"use client";

import { useEffect, useState } from "react";

const STEPS = ["Lendo página do Notion...", "Organizando tópicos...", "Criando mapa..."];
const STEP_INTERVAL_MS = 1500;

// A requisição é uma só, então as etapas trocam por tempo. A última fica até a resposta chegar.
export function LoadingSteps() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => Math.min(c + 1, STEPS.length - 1));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div role="status" aria-live="polite" className="flex h-full items-center justify-center">
      <ol className="flex flex-col gap-3 text-sm">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-3 ${
              i < current
                ? "text-zinc-400 dark:text-zinc-600"
                : i === current
                  ? "font-medium"
                  : "text-zinc-300 dark:text-zinc-700"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center">
              {i < current ? (
                "✓"
              ) : i === current ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" />
              ) : (
                "○"
              )}
            </span>
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
