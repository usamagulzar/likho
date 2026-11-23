# Likho - context bundle: Urdu / Kasheeda work

Earlier work to redo: Kasheeda size-adjust 125% and font file, bold Urdu fix, corrected Urdu keymap (U types the hamza-yeh letter), live keyboard layout panel, English / Urdu toggle embedded in the notebook.


## KASHEEDA-SETUP.md

```markdown
# Adding the Kasheeda font (italic Urdu)

1. Get "Jameel Noori Nastaleeq Kasheeda" (urdufonts.com, search "Kasheeda"). Check its license before committing it to a public repo.
2. Shrink it to a web font (the original is ~13 MB / 19,000 glyphs). Needs `pip install fonttools brotli`:

       pyftsubset JameelNooriNastaleeqKasheeda.ttf \
         --unicodes="U+0020,U+00A0,U+200C,U+200D,U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF" \
         --layout-features='*' --flavor=woff2 --output-file=kasheeda.woff2

3. Put it at `public/fonts/kasheeda.woff2`.
4. Write a note with `*italic urdu*` and adjust `size-adjust` on the "Kasheeda" @font-face in `src/app/globals.css`
   until it matches the size of the normal Urdu around it.

If the file is missing, italic Urdu just falls back to normal Mehr.

```

## src/app/globals.css

```css
@import "tailwindcss";
@import "tw-animate-css";

/* Design tokens. light-dark() follows color-scheme, which data-theme sets on <html>. Light is the default; the OS
   colour scheme is never read. */
:root {
  color-scheme: light;

  --canvas: light-dark(#efebdf, #242423);
  --sidebar: light-dark(#e9e4d5, #1d1d1c);
  --pad: light-dark(#f8f5ec, #2e2e2c);
  /* In-app logo tile: brand ink in light, a lifted ink in dark so the mark stays visible on the dark sidebar. */
  --logo-tile: light-dark(#2b2a27, #3d3c38);
  --text: light-dark(#141413, #f5f4ed);
  --text-secondary: light-dark(#3d3d3a, #c2c0b6);
  /* Light value is darker than SPEC's #73726C so it stays AA (4.5:1) on every tinted surface, including the selected row
     and its hover. Dark value is lifted so it stays AA on the accent-soft-hover surface too. */
  --text-muted: light-dark(#4d4c47, #b0aea6);
  /* Neutral hairlines in both themes. No warm tint anywhere. */
  --border: light-dark(rgb(31 30 29 / 0.12), rgb(255 255 255 / 0.1));
  --rule: light-dark(rgb(31 30 29 / 0.07), rgb(255 255 255 / 0.06));
  /* One neutral accent family in both themes: calm blue-grey in light, lighter blue-grey in dark. No orange or clay. */
  --accent: light-dark(#44597a, #8fa3bf);
  --accent-hover: light-dark(#3f5170, #a9bad1);
  --accent-soft: light-dark(rgb(31 30 29 / 0.06), rgb(255 255 255 / 0.07));
  --accent-soft-hover: light-dark(rgb(31 30 29 / 0.09), rgb(255 255 255 / 0.09));
  /* Filled primary button: ink in light, blue-grey in dark. Ink text on it in dark, cream text on it in light. */
  --primary: light-dark(#2b2a27, #8fa3bf);
  --hover: light-dark(rgb(31 30 29 / 0.05), rgb(255 255 255 / 0.07));
  --selected: light-dark(#d9d3c1, #2f2f2d);
  /* Dark danger is muted so it reads red, not salmon. It clears 4.5:1 as text on the dark pad and selected row. */
  --danger: light-dark(#b3261e, #d98a84);
  --success: light-dark(#4a7d4c, #7fb884);
  --warning: light-dark(#9a6a12, #e0b55c);
  /* Solid focus rings (no /50 at use sites). Light is the blue-grey accent; dark is the same blue-grey accent.
     Both stay at least 3:1 on every surface they sit on, including the selected row and its hover. */
  --ring: light-dark(#44597a, #8fa3bf);
  /* Text on the filled primary button. Cream on ink is about 13:1 in light; near-black on the blue-grey is 7.2:1 in dark. */
  --on-accent: light-dark(#f8f5ec, #141413);
  --selection: light-dark(rgb(68 89 122 / 0.22), rgb(143 163 191 / 0.3));

  --elev-xs: 0 1px 2px rgb(20 20 19 / 0.06);
  --elev-pad: 0 1px 2px rgb(20 20 19 / 0.04), 0 12px 32px -12px rgb(20 20 19 / 0.12);
  --elev-menu: 0 10px 30px -8px rgb(20 20 19 / 0.22), 0 2px 6px rgb(20 20 19 / 0.06);
  --elev-overlay: 0 20px 48px -12px rgb(20 20 19 / 0.25);

  /* Writing font follows the saved pref. data-font is set on <html> before paint (see layout.tsx). */
  --write-font: "Mehr", var(--font-patrick-hand), cursive;
}

:root[data-theme="dark"] {
  --elev-xs: 0 1px 2px rgb(0 0 0 / 0.3);
  --elev-pad: 0 1px 2px rgb(0 0 0 / 0.25), 0 14px 36px -12px rgb(0 0 0 / 0.5);
  --elev-menu: 0 12px 34px -8px rgb(0 0 0 / 0.6), 0 2px 6px rgb(0 0 0 / 0.3);
  --elev-overlay: 0 24px 56px -12px rgb(0 0 0 / 0.6);
}

:root[data-theme="light"] {
  color-scheme: light;
}

:root[data-theme="dark"] {
  color-scheme: dark;
}

:root[data-font="sans"] {
  --write-font: "Mehr", var(--font-plex-sans), system-ui, sans-serif;
}

:root[data-font="serif"] {
  --write-font: "Mehr", var(--font-plex-serif), Georgia, serif;
}

:root[data-font="mono"] {
  --write-font: "Mehr", var(--font-plex-mono), ui-monospace, monospace;
}

/* Text size multiplies the note's type. Rows stay 28px, so the ruled grid never moves. */
:root {
  --write-scale: 1;
}

:root[data-size="small"] {
  --write-scale: 0.875;
}

:root[data-size="large"] {
  --write-scale: 1.125;
}

:root[data-size="xlarge"] {
  --write-scale: 1.25;
}

@theme inline {
  --color-background: var(--canvas);
  --color-foreground: var(--text);
  --color-canvas: var(--canvas);
  --color-sidebar: var(--sidebar);
  --color-pad: var(--pad);
  --color-card: var(--pad);
  --color-card-foreground: var(--text);
  --color-popover: var(--pad);
  --color-popover-foreground: var(--text);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--on-accent);
  --color-secondary: var(--hover);
  --color-secondary-foreground: var(--text-secondary);
  --color-muted: var(--hover);
  --color-muted-foreground: var(--text-muted);
  --color-accent: var(--hover);
  --color-accent-foreground: var(--text);
  --color-hover: var(--hover);
  --color-selected: var(--selected);
  --color-brand: var(--accent);
  --color-brand-hover: var(--accent-hover);
  --color-brand-soft: var(--accent-soft);
  --color-brand-soft-hover: var(--accent-soft-hover);
  --color-destructive: var(--danger);
  --color-destructive-foreground: var(--pad);
  --color-border: var(--border);
  --color-input: var(--border);
  --color-ring: var(--ring);
  --color-rule: var(--rule);
  --color-success: var(--success);
  --color-warning: var(--warning);

  --font-sans: var(--font-geist-sans);

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 14px;
  --radius-2xl: 20px;

  --shadow-xs: var(--elev-xs);
  --shadow-pad: var(--elev-pad);
  --shadow-menu: var(--elev-menu);
  --shadow-overlay: var(--elev-overlay);

  --ease-soft: cubic-bezier(0.16, 1, 0.3, 1);
}

html {
  height: 100%;
}

body {
  height: 100%;
  margin: 0;
  background: var(--canvas);
  color: var(--text);
  font-family: var(--font-sans), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

::selection {
  background: var(--selection);
}

/* Rules on the 28px (1.75rem) line grid of the 16px / 1.75 text. The baseline sits 19px into each
   line, so the 1px rule at 24px sits about 5px under it, like a notepad rule under the text. Origin and
   clip are the content box, so the grid starts at the first text line whatever the top padding, and
   "local" attachment keeps the rules moving with the text when the pad scrolls. */
.notepad {
  font-family: var(--write-font);
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0 1.5rem,
    var(--rule) 1.5rem 1.5625rem,
    transparent 1.5625rem 1.75rem
  );
  background-origin: content-box;
  background-clip: content-box;
  background-attachment: local;
}

/* Desktop sidebar. One element animates its width; the data-sidebar attribute on <html> (set before first paint
   by layout.tsx) decides the state, so a reload never animates. Rules are unlayered on purpose: they must beat utilities.
   --sb-inset is the side inset (12px open, 8px rail). It is registered so it animates with the width, and the sections
   read it through .sb-inset. Icons sit in a 40px column that is centred in both states. */
@property --sb-inset {
  syntax: "<length>";
  inherits: true;
  initial-value: 0.75rem;
}

/* Layout containment: the sidebar's own layout never invalidates the pad, and the pad's never reaches the sidebar. */
.sb-aside {
  --sb-inset: 0.75rem;
  width: 17rem;
  contain: layout style;
  transition:
    width 220ms cubic-bezier(0.2, 0, 0, 1),
    --sb-inset 220ms cubic-bezier(0.2, 0, 0, 1);
}

.sb-aside > * {
  width: 17rem;
  flex-shrink: 0;
}

.sb-inset {
  padding-inline: var(--sb-inset, 0.75rem);
}

.sb-fade {
  transition:
    opacity 160ms ease-out,
    transform 220ms cubic-bezier(0.2, 0, 0, 1),
    visibility 220ms;
}

/* New note: a soft boxed row, 40px tall, full width. Collapsed it becomes a 36px square centred in the 40px icon
   column (2px margin), so its icon sits where the rail's other icons sit. */
.sb-new {
  width: 100%;
  margin-left: 0;
  padding-left: 0.25rem;
  transition:
    width 220ms cubic-bezier(0.2, 0, 0, 1),
    padding-left 220ms cubic-bezier(0.2, 0, 0, 1),
    margin-left 220ms cubic-bezier(0.2, 0, 0, 1),
    background-color 150ms ease-out;
}

.sb-rail-only {
  display: none;
}

html[data-sidebar="collapsed"] .sb-aside {
  --sb-inset: 0.5rem;
  width: 3.5rem;
}

html[data-sidebar="collapsed"] .sb-aside .sb-fade {
  opacity: 0;
  transform: translateX(-6px);
  visibility: hidden;
}

html[data-sidebar="collapsed"] .sb-aside .sb-new {
  width: 2.25rem;
  margin-left: 0.125rem;
  padding-left: 0;
}

html[data-sidebar="collapsed"] .sb-aside .sb-rail-only {
  display: flex;
}

/* A note row that appears after the list has settled. Opacity only, so no text moves. */
.sb-row-in {
  animation: sb-row-in 160ms ease-out both;
}

@keyframes sb-row-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Fade the whole view so the text, ruled paper and menus change together. */
html.theme-crossfade::view-transition {
  pointer-events: none;
}

html.theme-crossfade::view-transition-group(root),
html.theme-crossfade::view-transition-old(root),
html.theme-crossfade::view-transition-new(root) {
  animation-duration: 240ms;
  animation-timing-function: ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ---- Mobile shell (Agent E). Phones are below md, or a short landscape phone (height 500px or less, no hover).
   The desktop sidebar only appears on desktop-class screens, so an 844px-wide landscape phone keeps the phone shell. ---- */
.shell-desk-only {
  display: none;
}

.shell-phone-only {
  display: flex;
}

.shell-root {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.shell-main {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
  contain: layout style;
}

/* Phones: the pad is full-bleed under the top bar, so it drops its card frame. */
.shell-main > * {
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

@media (min-width: 48rem) and (min-height: 501px), (min-width: 48rem) and (hover: hover) {
  .shell-desk-only {
    display: flex;
  }

  .shell-phone-only {
    display: none;
  }

  .shell-main {
    padding: 0.75rem;
  }

  .shell-main > * {
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: var(--shadow-pad);
  }
}

/* AppShell applies this only while the editor route is visible. */
html.editor-scroll-lock,
html.editor-scroll-lock body {
  overflow: hidden;
  overscroll-behavior: none;
}

.shell-root {
  height: 100dvh;
  overscroll-behavior: none;
}

/* Touch: no grey tap flash, no double-tap zoom delay on controls. Zoom itself stays enabled. */
html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

* {
  -webkit-tap-highlight-color: transparent;
}

button,
a,
label,
summary,
[role="button"],
[role="menuitem"],
[role="option"] {
  touch-action: manipulation;
}

/* iOS zooms the page when a focused field is under 16px. Only text inputs without their own size class. */
@media (max-width: 47.99rem) {
  @layer base {
    input:not([type="checkbox"]):not([type="radio"]),
    textarea,
    select {
      font-size: 16px;
    }
  }
}

/* ── Auth pages (sign in, create account, forgot and reset password). Owned by the auth block only. ── */
.auth-serif {
  font-family: var(--font-plex-serif), Georgia, serif;
}

.auth-enter {
  animation: auth-enter 250ms var(--ease-soft) both;
}

@keyframes auth-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* Height follows the content with a short transition (set from JS, see AutoHeight). */
.auth-height {
  overflow: clip;
  overflow-clip-margin: 8px;
  transition: height 250ms var(--ease-soft);
}

@media (prefers-reduced-motion: reduce) {
  .auth-enter {
    animation: none;
  }
  .auth-height {
    transition: none;
  }
}

/* Mehr Nastaliq Web (Muhammad Zeeshan Nasar, calligraphy of Nasrullah Mehr), CC BY-SA 4.0. Urdu text only:
   unicode-range keeps English in the chosen writing font. */
@font-face {
  font-family: "Mehr";
  src:
    url("/fonts/mehr.woff") format("woff"),
    url("/fonts/mehr.ttf") format("truetype");
  font-display: swap;
  /* Nastaliq letters are small for their size; scale them up so Urdu reads as large as the English beside it.
     115% (was 165%). To make Urdu bigger or smaller change this number AND the other three faces below. */
  size-adjust: 115%;
  unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF;
}

/* ---- Where Urdu sits on the ruled lines ----
   The browser puts a line's baseline from the metrics of the line's FIRST font. "Mehr" above is limited to Urdu
   letters, so Chrome skips it for that job and the English font decides, which leaves Nastaliq floating in the middle
   of its two-row line. Mehr's own metrics are also huge and different on Windows and Mac (win 3000/1000, hhea 2200/1300),
   which is the "empty space" in the font.

   These three faces are the same font file, limited to Urdu plus the space character (the space is what makes the
   browser use the face for the baseline). They override ascent/descent so the baseline is the same on every platform:
     baseline = half the line height + (ascent - descent) / 2, with ascent/descent as % of the size-adjusted font size.
   Ruled paper has its rule 24px into each 28px row, so Urdu is set 5px above it, like the English text.
   Keep size-adjust identical in all four faces. Browsers without the override descriptors just use Mehr's own metrics. */
@font-face {
  font-family: "Mehr Line"; /* body lines and headings: 56px = two ruled rows */
  src:
    url("/fonts/mehr.woff") format("woff"),
    url("/fonts/mehr.ttf") format("truetype");
  font-display: swap;
  size-adjust: 115%;
  ascent-override: 245%;
  descent-override: 55%;
  line-gap-override: 0%;
  unicode-range: U+0020, U+00A0, U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF;
}

@font-face {
  font-family: "Mehr Title"; /* the note title input: 56px, baseline on the second rule */
  src:
    url("/fonts/mehr.woff") format("woff"),
    url("/fonts/mehr.ttf") format("truetype");
  font-display: swap;
  size-adjust: 115%;
  ascent-override: 205%;
  descent-override: 55%;
  line-gap-override: 0%;
  unicode-range: U+0020, U+00A0, U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF;
}

@font-face {
  font-family: "Mehr Row"; /* sidebar rows: Urdu centred in its row */
  src:
    url("/fonts/mehr.woff") format("woff"),
    url("/fonts/mehr.ttf") format("truetype");
  font-display: swap;
  size-adjust: 115%;
  ascent-override: 100%;
  descent-override: 40%;
  line-gap-override: 0%;
  unicode-range: U+0020, U+00A0, U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF;
}

/* ---- Italic Urdu: Kasheeda ----
   Nastaliq has no true italic, so the browser would just skew Mehr. Italic Urdu (*text* in a note) uses a Kasheeda
   font instead: long, elongated strokes. Declared as the italic style of its own family so the browser never skews it,
   and limited to Urdu letters so English italic stays in the writing font.

   The font file is NOT bundled (see KASHEEDA-SETUP.md): add public/fonts/kasheeda.woff2, or install
   "Jameel Noori Nastaleeq Kasheeda" on the device (local() is tried first). If neither is found, italic Urdu falls
   back to plain Mehr, nothing breaks.
   size-adjust: tune this one number until Kasheeda looks the same size as the Mehr text around it.
   Tuned: 120% matches Mehr's body size in mixed lines, 135% overshoots. 125% because Kasheeda's strokes are thinner
   and benefit from the extra size. */
@font-face {
  font-family: "Kasheeda";
  font-style: italic;
  src:
    local("Jameel Noori Nastaleeq Kasheeda"),
    local("JameelNooriNastaleeqKasheeda"),
    url("/fonts/kasheeda.woff2") format("woff2");
  font-display: swap;
  size-adjust: 125%;
  unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF;
}

.urdu-label {
  font-family: "Mehr", system-ui, sans-serif;
}

/* Mehr has one weight; without this the browser fakes a bold for the semibold title, which smears Nastaliq. */
input[aria-label="Note title"] {
  font-synthesis-weight: none;
}

/* Urdu must never be letter-spaced or faux-bolded: either one breaks the joining and ligatures Nastaliq relies on,
   which is what turned Urdu headings into garbled shapes. !important beats Tailwind's tracking-* utilities. */
.urdu-title,
.urdu-row,
.cm-urdu-line,
.cm-urdu-line *,
.shared-note-note-header h1[lang="ur"] {
  letter-spacing: 0 !important;
  font-synthesis-weight: none;
  font-variant-ligatures: normal;
}

/* Urdu note title: sits in the 56px title row (two ruled rows) with room for tall Nastaliq strokes. */
input.urdu-title {
  font-family: "Mehr Title", var(--write-font);
  font-size: 1.375rem;
  font-weight: 400;
  line-height: 56px;
  padding-top: 0;
  padding-bottom: 0;
}

/* Urdu row in the sidebar: taller row, right-aligned for RTL, ellipsis on the correct side. */
.urdu-row {
  font-family: "Mehr Row", var(--font-sans), system-ui, sans-serif;
  font-size: 0.8125rem;
  line-height: 3rem;
  text-align: start;
}

```

