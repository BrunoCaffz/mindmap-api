import { useExportImage, type ExportFormat } from "@/hooks/useExportImage";
import { CodeIcon, DownloadIcon } from "./icons";

const ROW =
  "flex h-9 w-full items-center gap-2.5 whitespace-nowrap rounded-sm px-2 text-left text-[13px] transition-[background-color,transform] duration-100 hover:bg-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent disabled:active:scale-100";

const LABELS: Record<ExportFormat, string> = {
  png: "Baixar como imagem (PNG)",
  svg: "Baixar editável (SVG)",
};

const DONE: Record<ExportFormat, string> = {
  png: "PNG baixado. Confere na sua pasta de downloads.",
  svg: "SVG baixado. Confere na sua pasta de downloads.",
};

interface ExportButtonsProps {
  title: string | undefined;
  disabled: boolean;
  onDone: (message: string) => void;
}

export function ExportButtons({ title, disabled, onDone }: ExportButtonsProps) {
  const { exporting, error, exportImage } = useExportImage(title);
  const hint = disabled ? "Desenhe um mapa primeiro, aí ele aparece aqui pra baixar" : undefined;

  return (
    <div className="flex flex-col">
      {(["png", "svg"] as const).map((format) => (
        <button
          key={format}
          type="button"
          disabled={disabled || exporting !== null}
          aria-busy={exporting === format}
          title={hint}
          onClick={async () => {
            if (await exportImage(format)) onDone(DONE[format]);
          }}
          className={ROW}
        >
          {format === "png" ? <DownloadIcon /> : <CodeIcon />}
          {exporting === format ? "Gerando a imagem..." : LABELS[format]}
        </button>
      ))}
      {error && (
        <p role="alert" className="px-2 pt-1 text-xs text-ink">
          {error}
        </p>
      )}
    </div>
  );
}
