"use client";

import { useEffect, useState } from "react";

export function useLocalStorageBoolean(key: string, defaultValue = false) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const stored = window.localStorage.getItem(key);
    if (stored === null) {
      setValue(defaultValue);
    } else {
      setValue(stored === "true");
    }
  }, [key, defaultValue]);

  const update = (next: boolean) => {
    setValue(next);
    window.localStorage.setItem(key, String(next));
    window.dispatchEvent(new Event("maos:theme"));
  };

  return [value, update] as const;
}
