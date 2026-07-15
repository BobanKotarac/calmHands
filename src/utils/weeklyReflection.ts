// Nedeljni pregled – ISO nedelja i Firestore
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

/** Id nedelje = datum ponedeljka te nedelje YYYY-MM-DD */
export function getCurrentWeekId(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // ponedeljak = 1
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const dayNum = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayNum}`;
}

export type WhatHelpedOption = 'breathing' | 'grounding' | 'mudras' | 'thoughtLog' | 'ritualPlans';

export type WeeklyReflectionDoc = {
  weekId: string;
  whatHelped: WhatHelpedOption[];
  topTriggersThisWeek?: string;
  note?: string;
  createdAt: any;
};

export async function getWeeklyReflection(uid: string, weekId: string): Promise<WeeklyReflectionDoc | null> {
  const ref = doc(db, 'users', uid, 'weeklyReflections', weekId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as WeeklyReflectionDoc) : null;
}

export async function saveWeeklyReflection(
  uid: string,
  weekId: string,
  data: Omit<WeeklyReflectionDoc, 'weekId' | 'createdAt'>
): Promise<void> {
  const ref = doc(db, 'users', uid, 'weeklyReflections', weekId);
  await setDoc(ref, {
    weekId,
    ...data,
    createdAt: serverTimestamp(),
  }, { merge: true });
}
