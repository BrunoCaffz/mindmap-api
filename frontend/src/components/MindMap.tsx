"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  getNodesBounds,
  useReactFlow,
  useStoreApi,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { buildLayout, type LayoutMode, type MapFlowNode, type Spacing } from "@/lib/layout";
import type { Theme } from "@/lib/theme";
import { collapsedForDepth, expandAncestors, findMatches, indexById } from "@/lib/tree";
import {
  ANIMATION_MS,
  CLICK_ZOOM,
  DETAIL_PANEL_WIDTH,
  INITIAL_DEPTH,
  MIN_ZOOM,
  READING_ZOOM,
  SEARCH_DEBOUNCE_MS,
} from "@/lib/view";
import type { MindMapNode } from "@/types/mindmap";
import { BubbleNode } from "./BubbleNode";
import { DetailPanel } from "./DetailPanel";
import { MapNode } from "./MapNode";
import { MapToolbar, type DepthSetting } from "./MapToolbar";

const nodeTypes = { mapNode: MapNode, bubbleNode: BubbleNode };

const ARIA_LABELS = {
  "controls.ariaLabel": "Controles do mapa",
  "controls.zoomIn.ariaLabel": "Aproximar",
  "controls.zoomOut.ariaLabel": "Afastar",
  "controls.fitView.ariaLabel": "Enquadrar o mapa",
  "controls.interactive.ariaLabel": "Alternar interação",
};

const FIT_OPTIONS = { minZoom: MIN_ZOOM, maxZoom: 1, padding: 0.1 };

type Layout = ReturnType<typeof buildLayout>;

interface Point {
  x: number;
  y: number;
}

// Posições intermediárias de uma transição, ligadas ao layout de destino para não vazarem para outro.
interface Transition {
  layout: Layout;
  positions: Map<string, Point>;
}

const minimapColors: Record<Theme, { main: string; rest: string }> = {
  dark: { main: "#7c83ff", rest: "#5b6577" },
  light: { main: "#5b5bd6", rest: "#94a0b4" },
};

