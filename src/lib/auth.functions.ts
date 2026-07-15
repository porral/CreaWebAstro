import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { db } from "./db.server";
import {
  SESSION_COOKIE,
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
  sessionCookieOptions,
} from "./auth.server";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(200),
});

type SessionUser = { id: string; email: string; displayName: string | null };

export const signUpFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credentialsSchema.parse(input))
  .handler(async ({ data }): Promise<SessionUser> => {
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [data.email]);
    if (existing.rowCount) throw new Error("Ya existe una cuenta con este email.");

    const passwordHash = await hashPassword(data.password);
    const displayName = data.email.split("@")[0];
    const result = await db.query(
      "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name",
      [data.email, passwordHash, displayName],
    );
    const user = result.rows[0];

    const token = await signSessionToken(user.id);
    setCookie(SESSION_COOKIE, token, sessionCookieOptions);

    return { id: user.id, email: user.email, displayName: user.display_name };
  });

export const signInFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credentialsSchema.parse(input))
  .handler(async ({ data }): Promise<SessionUser> => {
    const result = await db.query(
      "SELECT id, email, display_name, password_hash FROM users WHERE email = $1",
      [data.email],
    );
    const user = result.rows[0];
    if (!user || !(await verifyPassword(data.password, user.password_hash))) {
      throw new Error("Email o contraseña incorrectos.");
    }

    const token = await signSessionToken(user.id);
    setCookie(SESSION_COOKIE, token, sessionCookieOptions);

    return { id: user.id, email: user.email, displayName: user.display_name };
  });

export const signOutFn = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { ok: true };
});

export const getSessionFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionUser | null> => {
    const token = getCookie(SESSION_COOKIE);
    if (!token) return null;

    const userId = await verifySessionToken(token);
    if (!userId) return null;

    const result = await db.query("SELECT id, email, display_name FROM users WHERE id = $1", [
      userId,
    ]);
    const user = result.rows[0];
    if (!user) return null;
    return { id: user.id, email: user.email, displayName: user.display_name };
  },
);
