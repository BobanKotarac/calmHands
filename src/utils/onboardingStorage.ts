import { secureStorage } from './secureStorage';

const KEY_PREFIX = '@calmhands_onboarding_done_';

export async function getOnboardingDone(uid: string): Promise<boolean> {
  try {
    const raw = await secureStorage.get(KEY_PREFIX + uid);
    return raw === '1';
  } catch {
    return false;
  }
}

export async function setOnboardingDone(uid: string): Promise<void> {
  try {
    await secureStorage.set(KEY_PREFIX + uid, '1');
  } catch {}
}
