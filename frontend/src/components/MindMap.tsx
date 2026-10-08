"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { buildLayout, type LayoutMode, type MapFlowNode, type Spacing } from "@/lib/layout";
import type { Theme } from "@/lib/theme";
import type { MindMapNode } from "@/types/mindmap";
import { DetailPanel } from "./DetailPanel";
import { MapNode } from "./MapNode";

const nodeTypes = { mapNode: MapNode };

const ARIA_LABELS = {
  "controls.ariaLabel": "Controles do mapa",
  "controls.zoomIn.ariaLabel": "Aproximar",
  "controls.zoomOut.ariaLabel": "Afastar",
  "controls.fitView.ariaLabel": "Enquadrar o mapa",
  "controls.interactive.ariaLabel": "Alternar interação",
};

interface IndexedNode {
  node: MindMapNode;
  depth: number;
}

function indexById(root: MindMapNode): Map<string, IndexedNode> {
  const index = new Map<string, IndexedNode>();
  const visit = (node: MindMapNode, depth: number) => {
    index.set(node.id, { node, depth });
    node.children.forEach((child) => visit(child, depth + 1));
  };
  visit(root, 0);
  return index;
}

// O minimapa pinta por atributo SVG, que não resolve var(): usa cores literais por tema.
const MINIMAP_COLORS: Record<Theme, { main: string; rest: string }> = {
  dark: { main: "#7c83ff", rest: "#5b6577" },
  light: { main: "#5b5bd6", rest: "#94a0b4" },
};

interface MindMapProps {
  tree: MindMapNode;
  mode: LayoutMode;
  spacing: Spacing;
  theme: Theme;
}

function MindMapCanvas({ tree, mode, spacing, theme }: MindMapProps) {
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { fitView } = useReactFlow();

  const toggle = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  const index = useMemo(() => indexById(tree), [tree]);
  const layout = useMemo(
    () => buildLayout(tree, collapsedIds, toggle, mode, spacing),
    [tree, collapsedIds, toggle, mode, spacing],
  );
  const nodes = useMemo(
    () => layout.nodes.map((n) => ({ ...n, selected: n.id === selectedId })),
    [layout.nodes, selectedId],
  );

  // Ao trocar layout ou espaçamento o mapa muda de forma; reenquadra depois de renderizar.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const frame = requestAnimationFrame(() => fitView({ duration: 300 }));
    return () => cancelAnimationFrame(frame);
  }, [mode, spacing, fitView]);

  const minimapColor = useCallback(
    (node: MapFlowNode) => (node.data.depth <= 1 ? MINIMAP_COLORS[theme].main : MINIMAP_COLORS[theme].rest),
    [theme],
  );

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => setSelectedId(node.id), []);
  const closePanel = useCallback(() => setSelectedId(null), []);
  const selected = selectedId ? index.get(selectedId) : undefined;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={layout.edges}
          nodeTypes={nodeTypes}
          colorMode={theme}
          ariaLabelConfig={ARIA_LABELS}
          fitView
          minZoom={0.1}
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={onNodeClick}
          onPaneClick={closePanel}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="var(--grid)" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={minimapColor}
            style={{ right: selected ? 320 : 0, transition: "right 0.2s ease-out" }}
          />
        </ReactFlow>
        <AnimatePresence>
          {selected && <DetailPanel key={selected.node.id} node={selected.node} depth={selected.depth} onClose={closePanel} />}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

export function MindMap(props: MindMapProps) {
  return (
    <ReactFlowProvider>
      <MindMapCanvas {...props} />
    </ReactFlowProvider>
  );
}
