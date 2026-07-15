import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export async function getPlanCount(uid: string) {
  const q = query(
    collection(db, 'users', uid, 'ritualPlans')
  );
  const snap = await getDocs(q);
  return snap.size;
}
