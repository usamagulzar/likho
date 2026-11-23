"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { UiPrefs } from "@/lib/types";

export const UI_PREFS_STORAGE_KEY = "notes:ui:v1";
export const UI_PREFS_SCHEMA_VERSION = 1;

export const defaultUiPrefs: UiPrefs = {
  previewOpen: false,
  sidebarOpen: true,
  // The app is light until the visitor picks dark with the theme toggle. The OS colour scheme is never read.
  theme: "light",
  font: "hand",
  size: "medium",
};

const FONT_OPTIONS: readonly UiPrefs["font"][] = ["hand", "sans", "serif", "mono"];
const SIZE_OPTIONS: readonly UiPrefs["size"][] = ["small", "medium", "large", "xlarge"];

function isSize(value: unknown): value is UiPrefs["size"] {
  return SIZE_OPTIONS.some((option) => option === value);
}

function isFont(value: unknown): value is UiPrefs["font"] {
  return FONT_OPTIONS.some((option) => option === value);
}

function isTheme(value: unknown): value is UiPrefs["theme"] {
  return value === "light" || value === "dark";
}

/** Prefs for a visitor with nothing stored yet. A missing, invalid or legacy "system" theme is light. */
function unsetPrefs(): UiPrefs {
  return { ...defaultUiPrefs };
}

const subscribers = new Set<() => void>();
let cachedSnapshot: UiPrefs | null = null;

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parseUiPrefs(raw: string | null): UiPrefs {
  if (!raw) return unsetPrefs();

  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return unsetPrefs();

    const candidate = value as Record<string, unknown>;
    return {
      previewOpen:
        typeof candidate.previewOpen === "boolean"
          ? candidate.previewOpen
          : defaultUiPrefs.previewOpen,
      sidebarOpen:
        typeof candidate.sidebarOpen === "boolean"
          ? candidate.sidebarOpen
          : defaultUiPrefs.sidebarOpen,
      theme: isTheme(candidate.theme) ? candidate.theme : defaultUiPrefs.theme,
      font: isFont(candidate.font) ? candidate.font : defaultUiPrefs.font,
      size: isSize(candidate.size) ? candidate.size : defaultUiPrefs.size,
    };
  } catch {
    return unsetPrefs();
  }
}

export function readUiPrefs(): UiPrefs {
  const storage = getLocalStorage();
  if (!storage) return unsetPrefs();

  try {
    return parseUiPrefs(storage.getItem(UI_PREFS_STORAGE_KEY));
  } catch {
    return unsetPrefs();
  }
}

function notifySubscribers(): void {
  for (const notify of subscribers) notify();
}

export function writeUiPrefs(prefs: UiPrefs): boolean {
  const next: UiPrefs = {
    previewOpen: Boolean(prefs.previewOpen),
    sidebarOpen: Boolean(prefs.sidebarOpen),
    theme: isTheme(prefs.theme) ? prefs.theme : defaultUiPrefs.theme,
    font: isFont(prefs.font) ? prefs.font : defaultUiPrefs.font,
    size: isSize(prefs.size) ? prefs.size : defaultUiPrefs.size,
  };
  cachedSnapshot = next;

  const storage = getLocalStorage();
  if (!storage) {
    notifySubscribers();
    return false;
  }

  let persisted = false;
  try {
    storage.setItem(UI_PREFS_STORAGE_KEY, JSON.stringify(next));
    persisted = true;
  } catch {
    // Keep the in-memory preference so the current tab remains responsive.
  }
  notifySubscribers();
  return persisted;
}

export function updateUiPrefs(updates: Partial<UiPrefs>): boolean {
  return writeUiPrefs({ ...readSnapshot(), ...updates });
}

function readSnapshot(): UiPrefs {
  if (cachedSnapshot) return cachedSnapshot;
  cachedSnapshot = readUiPrefs();
  return cachedSnapshot;
}

function getSnapshot(): UiPrefs {
  if (typeof window === "undefined") return defaultUiPrefs;
  return readSnapshot();
}

function getServerSnapshot(): UiPrefs {
  return defaultUiPrefs;
}

function subscribe(notify: () => void): () => void {
  subscribers.add(notify);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== UI_PREFS_STORAGE_KEY && event.key !== null) return;
    cachedSnapshot = readUiPrefs();
    notify();
  };

  if (typeof window !== "undefined") {
    cachedSnapshot = readUiPrefs();
    window.addEventListener("storage", onStorage);
  }

  return () => {
    subscribers.delete(notify);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export interface PrefsStore {
  prefs: UiPrefs;
  setPrefs: (next: UiPrefs | ((current: UiPrefs) => UiPrefs)) => boolean;
  updatePrefs: (updates: Partial<UiPrefs>) => boolean;
}

export function usePrefs(): PrefsStore {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setPrefs = useCallback(
    (next: UiPrefs | ((current: UiPrefs) => UiPrefs)) =>
      writeUiPrefs(typeof next === "function" ? next(readSnapshot()) : next),
    [],
  );
  const updatePrefs = useCallback((updates: Partial<UiPrefs>) => updateUiPrefs(updates), []);

  return { prefs, setPrefs, updatePrefs };
}
