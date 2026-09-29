import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

export const PRO_ENTITLEMENT_ID = 'pro';

type Extra = {
  revenueCat?: {
    iosApiKey?: string;
    androidApiKey?: string;
    entitlementId?: string;
  };
};

function extra(): Extra {
  return (Constants.expoConfig?.extra ?? {}) as Extra;
}

export function getRevenueCatApiKey(): string | null {
  const fromEnv =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  if (fromEnv?.trim()) return fromEnv.trim();

  const rc = extra().revenueCat;
  const fromExtra = Platform.OS === 'ios' ? rc?.iosApiKey : rc?.androidApiKey;
  if (fromExtra?.trim()) return fromExtra.trim();
  return null;
}

export function getEntitlementId(): string {
  return extra().revenueCat?.entitlementId?.trim() || PRO_ENTITLEMENT_ID;
}

/** Expo Go has no native Purchases module — skip gracefully. */
export function isPurchasesNativeAvailable(): boolean {
  const ownership = (Constants as { appOwnership?: string | null }).appOwnership;
  if (ownership === 'expo') return false;
  return !!NativeModules.RNPurchases;
}

export function customerHasPro(info: CustomerInfo | null | undefined): boolean {
  if (!info) return false;
  const id = getEntitlementId();
  return typeof info.entitlements.active[id] !== 'undefined';
}

let configured = false;

export async function configureRevenueCat(): Promise<boolean> {
  if (configured) return true;
  if (!isPurchasesNativeAvailable()) return false;

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn('[RevenueCat] Missing API key — set EXPO_PUBLIC_REVENUECAT_* or app.json extra.revenueCat');
    return false;
  }

  const Purchases = (await import('react-native-purchases')).default;
  const { LOG_LEVEL } = await import('react-native-purchases');

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({ apiKey });
  configured = true;
  return true;
}

export async function identifyRevenueCatUser(appUserId: string | null): Promise<CustomerInfo | null> {
  const ok = await configureRevenueCat();
  if (!ok) return null;

  const Purchases = (await import('react-native-purchases')).default;
  try {
    if (appUserId) {
      const { customerInfo } = await Purchases.logIn(appUserId);
      return customerInfo;
    }
    await Purchases.logOut();
    return await Purchases.getCustomerInfo();
  } catch (e) {
    console.warn('[RevenueCat] identify failed', e);
    return null;
  }
}

export async function getCustomerInfoSafe(): Promise<CustomerInfo | null> {
  const ok = await configureRevenueCat();
  if (!ok) return null;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export async function getCurrentOfferingPackages(): Promise<PurchasesPackage[]> {
  const ok = await configureRevenueCat();
  if (!ok) return [];
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  } catch (e) {
    console.warn('[RevenueCat] offerings failed', e);
    return [];
  }
}

export async function purchasePackageSafe(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  const Purchases = (await import('react-native-purchases')).default;
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchasesSafe(): Promise<CustomerInfo | null> {
  const ok = await configureRevenueCat();
  if (!ok) return null;
  const Purchases = (await import('react-native-purchases')).default;
  return await Purchases.restorePurchases();
}

export function addCustomerInfoListener(listener: (info: CustomerInfo) => void): () => void {
  if (!isPurchasesNativeAvailable() || !configured) {
    return () => {};
  }
  try {
    // Configured path — sync require is fine after native module load
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Purchases = require('react-native-purchases').default;
    return Purchases.addCustomerInfoUpdateListener(listener);
  } catch {
    return () => {};
  }
}
