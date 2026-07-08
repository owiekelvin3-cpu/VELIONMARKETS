import { supabase } from "@/lib/supabase";

const JWT_EXPIRED_RE = /jwt expired|invalid jwt|session missing|refresh token|not authenticated/i;

export function isJwtExpiredError(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === "string") return JWT_EXPIRED_RE.test(error);
  if (error instanceof Error) return JWT_EXPIRED_RE.test(error.message);
  if (typeof error === "object" && error !== null && "message" in error) {
    return JWT_EXPIRED_RE.test(String((error as { message: unknown }).message));
  }
  return false;
}

/** Refresh the access token if missing or expiring within the next minute. */
export async function ensureValidSession(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const expiresAt = session.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt - now > 60) return true;

  const { data, error } = await supabase.auth.refreshSession();
  return !error && !!data.session;
}

/** Call before API requests; refreshes once when the JWT is stale. */
export async function withValidSession<T>(fn: () => Promise<T>): Promise<T> {
  await ensureValidSession();
  const result = await fn();

  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    (result as { error: unknown }).error &&
    isJwtExpiredError((result as { error: unknown }).error)
  ) {
    const refreshed = await ensureValidSession();
    if (refreshed) return fn();
  }

  return result;
}
