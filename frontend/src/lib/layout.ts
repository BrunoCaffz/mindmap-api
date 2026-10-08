import dagre from "@dagrejs/dagre";
import { Position, type Edge, type Node } from "@xyflow/react";
import type { MindMapNode, MindMapNodeType } from "@/types/mindmap";

export const NODE_WIDTH = 260;
export const NODE_HEIGHT = 84;

export interface MapNodeData extends Record<string, unknown> {
  title: string;
  type: MindMapNodeType;
  hasChildren: boolean;
  collapsed: boolean;
  onToggle: (id: string) => void;
}

export type MapFlowNode = Node<MapNodeData, "mapNode">;

export function buildLayout(
  root: MindMapNode,
  collapsedIds: ReadonlySet<string>,
  onToggle: (id: string) => void,
): { nodes: MapFlowNode[]; edges: Edge[] } {
  const nodes: MapFlowNode[] = [];
  const edges: Edge[] = [];

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "LR", nodesep: 24, ranksep: 80 });

  function visit(node: MindMapNode, parentId?: string) {
    const collapsed = collapsedIds.has(node.id);
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    nodes.push({
      id: node.id,
      type: "mapNode",
      position: { x: 0, y: 0 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        title: node.title,
        type: node.type,
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
    node.children.forEach((child) => visit(child, node.id));
  }

  visit(root);
  dagre.layout(graph);

  for (const node of nodes) {
    const { x, y } = graph.node(node.id);
    node.position = { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 };
  }

  return { nodes, edges };
}
