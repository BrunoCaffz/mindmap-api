import type { CSSProperties } from "react";
import { Handle, Position, useStore, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import type { MapFlowNode } from "@/lib/layout";
import { SEMANTIC_ZOOM } from "@/lib/view";

// Bolhas por nível, como num grafo: o círculo mostra a hierarquia e o título fica embaixo.
// O nível escolhe a classe (ver .bubble-* em globals.css); a cor do ramo vem de --b e --bt.
const LEVEL_CLASSES = ["bubble-root", "bubble-1", "bubble-2", "bubble-3"];

const CENTER_HANDLE = { top: "50%", left: "50%" };

export function BubbleNode({ id, data, selected }: NodeProps<MapFlowNode>) {
  const detailed = useStore((s) => s.transform[2] >= SEMANTIC_ZOOM);
  const level = Math.min(data.depth, LEVEL_CLASSES.length - 1);
  const isCallout = data.type === "CALLOUT" && data.depth > 0;
  const branchColor = data.branch >= 0 ? `var(--branch-${data.branch})` : "var(--root)";
  const branchTint = data.branch >= 0 ? `var(--tint-${data.branch})` : "var(--root)";

  const highlight = data.current
    ? "outline outline-[3px] outline-offset-2 outline-focus"
    : data.match
      ? "outline outline-2 outline-offset-2 outline-focus/70"
      : selected
        ? "outline outline-[3px] outline-offset-2 outline-focus/50"
        : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: data.dimmed ? 0.3 : 1, scale: data.current ? 1.15 : 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{ width: data.width, height: data.height, "--b": branchColor, "--bt": branchTint } as CSSProperties}
      className="group relative cursor-pointer"
    >
      <Handle type="target" position={Position.Top} style={CENTER_HANDLE} className="!opacity-0" />
      <div
        className={`bubble h-full w-full rounded-full border-[3px] group-hover:scale-[1.12] group-active:scale-[0.94] ${
          isCallout ? "bubble-callout" : LEVEL_CLASSES[level]
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
        className={`absolute left-1/2 top-full mt-1.5 w-40 -translate-x-1/2 break-words rounded-sm bg-canvas/80 px-1 text-center leading-tight ${
          level <= 1 ? "font-bold text-ink" : "text-muted"
        }`}
      >
        {data.title || "(sem título)"}
      </p>
      {data.hasChildren && (
        <button
          type="button"
          aria-label={data.collapsed ? `Abrir o galho (${data.hiddenCount} itens)` : "Fechar o galho"}
          aria-expanded={!data.collapsed}
          title={
            data.collapsed
              ? `${data.hiddenCount} ${data.hiddenCount === 1 ? "tópico fechado" : "tópicos fechados"}. Clique no + pra abrir o galho`
              : undefined
          }
          onClick={(e) => {
            e.stopPropagation();
            data.onToggle(id);
          }}
          className="nodrag nopan absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full border border-line-hi bg-bg px-1 text-[10px] leading-none text-ink transition-[background-color,transform] duration-150 hover:scale-110 hover:bg-hover"
        >
          {data.collapsed ? (detailed ? `+${data.hiddenCount}` : "+") : "−"}
        </button>
      )}
      <Handle type="source" position={Position.Bottom} style={CENTER_HANDLE} className="!opacity-0" />
    </motion.div>
  );
}
