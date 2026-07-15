// Local-disk asset storage (replaces Supabase Storage). Files live under
// UPLOADS_DIR, mounted as a Docker volume in production.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function uploadsRoot(): string {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), "data", "uploads");
}

function resolveAssetPath(storagePath: string): string {
  const root = uploadsRoot();
  const abs = path.resolve(root, storagePath);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    throw new Error("Invalid storage path");
  }
  return abs;
}

export async function saveAsset(storagePath: string, bytes: Buffer): Promise<void> {
  const abs = resolveAssetPath(storagePath);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, bytes);
}

export async function readAsset(storagePath: string): Promise<Buffer> {
  return readFile(resolveAssetPath(storagePath));
}
