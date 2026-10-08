import dagre from "@dagrejs/dagre";
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from "d3-force";
import type { SimulationLinkDatum, SimulationNodeDatum } from "d3-force";
import { Position, type Edge, type Node } from "@xyflow/react";
import type { MindMapNode, MindMapNodeType } from "@/types/mindmap";
import { countDescendants } from "./tree";
import { BRANCH_COLORS } from "./view";

export type LayoutMode = "mindmap" | "tree" | "radial" | "bubbles";
export type Spacing = "compact" | "normal" | "wide";

// Como as conexões saem do node: pela lateral (mind map), por baixo (tree) ou do centro (radial e bolhas).
export type Flow = "right" | "down" | "center";

const DAGRE_SPACING: Record<Spacing, { nodesep: number; ranksep: number }> = {
  compact: { nodesep: 20, ranksep: 60 },
  normal: { nodesep: 36, ranksep: 100 },
  wide: { nodesep: 60, ranksep: 140 },
};
const RADIAL_GAP: Record<Spacing, number> = { compact: 24, normal: 56, wide: 96 };
const BUBBLE_SCALE: Record<Spacing, number> = { compact: 0.75, normal: 1, wide: 1.4 };

export interface Box {
  width: number;
  height: number;
  fontSize: number;
  maxLines: number;
}

// Largura, fonte e limite de linhas por nível. A altura final depende do tamanho do título.
const LEVELS = [
  { width: 300, fontSize: 18, maxLines: 3, minHeight: 72 },
  { width: 280, fontSize: 15, maxLines: 4, minHeight: 56 },
  { width: 280, fontSize: 14, maxLines: 5, minHeight: 50 },
  { width: 260, fontSize: 13, maxLines: 5, minHeight: 44 },
];
const BOX_PADDING_X = 24;
const BOX_PADDING_Y = 24;
const ICON_WIDTH = 24;
const AVG_CHAR_WIDTH = 0.56;
const LINE_HEIGHT = 1.375;

// Estima quantas linhas o título ocupa para o balão crescer em vez de cortar o texto cedo demais.
export function boxFor(depth: number, title: string, type: MindMapNodeType): Box {
  const level = LEVELS[Math.min(depth, LEVELS.length - 1)];
  const inner = level.width - BOX_PADDING_X - (type === "CALLOUT" ? ICON_WIDTH : 0);
  const textWidth = Math.max(title.length, 1) * level.fontSize * AVG_CHAR_WIDTH;
  const lines = Math.min(level.maxLines, Math.max(1, Math.ceil((textWidth / inner) * 1.1)));
  const height = Math.max(level.minHeight, Math.round(lines * level.fontSize * LINE_HEIGHT + BOX_PADDING_Y));
  return { width: level.width, height, fontSize: level.fontSize, maxLines: level.maxLines };
}

const BUBBLE_DIAMETER = [84, 54, 34, 24];
const BUBBLE_FONT = [16, 14, 13, 12];

function bubbleFor(depth: number): Box {
  const i = Math.min(depth, BUBBLE_DIAMETER.length - 1);
  return { width: BUBBLE_DIAMETER[i], height: BUBBLE_DIAMETER[i], fontSize: BUBBLE_FONT[i], maxLines: 2 };
}

export interface MapNodeData extends Record<string, unknown> {
  title: string;
  type: MindMapNodeType;
  depth: number;
  // Ramo (filho direto da raiz) a que o nó pertence, para escolher a cor. A raiz é -1.
  branch: number;
  flow: Flow;
  width: number;
  height: number;
  fontSize: number;
  maxLines: number;
  hasChildren: boolean;
  collapsed: boolean;
  hiddenCount: number;
  onToggle: (id: string) => void;
  // Estados da busca, preenchidos pelo MindMap sem recalcular o layout.
  match: boolean;
  current: boolean;
  dimmed: boolean;
}

export type MapFlowNode = Node<MapNodeData, "mapNode" | "bubbleNode">;

interface Item {
  node: MindMapNode;
  depth: number;
  branch: number;
  parentId?: string;
  box: Box;
  children: Item[];
}

interface Point {
  x: number;
  y: number;
}

function buildItems(
  node: MindMapNode,
  depth: number,
  collapsedIds: ReadonlySet<string>,
  bubbles: boolean,
  branch: number,
  parentId?: string,
): Item {
  const box = bubbles ? bubbleFor(depth) : boxFor(depth, node.title, node.type);
  const children = collapsedIds.has(node.id)
    ? []
    : node.children.map((child, i) =>
        // Cada filho direto da raiz abre um ramo com a sua cor; os descendentes herdam.
        buildItems(child, depth + 1, collapsedIds, bubbles, depth === 0 ? i % BRANCH_COLORS : branch, node.id),
      );
  return { node, depth, branch, parentId, box, children };
}

