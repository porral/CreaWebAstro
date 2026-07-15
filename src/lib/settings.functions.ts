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
});
export type UserSettings = z.infer<typeof userSettingsSchema>;

export const getSettingsFn = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<UserSettings> => {
    const result = await db.query("SELECT settings FROM users WHERE id = $1", [context.userId]);
    const raw = (result.rows[0]?.settings ?? {}) as Record<string, unknown>;
    return userSettingsSchema.parse({ ...userSettingsSchema.parse({}), ...raw });
  });

export const saveSettingsFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => userSettingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    await db.query("UPDATE users SET settings = $1 WHERE id = $2", [
      JSON.stringify(data),
      context.userId,
    ]);
    return { ok: true };
  });
