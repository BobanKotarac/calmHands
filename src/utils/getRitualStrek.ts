import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/firebase';

function todayIdLocal(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseDayIdLocal(id: string) {
  const [y, m, d] = id.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Pure: counts the consecutive-day streak ending today (or `referenceDate`) given a set of dayIds with activity. */
export function computeRitualStreak(days: Set<string>, referenceDate: Date = new Date()): number {
  if (!days.size) return 0;

  let count = 0;
  let cursor = parseDayIdLocal(todayIdLocal(referenceDate));
  while (true) {
    const id = todayIdLocal(cursor);
    if (!days.has(id)) break;
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export async function getRitualStreak(uid: string) {
  const q = query(
    collection(db, 'users', uid, 'ritualEvents'),
    orderBy('completedAt', 'desc'),
    limit(800)
  ); // [web:1354]

  const snap = await getDocs(q);

  const days = new Set<string>();
  snap.docs.forEach((doc) => {
    const x: any = doc.data();
    if (typeof x.dayId === 'string') days.add(x.dayId);
  });

  return computeRitualStreak(days);
}
