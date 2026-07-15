// Server-only: resolve which AI provider/key/model a user's request should
// use, falling back to container-wide env vars. Kept out of
// settings.functions.ts (imported by client pages) so its `db` usage never
// gets pulled into the client bundle.
import { db } from "@/lib/db.server";
import { getTextProvider, DEFAULT_TEXT_PROVIDER, type TextProvider } from "@/lib/ai-providers";

async function loadSettings(userId: string): Promise<Record<string, unknown>> {
  const result = await db.query("SELECT settings FROM users WHERE id = $1", [userId]);
  return (result.rows[0]?.settings ?? {}) as Record<string, unknown>;
}

// Image generation stays OpenAI-only for now, so it just needs the OpenAI key.
export async function resolveOpenaiApiKey(userId: string): Promise<string | undefined> {
  const settings = await loadSettings(userId);
  const apiKeys = (settings.apiKeys ?? {}) as Record<string, string>;
  return apiKeys.openai || process.env.OPENAI_API_KEY;
}

export interface TextProviderConfig {
  provider: TextProvider;
  apiKey: string | undefined;
  model: string;
}

// Text generation (site plan + page improvements) uses whichever provider
// the user picked in Settings — never per-site, so it stays consistent even
// if the user switches provider after a site was already created.
export async function resolveTextProviderConfig(userId: string): Promise<TextProviderConfig> {
  const settings = await loadSettings(userId);
  const provider = getTextProvider(settings.textProvider as string | undefined);
  const apiKeys = (settings.apiKeys ?? {}) as Record<string, string>;
  const apiKey = apiKeys[provider.id] || process.env[provider.keyEnvVar];
  const model = (settings.textModel as string | undefined) || provider.models[0]?.id || DEFAULT_TEXT_PROVIDER.models[0]!.id;
  return { provider, apiKey, model };
}
