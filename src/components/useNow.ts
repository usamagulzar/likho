import { useSyncExternalStore } from "react";

const MINUTE = 60_000;

function subscribe(notify: () => void) {
  const id = window.setInterval(notify, MINUTE);
  return () => window.clearInterval(id);
}

// Floored to the minute so the snapshot is stable between ticks. The server snapshot is 0, so
// relative times are never computed during SSR or hydration.
function getSnapshot() {
  return Math.floor(Date.now() / MINUTE) * MINUTE;
}

/** Current time, refreshed once a minute. Returns 0 until mounted on the client. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}
