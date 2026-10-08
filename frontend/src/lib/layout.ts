import dagre from "@dagrejs/dagre";
import { Position, type Edge, type Node } from "@xyflow/react";
import type { MindMapNode, MindMapNodeType } from "@/types/mindmap";

export type LayoutMode = "mindmap" | "tree";
export type Spacing = "compact" | "normal" | "wide";

const SPACING: Record<Spacing, { nodesep: number; ranksep: number }> = {
  compact: { nodesep: 16, ranksep: 56 },
  normal: { nodesep: 32, ranksep: 90 },
  wide: { nodesep: 52, ranksep: 120 },
};

// Tamanho fixo por nível: o dagre precisa saber as dimensões antes de renderizar.
const SIZES = [
  { width: 240, height: 72 },
  { width: 220, height: 64 },
  { width: 210, height: 60 },
  { width: 190, height: 48 },
];

// Devolve uma cópia: o dagre grava x e y no objeto recebido, então ele não pode ser compartilhado.
export function nodeSize(depth: number): { width: number; height: number } {
  return { ...SIZES[Math.min(depth, SIZES.length - 1)] };
}

export interface MapNodeData extends Record<string, unknown> {
  title: string;
  type: MindMapNodeType;
  depth: number;
  horizontal: boolean;
  hasChildren: boolean;
  collapsed: boolean;
  onToggle: (id: string) => void;
}

export type MapFlowNode = Node<MapNodeData, "mapNode">;

export function buildLayout(
  root: MindMapNode,
  collapsedIds: ReadonlySet<string>,
  onToggle: (id: string) => void,
  mode: LayoutMode,
  spacing: Spacing,
): { nodes: MapFlowNode[]; edges: Edge[] } {
  const horizontal = mode === "mindmap";
  const nodes: MapFlowNode[] = [];
  const edges: Edge[] = [];

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: horizontal ? "LR" : "TB", ...SPACING[spacing] });

  function visit(node: MindMapNode, depth: number, parentId?: string) {
    const collapsed = collapsedIds.has(node.id);
    const { width, height } = nodeSize(depth);
    graph.setNode(node.id, { width, height });
    nodes.push({
      id: node.id,
      type: "mapNode",
      position: { x: 0, y: 0 },
      width,
      height,
      sourcePosition: horizontal ? Position.Right : Position.Bottom,
      targetPosition: horizontal ? Position.Left : Position.Top,
      data: {
        title: node.title,
        type: node.type,
        depth,
        horizontal,
        hasChildren: node.children.length > 0,
        collapsed,
        onToggle,
      },
    });
    if (parentId) {
      graph.setEdge(parentId, node.id);
      edges.push({ id: `${parentId}-${node.id}`, source: parentId, target: node.id });
    }
    if (collapsed) return;
    node.children.forEach((child) => visit(child, depth + 1, node.id));
  }

  visit(root, 0);
  dagre.layout(graph);

  for (const node of nodes) {
    const { x, y } = graph.node(node.id);
    const { width, height } = nodeSize(node.data.depth);
    node.position = { x: x - width / 2, y: y - height / 2 };
  }

  return { nodes, edges };
}
