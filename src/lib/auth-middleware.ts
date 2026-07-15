// TanStack Start server middleware gating authenticated server functions.
// Reads the session cookie set by signInFn/signUpFn and resolves the user id.
import { createMiddleware } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { SESSION_COOKIE, verifySessionToken } from "./auth.server";

export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const token = getCookie(SESSION_COOKIE);
  if (!token) throw new Error("Unauthorized: No session");

  const userId = await verifySessionToken(token);
  if (!userId) throw new Error("Unauthorized: Invalid session");

  return next({ context: { userId } });
});
