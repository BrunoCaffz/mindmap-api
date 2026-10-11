import { useExportImage, type ExportFormat } from "@/hooks/useExportImage";

const BUTTON =
  "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-line px-2 text-xs font-medium text-muted transition-[background-color,color,transform] hover:bg-surface-2 hover:text-ink active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent";

const LABELS: Record<ExportFormat, string> = { png: "PNG", svg: "SVG" };

interface ExportButtonsProps {
  title: string | undefined;
  disabled: boolean;
}

export function ExportButtons({ title, disabled }: ExportButtonsProps) {
  const { exporting, error, exportImage } = useExportImage(title);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {(["png", "svg"] as const).map((format) => (
          <button
            key={format}
            type="button"
            disabled={disabled || exporting !== null}
            aria-busy={exporting === format}
            onClick={() => exportImage(format)}
            className={BUTTON}
          >
            {exporting === format ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-line-hi border-t-accent" />
                Gerando...
              </>
            ) : (
              `Baixar ${LABELS[format]}`
            )}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
