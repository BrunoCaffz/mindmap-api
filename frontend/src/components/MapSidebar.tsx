import type { LayoutMode, Spacing } from "@/lib/layout";
import type { Theme } from "@/lib/theme";

interface OptionProps {
  label: string;
  active: boolean;
  onSelect: () => void;
}

function Option({ label, active, onSelect }: OptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
        active ? "bg-accent-soft text-ink" : "text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      <span
        className={`h-2 w-2 flex-none rounded-full border-[1.5px] ${
          active ? "border-accent bg-accent" : "border-faint"
        }`}
      />
      {label}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-faint">{title}</h3>
      <div className="flex flex-col gap-0.5">{children}</div>
    </section>
  );
}

interface MapSidebarProps {
  mode: LayoutMode;
  onModeChange: (mode: LayoutMode) => void;
  spacing: Spacing;
  onSpacingChange: (spacing: Spacing) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function MapSidebar({ mode, onModeChange, spacing, onSpacingChange, theme, onThemeChange }: MapSidebarProps) {
  return (
    <aside className="hidden w-[200px] flex-none flex-col gap-5 border-r border-line bg-surface p-3 md:flex">
      <Group title="Layout">
        <Option label="Mind Map" active={mode === "mindmap"} onSelect={() => onModeChange("mindmap")} />
        <Option label="Tree" active={mode === "tree"} onSelect={() => onModeChange("tree")} />
      </Group>

      <Group title="Espaçamento">
        <Option label="Compacto" active={spacing === "compact"} onSelect={() => onSpacingChange("compact")} />
        <Option label="Normal" active={spacing === "normal"} onSelect={() => onSpacingChange("normal")} />
        <Option label="Amplo" active={spacing === "wide"} onSelect={() => onSpacingChange("wide")} />
      </Group>

      <div className="mt-auto">
        <Group title="Tema">
          <div className="flex gap-0.5 rounded-lg border border-line bg-bg p-[3px]">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onThemeChange(t)}
                aria-pressed={theme === t}
                className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${
                  theme === t ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {t === "dark" ? "Escuro" : "Claro"}
              </button>
            ))}
          </div>
        </Group>
      </div>
    </aside>
  );
}