function centerOf(node: MapFlowNode): Point {
  return { x: node.position.x + node.data.width / 2, y: node.position.y + node.data.height / 2 };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// committed: a busca já expandiu os ancestrais e focou no primeiro resultado.
interface SearchState {
  query: string;
  committed: boolean;
  current: number;
}

interface MindMapProps {
  tree: MindMapNode;
  mode: LayoutMode;
  spacing: Spacing;
  theme: Theme;
}

function MindMapCanvas({ tree, mode, spacing, theme }: MindMapProps) {
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(() =>
    collapsedForDepth(tree, INITIAL_DEPTH),
  );
  const [depthSetting, setDepthSetting] = useState<DepthSetting>(INITIAL_DEPTH);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transition, setTransition] = useState<Transition | null>(null);
  // Pedido para centralizar num nó depois que o layout muda. Objeto novo a cada pedido.
  const [focusRequest, setFocusRequest] = useState<{ id: string; zoom?: number } | null>(null);
  const [search, setSearch] = useState<SearchState>({ query: "", committed: false, current: 0 });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { fitView, setCenter, getZoom } = useReactFlow();
  const store = useStoreApi();

  const layoutRef = useRef<Layout | null>(null);
  const previousPositions = useRef(new Map<string, Point>());

  const index = useMemo(() => indexById(tree), [tree]);

  const toggle = useCallback((id: string) => {
    setFocusRequest({ id });
    setDepthSetting(null);
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  const changeDepth = useCallback(
    (setting: DepthSetting) => {
      if (setting === null) return;
      setFocusRequest({ id: selectedId ?? tree.id });
      setDepthSetting(setting);
      setCollapsedIds(collapsedForDepth(tree, setting === "all" ? Infinity : setting));
    },
    [tree, selectedId],
  );

  const matches = useMemo(() => findMatches(index, search.query), [index, search.query]);

  // Mostra o resultado: expande os ancestrais dele e centraliza com zoom confortável.
  const goToMatch = useCallback(
    (id: string) => {
      setDepthSetting(null);
      setCollapsedIds((prev) => expandAncestors(prev, index, [id]));
      setFocusRequest({ id, zoom: CLICK_ZOOM });
    },
    [index],
  );

  const commitSearch = useCallback(
    (query: string) => {
      const ids = findMatches(index, query);
      setSearch({ query, committed: true, current: 0 });
      if (ids.length === 0) return;
      setDepthSetting(null);
      setCollapsedIds((prev) => expandAncestors(prev, index, ids));
      setFocusRequest({ id: ids[0], zoom: CLICK_ZOOM });
    },
    [index],
  );

  const changeQuery = useCallback(
    (query: string) => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      setSearch({ query, committed: false, current: 0 });
      // Só expande e foca depois que a pessoa para de digitar, para letras soltas não abrirem o mapa todo.
      if (query.trim().length >= 2) {
        searchTimer.current = setTimeout(() => commitSearch(query), SEARCH_DEBOUNCE_MS);
      }
    },
    [commitSearch],
  );

  const { query: searchQuery, committed: searchCommitted, current: searchCurrent } = search;

  const stepSearch = useCallback(
    (delta: 1 | -1) => {
      if (matches.length === 0) return;
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (!searchCommitted) {
        commitSearch(searchQuery);
        return;
      }
      const next = (searchCurrent + delta + matches.length) % matches.length;
      setSearch((prev) => ({ ...prev, current: next }));
      goToMatch(matches[next]);
    },
    [matches, searchCommitted, searchQuery, searchCurrent, commitSearch, goToMatch],
  );

  const clearSearch = useCallback(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearch({ query: "", committed: false, current: 0 });
  }, []);

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );

  const layout = useMemo(
    () => buildLayout(tree, collapsedIds, toggle, mode, spacing),
    [tree, collapsedIds, toggle, mode, spacing],
  );

  // Quando o layout muda: centraliza no nó que foi clicado e desliza os nós para as novas posições.
  useEffect(() => {
    layoutRef.current = layout;
    const target = new Map(layout.nodes.map((n) => [n.id, n.position]));
    const previous = previousPositions.current;
    previousPositions.current = target;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (previous.size === 0 || reduceMotion) return;

    // Nó novo nasce na posição do pai e desliza até a sua.
    const from = new Map<string, Point>();
    let moves = false;
    for (const [id, to] of target) {
      const parentId = index.get(id)?.parentId;
      const start = previous.get(id) ?? (parentId ? previous.get(parentId) : undefined) ?? to;
      from.set(id, start);
      if (start.x !== to.x || start.y !== to.y) moves = true;
    }
    if (!moves) return;

    const startedAt = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / ANIMATION_MS);
      const eased = easeOutCubic(t);
      const positions = new Map<string, Point>();
      for (const [id, to] of target) {
        const start = from.get(id) ?? to;
        positions.set(id, { x: start.x + (to.x - start.x) * eased, y: start.y + (to.y - start.y) * eased });
      }
      setTransition(t < 1 ? { layout, positions } : null);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [layout, index, setCenter, getZoom]);

  // Centraliza no nó pedido (o clicado, ou o selecionado/raiz nos botões da barra), mantendo o zoom.
  useEffect(() => {
    const current = layoutRef.current;
    if (!focusRequest || !current) return;
    const focused = current.nodes.find((n) => n.id === focusRequest.id) ?? current.nodes[0];
    if (!focused) return;
    const { x, y } = centerOf(focused);
    const zoom = Math.max(getZoom(), focusRequest.zoom ?? 0);
    setCenter(x, y, { zoom, duration: ANIMATION_MS });
  }, [focusRequest, setCenter, getZoom]);

  // Visão inicial (e ao trocar de layout ou espaçamento): tudo que cabe no zoom mínimo é enquadrado;
  // se não couber, o mapa fica maior que a tela, ancorado na raiz, e o usuário navega com pan.
  useEffect(() => {
    let frame = 0;
    const show = (attempt: number) => {
      const { width, height } = store.getState();
      const current = layoutRef.current;
      if (!current) return;
      if ((width === 0 || height === 0) && attempt < 30) {
        frame = requestAnimationFrame(() => show(attempt + 1));
        return;
      }
      const bounds = getNodesBounds(current.nodes);
      const fitZoom = Math.min(width / (bounds.width * 1.2), height / (bounds.height * 1.2));
      if (fitZoom >= MIN_ZOOM) {
        fitView({ ...FIT_OPTIONS, duration: 0 });
        return;
      }
      const root = current.nodes.find((n) => n.id === tree.id);
      if (!root) return;
      const { x, y } = centerOf(root);
      const shiftX = mode === "mindmap" ? (width * 0.25) / READING_ZOOM : 0;
      const shiftY = mode === "tree" ? (height * 0.3) / READING_ZOOM : 0;
      setCenter(x + shiftX, y + shiftY, { zoom: READING_ZOOM, duration: 0 });
    };
    frame = requestAnimationFrame(() => show(0));
    return () => cancelAnimationFrame(frame);
  }, [tree, mode, spacing, store, fitView, setCenter]);

  const matchSet = useMemo(() => new Set(matches), [matches]);
  const currentMatchId = search.committed ? matches[search.current] : undefined;

  const nodes = useMemo(() => {
    const positions = transition && transition.layout === layout ? transition.positions : null;
    const searching = matchSet.size > 0;
    return layout.nodes.map((n) => ({
      ...n,
      position: positions?.get(n.id) ?? n.position,
      selected: n.id === selectedId,
      data: {
        ...n.data,
        match: matchSet.has(n.id),
        current: n.id === currentMatchId,
        dimmed: searching && !matchSet.has(n.id),
      },
    }));
  }, [layout, transition, selectedId, matchSet, currentMatchId]);

  const minimapColor = useCallback(
    (node: MapFlowNode) => (node.data.depth <= 1 ? minimapColors[theme].main : minimapColors[theme].rest),
    [theme],
  );

  // Clicar num nó: abre o painel e aproxima nele, deslocado para não ficar atrás do painel.
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      setSelectedId(node.id);
      const target = layoutRef.current?.nodes.find((n) => n.id === node.id);
      if (!target) return;
      const zoom = Math.max(getZoom(), CLICK_ZOOM);
      const { x, y } = centerOf(target);
      setCenter(x + DETAIL_PANEL_WIDTH / 2 / zoom, y, { zoom, duration: ANIMATION_MS + 80 });
    },
    [getZoom, setCenter],
  );
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
          minZoom={MIN_ZOOM}
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={onNodeClick}
          onPaneClick={closePanel}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="var(--grid)" />
          <Controls showInteractive={false} fitViewOptions={FIT_OPTIONS} />
          <MiniMap
            pannable
            zoomable
            nodeColor={minimapColor}
            style={{ right: selected ? 320 : 0, transition: "right 0.2s ease-out" }}
          />
          <Panel position="top-left">
            <MapToolbar
              depth={depthSetting}
              onDepthChange={changeDepth}
              search={{
                query: search.query,
                onQueryChange: changeQuery,
                matchCount: matches.length,
                currentIndex: search.committed && matches.length > 0 ? search.current : null,
                onStep: stepSearch,
                onClear: clearSearch,
              }}
            />
          </Panel>
        </ReactFlow>
        <AnimatePresence>
          {selected && (
            <DetailPanel key={selected.node.id} node={selected.node} depth={selected.depth} onClose={closePanel} />
          )}
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
