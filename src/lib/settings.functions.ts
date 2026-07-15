import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const userSettingsSchema = z.object({
  textModel: z.string().default("google/gemini-3.5-flash"),
  imageModel: z.string().default("google/gemini-3.1-flash-image"),
  language: z.enum(["es", "en", "pt", "fr", "de", "it"]).default("es"),
  tone: z.enum(["profesional", "cercano", "elegante", "atrevido", "minimalista"]).default("profesional"),
  style: z.enum(["moderno", "clasico", "minimal", "atrevido"]).default("moderno"),
  pages: z.number().int().min(3).max(12).default(5),
  useSemrush: z.boolean().default(false),
  provider: z.enum(["lovable", "byok"]).default("lovable"),
});
export type UserSettings = z.infer<typeof userSettingsSchema>;

export const getSettingsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserSettings> => {
    const { data } = await context.supabase
      .from("profiles").select("settings").eq("id", context.userId).maybeSingle();
    const raw = (data?.settings ?? {}) as Record<string, unknown>;
    return userSettingsSchema.parse({ ...userSettingsSchema.parse({}), ...raw });
  });

export const saveSettingsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => userSettingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ settings: data as any })
      .eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
