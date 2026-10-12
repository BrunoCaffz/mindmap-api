"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "theme";

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function useTheme(): [Theme, (theme: Theme) => void] {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "light" as Theme);

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    // A classe liga a transição de cores só durante a troca (ver globals.css).
    root.classList.add("theme-fade");
    window.setTimeout(() => root.classList.remove("theme-fade"), 260);
    root.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sem armazenamento (janela privada, por exemplo): a escolha vale só nesta sessão.
    }
  }, []);

  return [theme, setTheme];
}
