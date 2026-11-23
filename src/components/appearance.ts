import type { UiPrefs } from "@/lib/types";

/** Writes the theme to <html>. The inline bootstrap in layout.tsx sets it before first paint. */
export function applyTheme(theme: UiPrefs["theme"]) {
  document.documentElement.dataset.theme = theme;
}

/** Writes the writing font to <html>, read by the --write-font rule in globals.css. */
export function applyFont(font: UiPrefs["font"]) {
  document.documentElement.dataset.font = font;
}

/** Writes the text size to <html>, read by the --write-scale rule in globals.css. */
export function applySize(size: UiPrefs["size"]) {
  document.documentElement.dataset.size = size;
}
