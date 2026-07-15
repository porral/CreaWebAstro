// Serves site-asset images from local disk. Replaces Supabase Storage signed URLs.
// Access is scoped to the requesting user's own folder (storage paths are
// always prefixed with `${userId}/...`), mirroring the old per-user storage RLS.
import { createFileRoute } from "@tanstack/react-router";
import { getCookie } from "@tanstack/react-start/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth.server";
import { readAsset } from "@/lib/storage.server";

export const Route = createFileRoute("/api/assets/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = getCookie(SESSION_COOKIE);
        const userId = token ? await verifySessionToken(token) : null;
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const storagePath = params._splat ?? "";
        if (!storagePath.startsWith(`${userId}/`)) {
          return new Response("Not found", { status: 404 });
        }

        try {
          const bytes = await readAsset(storagePath);
          return new Response(new Uint8Array(bytes), {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "private, max-age=31536000, immutable",
            },
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});
