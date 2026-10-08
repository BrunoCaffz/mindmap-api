import type { MindMapNode } from "@/types/mindmap";

export interface IndexedNode {
  node: MindMapNode;
  depth: number;
  parentId?: string;
}

export function indexById(root: MindMapNode): Map<string, IndexedNode> {
  const index = new Map<string, IndexedNode>();
  const visit = (node: MindMapNode, depth: number, parentId?: string) => {
    index.set(node.id, { node, depth, parentId });
    node.children.forEach((child) => visit(child, depth + 1, node.id));
  };
  visit(root, 0);
  return index;
}

export function countDescendants(node: MindMapNode): number {
  return node.children.reduce((total, child) => total + 1 + countDescendants(child), 0);
}

// Ids dos nós que ficam recolhidos quando só os níveis até `depth` aparecem (raiz = nível 0).
export function collapsedForDepth(root: MindMapNode, depth: number): Set<string> {
  const collapsed = new Set<string>();
  const visit = (node: MindMapNode, level: number) => {
    if (level >= depth && node.children.length > 0) collapsed.add(node.id);
    node.children.forEach((child) => visit(child, level + 1));
  };
  visit(root, 0);
  return collapsed;
}

// Texto sem acento e em minúsculas, para a busca ignorar maiúsculas e acentos.
export function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Ids dos nós cujo título contém a busca, na ordem em que aparecem na árvore.
export function findMatches(index: ReadonlyMap<string, IndexedNode>, query: string): string[] {
  const wanted = normalizeText(query.trim());
  if (!wanted) return [];
  const ids: string[] = [];
  for (const [id, { node }] of index) {
    if (normalizeText(node.title).includes(wanted)) ids.push(id);
  }
  return ids;
}

// Devolve o conjunto de recolhidos sem os ancestrais dos nós dados, para eles ficarem visíveis.
export function expandAncestors(
  collapsed: ReadonlySet<string>,
  index: ReadonlyMap<string, IndexedNode>,
  ids: readonly string[],
): Set<string> {
  const next = new Set(collapsed);
  for (const id of ids) {
    let parentId = index.get(id)?.parentId;
    while (parentId) {
      next.delete(parentId);
      parentId = index.get(parentId)?.parentId;
    }
  }
  return next;
}