## src/app/layout.tsx

```tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif, Patrick_Hand } from "next/font/google";
import type { ReactNode } from "react";
import { AppToaster } from "@/components/AppToaster";
import { WebAnalytics } from "@/components/WebAnalytics";
import { site } from "@/lib/site";
import "./globals.css";

// UI chrome uses Geist; code and monospaced writing use Geist Mono. Other writing faces follow the saved font preference.
// The app only loads the weight ranges used in the editor, and self-hosts each font in the build.
const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const patrickHand = Patrick_Hand({
  variable: "--font-patrick-hand",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [site.author],
  creator: site.author.name,
  publisher: site.author.name,
  category: "productivity",
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: site.locale,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: { capable: true, title: site.name, statusBarStyle: "default" },
  formatDetection: { telephone: false, email: false, address: false },
};

// Zoom stays enabled (no maximumScale or userScalable=no). "cover" lets the shell use the notch and home-indicator
// areas, which it pads with env(safe-area-inset-*). "resizes-content" makes the on-screen keyboard shrink the layout
// viewport (100dvh follows it), so the caret stays in view.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#efebdf",
};

// Applies the saved theme and font before first paint, so there is no flash.
const appearanceBootstrap = `
  try {
    const saved = window.localStorage.getItem("notes:ui:v1");
    const prefs = saved ? JSON.parse(saved) : undefined;
    // Only an explicit stored "dark" makes the app dark. Everything else (first visit, "light", "system", invalid) is light.
    const dark = prefs && prefs.theme === "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    // Pages without the app shell (about, login) keep the light theme-color unless it is set here.
    if (dark) document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => { meta.content = "#242423"; });
    const font = prefs && prefs.font;
    document.documentElement.dataset.font =
      font === "sans" || font === "serif" || font === "mono" ? font : "hand";
    const size = prefs && prefs.size;
    document.documentElement.dataset.size =
      size === "small" || size === "large" || size === "xlarge" ? size : "medium";
    // Desktop sidebar width is driven by this attribute (see .sb-aside in globals.css), so it is right before first paint.
    document.documentElement.dataset.sidebar = prefs && prefs.sidebarOpen === false ? "collapsed" : "open";
  } catch {}
`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${patrickHand.variable} ${plexMono.variable} ${plexSans.variable} ${plexSerif.variable}`}
      data-font="hand"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceBootstrap }} />
      </head>
      <body>
        {children}
        <AppToaster />
        <WebAnalytics />
      </body>
    </html>
  );
}

```

## src/lib/urdu/keymap.ts

```typescript
/**
 * Urdu keyboard layout (the standard Pakistani layout). Keys are physical positions (KeyboardEvent.code), so the
 * layout works no matter which language the operating system keyboard is set to: press the "Q" key and you get ق.
 *
 * Each entry is [normal, shift]. A missing value means the key types its normal character.
 * Keys not listed here (` [ ] \ ' / and the bracket pairs) are left alone on purpose: they carry Markdown syntax
 * (code, links, escapes), so they keep typing the usual characters while Urdu is on.
 */
type Pair = [normal?: string, shift?: string];

/**
 * The standard layout types Latin digits on the number row, and so does this one. Set to true to type Urdu-Indic
 * digits (۱۲۳…) instead.
 */
const URDU_DIGITS = false;

export const URDU_LAYOUT: Record<string, Pair> = {
  // Number row: digits stay as they are. Shift keeps the usual symbols, except ^ which gives ۂ.
  Digit6: [undefined, "ۂ"],
  Minus: [undefined, "ـ"], //       shift: tatweel (kashida)
  Equal: ["ٓ", "ۤ"], //   maddah mark, shift: small maddah

  // Top row
  KeyQ: ["ق", "ﷺ"],
  KeyW: ["و", "ؤ"],
  KeyE: ["ع", "ؑ"], //         shift: alayhe assalam sign
  KeyR: ["ر", "ڑ"],
  KeyT: ["ت", "ٹ"],
  KeyY: ["ے", "ۓ"],
  KeyU: ["ئ", "ء"], //             hamza on yeh; shift: plain hamza
  KeyI: ["ی", "ٰ"], //         shift: dagger alif
  KeyO: ["ہ", "ۃ"],
  KeyP: ["پ", "ُ"], //         shift: pesh

  // Home row
  KeyA: ["ا", "آ"],
  KeyS: ["س", "ص"],
  KeyD: ["د", "ڈ"],
  KeyF: ["ف", "ٖ"], //         shift: subscript alef
  KeyG: ["گ", "غ"],
  KeyH: ["ھ", "ح"],
  KeyJ: ["ج", "ض"],
  KeyK: ["ک", "خ"],
  KeyL: ["ل", "ؒ"], //         shift: rahmatullah alayh sign
  Semicolon: ["؛"],

  // Bottom row
  KeyZ: ["ز", "ذ"],
  KeyX: ["ش", "ژ"],
  KeyC: ["چ", "ث"],
  KeyV: ["ط", "ظ"],
  KeyB: ["ب", "﷽"],
  KeyN: ["ن", "ں"],
  KeyM: ["م", "ؐ"], //         shift: sallallahu alayhi wasallam sign
  Comma: ["،", "ِ"], //        shift: zer
  Period: ["۔", "َ"], //       shift: zabar
  Slash: [undefined, "؟"],
};

if (URDU_DIGITS) {
  const digits = "۰۱۲۳۴۵۶۷۸۹";
  for (let n = 0; n <= 9; n++) {
    const code = `Digit${n}`;
    URDU_LAYOUT[code] = [digits[n], URDU_LAYOUT[code]?.[1]];
  }
}

/** The Urdu character for a physical key, or undefined when the key should type normally. */
export function urduForKey(code: string, shift: boolean): string | undefined {
  const pair = URDU_LAYOUT[code];
  if (!pair) return undefined;
  return shift ? pair[1] : pair[0];
}

// US QWERTY characters for each position. Phone keyboards report characters, not key positions,
// so the typed character is mapped back to its position first.
const US_CHARS: Record<string, [string, string]> = {
  Backquote: ["`", "~"],
  Digit1: ["1", "!"], Digit2: ["2", "@"], Digit3: ["3", "#"], Digit4: ["4", "$"], Digit5: ["5", "%"],
  Digit6: ["6", "^"], Digit7: ["7", "&"], Digit8: ["8", "*"], Digit9: ["9", "("], Digit0: ["0", ")"],
  Minus: ["-", "_"], Equal: ["=", "+"],
  BracketLeft: ["[", "{"], BracketRight: ["]", "}"], Backslash: ["\\", "|"],
  Semicolon: [";", ":"], Quote: ["'", '"'], Comma: [",", "<"], Period: [".", ">"], Slash: ["/", "?"],
};
for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") US_CHARS[`Key${c}`] = [c.toLowerCase(), c];

