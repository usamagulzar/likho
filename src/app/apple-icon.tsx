import { ImageResponse } from "next/og";

import { AppMark } from "@/lib/brandImages";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds the corners itself, so the mark is drawn full-bleed.
export default function AppleIcon() {
  return new ImageResponse(<AppMark size={180} padded />, { ...size });
}
