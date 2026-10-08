export type DepthSetting = number | "all" | null;

const DEPTH_OPTIONS = [1, 2, 3, 4];

const BUTTON =
  "h-8 rounded-lg px-3 text-xs font-medium text-muted transition-[background-color,color,transform] hover:bg-surface-2 hover:text-ink active:scale-[0.97]";

const ICON_BUTTON =
  "flex h-7 w-7 items-center justify-center rounded-md text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent";

interface SearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  matchCount: number;
  // Posição do resultado atual (começando em 0), ou null enquanto a busca ainda não foi confirmada.
  currentIndex: number | null;
  onStep: (delta: 1 | -1) => void;
  onClear: () => void;
}

function SearchBox({ query, onQueryChange, matchCount, currentIndex, onStep, onClear }: SearchProps) {
  const hasQuery = query.trim() !== "";
  const status = !hasQuery
    ? ""
    : matchCount === 0
      ? "Nenhum resultado"
      : `${currentIndex === null ? "·" : currentIndex + 1} de ${matchCount}`;

  return (
    <div className="flex w-80 items-center gap-1 rounded-xl border border-line bg-surface p-1 shadow-pop focus-within:border-accent">
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onStep(e.shiftKey ? -1 : 1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            onStep(1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            onStep(-1);
          } else if (e.key === "Escape") {
            onClear();
          }
        }}
        aria-label="Buscar por título"
        placeholder="Buscar por título"
        spellCheck={false}
        autoComplete="off"
        className="h-7 min-w-0 flex-1 bg-transparent px-2 text-[13px] text-ink outline-none placeholder:text-faint"
      />
      <span aria-live="polite" className="whitespace-nowrap px-1 text-[11px] text-faint">
        {status}
      </span>
      <button type="button" aria-label="Resultado anterior" disabled={matchCount === 0} onClick={() => onStep(-1)} className={ICON_BUTTON}>
        ↑
      </button>
      <button type="button" aria-label="Próximo resultado" disabled={matchCount === 0} onClick={() => onStep(1)} className={ICON_BUTTON}>
        ↓
      </button>
      {hasQuery && (
        <button type="button" aria-label="Limpar busca" onClick={onClear} className={ICON_BUTTON}>
          ×
        </button>
      )}
    </div>
  );
}

interface MapToolbarProps {
  depth: DepthSetting;
  onDepthChange: (depth: DepthSetting) => void;
  search: SearchProps;
}

export function MapToolbar({ depth, onDepthChange, search }: MapToolbarProps) {
  return (
    <div className="flex flex-col items-start gap-2">
      <SearchBox {...search} />
      <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1 shadow-pop">
        <button type="button" onClick={() => onDepthChange("all")} className={BUTTON}>
          Expandir tudo
        </button>
        <button type="button" onClick={() => onDepthChange(0)} className={BUTTON}>
          Recolher tudo
        </button>
        <div className="mx-1 h-5 w-px bg-line" />
        <span className="px-1 text-xs text-faint" id="depth-label">
          Níveis
        </span>
        <div role="group" aria-labelledby="depth-label" className="flex gap-0.5 rounded-lg bg-bg p-0.5">
          {DEPTH_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={depth === option}
              onClick={() => onDepthChange(option)}
              className={`h-7 w-7 rounded-md text-xs font-medium transition-colors ${
                depth === option ? "bg-accent-soft text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
