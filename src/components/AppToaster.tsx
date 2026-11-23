"use client";

import { Toaster } from "@/components/ui/sonner";
import { usePrefs } from "@/lib/store/prefs";

export function AppToaster() {
  const { prefs } = usePrefs();

  return <Toaster position="bottom-center" theme={prefs.theme} />;
}