const CHAR_TO_URDU: Record<string, string> = {};
for (const [code, [plain, shifted]] of Object.entries(US_CHARS)) {
  const normal = urduForKey(code, false);
  const upper = urduForKey(code, true);
  if (normal) CHAR_TO_URDU[plain] = normal;
  if (upper) CHAR_TO_URDU[shifted] = upper;
}

/** The Urdu character for a typed Latin character (used when the browser gives no key position). */
export function urduForChar(char: string): string | undefined {
  return CHAR_TO_URDU[char];
}

export interface KeyDef {
  code: string;
  /** What the same key types on a US keyboard: [normal, shift]. */
  latin: [string, string];
}

const rowOf = (codes: string[]): KeyDef[] => codes.map((code) => ({ code, latin: US_CHARS[code] }));

/** The four character rows of a keyboard, for drawing the on-screen layout. Built from the same table as typing. */
export const KEY_ROWS: KeyDef[][] = [
  rowOf(["Backquote", ..."1234567890".split("").map((d) => `Digit${d}`), "Minus", "Equal"]),
  rowOf([..."QWERTYUIOP".split("").map((c) => `Key${c}`), "BracketLeft", "BracketRight", "Backslash"]),
  rowOf([..."ASDFGHJKL".split("").map((c) => `Key${c}`), "Semicolon", "Quote"]),
  rowOf([..."ZXCVBNM".split("").map((c) => `Key${c}`), "Comma", "Period", "Slash"]),
];

/** True for characters in the Arabic script blocks, which is where Urdu lives. */
export const ARABIC_SCRIPT = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

```

## src/components/editor/urdu.ts

```typescript
import { RangeSetBuilder, type Extension } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { ARABIC_SCRIPT } from "@/lib/urdu/keymap";

export const URDU_MODE_EVENT = "likho:urdu-mode";

const RTL_LETTER = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const LTR_LETTER = /[A-Za-z\u00C0-\u024F]/;

/** Direction of the first letter in the line, like the Unicode "first strong character" rule. */
function firstStrong(text: string): "rtl" | "ltr" | null {
  for (const char of text) {
    if (RTL_LETTER.test(char)) return "rtl";
    if (LTR_LETTER.test(char)) return "ltr";
  }
  return null;
}

const urduLtr = Decoration.line({ class: "cm-urdu-line" });
const urduRtl = Decoration.line({ class: "cm-urdu-line", attributes: { dir: "rtl" } });
const emptyRtl = Decoration.line({ attributes: { dir: "rtl" } });

function build(view: EditorView): DecorationSet {
  const keyboardOn = document.documentElement.dataset.urdu === "on";
  const builder = new RangeSetBuilder<Decoration>();
  let last = -1;
  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos);
      if (line.from > last) {
        last = line.from;
        const direction = firstStrong(line.text);
        if (ARABIC_SCRIPT.test(line.text)) {
          builder.add(line.from, line.from, direction === "ltr" ? urduLtr : urduRtl);
        } else if (keyboardOn && direction === null) {
          // Blank or number-only lines start at the right while the Urdu keyboard is on, so the caret is where Urdu starts.
          builder.add(line.from, line.from, emptyRtl);
        }
      }
      pos = line.to + 1;
    }
  }
  return builder.finish();
}

/**
 * Urdu support in the note body. A line that starts with Urdu is right-to-left and right-aligned; a line that starts
 * with English stays left-to-right. Lines with Urdu get two ruled rows of height, because Nastaliq letters are tall.
 */
export const urduSupport: Extension = [
  EditorView.perLineTextDirection.of(true),
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      private readonly refresh: () => void;
      constructor(private readonly view: EditorView) {
        this.decorations = build(view);
        // Switching the Urdu keyboard on or off changes how empty lines are aligned.
        this.refresh = () => {
          this.decorations = build(this.view);
          this.view.requestMeasure();
          this.view.dispatch({});
        };
        window.addEventListener(URDU_MODE_EVENT, this.refresh);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) this.decorations = build(update.view);
      }
      destroy() {
        window.removeEventListener(URDU_MODE_EVENT, this.refresh);
      }
    },
    { decorations: (plugin) => plugin.decorations },
  ),
];

```

## src/components/editor/editor.css

```css
/*
 * Live Markdown in the note body. Every row is 28px (1.75rem), so the ruled grid behind the text stays aligned.
 * Everything is scoped under .note-editor, so it only touches this editor.
 */

.note-editor {
  /* The one source for code type. Geist Mono is loaded in layout.tsx; the rest are fallbacks. */
  --editor-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-family: var(--write-font);
  font-size: calc(1rem * var(--write-scale, 1));
  line-height: 1.75rem;
  color: var(--text);
}

/* The handwritten font reads small at 16px, so its body text is a touch larger. The 28px row stays the same,
   so the ruled lines still line up. */
:root[data-font="hand"] .note-editor {
  font-size: calc(1.125rem * var(--write-scale, 1));
}

/* CodeMirror puts an empty inline image next to each widget. Its default is 1em tall, which would grow the row. */
.note-editor .cm-widgetBuffer {
  display: inline-block;
  width: 0;
  height: 0;
  vertical-align: top;
}

/* Inline spans never change a row's height. The 28px row comes from the .cm-line itself, whatever font a span uses. */
.note-editor .cm-line {
  line-height: 1.75rem;
}

.note-editor .cm-line span {
  line-height: 0;
}

/* ---- Headings: bigger and bolder, still one 28px row each ---- */

.note-editor .cm-line.md-h1 {
  font-size: calc(1.5625rem * var(--write-scale, 1));
  font-weight: 700;
  letter-spacing: -0.01em;
}

.note-editor .cm-line.md-h2 {
  font-size: calc(1.3125rem * var(--write-scale, 1));
  font-weight: 700;
}

.note-editor .cm-line.md-h3 {
  font-size: calc(1.125rem * var(--write-scale, 1));
  font-weight: 600;
}

/* ---- Lists: hanging indent, so wrapped text lines up after the marker ---- */

.note-editor .cm-line.md-list {
  padding-left: calc(var(--lvl, 0) * 1.5em + 1.5em);
  text-indent: -1.5em;
}

.note-editor .md-marker,
.note-editor .md-check,
.note-editor .md-code-head {
  text-indent: 0;
}

.note-editor .md-marker {
  display: inline-block;
  box-sizing: border-box;
  width: 1.5em;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.note-editor .md-marker-bullet {
  padding-left: 0.25em;
}

.note-editor .md-marker-ol {
  text-align: left;
  padding-right: 0;
}

.note-editor .md-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 16px;
  height: 16px;
  margin: 0 8px 0 0;
  padding: 0;
  vertical-align: -3px;
  border: 1.5px solid var(--text-muted);
  border-radius: 5px;
  background: transparent;
  color: var(--on-accent);
  line-height: 0;
  cursor: pointer;
  outline: none;
}

.note-editor .md-check:hover {
  border-color: var(--accent);
}

.note-editor .md-check[aria-checked="true"] {
  background: var(--accent);
  border-color: var(--accent);
}

.note-editor .md-check:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

.note-editor .md-icon {
  display: block;
}

.note-editor .md-task-done {
  color: var(--text-muted);
  text-decoration: line-through;
  text-decoration-thickness: 1px;
}

/* ---- Blockquote: a left bar and muted text ---- */

.note-editor .cm-line.md-quote {
  border-left: 3px solid var(--border);
  padding-left: 0.9em;
  color: var(--text-secondary);
}

/* ---- Horizontal rule: a centred hairline, clearly stronger than the ruled lines ---- */

.note-editor {
  --line-strong: light-dark(rgb(31 30 29 / 0.3), rgb(255 255 255 / 0.28));
  --line-stronger: light-dark(rgb(31 30 29 / 0.5), rgb(255 255 255 / 0.45));
}

.note-editor .cm-line.md-hr {
  background-image: linear-gradient(var(--line-strong), var(--line-strong));
  background-position: center;
  background-size: 100% 1px;
  background-repeat: no-repeat;
}

/* ---- Fenced code: a neutral rounded block. Lines keep the grid. ---- */

.note-editor .cm-line.md-code {
  font-family: var(--editor-mono);
  font-size: 0.875rem;
  /* Same 28px row as prose, so the ruled grid still lines up. */
  line-height: 1.75rem;
  font-variant-ligatures: none;
  tab-size: 2;
  background-color: var(--accent-soft);
  margin-inline: -6px;
  padding-inline: 6px;
  overflow-wrap: anywhere;
}

.note-editor .cm-line.md-code-first {
  position: relative;
  border-start-start-radius: 8px;
  border-start-end-radius: 8px;
}

.note-editor .cm-line.md-code-last {
  border-end-start-radius: 8px;
  border-end-end-radius: 8px;
}

.note-editor .md-code-head {
  position: absolute;
  top: 2px;
  right: 6px;
  height: 24px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--editor-mono);
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  color: var(--text-muted);
  line-height: 1.75rem;
}

.note-editor .md-code-lang {
  padding-right: 2px;
}

.note-editor .md-copy {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  outline: none;
  transition:
    opacity 150ms ease-out,
    background-color 150ms ease-out,
    color 150ms ease-out;
}

.note-editor .md-copy:hover {
  background: var(--hover);
  color: var(--text);
}

.note-editor .md-copy:focus-visible {
  opacity: 1;
  outline: 2px solid var(--ring);
  outline-offset: 1px;
}

.note-editor .cm-line.md-code-first:hover .md-copy,
.note-editor .cm-line.md-code-first.is-hover .md-copy,
.note-editor .cm-line.md-code-focus .md-copy {
  opacity: 1;
}

@media (hover: none) {
  .note-editor .md-copy {
    opacity: 1;
  }
}

/* ---- Inline styles ---- */

/* Markers: dimmed while the cursor is in their span. Hidden, as replaced ranges, otherwise. */
.note-editor .md-mark {
  color: var(--text-muted);
}

.note-editor .md-em {
  font-style: italic;
}

/* Italic Urdu is set in Kasheeda (see globals.css). It only covers Urdu letters, so English italic is unchanged,
   and the baseline stays the line's own (the span has line-height 0), so it sits on the same rule as the rest. */
.note-editor .cm-urdu-line .md-em {
  font-family: "Kasheeda", "Mehr Line", var(--write-font);
}

.note-editor .md-strong {
  font-weight: 700;
}

/* Bold Urdu. Mehr and Kasheeda have one weight, and faux-bold is switched off for Urdu lines (it garbled joins), so
   font-weight alone does nothing there. Thicken the strokes with a same-colour text stroke instead: it doesn't move
   glyphs or change advances, so joining and ligatures are untouched. --urdu-bold is the one number to tune. */
.note-editor .cm-urdu-line .md-strong {
  --urdu-bold: 0.03em;
  -webkit-text-stroke: var(--urdu-bold) currentColor;
  paint-order: stroke fill;
}

.note-editor .md-strike {
  text-decoration: line-through;
  text-decoration-thickness: 1px;
}

.note-editor .md-code-inline {
  font-family: var(--editor-mono);
  font-size: 0.9em;
  font-variant-ligatures: none;
  tab-size: 2;
  background-color: var(--accent-soft);
  border-radius: 4px;
  padding: 0.1em 0.3em;
}

