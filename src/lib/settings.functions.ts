import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db.server";
import { z } from "zod";

export const userSettingsSchema = z.object({
  textProvider: z.string().default("openai"),
  textModel: z.string().default("gpt-4o-mini"),
  imageModel: z.string().default("gpt-image-1"),
  language: z.enum(["es", "en", "pt", "fr", "de", "it"]).default("es"),
  tone: z.enum(["profesional", "cercano", "elegante", "atrevido", "minimalista"]).default("profesional"),
  style: z.enum(["moderno", "clasico", "minimal", "atrevido"]).default("moderno"),
  pages: z.number().int().min(3).max(12).default(5),
  useSemrush: z.boolean().default(false),
  // API keys per text provider id ("openai", "groq", "deepseek", "openrouter"),
  // plus a dedicated "openai" one is also used for image generation.
  apiKeys: z.record(z.string(), z.string()).default({}),
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
    const maskedKeys = Object.fromEntries(
      Object.entries(parsed.apiKeys).map(([provider, key]) => [provider, maskKey(key)]),
    );
    return { ...parsed, apiKeys: maskedKeys };
  });

export const saveSettingsFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => userSettingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Keep previously stored keys for any provider whose field still holds
    // the masked placeholder (i.e. the user didn't touch it this save).
    const existing = await db.query("SELECT settings FROM users WHERE id = $1", [context.userId]);
    const existingKeys = (((existing.rows[0]?.settings ?? {}) as Record<string, unknown>).apiKeys ?? {}) as Record<string, string>;
    const apiKeys = Object.fromEntries(
      Object.entries(data.apiKeys).map(([provider, key]) => [
        provider,
        key.startsWith(KEY_MASK) ? (existingKeys[provider] ?? "") : key,
      ]),
    );
    await db.query("UPDATE users SET settings = $1 WHERE id = $2", [
      JSON.stringify({ ...data, apiKeys }),
      context.userId,
    ]);
    return { ok: true };
  });
