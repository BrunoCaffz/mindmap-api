import { MapIcon } from "./icons";

interface EmptyMapStateProps {
  onShowExample: () => void;
}

export function EmptyMapState({ onShowExample }: EmptyMapStateProps) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <MapIcon className="h-6 w-6" />
        </div>
        <h2 className="mb-1.5 text-lg font-semibold tracking-tight">Seu Notion em forma de mapa</h2>
        <p className="text-muted">
          Cole o ID de uma página no campo lá em cima e clique em Gerar mapa. Se quiser só dar uma
          olhada antes, abra o exemplo.
        </p>
        <button
          type="button"
          onClick={onShowExample}
          className="mt-4 h-[34px] rounded-lg border border-line-hi bg-surface px-3.5 text-[13px] font-medium text-ink transition-[background-color,transform] hover:bg-surface-2 active:scale-[0.97]"
        >
          Ver exemplo
        </button>
      </div>
    </div>
  );
}
