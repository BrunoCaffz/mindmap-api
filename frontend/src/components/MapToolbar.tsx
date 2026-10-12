import { CloseIcon, SearchIcon } from "./icons";

export type DepthSetting = number | "all" | null;

const DEPTH_OPTIONS = [1, 2, 3, 4];

const BUTTON =
  "h-8 rounded-sm px-2.5 text-[13px] transition-[background-color,transform] duration-100 hover:bg-hover active:scale-[0.97]";

const ICON_BUTTON =
  "flex h-8 w-8 flex-none items-center justify-center rounded-sm text-muted transition-colors hover:bg-hover hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent";

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
      ? "Nada por aqui"
      : `${currentIndex === null ? "·" : currentIndex + 1} de ${matchCount}`;

  return (
    <div className="flex h-10 w-[min(300px,calc(100vw-24px))] items-center gap-1 rounded-md border border-line bg-bg pl-3 pr-1 shadow-float focus-within:border-focus">
      <SearchIcon width={15} height={15} className="flex-none text-muted" />
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
        aria-label="Buscar no mapa"
        placeholder="Buscar por título"
        spellCheck={false}
        autoComplete="off"
        className="h-9 min-w-0 flex-1 bg-transparent px-1.5 text-base text-ink outline-none"
      />
      <span aria-live="polite" className="whitespace-nowrap px-1 text-[11px] text-muted">
        {status}
      </span>
      {hasQuery && (
        <button type="button" aria-label="Limpar busca" onClick={onClear} className={ICON_BUTTON}>
          <CloseIcon width={12} height={12} />
        </button>
      )}
      <button
        type="button"
        aria-label="Resultado anterior"
        disabled={matchCount === 0}
        onClick={() => onStep(-1)}
        className={ICON_BUTTON}
      >
        ↑
      </button>
      <button
        type="button"
        aria-label="Próximo resultado"
        disabled={matchCount === 0}
        onClick={() => onStep(1)}
        className={ICON_BUTTON}
      >
        ↓
      </button>
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
      <div className="flex flex-wrap items-center gap-0.5 rounded-md border border-line bg-bg p-1 shadow-float">
        <button type="button" onClick={() => onDepthChange("all")} className={BUTTON}>
          Abrir tudo
        </button>
        <button type="button" onClick={() => onDepthChange(0)} className={BUTTON}>
          Fechar tudo
        </button>
        <span aria-hidden="true" className="mx-1 h-[18px] w-px bg-line" />
        <span className="px-1 text-[13px] text-muted" id="depth-label">
          Níveis
        </span>
        <div role="group" aria-labelledby="depth-label" className="flex gap-0.5">
          {DEPTH_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={depth === option}
              onClick={() => onDepthChange(option)}
              className={`h-8 w-8 rounded-sm text-[13px] transition-[background-color,transform] duration-100 hover:bg-hover active:scale-[0.97] ${
                depth === option ? "bg-active font-bold" : ""
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
