import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateInputSchema, type SitePlan } from "./site-schema";
import { z } from "zod";

// Create a new draft site row.
export const createSiteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => generateInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("sites")
      .insert({
        user_id: context.userId,
        name: data.name,
        sector: data.sector,
        brief: data.brief,
        config: data,
        status: "generating",
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id };
  });

// Generate the SEO plan for a site and store it.
export const generatePlanFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ siteId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    // Load site + config
    const { data: site, error } = await context.supabase
      .from("sites").select("id, config").eq("id", data.siteId).single();
    if (error || !site) throw new Error("Sitio no encontrado");

    const { generateSitePlanServer, auditSitePlanServer } = await import("./site-generator.server");
    const config = generateInputSchema.parse(site.config);
    const plan = await generateSitePlanServer(config);
    const audit = await auditSitePlanServer(plan);

    const { error: upErr } = await context.supabase
      .from("sites")
      .update({ plan: plan as any, seo_score: audit.score, status: "ready" })
      .eq("id", data.siteId);
    if (upErr) throw upErr;

    return { plan, audit };
  });

export const listSitesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sites")
      .select("id, name, sector, status, seo_score, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const getSiteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: site, error } = await context.supabase
      .from("sites")
      .select("id, name, sector, brief, config, plan, seo_score, status, created_at")
      .eq("id", data.id)
      .single();
    if (error) throw error;

    const { data: assets } = await context.supabase
      .from("site_assets").select("id, slot, storage_path, prompt")
      .eq("site_id", data.id);

    // Signed URLs for images
    const withUrls = await Promise.all((assets ?? []).map(async (a) => {
      const { data: signed } = await context.supabase.storage.from("site-images").createSignedUrl(a.storage_path, 60 * 60);
      return { ...a, url: signed?.signedUrl ?? null };
    }));
    return { site, assets: withUrls };
  });

// Save a generated image (base64) into Storage, then insert asset row.
export const saveImageFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      siteId: z.string().uuid(),
      slot: z.string(),
      prompt: z.string(),
      base64: z.string(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const bytes = Buffer.from(data.base64, "base64");
    const path = `${context.userId}/${data.siteId}/${data.slot}-${Date.now()}.png`;
    const { error: upErr } = await context.supabase.storage
      .from("site-images").upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) throw upErr;
    const { error: insErr } = await context.supabase.from("site_assets").insert({
      site_id: data.siteId,
      user_id: context.userId,
      slot: data.slot,
      prompt: data.prompt,
      storage_path: path,
    });
    if (insErr) throw insErr;
    return { path };
  });

// Delete a site
export const deleteSiteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("sites").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
