// Sessão do usuário. O navegador só carrega um cookie HttpOnly: o token do Notion fica no backend
// e nunca chega aqui. Nada de autenticação é guardado em localStorage.

export interface SessionUser {
  userName: string;
  workspaceName: string;
}

// Endereço do login. É navegação de página (não fetch): o backend redireciona ao Notion.
export const LOGIN_URL = "/api/auth/notion/login";

// Só para desenvolvimento: com o backend em app.dev-token-fallback=true dá para gerar mapas sem login.
// É um booleano público, sem nada sensível.
export const DEV_FALLBACK = process.env.NEXT_PUBLIC_DEV_TOKEN_FALLBACK === "true";

export const SESSION_EXPIRED_MESSAGE = "Sua sessão expirou. Entre com o Notion de novo.";

// Lê só os dois campos esperados, como texto. Qualquer outra coisa vira null.
export async function fetchSessionUser(signal?: AbortSignal): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/me", { credentials: "same-origin", signal });
    if (!res.ok) return null; // 401 é "não logado"; outros erros também não travam a tela
    const body: unknown = await res.json();
    if (typeof body !== "object" || body === null) return null;
    const { userName, workspaceName } = body as { userName?: unknown; workspaceName?: unknown };
    if (typeof userName !== "string" || typeof workspaceName !== "string") return null;
    return { userName, workspaceName };
  } catch {
    return null;
  }
}

function readXsrfToken(): string | null {
  const match = document.cookie.split("; ").find((part) => part.startsWith("XSRF-TOKEN="));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice("XSRF-TOKEN=".length));
  } catch {
    return null;
  }
}

// true se a sessão acabou (ou já não existia). 401 conta como sucesso: o objetivo é estar deslogado.
export async function postLogout(): Promise<boolean> {
  const headers: Record<string, string> = {};
  const token = readXsrfToken();
  if (token) headers["X-XSRF-TOKEN"] = token;
  try {
    const res = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin", headers });
    return res.ok || res.status === 401;
  } catch {
    return false;
  }
}
