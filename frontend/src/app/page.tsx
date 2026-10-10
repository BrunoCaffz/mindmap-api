"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { DemoBanner } from "@/components/DemoBanner";
import { EmptyMapState } from "@/components/EmptyMapState";
import { LoadingMap } from "@/components/LoadingMap";
import { MapSidebar } from "@/components/MapSidebar";
import { MindMap } from "@/components/MindMap";
import exampleMap from "@/data/example.json";
import { fetchMindMap, normalizePageId } from "@/lib/api";
import { DEMO_MODE } from "@/lib/demo";
import type { LayoutMode, Spacing } from "@/lib/layout";
import { useTheme } from "@/lib/theme";
import type { MindMapNode } from "@/types/mindmap";

export default function Home() {
  const [pageId, setPageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Na demonstração o mapa de exemplo já nasce carregado, sem chamar o backend.
  const [tree, setTree] = useState<MindMapNode | null>(DEMO_MODE ? (exampleMap as MindMapNode) : null);

  const [mode, setMode] = useState<LayoutMode>("mindmap");
  const [spacing, setSpacing] = useState<Spacing>("normal");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useTheme();

  function handleShowExample() {
    setError(null);
    setTree(exampleMap as MindMapNode);
  }

  async function handleSubmit() {
    if (!pageId.trim()) return;
    const id = normalizePageId(pageId);
    if (!id) {
      setError("O ID precisa ter 32 caracteres (letras de a a f e números), como aparece no fim do link da página.");
      return;
    }
    setLoading(true);
    setError(null);
    setTree(null);
    try {
      setTree(await fetchMindMap(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <AppHeader
        pageId={pageId}
        onPageIdChange={setPageId}
        onSubmit={handleSubmit}
        loading={loading}
        hideInput={DEMO_MODE}
        mapTitle={tree?.title}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
      />
      {DEMO_MODE && <DemoBanner />}
      {error && (
        <p
          role="alert"
          className="border-b border-danger-line bg-danger-soft px-4 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <div className="flex min-h-0 flex-1">
        {sidebarOpen && (
          <MapSidebar
            mode={mode}
            onModeChange={setMode}
            spacing={spacing}
            onSpacingChange={setSpacing}
            theme={theme}
            onThemeChange={setTheme}
          />
        )}
        <main className="min-w-0 flex-1 bg-bg">
          <motion.div
            key={loading ? "loading" : tree ? "map" : "empty"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {loading ? (
              <LoadingMap />
            ) : tree ? (
              <MindMap tree={tree} mode={mode} spacing={spacing} theme={theme} />
            ) : (
              <EmptyMapState onShowExample={handleShowExample} />
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
