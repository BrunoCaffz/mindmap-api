import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { nodeSize, type MapFlowNode } from "@/lib/layout";
import { BulbIcon } from "./icons";

// Hierarquia visual por nível: raiz com o destaque cheio, nível 1 com tom do destaque,
// nível 2 como superfície, nível 3 em diante mais compacto e discreto.
const LEVEL_STYLES = [
  "border-transparent bg-accent text-accent-fg text-[17px] font-semibold tracking-tight shadow-pop hover:brightness-110",
  "border-accent-line bg-accent-soft text-ink text-sm font-medium hover:border-accent",
  "border-line bg-surface text-ink text-[13px] hover:border-line-hi",
  "border-dashed border-line bg-surface text-muted text-xs hover:border-line-hi",
];

const CLAMP = ["line-clamp-2", "line-clamp-2", "line-clamp-3", "line-clamp-2"];

export function MapNode({ id, data, selected }: NodeProps<MapFlowNode>) {
  const level = Math.min(data.depth, LEVEL_STYLES.length - 1);
  const { width, height } = nodeSize(data.depth);
  const isCallout = data.type === "CALLOUT";

  // O botão de recolher fica na borda por onde saem as conexões.
  const togglePosition = data.horizontal
    ? "-right-3 top-1/2 -translate-y-1/2"
    : "-bottom-3 left-1/2 -translate-x-1/2";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{ width, height }}
      className={`relative flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 transition-[border-color,box-shadow,filter] duration-150 ${LEVEL_STYLES[level]} ${
        isCallout && level > 0 ? "!border-warn-line !bg-warn-soft" : ""
      } ${selected ? "!border-accent outline outline-[3px] outline-offset-1 outline-accent/40" : ""}`}
    >
      <Handle type="target" position={data.horizontal ? Position.Left : Position.Top} className="!opacity-0" />
      {isCallout && <BulbIcon className="h-4 w-4 flex-none opacity-80" />}
      <p className={`${CLAMP[level]} break-words leading-snug`}>{data.title || "(sem título)"}</p>
      {data.hasChildren && (
        <button
          type="button"
          aria-label={data.collapsed ? "Expandir ramo" : "Recolher ramo"}
          aria-expanded={!data.collapsed}
          onClick={(e) => {
            e.stopPropagation();
            data.onToggle(id);
          }}
          className={`nodrag nopan absolute ${togglePosition} flex h-5 w-5 items-center justify-center rounded-full border border-line-hi bg-surface-2 text-xs leading-none text-muted transition-colors hover:text-ink`}
        >
          {data.collapsed ? "+" : "−"}
        </button>
      )}
      <Handle type="source" position={data.horizontal ? Position.Right : Position.Bottom} className="!opacity-0" />
    </motion.div>
  );
}
