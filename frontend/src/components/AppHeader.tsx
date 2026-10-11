import type { SessionUser } from "@/lib/auth";
import { LOGIN_URL } from "@/lib/auth";
import { DocIcon, MapIcon, SidebarIcon } from "./icons";

interface AppHeaderProps {
  pageId: string;
  onPageIdChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  // Esconde o campo de ID e o botão (modo demonstração).
  hideInput?: boolean;
  mapTitle?: string;
  onToggleSidebar: () => void;
  // Só gera mapa quando a pessoa está logada (ou com o fallback de dev).
  canGenerate: boolean;
  sessionLoading: boolean;
  user: SessionUser | null;
  onLogout: () => void;
}

export function AppHeader({
  pageId,
  onPageIdChange,
  onSubmit,
  loading,
  hideInput = false,
  mapTitle,
  onToggleSidebar,
  canGenerate,
  sessionLoading,
  user,
  onLogout,
}: AppHeaderProps) {
  return (
    <header className="flex h-[52px] flex-none items-center gap-3 border-b border-line bg-surface px-3">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Mostrar ou esconder a barra lateral"
        title="Barra lateral"
        className="hidden rounded-md p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink md:block"
      >
        <SidebarIcon className="h-[18px] w-[18px]" />
      </button>

      <div className="flex items-center gap-2 whitespace-nowrap font-semibold tracking-tight">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-fg">
          <MapIcon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <span className="hidden sm:inline">Notion Mindmap</span>
      </div>

      {mapTitle && (
        <>
          <div className="hidden h-5 w-px bg-line md:block" />
          <p className="hidden min-w-0 truncate text-muted md:block">
            Mapa: <span className="font-medium text-ink">{mapTitle}</span>
          </p>
        </>
      )}

      {!hideInput && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none"
        >
          <label className="flex h-[34px] min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-bg px-2.5 text-faint transition-colors focus-within:border-accent hover:border-line-hi sm:w-80 sm:flex-none">
            <DocIcon className="h-3.5 w-3.5 flex-none" />
            <span className="sr-only">ID da página do Notion</span>
            <input
              value={pageId}
              onChange={(e) => onPageIdChange(e.target.value)}
              disabled={!canGenerate}
              placeholder={canGenerate ? "Cole o ID da página do Notion" : "Entre com o Notion para gerar um mapa"}
              spellCheck={false}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
            />
          </label>
          <button
            type="submit"
            disabled={loading || !canGenerate || !pageId.trim()}
            className="h-[34px] whitespace-nowrap rounded-lg bg-accent px-3.5 text-[13px] font-medium text-accent-fg transition-[filter,transform] hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Gerar mapa
          </button>
        </form>
      )}

      {!hideInput && !sessionLoading && (
        <div className="flex flex-none items-center gap-2">
          {user ? (
            <>
              <p className="hidden min-w-0 max-w-56 truncate text-[13px] text-muted lg:block">
                <span className="font-medium text-ink">{user.userName}</span> · {user.workspaceName}
              </p>
              <button
                type="button"
                onClick={onLogout}
                className="h-[34px] whitespace-nowrap rounded-lg border border-line px-3 text-[13px] font-medium text-ink transition-colors hover:border-line-hi hover:bg-surface-2"
              >
                Sair
              </button>
            </>
          ) : (
            <LoginButton />
          )}
        </div>
      )}
    </header>
  );
}

// Navegação de página (não fetch): o backend responde com o redirecionamento ao Notion.
export function LoginButton() {
  return (
    <a
      href={LOGIN_URL}
      className="inline-flex h-[34px] items-center whitespace-nowrap rounded-lg bg-accent px-3.5 text-[13px] font-medium text-accent-fg transition-[filter,transform] hover:brightness-110 active:scale-[0.97]"
    >
      Entrar com o Notion
    </a>
  );
}