.note-editor .md-link,
.note-editor .md-url {
  color: var(--accent);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.note-editor .cm-placeholder {
  position: relative;
  top: 11px;
  color: var(--text-muted);
}

/* ---- GFM tables: compact rows keep the ruled-paper grid aligned ---- */

.note-editor .cm-line.md-table-source {
  color: var(--text);
}

.note-editor .md-table-pipe {
  color: var(--text-muted);
}

.note-editor .md-table-scroll {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-inline: contain;
  scrollbar-color: var(--border) transparent;
}

.note-editor .md-table {
  width: max-content;
  min-width: 100%;
  height: 100%;
  border-collapse: collapse;
  table-layout: auto;
  color: var(--text);
  font-family: var(--write-font);
  font-size: inherit;
  line-height: 28px;
}

.note-editor .md-table tr {
  height: 28px;
}

.note-editor .md-table th,
.note-editor .md-table td {
  box-sizing: border-box;
  height: 28px;
  min-width: 3rem;
  padding: 0 0.5rem;
  border: 1px solid var(--line-strong);
  background: var(--pad);
  line-height: 27px;
  vertical-align: middle;
  white-space: nowrap;
}

.note-editor .md-table th {
  font-weight: 700;
  box-shadow: inset 0 -1px 0 var(--line-stronger);
}

.note-editor .md-table code.md-code-inline {
  white-space: nowrap;
}

.note-editor .md-table .md-table-link {
  color: var(--accent);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

/* Lines with Urdu get two ruled rows (56px): Nastaliq letters are tall, and 56px keeps the ruled grid aligned. */
.cm-content .cm-line.cm-urdu-line {
  line-height: 3.5rem;
  /* The FIRST font decides where the baseline lands (see "Mehr Line" in globals.css): Urdu sits 5px above the rule, like English. */
  font-family: "Mehr Line", var(--write-font);
}

/* Urdu headings: smaller so they fit the 56px row, no tracking, no faux bold. */
.note-editor .cm-line.cm-urdu-line.md-h1 {
  font-size: calc(1.25rem * var(--write-scale, 1));
  font-weight: 400;
  letter-spacing: 0;
}

.note-editor .cm-line.cm-urdu-line.md-h2 {
  font-size: calc(1.125rem * var(--write-scale, 1));
  font-weight: 400;
  letter-spacing: 0;
}

.note-editor .cm-line.cm-urdu-line.md-h3 {
  font-size: calc(1rem * var(--write-scale, 1));
  font-weight: 400;
  letter-spacing: 0;
}

.cm-content .cm-line[dir="rtl"] {
  text-align: start;
}

```

## src/components/editor/NoteEditor.tsx

```tsx
"use client";

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { Annotation, Compartment, EditorState, Transaction, type Extension } from "@codemirror/state";
import { drawSelection, EditorView, keymap, placeholder as placeholderExtension } from "@codemirror/view";
import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { editorKeymap, fenceExitOnBacktick, type EditorBridge } from "./commands";
import { formatState, formattingKeymap, runFormat, type FormatId, type FormatState } from "./formatting";
import { editorInteractions } from "./interactions";
import { livePreview } from "./livePreview";
import { markdownSupport } from "./markdown";
import { smartPaste } from "./smartPaste";
import { tablePipeInputHandler } from "./tableCommands";
import { tablePreview } from "./tables";
import { urduSupport } from "./urdu";
import { codeHighlight, editorBaseTheme } from "./theme";
import "./editor.css";

export interface NoteEditorHandle {
  focusStart: () => void;
  focusEnd: () => void;
  focusAt: (pos: number) => void;
  /** Re-measures the viewport. The pad scrolls the editor, so the editor needs a nudge when it scrolls. */
  refresh: () => void;
  /** Runs a toolbar command (bold, a heading, a list ...) on the current selection, then refocuses the note. */
  format: (id: FormatId) => void;
}

export interface NoteEditorProps {
  /** Changing id loads a fresh document with its own undo history. */
  noteId: string | null;
  /** The Markdown body: everything after the title line. */
  value: string;
  readOnly: boolean;
  placeholder: string;
  onChange: (body: string) => void;
  /** ArrowUp from the first line, or Backspace at the start, moves focus to the title. */
  onAtTop: () => void;
  onReady?: () => void;
  /** What the caret is inside (bold, a heading ...), so the toolbar can light its buttons. Only fires on change. */
  onFormatState?: (state: FormatState) => void;
  handleRef: RefObject<NoteEditorHandle | null>;
}

interface Wiring {
  compartments: { readOnly: Compartment; placeholder: Compartment };
  bridge: EditorBridge & { onChange: (body: string) => void };
  /** Reports the formatting at the caret to the toolbar, skipping reports that would say nothing new. */
  formats: (state: EditorState) => void;
}

/** Marks edits that copy the store into the editor, so they do not echo back as user changes. */
const externalSync = Annotation.define<boolean>();

function readOnlyExtension(readOnly: boolean): Extension {
  return readOnly ? [EditorState.readOnly.of(true), EditorView.editable.of(false)] : [];
}

function placeholderFor(text: string): Extension {
  return text ? placeholderExtension(text) : [];
}

function createState(doc: string, wiring: Wiring, readOnly: boolean, placeholder: string): EditorState {
  return EditorState.create({
    doc,
    extensions: [
      history(),
      drawSelection({ drawRangeCursor: false }),
      EditorView.lineWrapping,
      markdownSupport,
      livePreview,
      tablePreview,
      codeHighlight,
      editorBaseTheme,
      editorKeymap(wiring.bridge),
      fenceExitOnBacktick,
      tablePipeInputHandler,
      smartPaste(),
      urduSupport,
      editorInteractions,
      wiring.compartments.readOnly.of(readOnlyExtension(readOnly)),
      wiring.compartments.placeholder.of(placeholderFor(placeholder)),
      formattingKeymap,
      keymap.of([...historyKeymap, ...defaultKeymap]),
      EditorView.contentAttributes.of({ "aria-label": "Note body", spellcheck: "true" }),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;
        if (update.transactions.some((tr) => tr.annotation(externalSync))) return;
        wiring.bridge.onChange(update.state.doc.toString());
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged || update.selectionSet || update.focusChanged) wiring.formats(update.state);
      }),
    ],
  });
}

/**
 * The note body as a live Markdown editor. One CodeMirror view is created and kept for the life of the pad. It
 * only takes a new document when the note id changes, or when the store changes the text from outside.
 */
export function NoteEditor({
  noteId,
  value,
  readOnly,
  placeholder,
  onChange,
  onAtTop,
  onReady,
  onFormatState,
  handleRef,
}: NoteEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const loadedIdRef = useRef<string | null>(null);
  // The latest props, read by the editor's callbacks. The callbacks themselves never change identity.
  const latest = useRef({ noteId, value, readOnly, placeholder, onChange, onAtTop, onReady, onFormatState });
  const [wiring] = useState<Wiring>(() => {
    let lastReported = "";
    return {
      compartments: { readOnly: new Compartment(), placeholder: new Compartment() },
      bridge: {
        onChange: (body: string) => latest.current.onChange(body),
        onAtTop: () => latest.current.onAtTop(),
      },
      formats: (state: EditorState) => {
        const next = formatState(state);
        const key = `${next.active.join(",")}|${next.canUndo}|${next.canRedo}`;
        if (key === lastReported) return;
        lastReported = key;
        latest.current.onFormatState?.(next);
      },
    };
  });

  useLayoutEffect(() => {
    latest.current = { noteId, value, readOnly, placeholder, onChange, onAtTop, onReady, onFormatState };
  });

  // Created once. The view then lives across every keystroke.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const current = latest.current;
    const view = new EditorView({
      parent: host,
      state: createState(current.value, wiring, current.readOnly, current.placeholder),
    });
    viewRef.current = view;
    loadedIdRef.current = current.noteId;
    wiring.formats(view.state);
    current.onReady?.();
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [wiring]);

  // Syncs from the store only when the note changed, or the text differs from the editor's own document.
  // Typing already matches, so the caret never jumps.
  useLayoutEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (loadedIdRef.current !== noteId) {
      loadedIdRef.current = noteId;
      view.setState(createState(value, wiring, readOnly, placeholder));
      wiring.formats(view.state);
      return;
    }
    if (view.composing || view.state.doc.toString() === value) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
      selection: { anchor: Math.min(view.state.selection.main.head, value.length) },
      annotations: [externalSync.of(true), Transaction.addToHistory.of(false)],
    });
  }, [noteId, value, readOnly, placeholder, wiring]);

  useLayoutEffect(() => {
    viewRef.current?.dispatch({
      effects: [
        wiring.compartments.readOnly.reconfigure(readOnlyExtension(readOnly)),
        wiring.compartments.placeholder.reconfigure(placeholderFor(placeholder)),
      ],
    });
  }, [readOnly, placeholder, wiring]);

  useImperativeHandle(
    handleRef,
    () => {
      const place = (pos: number) => {
        const view = viewRef.current;
        if (!view) return;
        const anchor = Math.min(Math.max(pos, 0), view.state.doc.length);
        view.dispatch({ selection: { anchor }, scrollIntoView: true });
        view.focus();
      };
      return {
        focusStart: () => place(0),
        focusEnd: () => place(Number.MAX_SAFE_INTEGER),
        focusAt: place,
        refresh: () => viewRef.current?.requestMeasure(),
        format: (id: FormatId) => {
          const view = viewRef.current;
          if (view) runFormat(view, id);
        },
      };
    },
    [],
  );

  return <div ref={hostRef} className="note-editor min-w-0 flex-1" />;
}


```

## src/components/editor/theme.ts

```typescript
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

/**
 * Base theme for CodeMirror's own elements. Colours come from the app's tokens, so light and dark follow the same
 * values the rest of the app uses.
 */
export const editorBaseTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "var(--text)",
    fontFamily: "var(--write-font)",
    fontSize: "inherit",
    lineHeight: "1.75rem",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "inherit",
    lineHeight: "1.75rem",
    overflow: "visible",
  },
  ".cm-content": {
    padding: "0",
    fontFamily: "inherit",
    minHeight: "0",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--accent)",
    // Shorten the caret within each row without changing the ruled grid.
    transform: "scaleY(0.72)",
  },
  "& > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
    backgroundColor: "var(--selection)",
  },
  ".cm-line": {
    padding: "0",
    lineHeight: "1.75rem",
  },
  ".cm-placeholder": {
    color: "var(--muted-foreground)",
    fontFamily: "inherit",
  },
});

/** Colours for code-block tokens. Neutral tokens only, so nothing orange or clay appears. */
export const codeHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [t.keyword, t.modifier, t.operatorKeyword], color: "var(--accent)" },
    { tag: [t.propertyName], color: "var(--accent)" },
    { tag: [t.string, t.special(t.string)], color: "var(--success)" },
    { tag: [t.number, t.bool, t.null, t.atom], color: "var(--accent-hover)" },
    { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--text-muted)", fontStyle: "italic" },
    { tag: [t.typeName, t.className, t.namespace], color: "var(--text-secondary)", fontWeight: "600" },
    { tag: [t.function(t.variableName), t.definition(t.variableName)], color: "var(--text)" },
    { tag: [t.operator, t.punctuation, t.bracket, t.meta], color: "var(--text-secondary)" },
    { tag: t.invalid, color: "var(--danger)" },
  ]),
);

```

## src/components/editor/livePreview.ts

```typescript
import { syntaxTree } from "@codemirror/language";
import { type Line, RangeSet, RangeSetBuilder, type Range } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";
import { CheckboxWidget, CodeHeadWidget, MarkerWidget } from "./widgets";
import { closingFence, fenceInfo, QUOTE_PREFIX } from "./syntax";

/** Bullet glyph per nesting level. */
const BULLETS = ["•", "◦", "▪"];

const HEADING_LINE: Record<string, string> = {
  ATXHeading1: "md-h1",
  ATXHeading2: "md-h2",
  ATXHeading3: "md-h3",
  ATXHeading4: "md-h3",
  ATXHeading5: "md-h3",
  ATXHeading6: "md-h3",
};

// Shared decoration instances. CodeMirror compares by spec, so reusing them keeps rebuilds cheap.
const markCache = new Map<string, Decoration>();
function markDeco(cls: string): Decoration {
  let deco = markCache.get(cls);
  if (!deco) {
    deco = Decoration.mark({ class: cls });
    markCache.set(cls, deco);
  }
  return deco;
}
const dimDeco = markDeco("md-mark");
const hideDeco = Decoration.replace({});

const lineCache = new Map<string, Decoration>();
function lineDeco(classes: string, style: string): Decoration {
  const key = `${classes}|${style}`;
  let deco = lineCache.get(key);
  if (!deco) {
    deco = Decoration.line({ attributes: style ? { class: classes, style } : { class: classes } });
    lineCache.set(key, deco);
  }
  return deco;
}

interface Built {
  decorations: DecorationSet;
  atomic: DecorationSet;
}

function listDepth(node: SyntaxNode): number {
  let depth = 0;
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.name === "ListItem") depth++;
  }
  return depth;
}

/**
 * Builds the live-preview decorations for the lines in view only. Markers are hidden when the cursor is away
 * from their span and dimmed when it is inside. Markdown syntax is read from the lezer tree, so a fence or a list
 * is only what the parser says it is, and nothing inside a code block gets styled as Markdown.
 */
