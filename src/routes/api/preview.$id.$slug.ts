// Serves a standalone preview page for one site page, so it can be opened
// in a new browser tab (not just inside the sandboxed iframe).
import { createFileRoute } from "@tanstack/react-router";
import { getCookie } from "@tanstack/react-start/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth.server";
import { db } from "@/lib/db.server";
import { buildPreviewHtml, type AssetMap } from "@/lib/site-render";
import type { SitePlan } from "@/lib/site-schema";

export const Route = createFileRoute("/api/preview/$id/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = getCookie(SESSION_COOKIE);
        const userId = token ? await verifySessionToken(token) : null;
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const siteRes = await db.query("SELECT plan FROM sites WHERE id = $1 AND user_id = $2", [
          params.id,
          userId,
        ]);
        const plan = siteRes.rows[0]?.plan as SitePlan | undefined;
        if (!plan) return new Response("Not found", { status: 404 });

        const page = plan.pages.find((p) => p.slug === params.slug);
        if (!page) return new Response("Not found", { status: 404 });

        const assetsRes = await db.query(
          "SELECT slot, storage_path, prompt FROM site_assets WHERE site_id = $1 AND user_id = $2",
          [params.id, userId],
        );
        const assets: AssetMap = {};
        for (const a of assetsRes.rows) {
          if (a.slot) assets[a.slot] = { url: `/api/assets/${a.storage_path}`, alt: a.prompt ?? "" };
        }

        const html = buildPreviewHtml(plan, page, assets, {
          hrefFor: (p) => `/api/preview/${params.id}/${p.slug}`,
        });
        return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      },
    },
  },
});
