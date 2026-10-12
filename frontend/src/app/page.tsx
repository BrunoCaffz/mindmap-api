"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { MotionConfig, motion } from "framer-motion";
import { AppHeader, LoginButton } from "@/components/AppHeader";
import { DemoBanner } from "@/components/DemoBanner";
import { EmptyMapState } from "@/components/EmptyMapState";
import type { LoadError } from "@/components/ErrorCard";
import { CheckIcon, LockIcon } from "@/components/icons";
import { LoadingMap } from "@/components/LoadingMap";
import { MapSidebar } from "@/components/MapSidebar";
import { MindMap } from "@/components/MindMap";
import exampleMap from "@/data/example.json";
import { useSession } from "@/hooks/useSession";
import { fetchMindMap, MindMapError, normalizePageId, SessionExpiredError } from "@/lib/api";
import { DEV_FALLBACK, SESSION_EXPIRED_MESSAGE } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/demo";
import type { LayoutMode, Spacing } from "@/lib/layout";
import { useTheme } from "@/lib/theme";
import type { MindMapNode } from "@/types/mindmap";

const MODE_LABELS: Record<LayoutMode, string> = {
  mindmap: "Mapa mental",
  tree: "Árvore",
  radial: "Radial",
  bubbles: "Bolhas",
};

const ID_ERROR =
  "O ID precisa ter 32 caracteres (letras de a a f e números), como aparece no fim do link da página.";
const TOAST_MS = 5000;

export default function Home() {
  const [pageId, setPageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const session = useSession();
  const canGenerate = !DEMO_MODE && (session.user !== null || DEV_FALLBACK);
  const inputRef = useRef<HTMLInputElement>(null);
  // Na demonstração o mapa de exemplo já nasce carregado, sem chamar o backend.
  const [tree, setTree] = useState<MindMapNode | null>(DEMO_MODE ? (exampleMap as MindMapNode) : null);
  // Muda a cada mapa novo: o provider do React Flow recomeça limpo (sem viewport nem nós do mapa anterior).
  const [mapSeq, setMapSeq] = useState(0);

  const [mode, setMode] = useState<LayoutMode>("mindmap");
  const [spacing, setSpacing] = useState<Spacing>("normal");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  function clearMessages() {
    setIdError(null);
    setLoadError(null);
    setSessionExpired(false);
  }

  function handleShowExample(exampleMode?: LayoutMode) {
    clearMessages();
    if (exampleMode) setMode(exampleMode);
    setMapSeq((n) => n + 1);
    setTree(exampleMap as MindMapNode);
    setToast("Mapa pronto. Clique num galho pra espiar o que tem dentro.");
  }

  function handleNewMap() {
    clearMessages();
    setMapSeq((n) => n + 1);
    setTree(null);
  }

  async function handleLogout() {
    const ok = await session.logout();
    if (!ok) {
      setToast("Não consegui sair agora. Tenta de novo?");
      return;
    }
    // Some o mapa de quem saiu.
    clearMessages();
    setTree(null);
    setPageId("");
    setMapSeq((n) => n + 1);
  }

  async function handleSubmit() {
    if (!canGenerate || !pageId.trim()) return;
    const id = normalizePageId(pageId);
    if (!id) {
      setLoadError(null);
      setIdError(ID_ERROR);
      return;
    }
    setLoading(true);
    clearMessages();
    setTree(null);
    try {
      const loaded = await fetchMindMap(id);
      setMapSeq((n) => n + 1);
      setTree(loaded);
      setToast("Mapa pronto. Clique num galho pra espiar o que tem dentro.");
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        session.markLoggedOut();
        setSessionExpired(true);
        return;
      }
      setLoadError(
        err instanceof MindMapError
          ? { message: err.message, status: err.status }
          : { message: "Algo não saiu como esperado. Tenta de novo em alguns segundos.", status: 500 },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh flex-col">
        {DEMO_MODE && <DemoBanner />}
        <ReactFlowProvider key={mapSeq}>
          <div className="flex min-h-0 flex-1">
            <MapSidebar
              mode={mode}
              onModeChange={(next) => {
                setMode(next);
                closeDrawer();
              }}
              spacing={spacing}
              onSpacingChange={setSpacing}
              theme={theme}
              onThemeChange={setTheme}
              mapTitle={tree?.title}
              canExport={tree !== null}
              onNewMap={DEMO_MODE ? undefined : handleNewMap}
              onToast={setToast}
              drawerOpen={drawerOpen}
              onCloseDrawer={closeDrawer}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <AppHeader
                mapTitle={tree?.title}
                hideAuth={DEMO_MODE}
                sessionLoading={session.loading}
                user={session.user}
                onLogout={handleLogout}
                onOpenMenu={() => setDrawerOpen(true)}
              />
              {sessionExpired && (
                <div
                  role="alert"
                  className="rise flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-t-blue px-4 py-2.5"
                >
                  <p className="flex items-center gap-2">
                    <LockIcon className="flex-none text-c-blue" />
                    {SESSION_EXPIRED_MESSAGE}
                  </p>
                  <LoginButton label="Conectar de novo" />
                </div>
              )}
              <main className="relative min-h-0 flex-1 bg-bg">
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
                    <MindMap
                      tree={tree}
                      mode={mode}
                      spacing={spacing}
                      theme={theme}
                      modeLabel={MODE_LABELS[mode]}
                      onOpenMenu={() => setDrawerOpen(true)}
                    />
                  ) : (
                    <EmptyMapState
                      pageId={pageId}
                      onPageIdChange={(value) => {
                        setPageId(value);
                        setIdError(null);
                      }}
                      onSubmit={handleSubmit}
                      inputRef={inputRef}
                      canGenerate={canGenerate}
                      sessionLoading={session.loading && !DEMO_MODE}
                      idError={idError}
                      loadError={loadError}
                      onShowExample={handleShowExample}
                    />
                  )}
                </motion.div>
                {toast && (
                  <div
                    role="status"
                    className="toast absolute left-1/2 top-4 z-30 flex max-w-[calc(100%-24px)] items-center gap-2 rounded-md bg-tip px-3.5 py-2 text-[13px] text-tip-fg shadow-pop"
                  >
                    <CheckIcon width={14} height={14} className="flex-none" />
                    {toast}
                  </div>
                )}
              </main>
            </div>
          </div>
        </ReactFlowProvider>
      </div>
    </MotionConfig>
  );
}
