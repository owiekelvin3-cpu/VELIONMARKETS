const SOUND_ENABLED_KEY = "velion-notification-sound";

let audioContext: AudioContext | null = null;

export function getNotificationSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_ENABLED_KEY) !== "false";
  } catch {
    return true;
  }
}

export function setNotificationSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, enabled ? "true" : "false");
  } catch {
    /* ignore */
  }
}

/** Short two-tone chime — no audio file required. */
export async function playNotificationSound() {
  if (!getNotificationSoundEnabled()) return;

  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const ctx = audioContext;
    const now = ctx.currentTime;

    const tone = (frequency: number, start: number, duration: number, volume = 0.12) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.05);
    };

    tone(880, now, 0.12);
    tone(1318.5, now + 0.1, 0.18, 0.1);
  } catch {
    /* Audio may be blocked until user interaction */
  }
}

/** Call after a click so AudioContext is allowed to start. */
export function primeNotificationSound() {
  void playNotificationSound();
}
