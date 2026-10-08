"use client";

import { useState } from "react";
import { LoadingSteps } from "@/components/LoadingSteps";
import { MindMap } from "@/components/MindMap";
import { fetchMindMap } from "@/lib/api";
import type { MindMapNode } from "@/types/mindmap";

export default function Home() {
  const [pageId, setPageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tree, setTree] = useState<MindMapNode | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    <main className="flex h-screen flex-col gap-4 p-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
          placeholder="ID da página do Notion"
          className="flex-1 rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Gerar mapa
        </button>
      </form>
      {error && (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </p>
      )}
      {(loading || tree) && (
        <div className="min-h-0 flex-1 rounded border border-zinc-200 dark:border-zinc-800">
          {loading ? <LoadingSteps /> : tree && <MindMap tree={tree} />}
        </div>
      )}
    </main>
  );
}
