import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';

type AuthCtx = {
  user: User | null;
  initializing: boolean;
  logout: () => Promise<void>;
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
      logout: () => signOut(auth),
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
