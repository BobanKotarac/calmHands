// The `firebase` wrapper package's `./auth` export map resolves TypeScript's
// `types` condition straight to the generic (browser) declaration file,
// regardless of platform — so `getReactNativePersistence` never shows up
// there even though Metro correctly resolves the real React Native build
// from `@firebase/auth` at runtime. This augments (not replaces) the types
// to match — the `import` below is what makes this an augmentation.
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
