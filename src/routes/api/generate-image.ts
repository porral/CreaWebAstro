// Server-side image generation route, backed by the OpenAI Images API.
// Emits a single SSE "completed" event so the existing client-side SSE
// parser (src/lib/stream-image.ts) keeps working unchanged.
import { createFileRoute } from "@tanstack/react-router";
import { getCookie } from "@tanstack/react-start/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth.server";

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = getCookie(SESSION_COOKIE);
        const userId = token ? await verifySessionToken(token) : null;
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const { resolveOpenaiApiKey } = await import("@/lib/openai-key.server");
        const key = await resolveOpenaiApiKey(userId);
        if (!key) return new Response("Missing OPENAI_API_KEY", { status: 500 });

        const { prompt, model = "gpt-image-1", quality = "high", size = "1536x1024" } =
          (await request.json()) as { prompt: string; model?: string; quality?: string; size?: string };

        const upstream = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, prompt, size, quality, n: 1 }),
        });

        if (!upstream.ok) {
          return new Response(await upstream.text(), { status: upstream.status });
        }

        const json = await upstream.json();
        const b64 = json?.data?.[0]?.b64_json;
        if (!b64) return new Response("No image returned", { status: 502 });

        const sse = `event: image_generation.completed\ndata: ${JSON.stringify({ b64_json: b64 })}\n\ndata: [DONE]\n\n`;
        return new Response(sse, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
