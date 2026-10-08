import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { MapFlowNode } from "@/lib/layout";
import { NODE_HEIGHT, NODE_WIDTH } from "@/lib/layout";
import type { MindMapNodeType } from "@/types/mindmap";

const TYPE_STYLES: Record<MindMapNodeType, string> = {
  ROOT: "border-zinc-900 bg-zinc-900 text-white font-semibold dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900",
  HEADING: "border-indigo-300 bg-indigo-50 text-indigo-950 font-medium dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-100",
  LIST_ITEM: "border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
  CALLOUT: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100",
};

export function MapNode({ id, data, selected }: NodeProps<MapFlowNode>) {
  return (
    <div
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
      className={`relative flex cursor-pointer items-center rounded-lg border px-3 text-sm shadow-sm ${TYPE_STYLES[data.type]} ${
        selected ? "ring-2 ring-sky-500" : ""
      }`}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <p className="line-clamp-3 break-words">{data.title || "(sem título)"}</p>
      {data.hasChildren && (
        <button
          type="button"
          aria-label={data.collapsed ? "Expandir ramo" : "Recolher ramo"}
          aria-expanded={!data.collapsed}
          onClick={(e) => {
            e.stopPropagation();
            data.onToggle(id);
          }}
          className="nodrag nopan absolute -right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-300 bg-white text-xs text-zinc-700 shadow hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          {data.collapsed ? "+" : "−"}
        </button>
      )}
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </div>
  );
}