function build(view: EditorView): Built {
  const { state } = view;
  const doc = state.doc;
  const tree = syntaxTree(state);
  const cursors = state.selection.ranges;
  const touches = (from: number, to: number) => cursors.some((range) => range.from <= to && range.to >= from);

  const items: Range<Decoration>[] = [];
  const atomic: Range<Decoration>[] = [];
  const lines = new Map<number, { classes: string[]; style: string }>();
  const seen = new Set<string>();

  // Each tag names a kind of decoration, so a range visited from two visible ranges is only added once.
  const put = (tag: string, from: number, to: number, deco: Decoration, replaces: boolean) => {
    const key = `${tag}|${from}|${to}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(deco.range(from, to));
    if (replaces) atomic.push(deco.range(from, to));
  };

  const hide = (from: number, to: number, active: boolean) => {
    if (to <= from) return;
    if (active) put("dim", from, to, dimDeco, false);
    else put("hide", from, to, hideDeco, true);
  };

  const addLine = (at: number, classes: string, style = "") => {
    let entry = lines.get(at);
    if (!entry) {
      entry = { classes: [], style: "" };
      lines.set(at, entry);
    }
    for (const cls of classes.split(" ")) {
      if (cls && !entry.classes.includes(cls)) entry.classes.push(cls);
    }
    if (style) entry.style = style;
  };

  const skipSpaces = (pos: number) => {
    const line = doc.lineAt(pos);
    let i = pos - line.from;
    while (i < line.text.length && (line.text[i] === " " || line.text[i] === "\t")) i++;
    return line.from + i;
  };

  for (const range of view.visibleRanges) {
    // Lines of a block that start before or end after this visible range are clipped to it.
    const eachLine = (from: number, to: number, fn: (line: Line) => void) => {
      const start = Math.max(from, range.from);
      const end = Math.min(to, range.to);
      if (start > end) return;
      for (let line = doc.lineAt(start); ; line = doc.line(line.number + 1)) {
        fn(line);
        if (line.to >= end || line.number >= doc.lines) break;
      }
    };

    tree.iterate({
      from: range.from,
      to: range.to,
      enter: (ref) => {
        const node = ref.node;
        const name = ref.name;

        if (name in HEADING_LINE) {
          const cls = HEADING_LINE[name];
          eachLine(ref.from, ref.to, (line) => addLine(line.from, cls));
          return;
        }

        switch (name) {
          // Tables have their own StateField replacement. Skip their descendants so inline preview marks do not
          // overlap the block widget or partially style the raw Markdown while a table is being edited.
          case "Table":
            return false;

          case "HeaderMark": {
            const line = doc.lineAt(ref.from);
            // The "#" marker and the space after it.
            hide(ref.from, skipSpaces(ref.to), touches(line.from, line.to));
            return;
          }

          case "Blockquote":
            eachLine(ref.from, ref.to, (line) => {
              if (QUOTE_PREFIX.test(line.text)) addLine(line.from, "md-quote");
            });
            return;

          case "QuoteMark": {
            const line = doc.lineAt(ref.from);
            hide(ref.from, skipSpaces(ref.to), touches(line.from, line.to));
            return;
          }

          case "ListItem": {
            const mark = node.getChild("ListMark");
            if (!mark) return;
            // A marker counts only with a space after it. "-" alone is still plain text.
            const after = doc.sliceString(mark.to, mark.to + 1);
            if (after !== " " && after !== "\t") return;

            const depth = listDepth(node);
            eachLine(ref.from, ref.to, (line) => addLine(line.from, "md-list", `--lvl:${depth}`));

            const markLine = doc.lineAt(mark.from);
            // Leading indent is replaced together with the marker, so the hanging gutter alone sets the column.
            const leadingIsIndent = /^[ \t]*$/.test(doc.sliceString(markLine.from, mark.from));
            const start = leadingIsIndent ? markLine.from : mark.from;

            const task = node.getChild("Task");
            const box = task?.getChild("TaskMarker");
            if (task && box) {
              const end = skipSpaces(box.to);
              const checked = doc.sliceString(box.from + 1, box.from + 2).toLowerCase() === "x";
              const label = doc.sliceString(end, task.to).trim().slice(0, 120);
              put("box", start, end, Decoration.replace({ widget: new CheckboxWidget(checked, label) }), true);
              if (checked && task.to > end) put("done", end, task.to, markDeco("md-task-done"), false);
            } else {
              const end = skipSpaces(mark.to);
              const label = doc.sliceString(mark.from, mark.to);
              const ordered = /\d/.test(label);
              const glyph = ordered ? label : BULLETS[depth % BULLETS.length];
              put("bullet", start, end, Decoration.replace({ widget: new MarkerWidget(glyph, ordered) }), true);
            }
            return;
          }

          case "FencedCode": {
            const open = doc.lineAt(ref.from);
            const last = doc.lineAt(ref.to);
            const close = closingFence(node);
            // The fence lines show while the cursor is inside the block, and are hidden otherwise.
            const active = touches(ref.from, ref.to);
            eachLine(ref.from, ref.to, (line) => addLine(line.from, "md-code"));
            addLine(open.from, "md-code-first");
            addLine(last.from, "md-code-last");
            if (active) addLine(open.from, "md-code-focus");
            hide(open.from, open.to, active);
            if (close) hide(last.from, last.to, active);
            // The language label and Copy button sit at the end of the opening line, which has no other content.
            put(
              "head",
              open.to,
              open.to,
              // While the cursor is in the block the raw fence shows, so the label would repeat it.
              Decoration.widget({ widget: new CodeHeadWidget(active ? "" : fenceInfo(state, node)), side: 1 }),
              false,
            );
            return false;
          }

          case "HorizontalRule": {
            const line = doc.lineAt(ref.from);
            addLine(line.from, "md-hr");
            hide(ref.from, ref.to, touches(line.from, line.to));
            return false;
          }

          case "Emphasis":
          case "StrongEmphasis":
          case "Strikethrough":
          case "InlineCode": {
            const cls =
              name === "Emphasis"
                ? "md-em"
                : name === "StrongEmphasis"
                  ? "md-strong"
                  : name === "Strikethrough"
                    ? "md-strike"
                    : "md-code-inline";
            const active = touches(ref.from, ref.to);
            put(cls, ref.from, ref.to, markDeco(cls), false);
            for (let child = node.firstChild; child; child = child.nextSibling) {
              if (child.name === "EmphasisMark" || child.name === "StrikethroughMark" || child.name === "CodeMark") {
                hide(child.from, child.to, active);
              }
            }
            return;
          }

          case "Link": {
            const marks: SyntaxNode[] = [];
            for (let child = node.firstChild; child; child = child.nextSibling) {
              if (child.name === "LinkMark") marks.push(child);
            }
            const open = marks[0];
            const close = marks[1];
            if (!open || !close) return;
            const active = touches(ref.from, ref.to);
            if (open.to < close.from) put("md-link", open.to, close.from, markDeco("md-link"), false);
            // "[" on its own, then "](url)" as one range, so the link reads as its text alone.
            hide(open.from, open.to, active);
            hide(close.from, ref.to, active);
            return;
          }

          case "URL": {
            // Bare links. A URL inside a [text](url) link is styled by the Link branch.
            if (node.parent?.name !== "Link") put("md-url", ref.from, ref.to, markDeco("md-url"), false);
            return;
          }

          default:
            return;
        }
      },
    });
  }

  const lineItems: Range<Decoration>[] = [];
  for (const [at, entry] of lines) {
    lineItems.push(lineDeco(entry.classes.join(" "), entry.style).range(at));
  }
  const all = [...lineItems, ...items].sort(byStart);
  const builder = new RangeSetBuilder<Decoration>();
  for (const range of all) builder.add(range.from, range.to, range.value);

  const atomicSorted = atomic.sort(byStart);
  const atomicBuilder = new RangeSetBuilder<Decoration>();
  for (const range of atomicSorted) atomicBuilder.add(range.from, range.to, range.value);

  return { decorations: builder.finish(), atomic: atomicBuilder.finish() };
}

function byStart(a: Range<Decoration>, b: Range<Decoration>): number {
  return a.from - b.from || a.value.startSide - b.value.startSide;
}

/** The live Markdown decorations. Hidden markers are atomic, so the caret steps over them as one unit. */
export const livePreview = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    atomic: DecorationSet;

    constructor(view: EditorView) {
      const built = build(view);
      this.decorations = built.decorations;
      this.atomic = built.atomic;
    }

    update(update: ViewUpdate) {
      // Rebuild only when something a decoration depends on changed: the text, the view, the cursor, or a parse.
      if (
        update.docChanged ||
        update.viewportChanged ||
        update.selectionSet ||
        syntaxTree(update.state) !== syntaxTree(update.startState)
      ) {
        const built = build(update.view);
        this.decorations = built.decorations;
        this.atomic = built.atomic;
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
    provide: (plugin) =>
      EditorView.atomicRanges.of((view) => view.plugin(plugin)?.atomic ?? RangeSet.empty),
  },
);

```

## src/components/editor/syntax.ts

```typescript
import { syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";

/**
 * A bullet, numbered or task item line. Group 1 is the indent, 2 the marker, 3 the spacing after it and 4 the task
 * box. A marker only counts when a space or tab follows it, so a lone "-" (on its way to "---") stays plain text.
 */
export const LIST_LINE = /^([ \t]*)([-*+]|\d{1,9}[.)])([ \t]+)(\[[ xX]\][ \t]+)?/;
/** A blockquote prefix such as "> " or "> > ". */
export const QUOTE_PREFIX = /^[ \t]*(?:>[ \t]?)+/;

/** The FencedCode node around a position, or null. Looks on both sides so an edge position still finds its block. */
export function fencedBlockAt(state: EditorState, pos: number): SyntaxNode | null {
  const tree = syntaxTree(state);
  for (const side of [1, -1] as const) {
    let node: SyntaxNode | null = tree.resolveInner(pos, side);
    while (node && node.name !== "FencedCode") node = node.parent;
    if (node) return node;
  }
  return null;
}

/** The closing fence mark of a fenced block, or null while the block is still open. */
export function closingFence(block: SyntaxNode): SyntaxNode | null {
  const first = block.firstChild;
  const last = block.lastChild;
  if (!first || !last || last.name !== "CodeMark" || last.from === first.from) return null;
  return last;
}

/** The language word after the opening fence, or "". */
export function fenceInfo(state: EditorState, block: SyntaxNode): string {
  const info = block.getChild("CodeInfo");
  return info ? state.doc.sliceString(info.from, info.to).trim() : "";
}

/** The code between the fence lines, without the fences. */
export function fenceBody(state: EditorState, block: SyntaxNode): string {
  const doc = state.doc;
  const open = doc.lineAt(block.from);
  const close = closingFence(block);
  const end = close ? doc.lineAt(close.from).from - 1 : block.to;
  return end > open.to ? doc.sliceString(open.to + 1, end) : "";
}

/** Flips the [ ] / [x] box of the task item on the line at pos. Returns false when that line has no task box. */
export function toggleTaskAt(view: EditorView, pos: number): boolean {
  const line = view.state.doc.lineAt(pos);
  const match = LIST_LINE.exec(line.text);
  if (!match || !match[4]) return false;
  const boxStart = line.from + match[0].length - match[4].length;
  const checked = match[4][1] !== " ";
  view.dispatch({
    changes: { from: boxStart + 1, to: boxStart + 2, insert: checked ? " " : "x" },
    userEvent: "input.toggle",
  });
  return true;
}

/** Text of an automatic edit. Not joinable with typing, so one Cmd+Z reverts only this conversion. */
export const AUTO_EVENT = "input.autoformat";

```

## src/components/UrduKeyboard.tsx

```tsx
"use client";

import { EditorView } from "@codemirror/view";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { URDU_MODE_EVENT } from "@/components/editor/urdu";
import { urduForChar, urduForKey } from "@/lib/urdu/keymap";

const STORAGE_KEY = "likho:urdu-keyboard";
const LETTER_CODE = /^Key[A-Z]$/;

// The on/off choice lives in localStorage; useSyncExternalStore keeps the server render ("off") and the first client
// render identical, then switches to the saved value.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function readOn(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}
export function setUrduOn(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "on" : "off");
  } catch {}
  listeners.forEach((listener) => listener());
}

/** Types `text` at the caret of the focused editor or text field. Returns false when the target can't take it. */
export function insertText(target: EventTarget | null, text: string): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const cm = target.closest(".cm-editor");
  if (cm instanceof HTMLElement && target.closest(".cm-content")) {
    const view = EditorView.findFromDOM(cm);
    if (!view || view.state.readOnly) return false;
    view.dispatch({ ...view.state.replaceSelection(text), scrollIntoView: true, userEvent: "input.type" });
    return true;
  }

  const isTextInput =
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLInputElement && ["text", "search", ""].includes(target.type));
  if (isTextInput && !target.readOnly && !target.disabled) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    target.setRangeText(text, start, end, "end");
    target.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }
  return false;
}

/** The saved Urdu on/off choice, shared by the key handler and the toggle in the notebook. */
export function useUrduOn(): boolean {
  return useSyncExternalStore(subscribe, readOn, () => false);
}

/**
 * Switches typing to the Urdu keyboard layout. While it is on, keys type Urdu wherever you write (note body, title,
 * search), whatever language the system keyboard is set to. Ctrl+Shift+U toggles it.
 *
 * This component draws nothing: it only handles the keys and the saved on/off choice. The visible English | اردو
 * toggle and the layout viewer live inside the notebook (UrduToggle, mounted by WritingPad).
 */
export function UrduKeyboard() {
  const on = useUrduOn();
  const onRef = useRef(false);

  useEffect(() => {
    onRef.current = on;
    document.documentElement.dataset.urdu = on ? "on" : "off";
    window.dispatchEvent(new Event(URDU_MODE_EVENT));
  }, [on]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.shiftKey && !event.altKey && event.code === "KeyU") {
        event.preventDefault();
        setUrduOn(!readOn());
        return;
      }
      if (!onRef.current || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
      // Caps Lock acts like Shift on letter keys, as it does on a real Urdu keyboard.
      const shift = LETTER_CODE.test(event.code)
        ? event.shiftKey !== event.getModifierState("CapsLock")
        : event.shiftKey;
      const text = urduForKey(event.code, shift);
      if (text === undefined || !insertText(event.target, text)) return;
      event.preventDefault();
      event.stopPropagation();
    }

    // Phone keyboards report the typed character rather than a key position.
    function onBeforeInput(event: InputEvent) {
      if (!onRef.current || event.isComposing || event.inputType !== "insertText" || event.data?.length !== 1) return;
      const text = urduForChar(event.data);
      if (text === undefined || !insertText(event.target, text)) return;
      event.preventDefault();
    }

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("beforeinput", onBeforeInput, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("beforeinput", onBeforeInput, true);
    };
  }, []);

  return null;
}

```

## src/components/UrduLayoutPanel.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import { KEY_ROWS, urduForKey } from "@/lib/urdu/keymap";
import { cn } from "@/lib/utils";

const LETTER_CODE = /^Key[A-Z]$/;
const COMBINING = /\p{M}/u;

/** Keys that are drawn for realism only. [label, width in key units]. */
const EDGE_KEYS: Record<number, { left: [string, number]; right: [string, number] }> = {
  0: { left: ["", 0], right: ["Backspace", 2] },
  1: { left: ["Tab", 1.5], right: ["", 0] },
  2: { left: ["Caps", 1.75], right: ["Enter", 2.25] },
  3: { left: ["Shift", 2.25], right: ["Shift", 2.75] },
};
/** Extra width for the last key of the Q row (the backslash key is wider than a letter key). */
const WIDE_LAST_KEY: Record<number, number> = { 1: 1.5 };

/** A combining mark needs a base to sit on, so it is drawn on a dotted circle. */
function showable(char: string): string {
  return COMBINING.test(char) ? `◌${char}` : char;
}

interface Props {
  /** Whether the Urdu keyboard is switched on. */
  on: boolean;
  /** Types text at the caret of the focused editor. Returns false when there is nowhere to type. */
  onType: (text: string) => boolean;
  onClose: () => void;
}

/**
 * A live picture of the Urdu layout, drawn from the same table that does the typing. Pressing keys lights them up,
 * holding Shift (or Caps Lock on letters) flips the characters, and the keys can be clicked or tapped to type.
 */
export function UrduLayoutPanel({ on, onType, onClose }: Props) {
  const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set());
  const [shiftHeld, setShiftHeld] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  // On-screen Shift (for touch): applies to the next key only.
  const [stickyShift, setStickyShift] = useState(false);

  useEffect(() => {
    function sync(event: KeyboardEvent) {
      setShiftHeld(event.shiftKey);
      setCapsOn(event.getModifierState("CapsLock"));
    }
    function onKeyDown(event: KeyboardEvent) {
      sync(event);
      if (event.key === "Escape" && !event.defaultPrevented) onClose();
      setPressed((previous) => new Set(previous).add(event.code));
    }
    function onKeyUp(event: KeyboardEvent) {
      sync(event);
      setPressed((previous) => {
        const next = new Set(previous);
        next.delete(event.code);
        return next;
      });
    }
    function reset() {
      setPressed(new Set());
      setShiftHeld(false);
    }
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", reset);
    };
  }, [onClose]);

  const shiftActive = shiftHeld || stickyShift;

  function layerFor(code: string): boolean {
    // Caps Lock acts like Shift on letter keys only, as it does when typing.
    return LETTER_CODE.test(code) ? shiftActive !== capsOn : shiftActive;
  }

  function clickKey(code: string, latin: [string, string]) {
    const shift = layerFor(code);
    const urdu = on ? urduForKey(code, shift) : undefined;
    onType(urdu ?? latin[shift ? 1 : 0]);
    setStickyShift(false);
  }

  const plainKey = (label: string, units: number, key: string, active = false, onClick?: () => void) => (
    <button
      key={key}
      type="button"
      tabIndex={-1}
      disabled={!onClick}
      onClick={onClick}
      aria-label={label}
      style={{ flexGrow: units, flexBasis: 0 }}
      className={cn(
        "h-12 min-w-0 rounded-md border text-[11px] text-muted-foreground transition-colors duration-100 disabled:cursor-default",
        active ? "border-brand bg-brand/15 text-foreground" : "border-border bg-sidebar",
      )}
    >
      {label}
    </button>
  );

  return (
    <div
      role="group"
      id="urdu-layout-panel"
      aria-label="Urdu keyboard layout"
      // Keep the caret in the editor: clicking a key must not move focus to the panel.
      onMouseDown={(event) => event.preventDefault()}
      className="pointer-events-auto absolute top-full right-0 z-20 mt-1 w-[min(46rem,100%)] rounded-2xl border border-border bg-canvas p-3 shadow-(--elev-menu)"
    >
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <div className="min-w-0 text-sm text-secondary-foreground">
          <span className="font-medium text-foreground">Urdu keyboard layout</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {on ? "Press a key or tap one to type." : "Urdu is off: switch to اردو to type with it."}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide keyboard layout"
          className="grid size-7 shrink-0 place-items-center rounded-md text-secondary-foreground outline-none hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-1" dir="ltr">
        {KEY_ROWS.map((row, rowIndex) => {
          const edges = EDGE_KEYS[rowIndex];
          const lastWidth = WIDE_LAST_KEY[rowIndex] ?? 1;
          return (
            <div key={rowIndex} className="flex gap-1">
              {edges.left[1] > 0 &&
                plainKey(
                  edges.left[0],
                  edges.left[1],
                  "left",
                  edges.left[0] === "Shift" ? shiftActive : edges.left[0] === "Caps" ? capsOn : pressed.has("Tab"),
                  edges.left[0] === "Shift" ? () => setStickyShift((value) => !value) : undefined,
                )}
              {row.map((key, keyIndex) => {
                const shift = layerFor(key.code);
                const urdu = urduForKey(key.code, shift);
                const mapped = on && urdu !== undefined;
                const legend = key.latin[shift ? 1 : 0];
                const isLast = keyIndex === row.length - 1;
                return (
                  <button
                    key={key.code}
                    type="button"
                    tabIndex={-1}
                    onClick={() => clickKey(key.code, key.latin)}
                    aria-label={`${legend}${urdu ? `, types ${urdu}` : ""}`}
                    style={{ flexGrow: isLast ? lastWidth : 1, flexBasis: 0 }}
                    className={cn(
                      "relative h-12 min-w-0 rounded-md border outline-none transition-[background-color,border-color,transform] duration-100",
                      pressed.has(key.code)
                        ? "translate-y-px border-brand bg-brand text-white"
                        : "border-border bg-pad text-foreground hover:bg-hover",
                    )}
                  >
                    <span
                      lang="ur"
                      dir="rtl"
                      className={cn(
                        "absolute inset-0 flex items-center justify-center text-[1.15rem] leading-none",
                        !mapped && "text-[0.95rem] opacity-40",
                      )}
                      style={{ fontFamily: mapped ? '"Mehr Row", "Mehr", system-ui, sans-serif' : "var(--font-sans), system-ui, sans-serif" }}
                    >
                      {mapped ? showable(urdu) : legend}
                    </span>
                    {mapped && (
                      <span aria-hidden className="absolute bottom-0.5 left-1 text-[9px] leading-none opacity-60">
                        {legend}
                      </span>
                    )}
                  </button>
                );
              })}
              {edges.right[1] > 0 &&
                plainKey(
                  edges.right[0],
                  edges.right[1],
                  "right",
                  edges.right[0] === "Shift" ? shiftActive : pressed.has(edges.right[0] === "Enter" ? "Enter" : "Backspace"),
                  edges.right[0] === "Shift" ? () => setStickyShift((value) => !value) : undefined,
                )}
            </div>
          );
        })}
        <div className="flex gap-1">
          <div style={{ flexGrow: 4, flexBasis: 0 }} />
          {plainKey("Space", 7, "space", pressed.has("Space"), () => onType(" "))}
          <div style={{ flexGrow: 4, flexBasis: 0 }} />
        </div>
      </div>
    </div>
  );
}

