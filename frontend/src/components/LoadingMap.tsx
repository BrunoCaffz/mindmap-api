"use client";

import { useEffect, useState } from "react";
import { Mascot } from "./Mascot";

// A requisição é uma só, então as etapas trocam por tempo. A última fica até a resposta chegar, e por
// isso nenhuma delas diz "pronto": quem avisa que acabou é o mapa aparecendo.
const STEPS = [
  "Abrindo a página no Notion",
  "Lendo os títulos, um por um",
  "Achando as subpáginas",
  "Puxando cada galho pro seu lugar",
  "Pintando os ramos",
  "Só alinhando as pontas",
];
const STEP_INTERVAL_MS = 1500;
// A barra nunca chega a 100%: ela só enche de verdade quando o mapa abre.
const MAX_PROGRESS = 92;

interface SkeletonNode {
  x: number;
  y: number;
  r: number;
  color: string;
  at: number;
  label: number;
}

const ROOT = { x: 380, y: 210 };

// Galhos e nós do esqueleto. `at` é a etapa em que cada um aparece.
const BRANCHES = [
  { color: "blue", x: 220, y: 90, at: 1 },
  { color: "red", x: 150, y: 250, at: 2 },
  { color: "green", x: 270, y: 360, at: 2 },
  { color: "purple", x: 560, y: 80, at: 3 },
  { color: "pink", x: 620, y: 230, at: 3 },
  { color: "orange", x: 500, y: 360, at: 4 },
] as const;

const TWIGS = [
  { color: "blue", from: 0, x: 120, y: 56 },
  { color: "blue", from: 0, x: 176, y: 26 },
  { color: "red", from: 1, x: 56, y: 206 },
  { color: "red", from: 1, x: 52, y: 300 },
  { color: "purple", from: 3, x: 676, y: 40 },
  { color: "purple", from: 3, x: 690, y: 112 },
  { color: "pink", from: 4, x: 726, y: 276 },
] as const;

const NODES: SkeletonNode[] = [
  ...BRANCHES.map((b) => ({ x: b.x, y: b.y, r: 17, color: b.color, at: b.at, label: 90 })),
  ...TWIGS.map((t) => ({ x: t.x, y: t.y, r: 7, color: t.color, at: 5, label: 0 })),
];

// Esqueleto do mapa: a raiz e os galhos aparecem aos poucos, com barras no lugar dos títulos.
function Skeleton({ step }: { step: number }) {
  return (
    <div
      role="img"
      aria-label="Mapa sendo desenhado, galho por galho"
      className="relative mx-auto aspect-[760/420] w-full max-w-[760px]"
    >
      <svg viewBox="0 0 760 420" fill="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
        {BRANCHES.map((b) => (
          <path
            key={b.color}
            d={`M${ROOT.x} ${ROOT.y} L${b.x} ${b.y}`}
            stroke={`var(--c-${b.color})`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="420"
            strokeDashoffset={step >= b.at ? 0 : 420}
            style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        ))}
        {TWIGS.map((t, i) => {
          const parent = BRANCHES[t.from];
          return (
            <path
              key={i}
              d={`M${parent.x} ${parent.y} L${t.x} ${t.y}`}
              stroke={`var(--c-${t.color})`}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="420"
              strokeDashoffset={step >= 5 ? 0 : 420}
              style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
          );
        })}
      </svg>
      <SkeletonDot x={ROOT.x} y={ROOT.y} r={28} fill="var(--root)" border="transparent" shown labelWidth={150} />
      {NODES.map((n, i) => (
        <SkeletonDot
          key={i}
          x={n.x}
          y={n.y}
          r={n.r}
          fill={`var(--t-${n.color})`}
          border={`var(--c-${n.color})`}
          shown={step >= n.at}
          labelWidth={n.label}
        />
      ))}
    </div>
  );
}

interface SkeletonDotProps {
  x: number;
  y: number;
  r: number;
  fill: string;
  border: string;
  shown: boolean;
  labelWidth: number;
}

function SkeletonDot({ x, y, r, fill, border, shown, labelWidth }: SkeletonDotProps) {
  return (
    <div
      className="absolute flex w-24 flex-col items-center sm:w-40"
      style={{
        left: `${(x / 760) * 100}%`,
        top: `${(y / 420) * 100}%`,
        opacity: shown ? 1 : 0,
        transform: `translate(-50%, -${r}px) scale(${shown ? 1 : 0.4})`,
        transition: "opacity 360ms ease-out, transform 480ms cubic-bezier(0.3, 1.5, 0.5, 1)",
      }}
    >
      <span
        className="box-border rounded-full"
        style={{ width: r * 2, height: r * 2, background: fill, border: `2.5px solid ${border}` }}
      />
      {labelWidth > 0 && <span className="mt-2 h-2 rounded-full bg-line-hi max-sm:!w-14" style={{ width: labelWidth }} />}
    </div>
  );
}

export function LoadingMap() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), STEP_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const progress = Math.min(MAX_PROGRESS, Math.round(((step + 1) / STEPS.length) * MAX_PROGRESS));

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-5 overflow-hidden px-4 pb-16">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-line" aria-hidden="true">
        <div
          className="h-0.5 w-full origin-left bg-root"
          style={{ transform: `scaleX(${progress / 100})`, transition: "transform 900ms cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </div>

      <div className="w-full max-w-[760px]">
        <Skeleton step={step} />
      </div>

      <div role="status" aria-live="polite" className="flex items-center gap-4">
        <Mascot name="cat-sit" height={96} motion="bob" />
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 text-base font-semibold">
            <span aria-hidden="true" className="pulse h-2 w-2 flex-none rounded-full bg-root" />
            {STEPS[step]}
          </div>
          <div className="text-[13px] text-muted">
            Páginas grandes levam mais um tempinho.
          </div>
        </div>
      </div>
    </div>
  );
}
