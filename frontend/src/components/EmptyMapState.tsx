import { MapIcon } from "./icons";

export function EmptyMapState() {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <MapIcon className="h-6 w-6" />
        </div>
        <h2 className="mb-1.5 text-lg font-semibold tracking-tight">Seu Notion em forma de mapa</h2>
        <p className="text-muted">
          Cole o ID de uma página no campo lá em cima e clique em Gerar mapa. A página precisa estar
          compartilhada com a integração do Notion.
        </p>
      </div>
    </div>
  );
}
