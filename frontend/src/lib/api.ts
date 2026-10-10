import type { MindMapNode } from "@/types/mindmap";

// 32 caracteres hexadecimais, com ou sem hífens (formato dos IDs de página do Notion).
const PAGE_ID_PATTERN = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

export function normalizePageId(value: string): string | null {
  const trimmed = value.trim();
  return PAGE_ID_PATTERN.test(trimmed) ? trimmed.replaceAll("-", "").toLowerCase() : null;
}

const UNREACHABLE_MESSAGE = "Não consegui falar com o servidor.";

// Limite do texto vindo do backend, para uma resposta estranha não encher a tela.
const MAX_DETAIL_LENGTH = 300;

// Usadas só quando a resposta não traz um `detail` utilizável. `answered` diz se o corpo era JSON:
// um 500 em texto puro é o proxy do Next avisando que não alcançou o backend.
function genericMessage(status: number, answered: boolean): string {
  if (status === 400) return "O ID informado não parece válido. Confira se copiou o ID da página inteiro.";
  if (status === 401 || status === 403) return "Sem acesso a essa página.";
  if (status === 404) return "Página não encontrada ou sem acesso.";
  if (status === 429) return "Muitas tentativas seguidas ao Notion.";
  if (status === 502 || status === 504) return "O Notion não respondeu como esperado. Tente de novo em instantes.";
  if (status >= 500) return answered ? "O servidor não conseguiu gerar o mapa. Tente de novo." : UNREACHABLE_MESSAGE;
  return `Não foi possível carregar o mapa (HTTP ${status}).`;
}

// O backend responde erros em application/problem+json com `title` e `detail` já em português.
// Se o corpo não for JSON, ou não tiver texto, `text` vem null e quem chama usa a mensagem genérica.
async function readProblem(res: Response): Promise<{ text: string | null; isJson: boolean }> {
  let body: unknown;
  try {
    body = JSON.parse(await res.text());
  } catch {
    return { text: null, isJson: false };
  }
  if (typeof body !== "object" || body === null) return { text: null, isJson: true };
  const { detail, title } = body as { detail?: unknown; title?: unknown };
  for (const candidate of [detail, title]) {
    if (typeof candidate === "string" && candidate.trim() !== "") {
      return { text: candidate.trim().slice(0, MAX_DETAIL_LENGTH), isJson: true };
    }
  }
  return { text: null, isJson: true };
}

// Retry-After pode vir em segundos ou como data HTTP. Devolve segundos, ou null se não der para ler.
function retryAfterSeconds(res: Response): number | null {
  const header = res.headers.get("Retry-After")?.trim();
  if (!header) return null;
  const seconds = /^\d+$/.test(header) ? Number(header) : Math.ceil((Date.parse(header) - Date.now()) / 1000);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function formatWait(seconds: number): string {
  if (seconds < 60) return seconds === 1 ? "1 segundo" : `${seconds} segundos`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
}

export async function fetchMindMap(pageId: string): Promise<MindMapNode> {
  let res: Response;
  try {
    res = await fetch(`/api/mindmaps/notion/${encodeURIComponent(pageId)}`);
  } catch {
    throw new Error(UNREACHABLE_MESSAGE);
  }
  if (!res.ok) {
    const problem = await readProblem(res);
    const message = problem.text ?? genericMessage(res.status, problem.isJson);
    // No 429 a pessoa decide quando tentar de novo: a requisição nunca é repetida sozinha.
    const wait = res.status === 429 ? retryAfterSeconds(res) : null;
    throw new Error(wait ? `${message} Tente de novo em ${formatWait(wait)}.` : message);
  }
  return (await res.json()) as MindMapNode;
}
