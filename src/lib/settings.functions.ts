import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db.server";
import { z } from "zod";

export const userSettingsSchema = z.object({
  textModel: z.string().default("gpt-4o-mini"),
  imageModel: z.string().default("gpt-image-1"),
  language: z.enum(["es", "en", "pt", "fr", "de", "it"]).default("es"),
  tone: z.enum(["profesional", "cercano", "elegante", "atrevido", "minimalista"]).default("profesional"),
  style: z.enum(["moderno", "clasico", "minimal", "atrevido"]).default("moderno"),
  pages: z.number().int().min(3).max(12).default(5),
  useSemrush: z.boolean().default(false),
  openaiApiKey: z.string().default(""),
});
export type UserSettings = z.infer<typeof userSettingsSchema>;

const KEY_MASK = "••••••••";

function maskKey(key: string): string {
  return key ? KEY_MASK + key.slice(-4) : "";
}

export const getSettingsFn = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<UserSettings> => {
    const result = await db.query("SELECT settings FROM users WHERE id = $1", [context.userId]);
    const raw = (result.rows[0]?.settings ?? {}) as Record<string, unknown>;
    const parsed = userSettingsSchema.parse({ ...userSettingsSchema.parse({}), ...raw });
    return { ...parsed, openaiApiKey: maskKey(parsed.openaiApiKey) };
  });

export const saveSettingsFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => userSettingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Keep the previously stored key when the field still holds the masked
    // placeholder (i.e. the user didn't touch it while saving other settings).
    let openaiApiKey = data.openaiApiKey;
    if (openaiApiKey.startsWith(KEY_MASK)) {
      const existing = await db.query("SELECT settings FROM users WHERE id = $1", [context.userId]);
      openaiApiKey = ((existing.rows[0]?.settings ?? {}) as Record<string, unknown>).openaiApiKey as string ?? "";
    }
    await db.query("UPDATE users SET settings = $1 WHERE id = $2", [
      JSON.stringify({ ...data, openaiApiKey }),
      context.userId,
    ]);
    return { ok: true };
  });
