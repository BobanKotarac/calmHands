import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import type { CustomerInfo } from 'react-native-purchases';
import { db } from '../firebase/firebase';
import { useAuth } from './authContext';
import type { RootScreenNavigationProp } from '../navigation/types';
import { onListenError } from '../utils/onListenError';
import {
  addCustomerInfoListener,
  configureRevenueCat,
  customerHasPro,
  getCustomerInfoSafe,
  identifyRevenueCatUser,
  isPurchasesNativeAvailable,
} from '../utils/revenueCat';

type PremiumContextValue = {
  isPremium: boolean;
  /** True when native SDK is present (dev/client or store build), not Expo Go. */
  purchasesReady: boolean;
  showPaywall: () => void;
  refreshPremium: () => Promise<void>;
  applyCustomerInfo: (info: CustomerInfo | null) => void;
};

export const PremiumContext = createContext<PremiumContextValue>({
  isPremium: false,
  purchasesReady: false,
  showPaywall: () => {},
  refreshPremium: async () => {},
  applyCustomerInfo: () => {},
});

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation<RootScreenNavigationProp>();
  const { user, isGuest } = useAuth();
  const [rcPremium, setRcPremium] = useState(false);
  const [firestorePremium, setFirestorePremium] = useState(false);
  const [purchasesReady, setPurchasesReady] = useState(false);

  const applyCustomerInfo = useCallback((info: CustomerInfo | null) => {
    setRcPremium(customerHasPro(info));
  }, []);

  const refreshPremium = useCallback(async () => {
    const info = await getCustomerInfoSafe();
    applyCustomerInfo(info);
  }, [applyCustomerInfo]);

  // RevenueCat: configure + identify with Firebase uid (skip guests for purchases identity)
  useEffect(() => {
    let cancelled = false;
    let removeListener: (() => void) | undefined;

    (async () => {
      const native = isPurchasesNativeAvailable();
      if (!native) {
        if (!cancelled) setPurchasesReady(false);
        return;
      }

      const configured = await configureRevenueCat();
      if (cancelled) return;
      setPurchasesReady(configured);
      if (!configured) return;

      const appUserId = user?.uid && !isGuest ? user.uid : null;
      const info = await identifyRevenueCatUser(appUserId);
      if (cancelled) return;
      applyCustomerInfo(info);

      removeListener = addCustomerInfoListener((updated) => {
        if (!cancelled) applyCustomerInfo(updated);
      });
    })().catch((e) => console.warn('[Premium] RC init', e));

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [user?.uid, isGuest, applyCustomerInfo]);

  // Firestore fallback (manual TestFlight flag / legacy) until store products are live
  useEffect(() => {
    if (!user?.uid || isGuest) {
      setFirestorePremium(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setFirestorePremium(!!snap.data()?.isPremium);
      },
      onListenError
    );
    return unsub;
  }, [user?.uid, isGuest]);

  const isPremium = !isGuest && (rcPremium || firestorePremium);

  const showPaywall = useCallback(() => {
    navigation.navigate('Paywall' as never);
  }, [navigation]);

  const value = useMemo(
    () => ({ isPremium, purchasesReady, showPaywall, refreshPremium, applyCustomerInfo }),
    [isPremium, purchasesReady, showPaywall, refreshPremium, applyCustomerInfo]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export const usePremiumContext = () => {
  const context = useContext(PremiumContext);
  if (!context) throw new Error('usePremiumContext unutar PremiumProvider');
  return context;
};
