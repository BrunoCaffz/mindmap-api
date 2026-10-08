"use client";

import { useCallback, useMemo, useState } from "react";
import { Background, Controls, MiniMap, ReactFlow, type NodeMouseHandler } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { buildLayout } from "@/lib/layout";
import type { MindMapNode } from "@/types/mindmap";
import { DetailPanel } from "./DetailPanel";
import { MapNode } from "./MapNode";

const nodeTypes = { mapNode: MapNode };

function indexById(root: MindMapNode): Map<string, MindMapNode> {
  const index = new Map<string, MindMapNode>();
  const visit = (node: MindMapNode) => {
    index.set(node.id, node);
    node.children.forEach(visit);
  };
  visit(root);
  return index;
}

export function MindMap({ tree }: { tree: MindMapNode }) {
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  const nodesById = useMemo(() => indexById(tree), [tree]);
  const layout = useMemo(() => buildLayout(tree, collapsedIds, toggle), [tree, collapsedIds, toggle]);
  const nodes = useMemo(
    () => layout.nodes.map((n) => ({ ...n, selected: n.id === selectedId })),
    [layout.nodes, selectedId],
  );

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => setSelectedId(node.id), []);
  const closePanel = useCallback(() => setSelectedId(null), []);
  const selectedNode = selectedId ? nodesById.get(selectedId) : undefined;

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={layout.edges}
        nodeTypes={nodeTypes}
        colorMode="system"
        fitView
        minZoom={0.1}
        nodesDraggable={false}
        nodesConnectable={false}
        onNodeClick={onNodeClick}
        onPaneClick={closePanel}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable />
      </ReactFlow>
      {selectedNode && <DetailPanel node={selectedNode} onClose={closePanel} />}
    </div>
  );
}
