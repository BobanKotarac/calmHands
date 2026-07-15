import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

let useSecure = true;

async function get(key: string): Promise<string | null> {
  try {
    if (useSecure) return await SecureStore.getItemAsync(key);
  } catch {
    useSecure = false;
  }
  return await AsyncStorage.getItem(key);
}

async function set(key: string, value: string): Promise<void> {
  try {
    if (useSecure) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch {
    useSecure = false;
  }
  await AsyncStorage.setItem(key, value);
}

export const secureStorage = { get, set };
