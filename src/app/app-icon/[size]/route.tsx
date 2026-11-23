import { ImageResponse } from "next/og";

import { AppMark } from "@/lib/brandImages";

// PNG icons for the web app manifest (installable app on Android / desktop).
const SIZES = [192, 512] as const;

export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.includes(size as (typeof SIZES)[number])) return new Response("Not found", { status: 404 });
  return new ImageResponse(<AppMark size={size} padded />, { width: size, height: size });
}