```

## src/components/UrduToggle.tsx

```tsx
"use client";

import { useCallback, useState } from "react";
import { insertText, setUrduOn, useUrduOn } from "@/components/UrduKeyboard";
import { UrduLayoutPanel } from "@/components/UrduLayoutPanel";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: false, label: "English", lang: "en" },
  { value: true, label: "اردو", lang: "ur" },
] as const;

/**
 * The English | اردو toggle and the keyboard-layout button. They sit inside the notebook, in the empty ruled row
 * between the title and the body, so they scroll with the page and never cover its buttons. Fill a positioned
 * parent of one ruled row (28px) with it: it lays itself out at the right edge, and the layout viewer drops down
 * from it.
 */
export function UrduToggle() {
  const on = useUrduOn();
  const [layoutOpen, setLayoutOpen] = useState(false);
  const closeLayout = useCallback(() => setLayoutOpen(false), []);
  const typeAtCaret = useCallback((text: string) => insertText(document.activeElement, text), []);

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-end gap-1.5"
      // Keep the caret in the editor when these are clicked.
      onMouseDown={(event) => event.preventDefault()}
    >
      <button
        type="button"
        aria-pressed={layoutOpen}
        aria-controls="urdu-layout-panel"
        onClick={() => setLayoutOpen((open) => !open)}
        title={layoutOpen ? "Hide keyboard layout" : "Show keyboard layout"}
        className={cn(
          "pointer-events-auto grid size-7 shrink-0 place-items-center rounded-full border outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
          layoutOpen
            ? "border-brand bg-brand/15 text-foreground"
            : "border-border bg-canvas text-secondary-foreground hover:bg-hover hover:text-foreground",
        )}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
          <path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M6 13.5h.01M18 13.5h.01M9 14h6" />
        </svg>
        <span className="sr-only">Keyboard layout</span>
      </button>

      <div
        role="radiogroup"
        aria-label="Typing language (Ctrl+Shift+U)"
        title="Typing language (Ctrl+Shift+U)"
        className="pointer-events-auto relative grid h-7 shrink-0 grid-cols-2 rounded-full border border-border bg-canvas p-0.5 select-none"
      >
        {/* Sliding thumb: sits under the active side. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-full transition-[transform,background-color] duration-200 ease-out",
            on ? "translate-x-full bg-brand" : "translate-x-0 bg-pad shadow-xs",
          )}
        />
        {OPTIONS.map((option) => {
          const active = option.value === on;
          return (
            <button
              key={option.lang}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              lang={option.lang}
              onClick={() => setUrduOn(option.value)}
              className={cn(
                "relative z-10 flex min-w-14 items-center justify-center rounded-full px-2.5 text-xs outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring",
                option.lang === "ur" && "urdu-label text-[0.95rem] leading-none",
                active ? (option.value ? "text-white" : "text-foreground") : "text-secondary-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {layoutOpen && <UrduLayoutPanel on={on} onType={typeAtCaret} onClose={closeLayout} />}
    </div>
  );
}

```

## src/components/FontPopover.tsx

```tsx
"use client";

import { useId, useState, type CSSProperties } from "react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { applyFont, applySize } from "@/components/appearance";
import { Icon } from "@/components/Icon";
import type { SegmentOption } from "@/components/SegmentedControl";
import { usePrefs } from "@/lib/store/prefs";
import type { UiPrefs } from "@/lib/types";
import { cn } from "@/lib/utils";

type Font = UiPrefs["font"];
type Size = UiPrefs["size"];

export const fontOptions: SegmentOption<Font>[] = [
  { value: "hand", label: "Hand", fontFamily: "var(--font-patrick-hand)" },
  { value: "sans", label: "Sans", fontFamily: "var(--font-plex-sans)" },
  { value: "serif", label: "Serif", fontFamily: "var(--font-plex-serif)" },
  { value: "mono", label: "Mono", fontFamily: "var(--font-plex-mono)" },
];

export const sizeOptions: SegmentOption<Size>[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "xlarge", label: "Extra large" },
];

const rowClass =
  "flex h-10 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-sm text-secondary-foreground outline-none transition-colors duration-150 hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11";

interface ChoiceRowProps<T extends string> {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * A menu row that shows the current choice. Clicking it expands an inline radio list. Choosing an option applies it
 * at once and the menu stays open. Each option is set in its own face when it has one (fonts).
 */
function ChoiceRow<T extends string>({ label, expanded, onToggle, options, value, onChange }: ChoiceRowProps<T>) {
  const listId = useId();
  const current = options.find((option) => option.value === value) ?? options[0];

  return (
    <div>
      <button
        type="button"
        data-menu-item
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={onToggle}
        className={rowClass}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span
          className="truncate text-sm text-muted-foreground"
          style={current.fontFamily ? ({ fontFamily: current.fontFamily } as CSSProperties) : undefined}
        >
          {current.label}
        </span>
        <Icon
          icon={ArrowDown01Icon}
          className={cn(
            "text-muted-foreground transition-transform duration-200 ease-(--ease-soft) motion-reduce:transition-none",
            expanded && "rotate-180",
          )}
        />
      </button>

      {/* Animated height: the grid row goes from 0fr to 1fr. Collapsed rows are inert, so keys and focus skip them. */}
      <div
        id={listId}
        inert={!expanded}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-(--ease-soft) motion-reduce:transition-none",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div role="radiogroup" aria-label={label} className="flex flex-col gap-0.5 pt-0.5 pb-1">
            {options.map((option) => {
              const checked = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  tabIndex={checked ? 0 : -1}
                  data-menu-item
                  onClick={() => onChange(option.value)}
                  style={option.fontFamily ? ({ fontFamily: option.fontFamily } as CSSProperties) : undefined}
                  className={cn(
                    "flex h-9 w-full items-center gap-2.5 rounded-[10px] pr-2.5 pl-6 text-left text-[15px] outline-none transition-colors duration-150 hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11",
                    checked ? "text-foreground" : "text-secondary-foreground",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {checked && <Icon icon={Tick02Icon} className="text-brand" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * "Writing font" and "Text size" rows for the account menu. They work as an accordion: opening one closes the other,
 * so the two lists animate together and the menu never grows taller than one list.
 */
export function WritingTypeRows() {
  const { prefs, updatePrefs } = usePrefs();
  const [open, setOpen] = useState<"font" | "size" | null>(null);

  function changeFont(font: Font) {
    updatePrefs({ font });
    applyFont(font);
  }

  function changeSize(size: Size) {
    updatePrefs({ size });
    applySize(size);
  }

  return (
    <>
      <ChoiceRow
        label="Writing font"
        expanded={open === "font"}
        onToggle={() => setOpen((current) => (current === "font" ? null : "font"))}
        options={fontOptions}
        value={prefs.font}
        onChange={changeFont}
      />
      <ChoiceRow
        label="Text size"
        expanded={open === "size"}
        onToggle={() => setOpen((current) => (current === "size" ? null : "size"))}
        options={sizeOptions}
        value={prefs.size}
        onChange={changeSize}
      />
    </>
  );
}

```

## src/components/appearance.ts

```typescript
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

```

## src/components/WritingPad.tsx

```tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { formatSize } from "@/components/format";
import { FormatToolbar } from "@/components/editor/FormatToolbar";
import { EMPTY_FORMATS, type FormatState } from "@/components/editor/formatTypes";
import { ExportMenu } from "@/components/ExportMenu";
import { splitNote } from "@/components/exportNote";
import { Icon } from "@/components/Icon";
import { SharePopover, type ShareController } from "@/components/share/SharePopover";
import { SaveButton, useSaveAction } from "@/components/SaveButton";
import { UrduToggle } from "@/components/UrduToggle";
import { useWideScreen } from "@/components/useWideScreen";
import "./WritingPad.css";
import { cn } from "@/lib/utils";
import { ARABIC_SCRIPT } from "@/lib/urdu/keymap";
import type { NoteStore } from "@/lib/types";
import type { NoteEditorHandle } from "@/components/editor/NoteEditor";

// The editor is CodeMirror. It loads on the client only, after the pad is on screen. The skeleton is one empty
// 28px row, the same as an empty note, so nothing moves when the editor mounts.
const NoteEditor = dynamic(() => import("@/components/editor/NoteEditor").then((mod) => mod.NoteEditor), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="h-7 min-w-0 flex-1" />,
});

interface StatusView {
  label: string;
  dot?: string;
  spinning?: boolean;
}

/**
 * What the bottom strip says. Guest: the note lives on this device. Account: the save state. An empty note says
 * nothing.
 */
function statusFor(store: Pick<NoteStore, "mode" | "saveState">, empty: boolean): StatusView | null {
  if (store.mode === "guest") return empty ? null : { label: "On this device", dot: "bg-muted-foreground/60" };
  switch (store.saveState) {
    case "saving":
      return { label: "Saving…", spinning: true };
    case "unsaved":
      return { label: "Unsaved changes", dot: "bg-warning" };
    case "offline":
      return { label: "Offline — not saved", dot: "bg-warning" };
    case "error":
      return { label: "Couldn't save", dot: "bg-destructive" };
    default:
      return empty ? null : { label: "All changes saved", dot: "bg-success" };
  }
}

/** Joins the two fields back into the stored string. An empty note stays an empty string. */
function joinNote(title: string, body: string): string {
  if (title === "" && body === "") return "";
  return `${title}\n${body}`;
}

/** What the shell can ask of the pad. Focus goes to the title of an empty note, otherwise to the end of the body. */
export interface WritingPadHandle {
  focusNote: () => void;
}

/** The margin rule sits this far from the pad's left edge. The text starts 12px to its right. */
const MARGIN_RULE = "clamp(14px, 2.5vw, 32px)";

interface WritingPadProps {
  store: NoteStore;
  handleRef: RefObject<WritingPadHandle | null>;
  shareController: ShareController;
}

export function WritingPad({ store, handleRef, shareController }: WritingPadProps) {
  const wide = useWideScreen();
  const titleRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<NoteEditorHandle>(null);
  // What the caret is inside right now (bold, a heading ...). The editor reports it; the toolbar lights its buttons.
  const [formats, setFormats] = useState<FormatState>(EMPTY_FORMATS);
  // Caret to set in the body after a multi-line paste into the title. Applied once the body has re-rendered.
  const pendingBodyCaret = useRef<number | null>(null);
  // A focus request ran before the editor finished loading. The editor takes it when it is ready.
  const pendingEditorFocus = useRef<"start" | "end" | null>(null);
  // One save path for the pad's button and Cmd/Ctrl+S. Its sign-in prompt is rendered once, below.
  const save = useSaveAction(store);

  const content = store.activeNote?.content ?? "";
  const { title, body } = useMemo(() => splitNote(content), [content]);
  const size = useMemo(() => formatSize(content), [content]);
  const empty = content.trim() === "";
  const status = statusFor(store, empty);
  // Signed in with notes but none open yet: the note is still loading, so typing would be lost.
  const locked = store.mode === "account" && !store.activeNote && store.notes.length > 0;
  const readOnly = !store.ready || locked;

  useLayoutEffect(() => {
    const caret = pendingBodyCaret.current;
    if (caret === null) return;
    pendingBodyCaret.current = null;
    editorRef.current?.focusAt(caret);
  });

  // Writes both fields back as one string, so the store, sync and sidebar only ever see title + "\n" + body.
  function commit(nextTitle: string, nextBody: string) {
    // Signed in with no notes yet: the first keystroke creates one.
    if (!store.activeNote) store.create();
    store.update(joinNote(nextTitle, nextBody));
  }

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    commit(event.target.value, body);
  }

  function handleBodyChange(nextBody: string) {
    commit(title, nextBody);
  }

  function focusTitleEnd() {
    const input = titleRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  // The editor takes focus now, or once it has loaded.
  const focusEditor = useCallback((where: "start" | "end") => {
    const editor = editorRef.current;
    if (!editor) {
      pendingEditorFocus.current = where;
    } else if (where === "start") {
      editor.focusStart();
    } else {
      editor.focusEnd();
    }
  }, []);

  const focusEditorEnd = useCallback(() => focusEditor("end"), [focusEditor]);

  const onEditorReady = useCallback(() => {
    const where = pendingEditorFocus.current;
    if (!where) return;
    pendingEditorFocus.current = null;
    focusEditor(where);
  }, [focusEditor]);

  // An empty title takes focus (new notes, first load, empty notes). Otherwise the caret goes to the end of the body.
  // Reads the DOM, so callers must flush the store update first.
  const focusNote = useCallback(() => {
    const input = titleRef.current;
    if (!input) return;
    if (input.value === "") {
      input.focus();
      input.setSelectionRange(0, 0);
    } else {
      focusEditorEnd();
    }
  }, [focusEditorEnd]);

  useImperativeHandle(handleRef, () => ({ focusNote }), [focusNote]);

  // First load: focus the note once the store has loaded it. Editing is locked until then.
  useEffect(() => {
    if (store.ready) focusNote();
  }, [store.ready, focusNote]);

  // Enter, or Arrow Down at the end of the title, moves focus to the start of the body.
  function handleTitleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    const { selectionStart, selectionEnd, value } = event.currentTarget;
    const atEnd = selectionStart === value.length && selectionEnd === value.length;
    if (event.key === "Enter" || (event.key === "ArrowDown" && atEnd)) {
      event.preventDefault();
      editorRef.current?.focusStart();
    }
  }

  // A multi-line paste into the title: the first line stays in the title, the rest opens the body.
  function handleTitlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n");
    const lineBreak = text.indexOf("\n");
    if (lineBreak === -1) return; // One line pastes as usual.
    event.preventDefault();
    const { selectionStart, selectionEnd } = event.currentTarget;
    const start = selectionStart ?? title.length;
    const end = selectionEnd ?? start;
    const restOfPaste = text.slice(lineBreak + 1);
    // Title text after the caret moves down into the body, behind the rest of the paste.
    const bodyHead = restOfPaste + title.slice(end);
    commit(
      title.slice(0, start) + text.slice(0, lineBreak),
      body ? `${bodyHead}\n${body}` : bodyHead,
    );
    pendingBodyCaret.current = restOfPaste.length;
  }

  // Cmd/Ctrl+S saves the note to the account (or opens the sign-in prompt). It never downloads a file, and the
  // browser's save dialog stays shut.
  function handlePadKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing) return;
    if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
    if (event.key.toLowerCase() !== "s") return;
    event.preventDefault();
    void save.run();
  }

  // Clicks on the title keep their own caret. Clicks in the pad outside the text (the empty space below it, the
  // margins, the strip) put the caret at the end of the body. Clicks in portals (the sign-in prompt, the export
  // menu) are not in the pad's DOM, so they are ignored here.
  function focusPad(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Node) || !event.currentTarget.contains(target)) return;
    if (target instanceof Element && target.closest(".cm-editor, input, button, a")) return;
    focusEditorEnd();
  }

  // Urdu titles get their own size and line box, and no letter-spacing (see .urdu-title in globals.css).
  const urduTitle = ARABIC_SCRIPT.test(title);

  return (
    // The pad is a fixed sheet: border, radius and shadow stay put. Only the ruled sheet scrolls, so the bottom strip
    // is never over the text and the caret can't hide behind it.
    <div
      onClick={focusPad}
      onKeyDown={handlePadKeyDown}
      className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-pad"
    >
      {/* The formatting panel sits above the sheet, outside the scrolling part, so it is always in reach. */}
      <FormatToolbar state={formats} disabled={readOnly} onCommand={(id) => editorRef.current?.format(id)} />

      <div
        onScroll={() => editorRef.current?.refresh()}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {/* One ruled sheet for the title and the body: same 28px grid, same insets, so no rule breaks at the boundary. */}
        <div
          className="notepad relative flex min-h-full flex-col pt-3 pr-4 pad-gutter"
          style={{ paddingLeft: `calc(${MARGIN_RULE} + 12px)` }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-px bg-border"
            style={{ left: MARGIN_RULE }}
          />

          {/* Title row: two 28px rules tall. The title text sits on the second rule. Share and Save sit at the right. */}
          <div className="relative h-14 shrink-0">
            <input
              ref={titleRef}
              type="text"
              aria-label="Note title"
              dir="auto"
              lang={urduTitle ? "ur" : undefined}
              placeholder={store.ready ? "Untitled note" : undefined}
              autoComplete="off"
              spellCheck
              value={title}
              readOnly={readOnly}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              onPaste={handleTitlePaste}
              className={cn(
                "pad-title-reserve block h-14 w-full text-ellipsis bg-transparent pt-4 text-[1.75rem] leading-[36px] font-semibold tracking-[-0.01em] text-secondary-foreground caret-brand outline-none placeholder:font-medium placeholder:text-muted-foreground",
                urduTitle && "urdu-title",
              )}
              style={{ paddingRight: wide ? "12rem" : undefined }}
            />
            {/* Desktop-class screens only (CSS, same rule as the shell). Phones use the top-bar controls. */}
            <div className="shell-desk-only absolute top-[1.125rem] right-0 flex items-center gap-1">
              <SharePopover store={store} controller={shareController} />
              <SaveButton store={store} action={save} />
            </div>
          </div>

          {/* One empty 28px rule between the title and the body. Clicking it starts the body. The rules run through it.
              The English | اردو toggle and the keyboard-layout button live here, inside the notebook. */}
          <div className="relative h-7 shrink-0">
            <div
              aria-hidden="true"
              onClick={(event) => {
                event.stopPropagation();
                focusEditor("start");
              }}
              className="absolute inset-0 cursor-text"
            />
            <UrduToggle />
          </div>

          <NoteEditor
            noteId={store.activeNote?.id ?? null}
            value={body}
            readOnly={readOnly}
            placeholder={store.ready ? "Start writing…" : ""}
            onChange={handleBodyChange}
            onAtTop={focusTitleEnd}
            onReady={onEditorReady}
            onFormatState={setFormats}
            handleRef={editorRef}
          />
        </div>
      </div>

      {/* The strip is outside the scrolling sheet. Its height is 32px, or 56px plus the home-indicator inset on phones. */}
      <div className="pad-strip flex shrink-0 items-center justify-between gap-2 px-3">
        <Link
          href="/about"
          prefetch={false}
          className="inline-flex min-h-7 shrink-0 items-center rounded-sm text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          About Likho
        </Link>
        <div className="flex min-w-0 items-center gap-2 rounded-md bg-pad/90 px-1.5 text-xs text-muted-foreground tabular-nums">
          <ExportMenu content={content} />
          <span className="hidden min-[360px]:inline">{size}</span>
          {status ? (
            <span aria-hidden="true" className="hidden min-[360px]:inline">
              ·
            </span>
          ) : null}
          <span className="flex min-w-0 items-center gap-1.5">
            {status?.spinning ? (
              <Icon icon={Loading03Icon} className="size-3.5 animate-spin motion-reduce:animate-none" />
            ) : status?.dot ? (
              <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", status.dot)} />
            ) : null}
            <span role="status" aria-live="polite" className="truncate">
              {status?.label ?? ""}
            </span>
          </span>
        </div>
      </div>

      {save.prompt}
    </div>
  );
}


```

## src/components/WritingPad.css

```css
/*
 * Writing pad: phone or desktop, decided the same way as the app shell (see "Mobile shell" in globals.css).
 * Phone styles are the default. The desktop query is copied from the shell, so the two always agree. Keep them in step.
 */

/* Bottom strip: 56px plus the home-indicator inset on phones, 32px on desktop. */
.pad-strip {
  box-sizing: content-box;
  height: 3.5rem;
  padding-bottom: env(safe-area-inset-bottom);
}

/* Export button: a 44px tap target on phones, the compact 28px on desktop. */
.pad-export {
  width: 2.75rem;
  height: 2.75rem;
}

/* Right gutter of the ruled sheet. */
.pad-gutter {
  padding-right: 1rem;
}

/* The title leaves room for the Save button. */
.pad-title-reserve {
  padding-right: 0;
}

@media (min-width: 48rem) and (min-height: 501px), (min-width: 48rem) and (hover: hover) {
  .pad-strip {
    height: 2rem;
    padding-bottom: 0;
  }

  .pad-export {
    width: 1.75rem;
    height: 1.75rem;
  }

  .pad-gutter {
    padding-right: 1.5rem;
  }

  .pad-title-reserve {
    padding-right: 9rem;
  }
}

```

## src/components/SegmentedControl.tsx

```tsx
"use client";

import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconSvgElement;
  /** Renders the label in this font, so each option previews its own face. */
  fontFamily?: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLButtonElement>) {
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % options.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (index - 1 + options.length) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    if (next === null) return;
    event.preventDefault();
    onChange(options[next].value);
    buttons.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-0.5 rounded-lg border border-border bg-sidebar p-0.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        const style: CSSProperties | undefined = option.fontFamily
          ? { fontFamily: option.fontFamily }
          : undefined;
        return (
          <button
            key={option.value}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            style={style}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            className={cn(
              "flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-md px-2 text-sm outline-none transition-[background-color,color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-ring",
              checked
                ? "bg-pad text-foreground shadow-xs"
                : "text-secondary-foreground hover:text-foreground",
            )}
          >
            {option.icon && <Icon icon={option.icon} />}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

```

## src/components/share/shared-note.css

```css
.shared-note-page {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  color: var(--text);
  background: var(--canvas);
}

.shared-note-header,
.shared-note-main,
.shared-note-footer {
  width: min(100% - 32px, 800px);
  margin-inline: auto;
}

.shared-note-header {
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.shared-note-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 0.94rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-decoration: none;
}

.shared-note-open-link {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: var(--on-accent);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 0.84rem;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 150ms ease-out;
}

.shared-note-open-link:hover {
  background: var(--accent-hover);
}

.shared-note-main {
  flex: 1;
  padding-block: 26px 36px;
}

/* Italic Urdu in a shared note uses Kasheeda (see globals.css); English italic is unchanged. */
.shared-note-paper em,
.shared-note-paper i {
  font-family: "Kasheeda", var(--write-font);
}

.shared-note-paper {
  min-height: min(70vh, 660px);
  padding: clamp(24px, 6vw, 60px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--pad);
  box-shadow: var(--elev-pad);
}

.shared-note-note-header {
  padding-bottom: 22px;
  border-bottom: 1px solid var(--rule);
  margin-bottom: 24px;
}

/* Urdu title: no tracking (breaks Nastaliq joining), looser line height for tall glyphs. */
.shared-note-note-header h1[lang="ur"] {
  letter-spacing: 0;
  font-weight: 400;
  line-height: 1.7;
  max-width: none;
  text-wrap: pretty;
}

.shared-note-note-header h1 {
  max-width: 20ch;
  margin: 0;
  color: var(--text);
  font-family: var(--write-font);
  font-size: clamp(2rem, 6vw, 2.8rem);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.16;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.shared-note-note-header p {
  margin: 12px 0 0;
  color: var(--text-muted);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 0.78rem;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
}

.shared-note-markdown {
  max-width: 72ch;
  min-width: 0;
  color: var(--text);
  font-family: var(--write-font);
  font-size: clamp(1rem, 1vw + 0.84rem, 1.12rem);
  line-height: 1.75;
  overflow-wrap: anywhere;
}

.shared-note-markdown > :first-child {
  margin-top: 0;
}

.shared-note-markdown h1,
.shared-note-markdown h2,
.shared-note-markdown h3,
.shared-note-markdown h4 {
  margin: 1.65em 0 0.5em;
  color: var(--text);
  font-family: var(--write-font);
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.shared-note-markdown h1 {
  font-size: 1.65em;
}

.shared-note-markdown h2 {
  font-size: 1.42em;
}

.shared-note-markdown h3 {
  font-size: 1.2em;
}

.shared-note-markdown h4 {
  font-size: 1.08em;
}

.shared-note-markdown p,
.shared-note-markdown ul,
.shared-note-markdown ol,
.shared-note-markdown blockquote,
.shared-note-markdown table,
.shared-note-markdown pre {
  margin: 0 0 1.05em;
}

.shared-note-markdown ul,
.shared-note-markdown ol {
  padding-inline-start: 1.55em;
}

.shared-note-markdown li + li {
  margin-top: 0.28em;
}

.shared-note-markdown li > ul,
.shared-note-markdown li > ol {
  margin-top: 0.3em;
  margin-bottom: 0.3em;
}

.shared-note-markdown a {
  color: var(--accent);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.18em;
  overflow-wrap: anywhere;
}

.shared-note-markdown a:hover {
  color: var(--accent-hover);
}

.shared-note-markdown blockquote {
  padding: 0.1em 0 0.1em 1.1em;
  border-left: 1px solid var(--border);
  color: var(--text-secondary);
}

.shared-note-markdown blockquote > :last-child {
  margin-bottom: 0;
}

.shared-note-markdown hr {
  height: 1px;
  border: 0;
  margin: 1.8em 0;
  background: var(--border);
}

.shared-note-markdown strong {
  font-weight: 700;
}

.shared-note-markdown code {
  padding: 0.12em 0.35em;
  border: 1px solid var(--rule);
  border-radius: var(--radius-xs);
  background: var(--accent-soft);
  font-family: var(--font-geist-mono), ui-monospace, monospace;
  font-size: 0.82em;
  overflow-wrap: anywhere;
}

.shared-note-code-block {
  max-width: 100%;
  overflow-x: auto;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--canvas);
  color: var(--text);
  font-family: var(--font-geist-mono), ui-monospace, monospace;
  font-size: 0.84em;
  line-height: 1.6;
  tab-size: 2;
  white-space: pre;
  -webkit-overflow-scrolling: touch;
}

.shared-note-code-block code {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  font-size: inherit;
  overflow-wrap: normal;
}

.shared-note-table-scroll {
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: 1.05em;
  -webkit-overflow-scrolling: touch;
}

.shared-note-table-scroll:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

.shared-note-table-scroll table {
  width: 100%;
  min-width: 420px;
  border-collapse: collapse;
  margin: 0;
  font-size: 0.92em;
}

.shared-note-table-scroll th,
.shared-note-table-scroll td {
  padding: 9px 12px;
  border-bottom: 1px solid var(--rule);
  text-align: start;
  vertical-align: top;
}

.shared-note-table-scroll th {
  background: var(--accent-soft);
  font-weight: 700;
}

.shared-note-table-scroll tr:last-child td {
  border-bottom: 0;
}

.shared-note-markdown .contains-task-list {
  padding-inline-start: 0;
  list-style: none;
}

.shared-note-markdown .task-list-item {
  display: flex;
  align-items: baseline;
  gap: 0.55em;
}

.shared-note-markdown input[type="checkbox"] {
  width: 0.95em;
  height: 0.95em;
  flex: 0 0 auto;
  accent-color: var(--accent);
  vertical-align: -0.08em;
  opacity: 1;
}

.shared-note-image-frame {
  display: block;
  max-width: 100%;
  margin-block: 0.75em;
}

.shared-note-image-frame img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
}

.shared-note-download-link {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-top: 22px;
  color: var(--text-secondary);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 0.82rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 150ms ease-out;
}

.shared-note-download-link:hover {
  background: var(--hover);
  color: var(--text);
}

.shared-note-footer {
  padding-block: 10px 24px;
  color: var(--text-muted);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 0.78rem;
  line-height: 1.6;
  text-align: center;
}

.shared-note-footer a {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: var(--border);
  text-underline-offset: 0.2em;
}

.shared-note-footer a:hover {
  color: var(--text);
}

.shared-note-not-found {
  display: flex;
  min-height: min(62vh, 480px);
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

.shared-note-not-found h1 {
  max-width: 16ch;
  margin: 0;
  font-family: var(--write-font);
  font-size: clamp(2rem, 6vw, 2.6rem);
  letter-spacing: -0.025em;
  line-height: 1.18;
  text-wrap: balance;
}

.shared-note-not-found p {
  max-width: 55ch;
  margin: 16px 0 24px;
  color: var(--text-secondary);
  font-family: var(--write-font);
  font-size: 1.08rem;
  line-height: 1.7;
}

.shared-note-not-found .shared-note-open-link {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}

.shared-note-brand:focus-visible,
.shared-note-open-link:focus-visible,
.shared-note-download-link:focus-visible,
.shared-note-footer a:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 3px;
}

@media (max-width: 480px) {
  .shared-note-header,
  .shared-note-main,
  .shared-note-footer {
    width: min(100% - 24px, 800px);
  }

  .shared-note-header {
    min-height: 68px;
  }

  .shared-note-brand {
    gap: 8px;
  }

  .shared-note-open-link {
    min-height: 36px;
    gap: 5px;
    padding-inline: 10px;
    font-size: 0.76rem;
  }

  .shared-note-main {
    padding-block: 14px 26px;
  }

  .shared-note-paper {
    min-height: 60vh;
    padding: 22px 20px 26px;
    border-radius: var(--radius-md);
  }

  .shared-note-note-header {
    margin-bottom: 22px;
  }

  .shared-note-table-scroll table {
    min-width: 380px;
  }
}

@media (max-width: 350px) {
  .shared-note-brand span {
    font-size: 0.86rem;
  }

  .shared-note-open-link {
    gap: 4px;
    padding-inline: 8px;
    font-size: 0.72rem;
  }

  .shared-note-paper {
    padding-inline: 16px;
  }
}

```
