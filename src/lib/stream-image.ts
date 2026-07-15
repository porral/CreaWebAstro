// Client helper: SSE parser for /api/generate-image
export type ImageFrame = { dataUrl: string; isFinal: boolean };

export async function streamImage(
  prompt: string,
  onFrame: (f: ImageFrame) => void,
  opts: { model?: string; quality?: string; size?: string } = {},
): Promise<void> {
  const { flushSync } = await import("react-dom");
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, ...opts }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Image generation failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  let sawCompleted = false;
  let streamError: string | undefined;
  let buffer = "";
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let idx;
      while ((idx = buffer.indexOf("\n\n")) >= 0) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        let eventType = "";
        let dataStr = "";
        for (const line of rawEvent.split("\n")) {
          if (line.startsWith("event:")) eventType = line.slice(6).trim();
          else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
        }
        if (!dataStr || dataStr === "[DONE]") continue;
        let payload: any;
        try { payload = JSON.parse(dataStr); } catch { continue; }
        if (eventType === "error" || payload?.type === "error") {
          streamError = payload?.error?.message ?? "Image generation failed";
          continue;
        }
        if (payload?.b64_json) {
          const isFinal = eventType === "image_generation.completed" || payload.type === "image_generation.completed";
          flushSync(() => onFrame({ dataUrl: `data:image/png;base64,${payload.b64_json}`, isFinal }));
          if (isFinal) sawCompleted = true;
        }
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  if (streamError) throw new Error(streamError);
  if (!sawCompleted) throw new Error("La imagen no se completó.");
}

export function base64FromDataUrl(dataUrl: string): string {
  const idx = dataUrl.indexOf(",");
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}
