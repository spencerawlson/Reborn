/**
 * Session lookup. Real sessions (login, MFA, cookies) arrive in Phase 2;
 * until then nobody is signed in, so every protected route is closed.
 *
 * Local preview: with ADMIN_DEV_PREVIEW=true and NODE_ENV not
 * "production", a fake admin session lets you view the admin shell.
 * The production check means a stray env var cannot open it in a deploy.
 */

import type { Session } from "./index";

export async function getSession(
  env: Record<string, string | undefined> = process.env,
): Promise<Session | null> {
  if (env.NODE_ENV !== "production" && env.ADMIN_DEV_PREVIEW === "true") {
    return { userId: "dev-preview-admin", roles: ["admin"] };
  }
  return null;
}
