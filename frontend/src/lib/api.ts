import type { MindMapNode } from "@/types/mindmap";

function messageForStatus(status: number): string {
  if (status === 400) return "O ID informado não parece válido. Confira se copiou o ID da página inteiro.";
  if (status === 401 || status === 403) {
    return "Sem acesso a essa página. Confira se ela foi compartilhada com a integração do Notion.";
  }
  if (status === 404) return "Página não encontrada. Confira o ID e as permissões da integração.";
  if (status >= 500) return "O servidor não conseguiu gerar o mapa. Confira o ID da página e tente de novo.";
  return `Não foi possível carregar o mapa (HTTP ${status}).`;
}

export async function fetchMindMap(pageId: string): Promise<MindMapNode> {
  let res: Response;
  try {
    res = await fetch(`/api/mindmaps/notion/${encodeURIComponent(pageId)}`);
  } catch {
    throw new Error("Não consegui falar com o servidor. Confira se o backend está rodando.");
  }
  if (!res.ok) {
    throw new Error(messageForStatus(res.status));
  }
  return (await res.json()) as MindMapNode;
}
