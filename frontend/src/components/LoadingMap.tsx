"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Lendo página do Notion...",
  "Analisando conteúdo...",
  "Organizando tópicos...",
  "Criando mapa...",
  "Finalizando...",
];
const STEP_INTERVAL_MS = 1500;

// A requisição é uma só, então as etapas trocam por tempo. A última fica até a resposta chegar.
export function LoadingMap() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => Math.min(c + 1, STEPS.length - 1));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div role="status" aria-live="polite" className="flex h-full flex-col items-center justify-center gap-5">
      <ol className="flex flex-col gap-2.5 text-sm">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-2.5 transition-colors duration-300 ${
              i < current ? "text-muted" : i === current ? "font-medium text-ink" : "text-faint"
            }`}
          >
            <span className="flex h-4 w-4 items-center justify-center text-[11px]">
              {i < current ? (
                "✓"
              ) : i === current ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line-hi border-t-accent" />
              ) : (
                "○"
              )}
            </span>
            {label}
          </li>
        ))}
      </ol>
      <div className="relative h-[3px] w-48 overflow-hidden rounded-full bg-surface-2">
        <div className="loading-bar absolute inset-y-0 w-2/5 rounded-full bg-accent" />
      </div>
    </div>
  );
}
