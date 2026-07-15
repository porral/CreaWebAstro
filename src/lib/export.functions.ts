// Build a ZIP via createServerFn — returns base64 so the client can trigger a download.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const buildZipFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ siteId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: site, error } = await context.supabase
      .from("sites").select("id, plan").eq("id", data.siteId).single();
    if (error || !site?.plan) throw new Error("Sitio no encontrado o sin plan");

    const { data: assets } = await context.supabase
      .from("site_assets").select("slot, storage_path, prompt").eq("site_id", data.siteId);

    const assetMap: Record<string, { url: string; alt: string }> = {};
    const bufs: Record<string, Uint8Array> = {};
    for (const a of assets ?? []) {
      if (!a.slot) continue;
      const { data: dl } = await context.supabase.storage.from("site-images").download(a.storage_path);
      if (dl) {
        const arr = new Uint8Array(await dl.arrayBuffer());
        bufs[a.slot] = arr;
        assetMap[a.slot] = { url: `/images/${a.slot}.png`, alt: a.prompt ?? "" };
      }
    }

    const { buildAstroZip } = await import("@/lib/astro-export.server");
    const zip = await buildAstroZip(site.plan as any, assetMap, bufs);
    
    const base64 = Buffer.from(zip).toString("base64");
    const name = (((site.plan as any).siteName as string) || "sitio")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sitio";
    return { base64, filename: `${name}-astro.zip` };
  });