function flatten(item: Item): Item[] {
  return [item, ...item.children.flatMap(flatten)];
}

function dagreCenters(items: Item[], horizontal: boolean, spacing: Spacing): Map<string, Point> {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: horizontal ? "LR" : "TB", ...DAGRE_SPACING[spacing] });
  for (const item of items) {
    graph.setNode(item.node.id, { width: item.box.width, height: item.box.height });
    if (item.parentId) graph.setEdge(item.parentId, item.node.id);
  }
  dagre.layout(graph);
  return new Map(items.map((item) => [item.node.id, { x: graph.node(item.node.id).x, y: graph.node(item.node.id).y }]));
}

// Radial clássico: raiz no centro, um anel por nível, cada ramo com uma fatia proporcional às suas folhas.
function radialCenters(root: Item, items: Item[], spacing: Spacing): Map<string, Point> {
  const gap = RADIAL_GAP[spacing];
  const leaves = new Map<string, number>();
  const countLeaves = (item: Item): number => {
    const total = item.children.length === 0 ? 1 : item.children.reduce((sum, c) => sum + countLeaves(c), 0);
    // Peso suavizado: ramos com poucas folhas não ficam com fatias estreitas demais.
    leaves.set(item.node.id, Math.pow(total, 0.7));
    return total;
  };
  countLeaves(root);

  const byDepth: Item[][] = [];
  for (const item of items) (byDepth[item.depth] ??= []).push(item);

  const radii: number[] = [0];
  for (let d = 1; d < byDepth.length; d++) {
    const widthOf = (list: Item[]) => Math.max(...list.map((i) => i.box.width));
    const step = (widthOf(byDepth[d - 1]) + widthOf(byDepth[d])) / 2 + gap;
    const crowded = byDepth[d].reduce((sum, i) => sum + (i.box.width + i.box.height) / 2 + gap, 0) * 1.1;
    radii[d] = Math.max(radii[d - 1] + step, crowded / (2 * Math.PI));
  }

  const centers = new Map<string, Point>();
  const place = (item: Item, start: number, end: number) => {
    const angle = (start + end) / 2;
    const r = radii[item.depth];
    centers.set(item.node.id, { x: r * Math.cos(angle), y: r * Math.sin(angle) });
    let cursor = start;
    const childWeight = item.children.reduce((sum, c) => sum + (leaves.get(c.node.id) ?? 1), 0);
    for (const child of item.children) {
      const share = ((end - start) * (leaves.get(child.node.id) ?? 1)) / childWeight;
      place(child, cursor, cursor + share);
      cursor += share;
    }
  };
  place(root, -Math.PI / 2, (3 * Math.PI) / 2);
  centers.set(root.node.id, { x: 0, y: 0 });
  separateOverlaps(centers, items, gap / 2, root.node.id);
  return centers;
}

// Afasta caixas que ainda se sobrepõem, empurrando pelo eixo de menor penetração. A raiz fica fixa.
function separateOverlaps(centers: Map<string, Point>, items: Item[], margin: number, pinnedId: string) {
  for (let pass = 0; pass < 80; pass++) {
    let moved = false;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        const pa = centers.get(a.node.id);
        const pb = centers.get(b.node.id);
        if (!pa || !pb) continue;
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const overlapX = (a.box.width + b.box.width) / 2 + margin - Math.abs(dx);
        const overlapY = (a.box.height + b.box.height) / 2 + margin - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        moved = true;
        const shareA = a.node.id === pinnedId ? 0 : b.node.id === pinnedId ? 1 : 0.5;
        const shareB = 1 - shareA;
        if (overlapY < overlapX) {
          const dir = dy >= 0 ? 1 : -1;
          pa.y -= dir * overlapY * shareA;
          pb.y += dir * overlapY * shareB;
        } else {
          const dir = dx >= 0 ? 1 : -1;
          pa.x -= dir * overlapX * shareA;
          pb.x += dir * overlapX * shareB;
        }
      }
    }
    if (!moved) break;
  }
}

interface BubbleNodeDatum extends SimulationNodeDatum {
  id: string;
  depth: number;
  radius: number;
}

const LINK_DISTANCE = [170, 130, 100];

