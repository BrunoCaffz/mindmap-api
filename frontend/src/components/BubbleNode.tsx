import type { CSSProperties } from "react";
import { Handle, Position, useStore, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import type { MapFlowNode } from "@/lib/layout";
import { SEMANTIC_ZOOM } from "@/lib/view";

// Bolhas por nível, como num grafo: o círculo mostra a hierarquia e o título fica embaixo.
// A cor do ramo vem da variável --b; a raiz usa o destaque.
const BUBBLE_STYLES = [
  "border-transparent bg-accent shadow-pop",
  "border-[color:var(--b)] bg-[color-mix(in_srgb,var(--b)_28%,var(--surface))]",
  "border-[color:color-mix(in_srgb,var(--b)_55%,transparent)] bg-surface",
  "border-transparent bg-[color-mix(in_srgb,var(--b)_45%,var(--surface))]",
];

const CENTER_HANDLE = { top: "50%", left: "50%" };

export function BubbleNode({ id, data, selected }: NodeProps<MapFlowNode>) {
  const detailed = useStore((s) => s.transform[2] >= SEMANTIC_ZOOM);
  const level = Math.min(data.depth, BUBBLE_STYLES.length - 1);
  const isCallout = data.type === "CALLOUT";
  const branchColor = data.branch >= 0 ? `var(--branch-${data.branch})` : "var(--accent)";

  const highlight = data.current
    ? "outline outline-[3px] outline-offset-2 outline-accent"
    : data.match
      ? "outline outline-2 outline-offset-2 outline-accent/70"
      : selected
        ? "outline outline-[3px] outline-offset-2 outline-accent/50"
        : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: data.dimmed ? 0.3 : 1, scale: data.current ? 1.15 : 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{ width: data.width, height: data.height, "--b": branchColor } as CSSProperties}
      className="group relative cursor-pointer"
    >
      <Handle type="target" position={Position.Top} style={CENTER_HANDLE} className="!opacity-0" />
      <div
        className={`h-full w-full rounded-full border-2 transition-transform duration-150 group-hover:scale-110 ${BUBBLE_STYLES[level]} ${
          isCallout ? "!border-warn-line !bg-warn-tint" : ""
        } ${highlight}`}
      />
      <p
        style={{
          fontSize: data.fontSize,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: data.maxLines,
          overflow: "hidden",
        }}
        className={`absolute left-1/2 top-full mt-1.5 w-40 -translate-x-1/2 break-words rounded bg-bg/80 px-1 text-center leading-tight ${
          level === 0 ? "font-semibold text-ink" : level === 1 ? "font-medium text-ink" : "text-muted"
        }`}
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
          className="nodrag nopan absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full border border-line-hi bg-surface-2 px-1 text-[10px] leading-none text-muted transition-colors hover:text-ink"
        >
          {data.collapsed ? (detailed ? `+${data.hiddenCount}` : "+") : "−"}
        </button>
      )}
      <Handle type="source" position={Position.Bottom} style={CENTER_HANDLE} className="!opacity-0" />
    </motion.div>
  );
}
