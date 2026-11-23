"use client";

import { useSyncExternalStore } from "react";

// Desktop-class screen: the same query as the app shell (globals.css, "Mobile shell") and WritingPad.css.
const QUERY = "(min-width: 48rem) and ((min-height: 501px) or (hover: hover))";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/** True on desktop-class screens, using the shell's rule. Server render and first client render assume a phone. */
export function useWideScreen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
