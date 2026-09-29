import AsyncStorage from '@react-native-async-storage/async-storage';

const QUIET_MODE_KEY = 'calmhands_quiet_mode';

export async function getQuietMode(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(QUIET_MODE_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function setQuietMode(on: boolean): Promise<void> {
  await AsyncStorage.setItem(QUIET_MODE_KEY, on ? '1' : '0');
}
