// Server-only helper: resolve the OpenAI key to use for a given user,
// falling back to the container-wide OPENAI_API_KEY env var.
// Kept out of settings.functions.ts (imported by client pages) so its
// `db` usage never gets pulled into the client bundle.
import { db } from "@/lib/db.server";

export async function resolveOpenaiApiKey(userId: string): Promise<string | undefined> {
  const result = await db.query("SELECT settings FROM users WHERE id = $1", [userId]);
  const key = ((result.rows[0]?.settings ?? {}) as Record<string, unknown>).openaiApiKey as string | undefined;
  return key || process.env.OPENAI_API_KEY;
}
