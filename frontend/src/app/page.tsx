"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { EmptyMapState } from "@/components/EmptyMapState";
import { LoadingMap } from "@/components/LoadingMap";
import { MapSidebar } from "@/components/MapSidebar";
import { MindMap } from "@/components/MindMap";
import { fetchMindMap } from "@/lib/api";
import type { LayoutMode, Spacing } from "@/lib/layout";
import { useTheme } from "@/lib/theme";
import type { MindMapNode } from "@/types/mindmap";

export default function Home() {
  const [pageId, setPageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tree, setTree] = useState<MindMapNode | null>(null);

  const [mode, setMode] = useState<LayoutMode>("mindmap");
  const [spacing, setSpacing] = useState<Spacing>("normal");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useTheme();

  async function handleSubmit() {
    const id = pageId.trim();
    if (!id) return;
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
        mapTitle={tree?.title}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
      />
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
              <EmptyMapState />
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
