import { supabase } from "@/lib/supabase";

const JWT_EXPIRED_RE = /jwt expired|invalid jwt|session missing|refresh token|not authenticated/i;
const SESSION_EXPIRED_EVENT = "velion:session-expired";

let refreshInFlight: Promise<boolean> | null = null;

export function isJwtExpiredError(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === "string") return JWT_EXPIRED_RE.test(error);
  if (error instanceof Error) return JWT_EXPIRED_RE.test(error.message);
  if (typeof error === "object" && error !== null && "message" in error) {
    return JWT_EXPIRED_RE.test(String((error as { message: unknown }).message));
  }
  return false;
}

/** User-friendly message — never show raw "JWT expired" in the UI. */
export function formatAuthError(error: unknown, fallback = "Your session expired. Please sign in again."): string {
  if (!error) return fallback;
  if (isJwtExpiredError(error)) return fallback;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return fallback;
}

export function notifySessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

export function onSessionExpired(listener: () => void) {
  window.addEventListener(SESSION_EXPIRED_EVENT, listener);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
}

async function doRefreshSession(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const expiresAt = session.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = expiresAt - now;

  // Validate with the server when the token is expired or close to expiry.
  if (secondsLeft <= 120) {
    const { error: userError } = await supabase.auth.getUser();
    if (!userError && secondsLeft > 30) return true;
    if (userError && !isJwtExpiredError(userError)) return false;
  } else {
    return true;
  }

  const { data, error } = await supabase.auth.refreshSession();
  return !error && !!data.session;
}

/** Refresh the access token if missing, invalid, or expiring within two minutes. */
export async function ensureValidSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefreshSession().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Always attempt a token refresh (used after a JWT error from the API). */
export async function forceRefreshSession(): Promise<boolean> {
  const { data, error } = await supabase.auth.refreshSession();
  return !error && !!data.session;
}

function hasSupabaseError(result: unknown): result is { error: unknown } {
  return !!result && typeof result === "object" && "error" in result && !!(result as { error: unknown }).error;
}

/** Call before API requests; refreshes and retries once when the JWT is stale. */
export async function withValidSession<T>(fn: () => Promise<T>): Promise<T> {
  const ok = await ensureValidSession();
  if (!ok) {
    notifySessionExpired();
    throw new Error("Session expired");
  }

  const result = await fn();

  if (hasSupabaseError(result) && isJwtExpiredError(result.error)) {
    const refreshed = await forceRefreshSession();
    if (refreshed) return fn();
    notifySessionExpired();
    throw new Error("Session expired");
  }

  return result;
}
