"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

function filterEvent(event: BeforeSendEvent) {
  const path = new URL(event.url).pathname;
  // Password reset URLs and shared note URLs contain access tokens.
  if (path === "/reset-password" || path.startsWith("/reset-password/") || path.startsWith("/s/")) {
    return null;
  }
  return event;
}

export function WebAnalytics() {
  return <Analytics beforeSend={filterEvent} />;
}
