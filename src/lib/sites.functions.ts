import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db.server";
import { saveAsset } from "@/lib/storage.server";
import { generateInputSchema } from "./site-schema";
import { z } from "zod";

// Create a new draft site row.
export const createSiteFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => generateInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const result = await db.query(
      `INSERT INTO sites (user_id, name, sector, brief, config, status)
       VALUES ($1, $2, $3, $4, $5, 'generating') RETURNING id`,
      [context.userId, data.name, data.sector, data.brief, JSON.stringify(data)],
    );
    return { id: result.rows[0].id as string };
  });

// Generate the SEO plan for a site and store it.
export const generatePlanFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ siteId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const siteRes = await db.query("SELECT id, config FROM sites WHERE id = $1 AND user_id = $2", [
      data.siteId,
      context.userId,
    ]);
    const site = siteRes.rows[0];
    if (!site) throw new Error("Sitio no encontrado");

    const { generateSitePlanServer, auditSitePlanServer } = await import("./site-generator.server");
    const config = generateInputSchema.parse(site.config);
    const plan = await generateSitePlanServer(config);
    const audit = await auditSitePlanServer(plan);

    await db.query(
      "UPDATE sites SET plan = $1, seo_score = $2, status = 'ready' WHERE id = $3 AND user_id = $4",
      [JSON.stringify(plan), audit.score, data.siteId, context.userId],
    );

    return { plan, audit };
  });

export const listSitesFn = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const result = await db.query(
      "SELECT id, name, sector, status, seo_score, created_at FROM sites WHERE user_id = $1 ORDER BY created_at DESC",
      [context.userId],
    );
    return result.rows;
  });

export const getSiteFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const siteRes = await db.query(
      `SELECT id, name, sector, brief, config, plan, seo_score, status, created_at
       FROM sites WHERE id = $1 AND user_id = $2`,
      [data.id, context.userId],
    );
    const site = siteRes.rows[0];
    if (!site) throw new Error("Sitio no encontrado");

    const assetsRes = await db.query(
      "SELECT id, slot, storage_path, prompt FROM site_assets WHERE site_id = $1 AND user_id = $2",
      [data.id, context.userId],
    );
    const withUrls = assetsRes.rows.map((a) => ({
      ...a,
      url: `/api/assets/${a.storage_path}`,
    }));

    return { site, assets: withUrls };
  });

// Save a generated image (base64) to local disk, then insert asset row.
export const saveImageFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        siteId: z.string().uuid(),
        slot: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Slot inválido"),
        prompt: z.string(),
        base64: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const bytes = Buffer.from(data.base64, "base64");
    const path = `${context.userId}/${data.siteId}/${data.slot}-${Date.now()}.png`;
    await saveAsset(path, bytes);

    await db.query(
      "INSERT INTO site_assets (site_id, user_id, slot, prompt, storage_path) VALUES ($1, $2, $3, $4, $5)",
      [data.siteId, context.userId, data.slot, data.prompt, path],
    );

    return { path };
  });

// Delete a site
export const deleteSiteFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await db.query("DELETE FROM sites WHERE id = $1 AND user_id = $2", [data.id, context.userId]);
    return { ok: true };
  });
