// Server-side streaming image generation route.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { prompt, model = "openai/gpt-image-2", quality = "high", size = "1536x1024" } =
          (await request.json()) as { prompt: string; model?: string; quality?: string; size?: string };

        const isGemini = model.startsWith("google/");
        const body = isGemini
          ? {
              model,
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
              stream: true,
            }
          : {
              model,
              prompt,
              size,
              quality,
              n: 1,
              stream: true,
              partial_images: 1,
            };

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!upstream.ok || !upstream.body) {
          return new Response(await upstream.text(), { status: upstream.status });
        }
        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
