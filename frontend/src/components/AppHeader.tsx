import { LOGIN_URL, type SessionUser } from "@/lib/auth";
import { MenuIcon } from "./icons";

const PRIMARY_BUTTON =
  "inline-flex h-9 items-center whitespace-nowrap rounded-sm bg-primary px-3.5 font-semibold text-on-primary transition-[background-color,transform] duration-100 hover:bg-primary-hover active:scale-[0.97]";

interface AppHeaderProps {
  // Título do mapa aberto. Sem ele, o caminho mostra "Sem título".
  mapTitle?: string;
  // Esconde tudo o que é de login (modo demonstração).
  hideAuth?: boolean;
  // Quando existe, "Mapas" vira um botão que volta à tela inicial.
  onHome?: () => void;
  sessionLoading: boolean;
  user: SessionUser | null;
  onLogout: () => void;
  onOpenMenu: () => void;
}

export function AppHeader({ mapTitle, hideAuth = false, onHome, sessionLoading, user, onLogout, onOpenMenu }: AppHeaderProps) {
  return (
    <header className="flex min-h-12 flex-none items-center justify-between gap-3 border-b border-line bg-bg py-1 pl-2 pr-3 md:pl-4">
      <div className="flex min-w-0 items-center gap-1 text-muted">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir o menu"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-sm text-ink transition-colors hover:bg-hover md:hidden"
        >
          <MenuIcon width={20} height={20} />
        </button>
        <nav aria-label="Onde você está" className="flex min-w-0 items-center gap-1.5">
          {onHome && mapTitle ? (
            <button
              type="button"
              onClick={onHome}
              className="hidden rounded-sm px-1 transition-colors hover:bg-hover hover:text-ink sm:inline"
            >
              Mapas
            </button>
          ) : (
            <span className="hidden sm:inline">Mapas</span>
          )}
          <span aria-hidden="true" className="hidden sm:inline">
            /
          </span>
          <span className="truncate font-medium text-ink sm:font-normal">{mapTitle || "Sem título"}</span>
        </nav>
      </div>

      {!hideAuth && !sessionLoading && (user ? <UserMenu user={user} onLogout={onLogout} /> : <LoginButton />)}
    </header>
  );
}

function UserMenu({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  return (
    <div className="flex min-w-0 flex-none items-center gap-2">
      <p className="flex min-w-0 items-center gap-2 text-muted" title={`${user.userName} · ${user.workspaceName}`}>
        <span aria-hidden="true" className="h-2 w-2 flex-none rounded-full bg-c-green" />
        <span className="hidden max-w-56 truncate lg:inline">
          <span className="font-medium text-ink">{user.userName}</span> · {user.workspaceName}
        </span>
        <span className="sr-only lg:hidden">
          Conectado como {user.userName} no workspace {user.workspaceName}
        </span>
      </p>
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex h-9 items-center whitespace-nowrap rounded-sm px-3 font-medium text-ink transition-[background-color,transform] duration-100 hover:bg-hover active:scale-[0.97]"
      >
        Sair
      </button>
    </div>
  );
}

// Navegação de página (não fetch): o backend responde com o redirecionamento para o Notion.
export function LoginButton({ label = "Conectar meu Notion" }: { label?: string }) {
  return (
    <a href={LOGIN_URL} className={PRIMARY_BUTTON}>
      {label}
    </a>
  );
}
