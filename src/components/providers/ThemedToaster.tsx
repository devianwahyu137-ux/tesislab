"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/context/ThemeContext";

/**
 * Client-side Sonner toaster synchronized with TesisLab's Dark / Light ThemeContext.
 */
export function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster position="bottom-right" richColors theme={theme} />;
}
