import type { ReactNode, RefObject } from "react";
import type { LayoutMode } from "@/lib/layout";
import { ErrorCard, type LoadError } from "./ErrorCard";
import { AlertIcon, LinkIcon, LockIcon } from "./icons";
import { Mascot } from "./Mascot";

interface ExampleCardProps {
  title: string;
  description: string;
  thumb: ReactNode;
  onOpen: () => void;
}

function ExampleCard({ title, description, thumb, onOpen }: ExampleCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="example-card relative z-[1] block overflow-hidden rounded-lg border border-line bg-bg text-left"
    >
      <div className="flex h-[104px] items-center justify-center border-b border-line bg-canvas">{thumb}</div>
      <div className="px-3 pb-3 pt-2.5">
        <div className="font-semibold">{title}</div>
        <div className="text-[13px] text-muted">{description}</div>
      </div>
    </button>
  );
}

const THUMB = { width: 160, height: 96, viewBox: "0 0 160 96", fill: "none", "aria-hidden": true } as const;
const LINE = { strokeWidth: 1.6, strokeLinecap: "round" } as const;

function MindThumb() {
  return (
    <svg {...THUMB}>
      <g {...LINE}>
        <path className="thumb-line" stroke="var(--c-blue)" d="M58 48 L42 17" />
        <path className="thumb-line" stroke="var(--c-red)" d="M58 48 L42 79" />
        <path className="thumb-line" stroke="var(--c-green)" d="M102 48 L118 13" />
        <path className="thumb-line" stroke="var(--c-purple)" d="M102 48 L118 47" />
        <path className="thumb-line" stroke="var(--c-orange)" d="M102 48 L118 81" />
      </g>
      <rect x="58" y="40" width="44" height="16" rx="4" fill="var(--root)" />
      {(
        [
          ["blue", 8, 12],
          ["red", 8, 74],
          ["green", 118, 8],
          ["purple", 118, 42],
          ["orange", 118, 76],
        ] as const
      ).map(([c, x, y]) => (
        <rect
          key={c}
          x={x}
          y={y}
          width="34"
          height="11"
          rx="3"
          fill={`var(--t-${c})`}
          stroke={`var(--c-${c})`}
          strokeWidth="1.3"
        />
      ))}
    </svg>
  );
}

function TreeThumb() {
  return (
    <svg {...THUMB}>
      <g {...LINE}>
        <path className="thumb-line" stroke="var(--c-blue)" d="M80 18 V30 H32 V40 M32 52 V62 H24 V72 M32 62 H50 V72" />
        <path className="thumb-line" stroke="var(--c-purple)" d="M80 30 V40" />
        <path className="thumb-line" stroke="var(--c-green)" d="M80 30 H128 V40 M128 52 V72" />
      </g>
      <rect x="62" y="6" width="36" height="12" rx="3" fill="var(--root)" />
      {(
        [
          ["blue", 14, 40, 36, 12],
          ["purple", 62, 40, 36, 12],
          ["green", 110, 40, 36, 12],
          ["blue", 14, 72, 20, 10],
          ["blue", 40, 72, 20, 10],
          ["green", 118, 72, 20, 10],
        ] as const
      ).map(([c, x, y, w, h], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={w}
          height={h}
          rx="3"
          fill={`var(--t-${c})`}
          stroke={`var(--c-${c})`}
          strokeWidth="1.2"
        />
      ))}
    </svg>
  );
}

function RadialThumb() {
  const kids = [
    ["blue", 40, 22],
    ["purple", 124, 20],
    ["green", 134, 62],
    ["red", 42, 76],
    ["orange", 90, 84],
  ] as const;
  return (
    <svg {...THUMB}>
      <g {...LINE}>
        {kids.map(([c, x, y]) => (
          <path key={c} className="thumb-line" stroke={`var(--c-${c})`} d={`M80 48 L${x} ${y}`} />
        ))}
      </g>
      <circle cx="80" cy="48" r="11" fill="var(--root)" />
      {kids.map(([c, x, y]) => (
        <circle key={c} cx={x} cy={y} r="6" fill={`var(--t-${c})`} stroke={`var(--c-${c})`} strokeWidth="1.8" />
      ))}
    </svg>
  );
}

// Doodle da entrada: uma folha de onde saem galhos coloridos, desenhados um a um.
function Doodle() {
  return (
    <svg width="210" height="140" viewBox="0 0 210 140" fill="none" aria-hidden="true" className="-ml-3">
      <g strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" className="stroke-ink">
        <path className="draw-line" d="M34 22 L82 20 L95 32 L96 116 L36 118 Z" />
        <path className="draw-line" style={{ animationDelay: ".25s" }} d="M82 20 L82.5 33 L95 32" />
        <path
          className="draw-line"
          style={{ animationDelay: ".45s" }}
          d="M47 50 L79 48.5 M47 63 L72 62.5 M47 76 L81 75 M47 90 L64 90.5"
        />
      </g>
      <g strokeWidth="2.2" strokeLinecap="round">
        <path className="draw-line" style={{ animationDelay: ".65s" }} stroke="var(--c-orange)" d="M96 58 L145 32" />
        <path className="draw-line" style={{ animationDelay: ".65s" }} stroke="var(--c-blue)" d="M96 71 L155 72" />
        <path className="draw-line" style={{ animationDelay: ".9s" }} stroke="var(--c-pink)" d="M96 84 L145 110" />
        <path className="draw-line" style={{ animationDelay: "1.1s" }} stroke="var(--c-green)" d="M169 72 L192 96" />
      </g>
      {(
        [
          ["orange", 152, 30, 8, ".9s"],
          ["blue", 163, 72, 8, "1.05s"],
          ["pink", 152, 112, 8, "1.2s"],
          ["green", 195, 100, 5, "1.5s"],
        ] as const
      ).map(([c, cx, cy, r, delay]) => (
        <circle
          key={c}
          className="draw-pop"
          style={{ animationDelay: delay }}
          cx={cx}
          cy={cy}
          r={r}
          fill={`var(--t-${c})`}
          stroke={`var(--c-${c})`}
          strokeWidth="2.4"
        />
      ))}
    </svg>
  );
}

