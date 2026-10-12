"use client";

import { useCallback, useSyncExternalStore } from "react";

// Acompanha uma media query. No servidor devolve `serverValue`, para a primeira pintura bater com a hidratação.
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => serverValue);
}
