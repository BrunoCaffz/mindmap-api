import { useEffect } from "react";
import type { MindMapNode } from "@/types/mindmap";

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
      <pre className="overflow-x-auto rounded bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-800">
        <code>{text}</code>
      </pre>
    );
  }
  if (block.kind === "quote") {
    return (
      <blockquote className="whitespace-pre-wrap rounded bg-zinc-50 px-3 py-2 italic text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        {text}
      </blockquote>
    );
  }
  return <p className="whitespace-pre-wrap">{text}</p>;
}

interface DetailPanelProps {
  node: MindMapNode;
  onClose: () => void;
}

export function DetailPanel({ node, onClose }: DetailPanelProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const blocks = parseDescription(node.description);

  return (
    <aside className="absolute right-0 top-0 z-10 flex h-full w-96 max-w-full flex-col border-l border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex items-start justify-between gap-2 border-b border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="break-words text-base font-semibold">{node.title || "(sem título)"}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel"
          className="rounded px-2 text-lg leading-none text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          ×
        </button>
      </header>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 text-sm">
        {blocks.length === 0 ? (
          <p className="text-zinc-500">Sem descrição.</p>
        ) : (
          blocks.map((block, i) => <BlockView key={i} block={block} />)
        )}
      </div>
    </aside>
  );
}