interface EmptyMapStateProps {
  pageId: string;
  onPageIdChange: (value: string) => void;
  onSubmit: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  // Só gera mapa com o Notion conectado (ou com o fallback de desenvolvimento do backend).
  canGenerate: boolean;
  sessionLoading: boolean;
  // Erro de validação do ID (nem chegou a ir ao backend) e erro de carregamento (veio do backend).
  idError: string | null;
  loadError: LoadError | null;
  onShowExample: (mode: LayoutMode) => void;
}

export function EmptyMapState({
  pageId,
  onPageIdChange,
  onSubmit,
  inputRef,
  canGenerate,
  sessionLoading,
  idError,
  loadError,
  onShowExample,
}: EmptyMapStateProps) {
  const needsConnect = !canGenerate && !sessionLoading;
  const ready = canGenerate && pageId.trim() !== "";

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="mx-auto w-full max-w-[760px] px-6 pb-16 pt-8 sm:pt-10">
        <Doodle />

        <h1 className="mb-2 mt-5 text-[28px] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[40px]">
          Que página vamos desenhar hoje?
        </h1>
        <p className="mb-7 max-w-[560px] text-base text-muted">
          Cole o ID de uma página do Notion. Cada título vira um galho, cada subpágina vira um ramo, e você enxerga a
          página inteira de uma vez só.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <label htmlFor="page-id" className="mb-1.5 block text-[13px] font-semibold">
            ID da página
          </label>
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-bg py-1.5 pl-3 pr-1.5 shadow-field transition-shadow focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--focus)_45%,transparent)]">
            <LinkIcon className="flex-none text-muted" />
            <input
              id="page-id"
              ref={inputRef}
              value={pageId}
              onChange={(e) => onPageIdChange(e.target.value)}
              disabled={!canGenerate}
              placeholder="1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
              spellCheck={false}
              autoComplete="off"
              aria-describedby="page-id-help"
              aria-invalid={idError ? true : undefined}
              className="h-9 min-w-[160px] flex-[1_1_220px] bg-transparent text-base text-ink outline-none disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!ready}
              className={`h-9 rounded-sm px-3.5 font-semibold transition-[background-color,transform] duration-100 active:scale-[0.97] ${
                ready ? "bg-primary text-on-primary hover:bg-primary-hover" : "cursor-not-allowed bg-hover text-muted"
              }`}
            >
              Desenhar mapa
            </button>
          </div>
          {idError ? (
            <p id="page-id-help" role="alert" className="mt-2.5 flex items-start gap-1.5 text-[13px] text-ink">
              <AlertIcon width={14} height={14} className="mt-0.5 flex-none text-c-red" />
              {idError}
            </p>
          ) : needsConnect ? (
            <p id="page-id-help" className="mt-2.5 flex items-center gap-1.5 text-[13px] text-muted">
              <LockIcon width={14} height={14} className="flex-none" />
              Conecte seu Notion primeiro. Na hora de liberar, você escolhe quais páginas o app pode ler.
            </p>
          ) : (
            <p id="page-id-help" className="mt-2.5 text-[13px] text-muted">
              O ID são os 32 caracteres no fim do link da página. Vale com ou sem hífens.
            </p>
          )}
        </form>

        {loadError && (
          <ErrorCard
            error={loadError}
            onRetry={onSubmit}
            onPasteAnother={() => {
              onPageIdChange("");
              inputRef.current?.focus();
            }}
          />
        )}

        <div className="mb-3.5 mt-24 flex items-center gap-3 sm:mt-32">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[13px] font-semibold text-muted">Ou abra um exemplo pronto</span>
        </div>
        <div className="relative">
          <Mascot name="cat-peek" height={130} motion="bob" className="absolute -top-[118px] left-11 z-[2] max-sm:hidden" />
          <Mascot
            name="dog-peek"
            height={170}
            motion="lean"
            className="absolute -top-1.5 left-[calc(100%-8px)] z-0 max-[1279px]:hidden"
          />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
            <ExampleCard
              title="Mapa mental"
              description="Notas de estudo da AWS, da esquerda pra direita"
              thumb={<MindThumb />}
              onOpen={() => onShowExample("mindmap")}
            />
            <ExampleCard
              title="Árvore"
              description="As mesmas notas, de cima pra baixo"
              thumb={<TreeThumb />}
              onOpen={() => onShowExample("tree")}
            />
            <ExampleCard
              title="Radial"
              description="As mesmas notas, saindo do centro"
              thumb={<RadialThumb />}
              onOpen={() => onShowExample("radial")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
