'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient, broadcastLogout, setAccessToken, setOnUnauthorized, subscribeLogout } from '@/lib/api-client';
import { qk } from '@/lib/query-client';
import { hasPermission, normalizePermissions, roleNames } from '@/lib/permissions';
import type { AuthResponse, AuthUser } from '@/types/api';

interface AuthContextValue {
  user: AuthUser | null;
  permissions: string[];
  roleLabels: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  can: (name: string) => boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: {
    organizationName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

  const meQuery = useQuery({
    queryKey: qk.me,
    queryFn: async (): Promise<AuthUser | null> => {
      const res = await apiClient.get('/auth/me');
      return toUser(res.data);
    },
    retry: false,
    staleTime: 60_000,
  });

  // Silent-refresh boot: cookie session → access token → /me
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiClient.post<AuthResponse>('/auth/refresh', {});
        if (res.data?.accessToken) setAccessToken(res.data.accessToken);
      } catch {
        setAccessToken(null);
      } finally {
        if (alive) {
          setBooted(true);
          void queryClient.invalidateQueries({ queryKey: qk.me });
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [queryClient]);

  const doLogout = useCallback(async () => {
    setAccessToken(null);
    queryClient.clear();
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      /* already logged out server-side — continue */
    }
  }, [queryClient]);

  useEffect(() => {
    setOnUnauthorized(() => {
      void doLogout().finally(() => router.replace('/login'));
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
    return {
      user,
      permissions,
      roleLabels: roleNames(user?.roles),
      isLoading: !booted || meQuery.isLoading,
      isAuthenticated: Boolean(user),
      can: (name: string) => hasPermission(permissions, name),
      login: async (input) => {
        const res = await apiClient.post<AuthResponse>('/auth/login', input);
        setAccessToken(res.data.accessToken);
        queryClient.setQueryData(qk.me, toUser(res.data.user));
        await queryClient.invalidateQueries({ queryKey: qk.me });
      },
      register: async (input) => {
        const res = await apiClient.post<AuthResponse>('/auth/register', input);
        setAccessToken(res.data.accessToken);
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
  }, [meQuery.data, meQuery.isLoading, booted, doLogout, queryClient, router]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
