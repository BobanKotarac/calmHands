import type { FirestoreError } from 'firebase/firestore';

/** Suppress expected permission errors when auth drops (logout / uid swap). */
export function onListenError(err: FirestoreError) {
  if (err?.code === 'permission-denied' || err?.code === 'unauthenticated') return;
  console.warn('[firestore]', err.code, err.message);
}
