import { useEffect, type ReactNode } from "react";
import type { LayoutMode, Spacing } from "@/lib/layout";
import type { Theme } from "@/lib/theme";
import { ExportButtons } from "./ExportButtons";
import {
  BrandIcon,
  BubbleLayoutIcon,
  MindLayoutIcon,
  MoonIcon,
  PlusIcon,
  RadialLayoutIcon,
  TreeLayoutIcon,
} from "./icons";

const ROW =
  "flex h-9 w-full items-center gap-2.5 rounded-sm px-2 text-left transition-[background-color,transform] duration-100 hover:bg-hover active:scale-[0.98]";

const LAYOUTS: { id: LayoutMode; label: string; icon: ReactNode }[] = [
  { id: "mindmap", label: "Mapa mental", icon: <MindLayoutIcon /> },
  { id: "tree", label: "Árvore", icon: <TreeLayoutIcon /> },
  { id: "radial", label: "Radial", icon: <RadialLayoutIcon /> },
  { id: "bubbles", label: "Bolhas", icon: <BubbleLayoutIcon /> },
];

const SPACINGS: { id: Spacing; label: string }[] = [
  { id: "compact", label: "Junto" },
  { id: "normal", label: "Normal" },
  { id: "wide", label: "Folgado" },
];

function SectionTitle({ children, id }: { children: string; id?: string }) {
  return (
    <div id={id} className="mx-2 mb-1 mt-[18px] text-xs font-semibold text-muted">
      {children}
    </div>
  );
}

interface MapSidebarProps {
  mode: LayoutMode;
  onModeChange: (mode: LayoutMode) => void;
  spacing: Spacing;
  onSpacingChange: (spacing: Spacing) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  // Título do mapa (vira o nome do arquivo exportado) e se já existe um mapa para exportar.
  mapTitle?: string;
  canExport: boolean;
  // Volta para a tela de começo. Fica de fora na demonstração, que não tem o que digitar.
  onNewMap?: () => void;
  onToast: (message: string) => void;
  // No celular a barra é uma gaveta: aberta pelo menu do cabeçalho e fechada por aqui.
  drawerOpen: boolean;
  onCloseDrawer: () => void;
}

export function MapSidebar({
  mode,
  onModeChange,
  spacing,
  onSpacingChange,
  theme,
  onThemeChange,
  mapTitle,
  canExport,
  onNewMap,
  onToast,
  drawerOpen,
  onCloseDrawer,
}: MapSidebarProps) {
  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, onCloseDrawer]);

  const dark = theme === "dark";

  return (
    <>
      {drawerOpen && (
        <button
          type="button"
          aria-label="Fechar o menu"
          onClick={onCloseDrawer}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}
      <nav
        aria-label="Opções do mapa"
        className={`${
          drawerOpen ? "drawer-in fixed inset-y-0 left-0 z-40 flex w-[280px] shadow-pop" : "hidden"
        } flex-none flex-col gap-0.5 border-r border-line bg-side px-2 pb-3 pt-2 md:static md:z-auto md:flex md:w-[240px] md:shadow-none`}
      >
        <div className="flex h-10 items-center gap-2 px-2 font-semibold">
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-ink text-bg">
            <BrandIcon width={14} height={14} />
          </span>
          Notion Mindmap
        </div>
        {onNewMap && (
          <button
            type="button"
            onClick={() => {
              onNewMap();
              onCloseDrawer();
            }}
            className={`${ROW} text-muted hover:text-ink`}
          >
            <PlusIcon />
            Novo mapa
          </button>
        )}

        <SectionTitle>Formato</SectionTitle>
        {LAYOUTS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id}
            onClick={() => onModeChange(id)}
            className={`${ROW} ${mode === id ? "bg-active font-semibold" : ""}`}
          >
            {icon}
            {label}
          </button>
        ))}

        <SectionTitle id="spacing-label">Respiro entre os galhos</SectionTitle>
        <div
          role="group"
          aria-labelledby="spacing-label"
          className="mx-2 grid grid-cols-3 gap-0.5 rounded-md bg-hover p-0.5"
        >
          {SPACINGS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={spacing === id}
              onClick={() => onSpacingChange(id)}
              className={`h-8 rounded-sm text-[13px] transition-[background-color,box-shadow,transform] duration-100 active:scale-[0.97] ${
                spacing === id ? "bg-bg shadow-float" : "hover:bg-active"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-10 flex-1" />

        <div className="mx-2 mb-1 text-xs font-semibold text-muted">Levar pra fora</div>
        <ExportButtons title={mapTitle} disabled={!canExport} onDone={onToast} />

        <button
          type="button"
          role="switch"
          aria-checked={dark}
          onClick={() => onThemeChange(dark ? "light" : "dark")}
          className={`${ROW} mt-1.5 h-10`}
        >
          <MoonIcon />
          <span className="flex-1">Modo escuro</span>
          <span
            aria-hidden="true"
            className={`relative inline-block h-[18px] w-[30px] rounded-full transition-colors duration-200 ${
              dark ? "bg-primary" : "bg-switch-off"
            }`}
          >
            <span
              className="absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-[cubic-bezier(0.3,1.3,0.5,1)]"
              style={{ transform: dark ? "translateX(12px)" : "translateX(0)" }}
            />
          </span>
        </button>
      </nav>
    </>
  );
}