// Aranha ou bolhas: simulação de forças calculada de uma vez (sem animar), igual a cada render.
function bubbleCenters(root: Item, items: Item[], spacing: Spacing): Map<string, Point> {
  const scale = BUBBLE_SCALE[spacing];
  const nodes: BubbleNodeDatum[] = items.map((item) => ({
    id: item.node.id,
    depth: item.depth,
    // Folga extra no raio para o rótulo que fica embaixo da bolha.
    radius: (item.box.width / 2 + 46) * scale,
  }));
  const links: SimulationLinkDatum<BubbleNodeDatum>[] = items
    .filter((item) => item.parentId)
    .map((item) => ({ source: item.parentId as string, target: item.node.id }));

  const rootDatum = nodes.find((n) => n.id === root.node.id);
  if (rootDatum) {
    rootDatum.fx = 0;
    rootDatum.fy = 0;
  }

  const simulation = forceSimulation(nodes)
    .force(
      "link",
      forceLink<BubbleNodeDatum, SimulationLinkDatum<BubbleNodeDatum>>(links)
        .id((n) => n.id)
        .distance((l) => LINK_DISTANCE[Math.min((l.target as BubbleNodeDatum).depth - 1, LINK_DISTANCE.length - 1)] * scale)
        .strength(0.9),
    )
    .force("charge", forceManyBody<BubbleNodeDatum>().strength(-260 * scale))
    .force("collide", forceCollide<BubbleNodeDatum>((n) => n.radius).iterations(2))
    .force("x", forceX<BubbleNodeDatum>(0).strength(0.03))
    .force("y", forceY<BubbleNodeDatum>(0).strength(0.03))
    .stop();
  for (let i = 0; i < 400; i++) simulation.tick();

  return new Map(nodes.map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]));
}

// Radial e bolhas são calculados uma vez com a árvore inteira e guardados: recolher ou expandir um ramo
// só esconde ou mostra nós, sem mover os que já estavam na tela.
const centersCache = new WeakMap<MindMapNode, Map<string, Map<string, Point>>>();

function stableCenters(root: MindMapNode, mode: "radial" | "bubbles", spacing: Spacing): Map<string, Point> {
  const key = `${mode}:${spacing}`;
  const perRoot = centersCache.get(root) ?? new Map<string, Map<string, Point>>();
  centersCache.set(root, perRoot);
  const cached = perRoot.get(key);
  if (cached) return cached;

  const fullRoot = buildItems(root, 0, new Set(), mode === "bubbles", -1);
  const fullItems = flatten(fullRoot);
  const centers =
    mode === "radial" ? radialCenters(fullRoot, fullItems, spacing) : bubbleCenters(fullRoot, fullItems, spacing);
  perRoot.set(key, centers);
  return centers;
}

export function buildLayout(
  root: MindMapNode,
  collapsedIds: ReadonlySet<string>,
  onToggle: (id: string) => void,
  mode: LayoutMode,
  spacing: Spacing,
): { nodes: MapFlowNode[]; edges: Edge[] } {
  const bubbles = mode === "bubbles";
  const rootItem = buildItems(root, 0, collapsedIds, bubbles, -1);
  const items = flatten(rootItem);

  const centers =
    mode === "radial" || bubbles
      ? stableCenters(root, mode === "radial" ? "radial" : "bubbles", spacing)
      : dagreCenters(items, mode === "mindmap", spacing);

  const flow: Flow = mode === "mindmap" ? "right" : mode === "tree" ? "down" : "center";
  const sourcePosition = flow === "right" ? Position.Right : Position.Bottom;
  const targetPosition = flow === "right" ? Position.Left : Position.Top;
  const edgeType = flow === "center" ? "straight" : "default";

  const nodes: MapFlowNode[] = items.map((item) => {
    const center = centers.get(item.node.id) ?? { x: 0, y: 0 };
    return {
      id: item.node.id,
      type: bubbles ? "bubbleNode" : "mapNode",
      position: { x: center.x - item.box.width / 2, y: center.y - item.box.height / 2 },
      width: item.box.width,
      height: item.box.height,
      sourcePosition,
      targetPosition,
      data: {
        title: item.node.title,
        type: item.node.type,
        depth: item.depth,
        branch: item.branch,
        flow,
        width: item.box.width,
        height: item.box.height,
        fontSize: item.box.fontSize,
        maxLines: item.box.maxLines,
        hasChildren: item.node.children.length > 0,
        collapsed: collapsedIds.has(item.node.id),
        hiddenCount: collapsedIds.has(item.node.id) ? countDescendants(item.node) : 0,
        onToggle,
        match: false,
        current: false,
        dimmed: false,
      },
    };
  });

  const edges: Edge[] = items
    .filter((item) => item.parentId)
    .map((item) => ({
      id: `${item.parentId}-${item.node.id}`,
      source: item.parentId as string,
      target: item.node.id,
      type: edgeType,
      style: { stroke: `var(--branch-${item.branch})` },
    }));

  return { nodes, edges };
}
