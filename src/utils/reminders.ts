// utils/reminders.ts
// Mood reminder: users/{uid}.settings.moodReminderOn, moodReminderNotificationId, moodReminderHour, moodReminderMinute
// Plan reminders: users/{uid}/ritualPlanReminders/{planId} – enabled, hour, minute, notificationId
import * as Notifications from 'expo-notifications';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const MOOD_REMINDER_TITLE = 'Mood check-in';
const PLAN_REMINDER_TITLE = 'Ritual plan';

// --------------------
// Permissions
// --------------------
export async function ensurePermission() {
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    if (req.status !== 'granted') return false;
  }
  return true;
}

// --------------------
// Shared helpers
// --------------------
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Daily repeating trigger.
 * TypeScript types in expo-notifications can vary by SDK version, so we keep this shape consistent app-wide.
 */
function dailyTrigger(hour: number, minute: number): Notifications.NotificationTriggerInput {
  return {
    hour: clamp(hour, 0, 23),
    minute: clamp(minute, 0, 59),
    repeats: true,
  } as any;
}

async function safeCancel(notificationId?: string | null) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignore (already canceled / not found)
  }
}

/** Lista svih zakazanih notifikacija (expo koristi getAllScheduledNotificationsAsync). */
async function getAllScheduled(): Promise<Array<{ identifier: string; content: { title?: string; data?: Record<string, unknown> } }>> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled as Array<{ identifier: string; content: { title?: string; data?: Record<string, unknown> } }>;
  } catch {
    return [];
  }
}

/** Otkazuje sve zakazane notifikacije koje izgledaju kao mood reminder (po naslovu). Koristi se kad je reminder off u Firebase ali notifikacija i dalje stiže (npr. stari id, reinstalacija). */
export async function cancelAllMoodReminderNotifications(): Promise<void> {
  const scheduled = await getAllScheduled();
  for (const n of scheduled) {
    const title = n.content?.title;
    if (title === MOOD_REMINDER_TITLE && n.identifier) {
      await safeCancel(n.identifier);
    }
  }
}

/** Otkazuje sve zakazane notifikacije koje izgledaju kao plan reminder (naslov ili data.kind === 'plan'). */
export async function cancelAllPlanReminderNotifications(): Promise<void> {
  const scheduled = await getAllScheduled();
  for (const n of scheduled) {
    const title = n.content?.title;
    const kind = (n.content?.data as any)?.kind;
    const isPlan = title === PLAN_REMINDER_TITLE || kind === 'plan';
    if (isPlan && n.identifier) {
      await safeCancel(n.identifier);
    }
  }
}

// --------------------
// Mood reminder (stored on users/{uid}.settings)
// --------------------
function userDocRef(uid: string) {
  return doc(db, 'users', uid);
}

export async function scheduleDailyMoodReminderForUser(uid: string, hour: number, minute: number) {
  const ok = await ensurePermission();
  if (!ok) return null;

  // 1) read prev id
  const snap = await getDoc(userDocRef(uid));
  const prevId = (snap.data() as any)?.settings?.moodReminderNotificationId as string | undefined;

  // 2) cancel prev
  await safeCancel(prevId);

  // 3) schedule new
  const newId = await Notifications.scheduleNotificationAsync({
    content: { title: MOOD_REMINDER_TITLE, body: 'Unesi današnji mood (1 minut).' },
    trigger: dailyTrigger(hour, minute),
  });

  // 4) persist settings
  await setDoc(
    userDocRef(uid),
    {
      settings: {
        moodReminderOn: true,
        moodReminderHour: clamp(hour, 0, 23),
        moodReminderMinute: clamp(minute, 0, 59),
        moodReminderNotificationId: newId,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return newId;
}

export async function cancelDailyMoodReminderForUser(uid: string) {
  const snap = await getDoc(userDocRef(uid));
  const prevId = (snap.data() as any)?.settings?.moodReminderNotificationId as string | undefined;

  await safeCancel(prevId);
  await cancelAllMoodReminderNotifications(); // ukloni i eventualne "siročiće" (stari id, drugi uređaj, reinstalacija)

  await setDoc(
    userDocRef(uid),
    {
      settings: {
        moodReminderOn: false,
        moodReminderNotificationId: null,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// --------------------
// Plan reminder (1 reminder per plan, docId = planId)
// users/{uid}/ritualPlanReminders/{planId}
// --------------------
function planReminderRef(uid: string, planId: string) {
  return doc(db, 'users', uid, 'ritualPlanReminders', planId);
}

export async function enablePlanReminder(
  uid: string,
  planId: string,
  planTitle: string,
  hour: number,
  minute: number
) {
  const ok = await ensurePermission();
  if (!ok) return null;

  const ref = planReminderRef(uid, planId);

  // cancel old
  const snap = await getDoc(ref);
  const prevId = (snap.data() as any)?.notificationId as string | undefined;
  await safeCancel(prevId);

  // schedule new
  const newId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ritual plan',
      body: planTitle ? `Run: ${planTitle}` : 'Time to run your plan',
      data: { kind: 'plan', planId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: clamp(hour, 0, 23),
      minute: clamp(minute, 0, 59),
    } 
  });

  await setDoc(
    ref,
    {
      planId,
      enabled: true,
      hour: clamp(hour, 0, 23),
      minute: clamp(minute, 0, 59),
      notificationId: newId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return newId;
}

export async function disablePlanReminder(uid: string, planId: string) {
  const ref = planReminderRef(uid, planId);
  const snap = await getDoc(ref);
  const prevId = (snap.data() as any)?.notificationId as string | undefined;

  await safeCancel(prevId);
  await cancelAllPlanReminderNotifications(); // ukloni i eventualne „siročiće“

  await setDoc(
    ref,
    {
      planId,
      enabled: false,
      notificationId: null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getPlanReminder(uid: string, planId: string) {
  const snap = await getDoc(planReminderRef(uid, planId));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) }) : null;
}

/**
 * Sinhronizuje lokalne notifikacije sa Firebase-om:
 * - Ako je mood reminder isključen u Firebase, otkazuje sve mood notifikacije (uključujući „siročiće“).
 * - Otkazuje sve plan notifikacije, zatim ponovo zakazuje samo one koji su enabled u Firebase.
 * Pozovi pri učitavanju Profila ili pri startu app-a kad je user ulogovan.
 */
export async function syncNotificationsWithFirebase(uid: string): Promise<void> {
  try {
    const userSnap = await getDoc(userDocRef(uid));
    const settings = (userSnap.data() as any)?.settings;
    if (settings && settings.moodReminderOn === false) {
      await cancelAllMoodReminderNotifications();
    }

    const remindersSnap = await getDocs(collection(db, 'users', uid, 'ritualPlanReminders'));
    await cancelAllPlanReminderNotifications();
    for (const d of remindersSnap.docs) {
      const data = d.data() as { enabled?: boolean; hour?: number; minute?: number };
      if (data.enabled !== true || typeof data.hour !== 'number' || typeof data.minute !== 'number') continue;
      const planId = d.id;
      let planTitle = '';
      try {
        const planSnap = await getDoc(doc(db, 'users', uid, 'ritualPlans', planId));
        planTitle = (planSnap.data() as any)?.title ?? '';
      } catch {
        // plan možda obrisan
      }
      await enablePlanReminder(uid, planId, planTitle, data.hour, data.minute);
    }
  } catch {
    // ignore
  }
}
