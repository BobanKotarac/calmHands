import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from './authContext';
import { onListenError } from '../utils/onListenError';

function todayId() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

type TodayMoodContextValue = { hasTodayMood: boolean; loading: boolean };

const TodayMoodContext = createContext<TodayMoodContextValue>({ hasTodayMood: false, loading: true });

export function TodayMoodProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [hasTodayMood, setHasTodayMood] = useState(false);
  const [loading, setLoading] = useState(true);
  const today = useMemo(() => todayId(), []);

  useEffect(() => {
    if (!user?.uid) {
      setHasTodayMood(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(db, 'users', user.uid, 'moods', today);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setHasTodayMood(snap.exists());
        setLoading(false);
      },
      (err) => {
        onListenError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [user?.uid, today]);

  const value = useMemo(() => ({ hasTodayMood, loading }), [hasTodayMood, loading]);

  return <TodayMoodContext.Provider value={value}>{children}</TodayMoodContext.Provider>;
}

export function useTodayMood() {
  return useContext(TodayMoodContext);
}
