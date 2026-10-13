'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiClient,
  getPlatformToken,
  platformSilentRefresh,
  setOnPlatformUnauthorized,
  setOrgScope,
  setPlatformToken,
} from '@/lib/api-client';

interface PlatformAdmin {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface PlatformContextValue {
  admin: PlatformAdmin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Organization the admin acts as (X-Organization-Id), null = platform scope. */
  orgScope: string | null;
  orgScopeName: string | null;
  setScope: (orgId: string | null, orgName?: string | null) => void;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformAuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const router = useRouter();
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [booted, setBooted] = useState(false);
  const [scope, setScopeState] = useState<{ id: string | null; name: string | null }>({
    id: null,
    name: null,
  });

  const setScope = useCallback((orgId: string | null, orgName?: string | null) => {
    setOrgScope(orgId);
    setScopeState({ id: orgId, name: orgName ?? null });
  }, []);

  const doLogout = useCallback(async () => {
    setPlatformToken(null);
    setScope(null);
    setAdmin(null);
    try {
      await apiClient.post('/platform/auth/logout', {});
    } catch {
      /* already logged out server-side */
    }
  }, [setScope]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const token = await platformSilentRefresh();
      if (!alive) return;
      if (!token) {
        setBooted(true);
        return;
      }
      try {
        const res = await apiClient.get('/platform/auth/me');
        if (!alive) return;
        setAdmin(res.data as PlatformAdmin);
      } catch {
        setPlatformToken(null);
      } finally {
        if (alive) setBooted(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setOnPlatformUnauthorized(() => {
      void doLogout().finally(() => router.replace('/platform/login'));
    });
    return () => setOnPlatformUnauthorized(null);
  }, [doLogout, router]);

  const value = useMemo<PlatformContextValue>(
    () => ({
      admin,
      isLoading: !booted,
      isAuthenticated: Boolean(admin),
      orgScope: scope.id,
      orgScopeName: scope.name,
      setScope,
      login: async (input) => {
        const res = await apiClient.post('/platform/auth/login', input);
        setPlatformToken(res.data?.accessToken ?? null);
        setAdmin((res.data?.admin ?? null) as PlatformAdmin | null);
      },
      logout: async () => {
        await doLogout();
        router.replace('/platform/login');
      },
    }),
    [admin, booted, scope, setScope, doLogout, router],
  );

  // Keep the axios module token in sync (login/logout are the only writers,
  // but belt-and-braces costs nothing).
  useEffect(() => {
    void getPlatformToken();
  }, [admin]);

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformContextValue {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used inside <PlatformAuthProvider>');
  return ctx;
}
