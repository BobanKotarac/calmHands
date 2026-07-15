import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export type AchievementId =
  | 'mood_streak_3'
  | 'mood_streak_7'
  | 'ritual_streak_3'
  | 'ritual_streak_7'
  | 'sos_first'
  | 'plan_5x'
  | 'thought_log_10'
  | 'weekly_review_2';

export const ACHIEVEMENT_LABELS: Record<AchievementId, string> = {
  mood_streak_3: '3 dana uneto mood',
  mood_streak_7: '7 dana uneto mood',
  ritual_streak_3: '3 dana ritual zaredom',
  ritual_streak_7: '7 dana ritual zaredom',
  sos_first: 'Prvi put korišćen SOS',
  plan_5x: 'Ritualni plan 5 puta',
  thought_log_10: '10 logova misli',
  weekly_review_2: '2 nedeljna pregleda',
};

function userRef(uid: string) {
  return doc(db, 'users', uid);
}

export type LongestStreaks = { mood: number; ritual: number };

export async function getLongestStreaks(uid: string): Promise<LongestStreaks> {
  const snap = await getDoc(userRef(uid));
  const data = snap.data() as any;
  return {
    mood: typeof data?.longestMoodStreak === 'number' ? data.longestMoodStreak : 0,
    ritual: typeof data?.longestRitualStreak === 'number' ? data.longestRitualStreak : 0,
  };
}

export async function updateLongestStreaks(
  uid: string,
  currentMood: number,
  currentRitual: number
): Promise<void> {
  const snap = await getDoc(userRef(uid));
  const data = snap.data() as any;
  const prevMood = typeof data?.longestMoodStreak === 'number' ? data.longestMoodStreak : 0;
  const prevRitual = typeof data?.longestRitualStreak === 'number' ? data.longestRitualStreak : 0;
  const mood = Math.max(prevMood, currentMood);
  const ritual = Math.max(prevRitual, currentRitual);
  if (mood > prevMood || ritual > prevRitual) {
    await setDoc(
      userRef(uid),
      { longestMoodStreak: mood, longestRitualStreak: ritual, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
}

export async function getUnlockedAchievements(uid: string): Promise<Record<AchievementId, any>> {
  const snap = await getDoc(userRef(uid));
  const data = snap.data() as any;
  return (data?.achievements ?? {}) as Record<AchievementId, any>;
}

export async function unlockAchievement(uid: string, achievementId: AchievementId): Promise<void> {
  const snap = await getDoc(userRef(uid));
  const data = snap.data() as any;
  const existing = data?.achievements ?? {};
  if (existing[achievementId]) return; // već otključan
  await setDoc(
    userRef(uid),
    {
      achievements: { ...existing, [achievementId]: { unlockedAt: serverTimestamp() } },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function getAchievementsToCheck(
  moodStreak: number,
  ritualStreak: number
): AchievementId[] {
  const out: AchievementId[] = [];
  if (moodStreak >= 3) out.push('mood_streak_3');
  if (moodStreak >= 7) out.push('mood_streak_7');
  if (ritualStreak >= 3) out.push('ritual_streak_3');
  if (ritualStreak >= 7) out.push('ritual_streak_7');
  return out;
}

/** Proveri i otključaj dostignuća koja zavise od broja logova, planova, nedeljnih pregleda */
export async function checkAndUnlockOtherAchievements(uid: string): Promise<void> {
  const unlocked = await getUnlockedAchievements(uid);

  if (!unlocked.thought_log_10) {
    const snap = await getDocs(collection(db, 'users', uid, 'thoughtLogs'));
    if (snap.size >= 10) await unlockAchievement(uid, 'thought_log_10');
  }

  if (!unlocked.plan_5x) {
    const snap = await getDocs(collection(db, 'users', uid, 'ritualEvents'));
    const runs = new Set<string>();
    snap.docs.forEach((d) => {
      const x = d.data() as any;
      if (x.planId && x.dayId) runs.add(`${x.dayId}:${x.planId}`);
    });
    if (runs.size >= 5) await unlockAchievement(uid, 'plan_5x');
  }

  if (!unlocked.weekly_review_2) {
    const snap = await getDocs(collection(db, 'users', uid, 'weeklyReflections'));
    if (snap.size >= 2) await unlockAchievement(uid, 'weekly_review_2');
  }
}
