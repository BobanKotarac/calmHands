import { addDoc, collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export async function createRitualPlan(uid: string, plan: any) {
  const ref = await addDoc(collection(db, 'users', uid, 'ritualPlans'), {
    ...plan,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRitualPlan(uid: string, planId: string, patch: any) {
  await updateDoc(doc(db, 'users', uid, 'ritualPlans', planId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export function dayIdLocal(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function logRitualEvent(uid: string, args: { planId?: string; stepType: string, source?: string }) {
  const now = new Date();

  await addDoc(collection(db, 'users', uid, 'ritualEvents'), {
    planId: args.planId ?? null,
    stepType: args.stepType,
    dayId: dayIdLocal(now),          // bitno za streak
    completedAt: serverTimestamp(),  // server time
  });
}
