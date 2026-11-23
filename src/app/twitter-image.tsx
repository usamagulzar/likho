import { ImageResponse } from "next/og";

import { SocialCard } from "@/lib/brandImages";

export const alt = "Likho — a free online notepad with live Markdown";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<SocialCard />, { ...size });
}
