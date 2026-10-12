import { useEffect, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { DETAIL_SHEET_HEIGHT } from "@/lib/view";
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
      <pre className="overflow-x-auto rounded-md border border-line bg-side p-3 font-mono text-xs text-ink">
        <code>{text}</code>
      </pre>
    );
  }
  if (block.kind === "quote") {
    return (
      <blockquote className="whitespace-pre-wrap rounded-sm border-l-[3px] border-line-hi bg-side px-3 py-2 text-muted">
        {text}
      </blockquote>
    );
  }
  return <p className="whitespace-pre-wrap">{text}</p>;
}

function kindLabel(node: MindMapNode, depth: number): string {
  if (depth === 0) return "Raiz do mapa";
  if (node.type === "CALLOUT") return "Destaque";
  return node.type === "HEADING" ? "Título" : "Item";
}

function insideLabel(count: number): string {
  if (count === 0) return "Nada, é uma ponta do mapa";
  return count === 1 ? "1 tópico" : `${count} tópicos`;
}

interface DetailPanelProps {
  node: MindMapNode;
  depth: number;
  // Título da raiz e do galho (filho direto da raiz) a que o nó pertence. O galho é vazio na raiz.
  rootTitle: string;
  branchTitle: string;
  // Índice da cor do ramo (--branch-N), ou -1 na raiz.
  branch: number;
  descendants: number;
  // No celular o painel vira uma folha por baixo do mapa.
  sheet: boolean;
  onClose: () => void;
}

export function DetailPanel({
  node,
  depth,
  rootTitle,
  branchTitle,
  branch,
  descendants,
  sheet,
  onClose,
}: DetailPanelProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const blocks = parseDescription(node.description).filter((block) => block.lines.join("").trim() !== "");
  const color = branch >= 0 ? `var(--branch-${branch})` : "var(--root)";
  const tint = branch >= 0 ? `var(--tint-${branch})` : "var(--root)";
  const title = node.title || "(sem título)";
  const crumb = depth === 0 ? rootTitle : `${rootTitle} / ${branchTitle}`;

  return (
    <motion.aside
      aria-label="Detalhes do tópico"
      initial={sheet ? { y: 40, opacity: 0 } : { x: 16, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      exit={sheet ? { y: 40, opacity: 0 } : { x: 16, opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
      style={sheet ? ({ height: DETAIL_SHEET_HEIGHT } as CSSProperties) : undefined}
      className={`absolute z-10 flex flex-col gap-3.5 overflow-y-auto bg-bg px-5 pb-6 pt-3 ${
        sheet
          ? "inset-x-0 bottom-0 rounded-t-xl border-t border-line shadow-[var(--sh-sheet)]"
          : "right-0 top-0 h-full w-[340px] max-w-full border-l border-line"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs text-muted">{crumb}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-sm text-muted transition-colors hover:bg-hover hover:text-ink"
        >
          <CloseIcon width={14} height={14} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="box-border h-7 w-7 flex-none rounded-full border-[3px]"
          style={{ background: tint, borderColor: branch >= 0 ? color : "transparent" }}
        />
        <h2 className="break-words text-[22px] font-bold leading-tight tracking-[-0.01em] sm:text-[26px]">{title}</h2>
      </div>

      <dl className="grid grid-cols-[110px_1fr] gap-y-1.5 text-[13px]">
        <dt className="text-muted">Tipo</dt>
        <dd>{kindLabel(node, depth)}</dd>
        {depth > 0 && (
          <>
            <dt className="text-muted">Galho</dt>
            <dd className="min-w-0">
              <span
                className="inline-flex max-w-full items-center gap-1.5 rounded-[4px] px-1.5 py-px"
                style={{ background: tint }}
              >
                <span aria-hidden="true" className="h-2 w-2 flex-none rounded-full" style={{ background: color }} />
                <span className="truncate">{branchTitle || title}</span>
              </span>
            </dd>
          </>
        )}
        <dt className="text-muted">Dentro dele</dt>
        <dd>{insideLabel(descendants)}</dd>
      </dl>

      <div className="h-px flex-none bg-line" />

      <div className="flex flex-col gap-3 text-sm">
        {blocks.length === 0 ? (
          <p className="text-muted">Esse tópico não tem texto, só o título.</p>
        ) : (
          blocks.map((block, i) => <BlockView key={i} block={block} />)
        )}
      </div>
    </motion.aside>
  );
}
