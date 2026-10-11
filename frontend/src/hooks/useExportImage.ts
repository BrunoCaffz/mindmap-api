"use client";

import { useCallback, useState } from "react";
import { getNodesBounds, getViewportForBounds, useReactFlow } from "@xyflow/react";
import { toBlob, toSvg } from "html-to-image";
import { marginFor, pixelRatioFor } from "@/lib/exportSize";
import { withSvgBackground } from "@/lib/exportSvg";
import { slugifyFilename } from "@/lib/filename";

export type ExportFormat = "png" | "svg";

const EXPORT_ERROR = "Não consegui gerar a imagem. Tente de novo.";
const REVOKE_DELAY_MS = 4000;

// Elementos de interface que não entram na imagem: minimapa, controles, painéis (busca e barra de
// níveis) e a marca do React Flow. Os botões "−" dos ramos abertos também saem; o "+N" dos
// recolhidos fica, porque mostra o que está escondido.
const UI_CLASSES = ["react-flow__minimap", "react-flow__controls", "react-flow__panel", "react-flow__attribution"];

function keepInImage(node: HTMLElement): boolean {
  if (!(node instanceof Element)) return true;
  if (UI_CLASSES.some((name) => node.classList.contains(name))) return false;
  return !(node.tagName === "BUTTON" && node.getAttribute("aria-expanded") === "true");
}

// Deixa o navegador pintar o estado "Gerando..." antes de começar o trabalho pesado.
function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

// toSvg devolve uma data URL; o texto do SVG está depois da primeira vírgula, codificado.
function svgBlobFromDataUrl(dataUrl: string, background: string): Blob {
  const svg = decodeURIComponent(dataUrl.slice(dataUrl.indexOf(",") + 1));
  return new Blob([withSvgBackground(svg, background)], { type: "image/svg+xml;charset=utf-8" });
}

export function useExportImage(title: string | undefined) {
  const { getNodes } = useReactFlow();
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportImage = useCallback(
    async (format: ExportFormat) => {
      if (exporting) return;
      setExporting(format);
      setError(null);
      try {
        await nextPaint();
        const nodes = getNodes();
        const element = document.querySelector<HTMLElement>(".react-flow__viewport");
        if (!element || nodes.length === 0) throw new Error("nothing to export");

        // O mapa inteiro, não só a parte visível: o viewport da imagem é calculado a partir dos limites
        // de todos os nós, mais uma margem para o que sai deles (rótulos), e aplicado só na cópia que o
        // html-to-image captura.
        const bounds = getNodesBounds(nodes);
        const marginX = marginFor(bounds.width);
        const marginY = marginFor(bounds.height);
        const width = Math.ceil(bounds.width + marginX * 2);
        const height = Math.ceil(bounds.height + marginY * 2);
        const viewport = getViewportForBounds(bounds, width, height, 0.1, 1, {
          x: `${marginX}px`,
          y: `${marginY}px`,
        });

        const background = getComputedStyle(document.body).backgroundColor;
        const options = {
          backgroundColor: background,
          width,
          height,
          filter: keepInImage,
          style: {
            width: `${width}px`,
            height: `${height}px`,
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          },
        };
        const filename = `${slugifyFilename(title)}.${format}`;

        if (format === "png") {
          const blob = await toBlob(element, { ...options, pixelRatio: pixelRatioFor(width, height) });
          if (!blob) throw new Error("empty image");
          download(blob, filename);
        } else {
          download(svgBlobFromDataUrl(await toSvg(element, options), background), filename);
        }
      } catch {
        // Sem log: o título e o conteúdo do mapa são dados do usuário.
        setError(EXPORT_ERROR);
      } finally {
        setExporting(null);
      }
    },
    [exporting, getNodes, title],
  );

  return { exporting, error, exportImage };
}
