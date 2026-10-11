'use client';

import { useSyncExternalStore } from 'react';

let preference: MediaQueryList | undefined;
const media = () => preference ??= window.matchMedia('(prefers-reduced-motion: reduce)');
const subscribe = (notify: () => void) => {
  const query = media();
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};
const snapshot = () => media().matches;
const serverSnapshot = () => true;

// The installed Motion hook snapshots the preference at mount. This external
// store also reacts when visitors change their OS preference without reloading.
export function useMotionPreference() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
