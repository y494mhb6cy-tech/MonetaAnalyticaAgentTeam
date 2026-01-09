"use client";

import { useEffect } from "react";
import { useLocalStorageBoolean } from "../lib/storage";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [deepModeEnabled] = useLocalStorageBoolean("moneta-analytica-deep-mode", false);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.dataset.theme = deepModeEnabled ? "deep" : "slack";
  }, [deepModeEnabled]);

  return <>{children}</>;
}
