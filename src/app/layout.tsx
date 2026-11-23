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
