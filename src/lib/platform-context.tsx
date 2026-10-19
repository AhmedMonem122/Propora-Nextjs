'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  apiClient,
  getPlatformToken,
  platformSilentRefresh,
  setAccessToken,
  setOnPlatformUnauthorized,
  setOrgScope,
  setPlatformToken,
} from '@/lib/api-client';
import { setSessionKind } from '@/lib/session-flag';

interface PlatformAdmin {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * Module-level adopter so the ORG auth context can hand over a platform
 * session created by the unified login (ADMIN) without a provider cycle:
 * platform-context never imports auth-context, only this setter is shared.
 */
let platformAdopter: ((accessToken: string, admin: PlatformAdmin) => void) | null = null;

export function adoptPlatformSession(accessToken: string, admin: PlatformAdmin): void {
  platformAdopter?.(accessToken, admin);
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
  /** Adopt a platform session created elsewhere (unified /auth/login as ADMIN). */
  adopt: (accessToken: string, admin: PlatformAdmin) => void;
  logout: () => Promise<void>;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformAuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [booted, setBooted] = useState(false);
  const [scope, setScopeState] = useState<{ id: string | null; name: string | null }>(
    () => ({ id: null, name: null }),
  );

  const setScope = useCallback((orgId: string | null, orgName?: string | null) => {
    setOrgScope(orgId);
    setScopeState({ id: orgId, name: orgName ?? null });
  }, []);

  const doLogout = useCallback(async () => {
    // Mirror of the org logout: end both sessions, clear cached org data.
    setPlatformToken(null);
    setAccessToken(null);
    setScope(null);
    setSessionKind('platform', false);
    setSessionKind('org', false);
    setAdmin(null);
    queryClient.clear();
    try {
      await apiClient.post('/platform/auth/logout', {});
    } catch {
      /* already logged out server-side */
    }
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      /* no org session */
    }
  }, [setScope, queryClient]);

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

  // On client mount, restore the persisted org scope from localStorage. The
  // useState initializer above always returns null on the server (no window),
  // so we re-read localStorage here on the client so a platform admin acting
  // as a tenant stays on the same organization dashboard after reload instead
  // of being kicked to ScopeGate.
  // We deliberately do NOT fetch the org name here: a 401 on
  // /platform/organizations/{id} would trigger the axios 401 interceptor and
  // log the user out. The ID is enough for X-Organization-Id; the name is
  // displayed as a truncated slice in the banner.
  useEffect(() => {
    let alive = true;
    const saved =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('propora.orgScope')
        : null;
    if (!saved || !alive) return;
    // Defer the state update to the next microtask to avoid cascading renders
    // from calling setState synchronously inside an effect body.
    Promise.resolve().then(() => {
      if (!alive) return;
      setScopeState({ id: saved, name: null });
    });
    return () => {
      alive = false;
    };
  }, []);

  // Restore the persisted scope's display name after a scope change.
  // Fetching the name here risks a 401 → logout, so we only update the name
  // when setScope() is called with an explicit name (from the org picker).
  useEffect(() => {
    if (!scope.id || scope.name) return;
    let alive = true;
    // Name lookup deferred: org name is set via setScope() when the admin
    // picks an org from the picker. No background fetch to avoid 401 logout.
    return () => {
      alive = false;
    };
  }, [scope.id, scope.name]);

  useEffect(() => {
    setOnPlatformUnauthorized(() => {
      void doLogout().finally(() => router.replace('/platform/login'));
    });
    return () => setOnPlatformUnauthorized(null);
  }, [doLogout, router]);

  const adopt = useCallback((accessToken: string, admin: PlatformAdmin) => {
    setPlatformToken(accessToken);
    setAdmin(admin);
    setSessionKind('platform', true);
  }, []);

  // Register the module-level adopter (used by unified ADMIN login).
  useEffect(() => {
    platformAdopter = adopt;
    return () => {
      platformAdopter = null;
    };
  }, [adopt]);

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
        const token = res.data?.accessToken as string | undefined;
        const admin = (res.data?.admin ?? null) as PlatformAdmin | null;
        if (!token || !admin) throw new Error('Platform login failed.');
        adopt(token, admin);
      },
      adopt,
      logout: async () => {
        await doLogout();
        router.replace('/platform/login');
      },
    }),
    [admin, booted, scope, setScope, adopt, doLogout, router],
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
