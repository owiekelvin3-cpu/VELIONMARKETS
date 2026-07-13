const STORAGE_PREFIX = "velion_ai_trading_walkthrough_v1";

export function getWalkthroughKey(userId: string) {
  return `${STORAGE_PREFIX}_${userId}`;
}

export function hasSeenWalkthrough(userId: string): boolean {
  try {
    return localStorage.getItem(getWalkthroughKey(userId)) === "true";
  } catch {
    return false;
  }
}

export function markWalkthroughSeen(userId: string) {
  try {
    localStorage.setItem(getWalkthroughKey(userId), "true");
  } catch {
    /* ignore */
  }
}

export function clearWalkthroughSeen(userId: string) {
  try {
    localStorage.removeItem(getWalkthroughKey(userId));
  } catch {
    /* ignore */
  }
}
