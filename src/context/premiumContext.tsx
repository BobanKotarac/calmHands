import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/authContext';  // Tvoj auth
import type { RootScreenNavigationProp } from '../navigation/types';

export const PremiumContext = createContext({
  isPremium: false,
  showPaywall: () => {},
});

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation<RootScreenNavigationProp>();
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);

  // FAZA 1: Firebase mock (sada)
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setIsPremium(snap.data()?.isPremium ?? false);  // ← Čita iz Firebase
    });
    return unsub;
  }, [user?.uid]);

  const showPaywall = () => navigation.navigate('Paywall' as never);

  return (
    <PremiumContext.Provider value={{ isPremium, showPaywall }}>
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremiumContext = () => {
  const context = useContext(PremiumContext);
  if (!context) throw new Error('usePremiumContext unutar PremiumProvider');
  return context;
};
