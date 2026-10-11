"use client";

import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { motion } from "framer-motion";
import { AppHeader, LoginButton } from "@/components/AppHeader";
import { DemoBanner } from "@/components/DemoBanner";
import { EmptyMapState } from "@/components/EmptyMapState";
import { LoadingMap } from "@/components/LoadingMap";
import { MapSidebar } from "@/components/MapSidebar";
import { MindMap } from "@/components/MindMap";
import exampleMap from "@/data/example.json";
import { fetchMindMap, normalizePageId, SessionExpiredError } from "@/lib/api";
import { DEV_FALLBACK, SESSION_EXPIRED_MESSAGE } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/demo";
import type { LayoutMode, Spacing } from "@/lib/layout";
import { useSession } from "@/hooks/useSession";
import { useTheme } from "@/lib/theme";
import type { MindMapNode } from "@/types/mindmap";

export default function Home() {
  const [pageId, setPageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const session = useSession();
  const canGenerate = !DEMO_MODE && (session.user !== null || DEV_FALLBACK);
  // Na demonstração o mapa de exemplo já nasce carregado, sem chamar o backend.
  const [tree, setTree] = useState<MindMapNode | null>(DEMO_MODE ? (exampleMap as MindMapNode) : null);
  // Muda a cada mapa novo: o provider do React Flow recomeça limpo (sem viewport nem nós do mapa anterior).
  const [mapSeq, setMapSeq] = useState(0);

  const [mode, setMode] = useState<LayoutMode>("mindmap");
  const [spacing, setSpacing] = useState<Spacing>("normal");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useTheme();

  function handleShowExample() {
    setError(null);
    setMapSeq((n) => n + 1);
    setTree(exampleMap as MindMapNode);
  }

  async function handleLogout() {
    const ok = await session.logout();
    if (!ok) {
      setError("Não consegui sair agora. Tente de novo.");
      return;
    }
    // Some o mapa da pessoa que saiu.
    setError(null);
    setSessionExpired(false);
    setTree(null);
    setPageId("");
    setMapSeq((n) => n + 1);
  }

  async function handleSubmit() {
    if (!canGenerate || !pageId.trim()) return;
    const id = normalizePageId(pageId);
    if (!id) {
      setError("O ID precisa ter 32 caracteres (letras de a a f e números), como aparece no fim do link da página.");
      return;
    }
    setLoading(true);
    setError(null);
    setSessionExpired(false);
    setTree(null);
    try {
      const loaded = await fetchMindMap(id);
      setMapSeq((n) => n + 1);
      setTree(loaded);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        session.markLoggedOut();
        setSessionExpired(true);
        return;
      }
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
        canGenerate={canGenerate}
        sessionLoading={session.loading}
        user={session.user}
        onLogout={handleLogout}
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
      {sessionExpired && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 border-b border-danger-line bg-danger-soft px-4 py-2 text-sm text-danger"
        >
          <p>{SESSION_EXPIRED_MESSAGE}</p>
          <LoginButton />
        </div>
      )}
      <ReactFlowProvider key={mapSeq}>
        <div className="flex min-h-0 flex-1">
          {sidebarOpen && (
            <MapSidebar
              mode={mode}
              onModeChange={setMode}
              spacing={spacing}
              onSpacingChange={setSpacing}
              theme={theme}
              onThemeChange={setTheme}
              mapTitle={tree?.title}
              canExport={tree !== null}
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
      </ReactFlowProvider>
    </div>
  );
}
