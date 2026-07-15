import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export type SafetyPlanStep = { id: string; label: string; order: number };
export type SafetyPlanContact = { id: string; name: string; phone?: string; role?: string };

export type SafetyPlanDoc = {
  steps: SafetyPlanStep[];
  contacts: SafetyPlanContact[];
  /** Šta mi obično pomaže (npr. šetnja, muzika, poziv drugu) */
  whatHelps?: string;
  /** Šta primećujem kad krene napad – samoopservacija */
  selfObservation?: string;
  /** Krizni broj (npr. centar za kriznu pomoć) */
  crisisPhone?: string;
  updatedAt?: any;
};

function userRef(uid: string) {
  return doc(db, 'users', uid);
}

export async function getSafetyPlan(uid: string): Promise<SafetyPlanDoc | null> {
  const snap = await getDoc(userRef(uid));
  if (!snap.exists()) return null;
  const data = (snap.data() as any)?.safetyPlan;
  if (!data) return null;
  return {
    steps: Array.isArray(data.steps) ? data.steps : [],
    contacts: Array.isArray(data.contacts) ? data.contacts : [],
    whatHelps: data.whatHelps,
    selfObservation: data.selfObservation,
    crisisPhone: data.crisisPhone,
    updatedAt: data.updatedAt,
  };
}

export async function saveSafetyPlan(
  uid: string,
  data: {
    steps: SafetyPlanStep[];
    contacts: SafetyPlanContact[];
    whatHelps?: string;
    selfObservation?: string;
    crisisPhone?: string;
  }
): Promise<void> {
  await setDoc(
    userRef(uid),
    {
      safetyPlan: {
        steps: data.steps,
        contacts: data.contacts,
        whatHelps: data.whatHelps?.trim() || null,
        selfObservation: data.selfObservation?.trim() || null,
        crisisPhone: data.crisisPhone?.trim() || null,
        updatedAt: serverTimestamp(),
      },
    },
    { merge: true }
  );
}
