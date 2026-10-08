import { useEffect } from "react";
import { motion } from "framer-motion";
import type { MindMapNode } from "@/types/mindmap";
import { CloseIcon } from "./icons";

type Block =
  | { kind: "text"; lines: string[] }
  | { kind: "quote"; lines: string[] }
  | { kind: "code"; lines: string[] };

// Interpreta o markdown simples da description: cercas ``` e linhas com ">".
function parseDescription(description: string): Block[] {
  const blocks: Block[] = [];
  let inCode = false;

  for (const line of description.split("\n")) {
    if (line.trim().startsWith("```")) {
      if (!inCode) blocks.push({ kind: "code", lines: [] });
      inCode = !inCode;
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (inCode && last?.kind === "code") {
      last.lines.push(line);
    } else if (line.startsWith(">")) {
      const text = line.replace(/^>\s?/, "");
      if (last?.kind === "quote") last.lines.push(text);
      else blocks.push({ kind: "quote", lines: [text] });
    } else if (last?.kind === "text") {
      last.lines.push(line);
    } else {
      blocks.push({ kind: "text", lines: [line] });
    }
  }
  return blocks;
}

function BlockView({ block }: { block: Block }) {
  const text = block.lines.join("\n");
  if (block.kind === "code") {
    return (
      <pre className="overflow-x-auto rounded-lg border border-line bg-bg p-3 font-mono text-xs text-ink">
        <code>{text}</code>
      </pre>
    );
  }
  if (block.kind === "quote") {
    return (
      <blockquote className="whitespace-pre-wrap rounded-lg bg-surface-2 px-3 py-2 italic text-muted">
        {text}
      </blockquote>
    );
  }
  return <p className="whitespace-pre-wrap text-muted">{text}</p>;
}

function nodeLabel(node: MindMapNode, depth: number): string {
  if (depth === 0) return "Raiz";
  if (node.type === "CALLOUT") return `Nível ${depth} · Destaque`;
  return `Nível ${depth} · ${node.type === "HEADING" ? "Título" : "Item"}`;
}

interface DetailPanelProps {
  node: MindMapNode;
  depth: number;
  onClose: () => void;
}

export function DetailPanel({ node, depth, onClose }: DetailPanelProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const blocks = parseDescription(node.description);

  return (
    <motion.aside
      initial={{ x: 24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 24, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute right-0 top-0 z-10 flex h-full w-80 max-w-full flex-col border-l border-line bg-surface shadow-pop"
    >
      <header className="flex items-start justify-between gap-2 border-b border-line p-4">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="self-start rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
            {nodeLabel(node, depth)}
          </span>
          <h2 className="break-words text-[15px] font-semibold leading-snug">{node.title || "(sem título)"}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel"
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </header>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 text-sm">
        {blocks.length === 0 ? (
          <p className="text-faint">Sem descrição.</p>
        ) : (
          blocks.map((block, i) => <BlockView key={i} block={block} />)
        )}
      </div>
    </motion.aside>
  );
}
