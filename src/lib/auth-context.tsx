'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  apiClient,
  broadcastLogout,
  getApiStatus,
  getPlatformToken,
  setAccessToken,
  setOnUnauthorized,
  setOrgScope,
  setPlatformToken,
  silentRefresh,
  subscribeLogout,
} from '@/lib/api-client';
import { qk } from '@/lib/query-client';
import { hasAnyPermission, hasPermission, isOwnerRole, normalizePermissions, roleNames } from '@/lib/permissions';
import { adoptPlatformSession } from '@/lib/platform-context';
import { setSessionKind } from '@/lib/session-flag';
import type { AuthResponse, AuthUser } from '@/types/api';

interface AuthContextValue {
  user: AuthUser | null;
  permissions: string[];
  roleLabels: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Non-401 /me failure (flaky network) — session may still be valid. */
  sessionError: unknown;
  retrySession: () => Promise<void>;
  can: (name: string) => boolean;
  canAny: (names: string[]) => boolean;
  /** True when acting as a platform admin (possibly scoped to an org). */
  isPlatformMode?: boolean;
  login: (input: { email: string; password: string; role?: string }) => Promise<string>;
  register: (input: {
    organizationName?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    inviteCode?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export { AuthContext };

function toUser(data: unknown): AuthUser | null {
  if (!data || typeof data !== 'object') return null;
  const u = data as Record<string, unknown>;
  return {
    id: String(u.id ?? ''),
    email: String(u.email ?? ''),
    firstName: (u.firstName as string) ?? null,
    lastName: (u.lastName as string) ?? null,
    status: (u.status as string) ?? undefined,
    organizationId: (u.organizationId as string) ?? undefined,
    roles: Array.isArray(u.roles) ? (u.roles as AuthUser['roles']) : [],
    permissions: normalizePermissions(u.permissions),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [booted, setBooted] = useState(false);
  /**
   * Logged-out flag gates /me (and stops refetch loops after logout).
   * Set on boot-without-session and on every logout; cleared on login/register
   * and on a successful silent refresh.
   */
  const [loggedOut, setLoggedOut] = useState(false);

  const meQuery = useQuery({
    queryKey: qk.me,
    queryFn: async (): Promise<AuthUser | null> => {
      const res = await apiClient.get('/auth/me');
      return toUser(res.data);
    },
    // Never fire before the boot refresh settles — a premature /me 401 would
    // trigger a SECOND concurrent refresh and trip reuse detection.
    enabled: booted && !loggedOut,
    // Retry transient failures (flaky network/CORS blip) — but NEVER 401s:
    // a retry would fire a second refresh and risk reuse detection.
    retry: (count, err) => (count < 2 ? getApiStatus(err) !== 401 : false),
    retryDelay: (count) => Math.min(1000 * 2 ** count, 5000),
    staleTime: 60_000,
  });

  // Silent-refresh boot through the single-flight refresh: StrictMode
  // double-mounts share one network request, never two.
  useEffect(() => {
    let alive = true;
    void silentRefresh().then((token) => {
      if (!alive) return;
      setLoggedOut(!token);
      setBooted(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const doLogout = useCallback(async (clearAll = true) => {
    // Org-only 401 (e.g. platform admin hitting /auth/me with no org token)
    // must NOT clear the platform session — otherwise a reload boots the
    // admin back to login even though the platform session is still valid.
    setAccessToken(null);
    if (clearAll) {
      setPlatformToken(null);
      setSessionKind('platform', false);
    }
    // Only clear the persisted org scope on a full logout. An org-only 401
    // (platform admin acting as a tenant) keeps the scope so a reload keeps
    // the admin on the same organization dashboard instead of bouncing out.
    if (clearAll) {
      setOrgScope(null);
      setSessionKind('org', false);
    }
    setLoggedOut(true);
    queryClient.clear();
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      /* already logged out server-side — continue */
    }
    if (clearAll) {
      try {
        await apiClient.post('/platform/auth/logout', {});
      } catch {
        /* no platform session — continue */
      }
    }
  }, [queryClient]);

  useEffect(() => {
    setOnUnauthorized(() => {
      // If a platform session is active, an org /auth/me 401 is expected
      // (platform admin acting as a tenant has no org session). Do not log
      // out — stay on the page so a reload keeps the admin on the same org.
      if (getPlatformToken()) return;
      void doLogout(false).finally(() => router.replace('/login'));
    });
    const unsub = subscribeLogout(() => {
      void doLogout().finally(() => router.replace('/login'));
    });
    return () => {
      setOnUnauthorized(null);
      unsub();
    };
  }, [doLogout, router]);

  const value = useMemo<AuthContextValue>(() => {
    const user = meQuery.data ?? null;
    const permissions = user?.permissions ?? [];
    const labels = roleNames(user?.roles);
    const owner = isOwnerRole(labels);
    // isPending (not just isFetching) covers retry backoff gaps — never treat
    // a pending bootstrap as logged out, or a transient blip bounces to login.
    const loading = !booted || (!loggedOut && meQuery.isPending);
    const failed = !loggedOut && meQuery.status === 'error' ? meQuery.error : null;
    return {
      user,
      permissions,
      roleLabels: labels,
      isLoading: loading,
      isAuthenticated: Boolean(user),
      sessionError: failed && getApiStatus(failed) !== 401 ? failed : null,
      retrySession: async () => {
        await queryClient.invalidateQueries({ queryKey: qk.me });
      },
      can: (name: string) => owner || hasPermission(permissions, name),
      canAny: (names: string[]) => owner || hasAnyPermission(permissions, names),
      login: async (input) => {
        const res = await apiClient.post<AuthResponse>('/auth/login', input);
        // Unified login: ADMIN lands in the platform session (the server
        // verified the account), everyone else in the org session.
        if (res.data.target === '/platform') {
          const admin = res.data.user as unknown as {
            id: string;
            email: string;
            firstName?: string | null;
            lastName?: string | null;
          };
          setAccessToken(null);
          setLoggedOut(true);
          queryClient.clear();
          adoptPlatformSession(res.data.accessToken, {
            id: admin.id,
            email: admin.email,
            firstName: admin.firstName ?? null,
            lastName: admin.lastName ?? null,
          });
          setSessionKind('org', false);
          return res.data.target;
        }
        setAccessToken(res.data.accessToken);
        setSessionKind('org', true);
        setLoggedOut(false);
        queryClient.setQueryData(qk.me, toUser(res.data.user));
        await queryClient.invalidateQueries({ queryKey: qk.me });
        return res.data.target ?? '/dashboard';
      },
      register: async (input) => {
        // Register sends the welcome email synchronously (~25s+) — allow it time.
        const res = await apiClient.post<AuthResponse>('/auth/register', input, { timeout: 90000 });
        setAccessToken(res.data.accessToken);
        setSessionKind('org', true);
        setLoggedOut(false);
        queryClient.setQueryData(qk.me, toUser(res.data.user));
        await queryClient.invalidateQueries({ queryKey: qk.me });
      },
      logout: async () => {
        await doLogout();
        broadcastLogout();
        router.replace('/login');
      },
      refreshUser: async () => {
        await queryClient.invalidateQueries({ queryKey: qk.me });
      },
    };
  }, [meQuery.data, meQuery.isPending, meQuery.status, meQuery.error, booted, loggedOut, doLogout, queryClient, router]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
