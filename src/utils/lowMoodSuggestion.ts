import { secureStorage } from './secureStorage';

const KEY = '@calmhands_lowMoodSuggestionDismissed';

/** Dismiss the low-mood suggestion for 7 days. */
export async function dismissLowMoodSuggestion(): Promise<void> {
  const until = new Date();
  until.setDate(until.getDate() + 7);
  await secureStorage.set(KEY, until.toISOString());
}

/** True if we should not show the suggestion (dismissed and still within 7 days). */
export async function isLowMoodSuggestionDismissed(): Promise<boolean> {
  try {
    const raw = await secureStorage.get(KEY);
    if (!raw) return false;
    const until = new Date(raw);
    return new Date() < until;
  } catch {
    return false;
  }
}
