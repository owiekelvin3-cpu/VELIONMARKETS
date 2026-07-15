import { supabase } from "@/lib/supabase";

/** Messages from GoTrue, PostgREST, Storage, and golang-jwt when the access token is stale. */
const JWT_EXPIRED_RE =
  /jwt expired|invalid jwt|invalid claim|exp["']?\s*claim|timestamp check failed|session missing|refresh.?token|not authenticated|token is expired|PGRST301/i;

const SESSION_EXPIRED_EVENT = "velion:session-expired";

/** Refresh a bit earlier to absorb clock skew between device and Auth. */
const REFRESH_SKEW_SECONDS = 180;

let refreshInFlight: Promise<boolean> | null = null;

function errorText(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const parts: string[] = [];
    if ("message" in error) parts.push(String((error as { message: unknown }).message));
    if ("error" in error) parts.push(String((error as { error: unknown }).error));
    if ("error_description" in error) {
      parts.push(String((error as { error_description: unknown }).error_description));
    }
    if ("code" in error) parts.push(String((error as { code: unknown }).code));
    if ("status" in error) parts.push(String((error as { status: unknown }).status));
    return parts.join(" ");
  }
  return String(error);
}

export function isJwtExpiredError(error: unknown): boolean {
  return JWT_EXPIRED_RE.test(errorText(error));
}

/** User-friendly message — never show raw JWT / exp claim text in the UI. */
export function formatAuthError(
  error: unknown,
  fallback = "Your session expired. Please sign in again."
): string {
  if (!error) return fallback;
  if (isJwtExpiredError(error)) return fallback;
  const text = errorText(error).trim();
  return text || fallback;
}

export function notifySessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

export function onSessionExpired(listener: () => void) {
  window.addEventListener(SESSION_EXPIRED_EVENT, listener);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
}

async function doRefreshSession(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return false;

  const expiresAt = session.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = expiresAt - now;

  // Token still has plenty of life — trust local session.
  if (secondsLeft > REFRESH_SKEW_SECONDS) {
    return true;
  }

  // Near expiry / already expired: prove with Auth, then refresh.
  const { error: userError } = await supabase.auth.getUser();
  if (!userError && secondsLeft > 30) {
    return true;
  }

  // Any auth failure near expiry → refresh (covers "exp claim timestamp check failed").
  if (userError && !isJwtExpiredError(userError) && secondsLeft > 0) {
    // Unexpected non-auth error while token still "valid" locally — still try refresh once.
  }

  const { data, error } = await supabase.auth.refreshSession();
  if (!error && data.session) return true;

  // Last resort: refresh again after a brief pause (clock skew / race).
  await new Promise((r) => setTimeout(r, 400));
  const retry = await supabase.auth.refreshSession();
  return !retry.error && !!retry.data.session;
}

/** Refresh the access token if missing, invalid, or expiring soon. */
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
  if (!error && data.session) return true;
  await new Promise((r) => setTimeout(r, 300));
  const retry = await supabase.auth.refreshSession();
  return !retry.error && !!retry.data.session;
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
