import { supabase } from "@/lib/supabase";

const SYNC_KEY_PREFIX = "velion_location_sync_v1";
const SYNC_INTERVAL_MS = 15 * 60 * 1000;

interface IpWhoResponse {
  success?: boolean;
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: { id?: string };
  message?: string;
}

function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "";
  }
}

function formatLocation(parts: Array<string | undefined | null>): string {
  return parts.filter((p) => p && p.trim()).join(", ");
}

async function fetchGeoFromIp(): Promise<IpWhoResponse | null> {
  try {
    const res = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = (await res.json()) as IpWhoResponse;
    return data.success ? data : null;
  } catch {
    return null;
  }
}

function shouldSync(userId: string, force: boolean): boolean {
  if (force) return true;
  const last = sessionStorage.getItem(`${SYNC_KEY_PREFIX}_${userId}`);
  if (!last) return true;
  return Date.now() - Number(last) >= SYNC_INTERVAL_MS;
}

export async function syncUserLocation(userId: string, options?: { force?: boolean }): Promise<void> {
  if (!userId) return;
  if (!shouldSync(userId, options?.force ?? false)) return;

  const tz = browserTimezone();
  const geo = await fetchGeoFromIp();

  const country = geo?.country ?? null;
  const city = geo?.city ?? null;
  const timezone = geo?.timezone?.id || tz || null;
  const ip = geo?.ip ?? null;
  const location = geo
    ? formatLocation([geo.city, geo.region, geo.country])
    : tz || null;

  if (!country && !city && !timezone && !ip && !location) return;

  const { error } = await supabase.rpc("sync_user_location", {
    p_country: country ?? "",
    p_city: city ?? "",
    p_timezone: timezone ?? "",
    p_last_known_ip: ip ?? "",
    p_last_known_location: location ?? "",
  });

  if (error) {
    // Fallback if migration not applied yet
    if (error.message.includes("sync_user_location")) {
      await supabase.from("profiles").update({
        country,
        city,
        timezone,
        last_known_ip: ip,
        last_known_location: location,
      }).eq("id", userId);
    }
    return;
  }

  sessionStorage.setItem(`${SYNC_KEY_PREFIX}_${userId}`, String(Date.now()));
}
