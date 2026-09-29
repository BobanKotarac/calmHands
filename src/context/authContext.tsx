import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut,
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

type AuthCtx = {
  user: User | null;
  initializing: boolean;
  /** True once a guest (anonymous) session is active — no account has been created yet. */
  isGuest: boolean;
  logout: () => Promise<void>;
  /** Explicit guest entry from the login screen — not automatic after logout. */
  continueAsGuest: () => Promise<void>;
  /** Upgrades the current guest session into a permanent account, keeping the same uid/data. */
  upgradeToAccount: (email: string, password: string) => Promise<void>;
  /** Signs into an existing account, replacing the current guest session. */
  loginToExistingAccount: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      initializing,
      isGuest: !!user?.isAnonymous,
      logout: () => signOut(auth),
      continueAsGuest: async () => {
        if (auth.currentUser) return;
        await signInAnonymously(auth);
      },
      upgradeToAccount: async (email, password) => {
        if (!auth.currentUser) throw new Error('No active session');
        const credential = EmailAuthProvider.credential(email.trim(), password);
        await linkWithCredential(auth.currentUser, credential);
      },
      loginToExistingAccount: async (email, password) => {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      sendPasswordReset: async (email) => {
        await sendPasswordResetEmail(auth, email.trim());
      },
    }),
    [user, initializing]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
