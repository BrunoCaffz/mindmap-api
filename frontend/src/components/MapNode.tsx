import type { CSSProperties } from "react";
import { Handle, Position, useStore, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import type { MapFlowNode } from "@/lib/layout";
import { SEMANTIC_ZOOM } from "@/lib/view";
import type { MindMapNodeType } from "@/types/mindmap";
import { BulbIcon } from "./icons";

// A cor do ramo nunca é a única pista do tipo: a forma (raio da borda) e o peso da fonte também mudam,
// e o marcador (bolinha ou lâmpada) aparece quando o zoom permite.
const SHAPES: Record<MindMapNodeType, string> = {
  ROOT: "rounded-2xl",
  HEADING: "rounded-xl",
  LIST_ITEM: "rounded-md",
  CALLOUT: "rounded-xl border-2",
};

// Tom por nível: raiz com o destaque cheio, nível 1 e 2 com a cor do ramo, nível 3 em diante discreto.
const TONES = [
  "border-transparent bg-accent text-accent-fg shadow-pop hover:brightness-110",
  "tone-1 text-ink",
  "tone-2 text-ink",
  "tone-3 text-muted",
];

function fontWeight(type: MindMapNodeType, level: number): string {
  if (type === "ROOT") return "font-semibold tracking-tight";
  if (type === "HEADING") return level <= 1 ? "font-semibold" : "font-medium";
  if (type === "CALLOUT") return "font-medium";
  return "font-normal";
}

const CENTER_HANDLE = { top: "50%", left: "50%" };

export function MapNode({ id, data, selected }: NodeProps<MapFlowNode>) {
  const detailed = useStore((s) => s.transform[2] >= SEMANTIC_ZOOM);
  const level = Math.min(data.depth, TONES.length - 1);
  const isCallout = data.type === "CALLOUT";
  const flow = data.flow;
  const handleStyle = flow === "center" ? CENTER_HANDLE : undefined;
  const branchColor = data.branch >= 0 ? `var(--branch-${data.branch})` : "var(--accent)";

  // O botão de recolher fica na borda por onde saem as conexões.
  const togglePosition =
    flow === "right" ? "-right-3 top-1/2 -translate-y-1/2" : "-bottom-3 left-1/2 -translate-x-1/2";

  const highlight = data.current
    ? "outline outline-[3px] outline-offset-2 outline-accent"
    : data.match
      ? "outline outline-2 outline-offset-1 outline-accent/70"
      : selected
        ? "!border-accent outline outline-[3px] outline-offset-1 outline-accent/40"
        : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: data.dimmed ? 0.3 : 1, scale: data.current ? 1.04 : 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{ width: data.width, height: data.height, "--b": branchColor } as CSSProperties}
      className={`relative flex cursor-pointer items-center gap-2 border px-3 transition-[border-color,box-shadow,filter] duration-150 ${SHAPES[data.type]} ${TONES[level]} ${fontWeight(data.type, level)} ${
        isCallout && level > 0 ? "!border-warn-line !bg-warn-tint" : ""
      } ${highlight}`}
    >
      <Handle
        type="target"
        position={flow === "right" ? Position.Left : Position.Top}
        style={handleStyle}
        className="!opacity-0"
      />
      {detailed && isCallout && <BulbIcon className="h-4 w-4 flex-none opacity-80" />}
      {detailed && data.type === "LIST_ITEM" && (
        <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: "var(--b)" }} />
      )}
      <p
        style={{
          fontSize: data.fontSize,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: data.maxLines,
          overflow: "hidden",
        }}
        className="break-words leading-snug"
      >
        {data.title || "(sem título)"}
      </p>
      {data.hasChildren && (
        <button
          type="button"
          aria-label={data.collapsed ? `Expandir ramo (${data.hiddenCount} itens)` : "Recolher ramo"}
          aria-expanded={!data.collapsed}
          title={data.collapsed ? `${data.hiddenCount} itens recolhidos` : undefined}
          onClick={(e) => {
            e.stopPropagation();
            data.onToggle(id);
          }}
          className={`nodrag nopan absolute ${togglePosition} flex h-5 min-w-5 items-center justify-center rounded-full border border-line-hi bg-surface-2 px-1 text-[11px] font-medium leading-none text-muted transition-colors hover:text-ink`}
        >
          {data.collapsed ? (detailed ? `+${data.hiddenCount}` : "+") : "−"}
        </button>
      )}
      <Handle
        type="source"
        position={flow === "right" ? Position.Right : Position.Bottom}
        style={handleStyle}
        className="!opacity-0"
      />
    </motion.div>
  );
}
