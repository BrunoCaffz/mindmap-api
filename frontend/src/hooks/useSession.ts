"use client";

import { useCallback, useEffect, useState } from "react";
import { DEMO_MODE } from "@/lib/demo";
import { fetchSessionUser, postLogout, type SessionUser } from "@/lib/auth";

interface SessionState {
  loading: boolean;
  user: SessionUser | null;
  logout: () => Promise<boolean>;
  // Chamado quando o backend responde 401 no meio do uso: a pessoa passa a ser tratada como não logada.
  markLoggedOut: () => void;
}

// Em modo demo não há backend: não chama /api/me e nunca fica "carregando".
export function useSession(): SessionState {
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    if (DEMO_MODE) return;
    const controller = new AbortController();
    fetchSessionUser(controller.signal).then((found) => {
      if (controller.signal.aborted) return;
      setUser(found);
      setLoading(false);
    });
    return () => controller.abort();
  }, []);

  const logout = useCallback(async () => {
    const ok = await postLogout();
    if (ok) setUser(null);
    return ok;
  }, []);

  const markLoggedOut = useCallback(() => setUser(null), []);

  return { loading, user, logout, markLoggedOut };
}
