// Build a ZIP via createServerFn — returns base64 so the client can trigger a download.
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db.server";
import { readAsset } from "@/lib/storage.server";
import { z } from "zod";

export const buildZipFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ siteId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const siteRes = await db.query("SELECT id, plan FROM sites WHERE id = $1 AND user_id = $2", [
      data.siteId,
      context.userId,
    ]);
    const site = siteRes.rows[0];
    if (!site?.plan) throw new Error("Sitio no encontrado o sin plan");

    const assetsRes = await db.query(
      "SELECT slot, storage_path, prompt FROM site_assets WHERE site_id = $1 AND user_id = $2",
      [data.siteId, context.userId],
    );

    const assetMap: Record<string, { url: string; alt: string }> = {};
    const bufs: Record<string, Uint8Array> = {};
    for (const a of assetsRes.rows) {
      if (!a.slot) continue;
      try {
        const buf = await readAsset(a.storage_path);
        bufs[a.slot] = new Uint8Array(buf);
        assetMap[a.slot] = { url: `/images/${a.slot}.png`, alt: a.prompt ?? "" };
      } catch {
        // Asset file missing on disk; skip it.
      }
    }

    const { buildAstroZip } = await import("@/lib/astro-export.server");
    const zip = await buildAstroZip(site.plan as any, assetMap, bufs);

    const base64 = Buffer.from(zip).toString("base64");
    const name = (((site.plan as any).siteName as string) || "sitio")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sitio";
    return { base64, filename: `${name}-astro.zip` };
  });
