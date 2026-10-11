import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorBody } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://propora-nestjs-postegresql.vercel.app';
const API_PREFIX = '/api/v1';

/** In-memory access token. Never persisted (no localStorage/sessionStorage/URL). */
let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** Root layout registers this so a failed refresh logs out everywhere. */
export function setOnUnauthorized(cb: (() => void) | null): void {
  onUnauthorized = cb;
}

/** Multi-tab logout without storage: tabs notify each other. */
const logoutChannelName = 'propora:auth';
export function broadcastLogout(): void {
  try {
    const ch = new BroadcastChannel(logoutChannelName);
    ch.postMessage({ type: 'logout' });
    ch.close();
  } catch {
    /* BroadcastChannel unavailable (SSR/tests) — ignore */
  }
}

export function subscribeLogout(cb: () => void): () => void {
  try {
    const ch = new BroadcastChannel(logoutChannelName);
    ch.onmessage = (e: MessageEvent) => {
      if (e.data?.type === 'logout') cb();
    };
    return () => ch.close();
  } catch {
    return () => undefined;
  }
}

async function refreshAccessToken(client: AxiosInstance): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(
        `${API_URL}${API_PREFIX}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then((res) => {
        const token = res.data?.accessToken as string | undefined;
        setAccessToken(token ?? null);
        return token ?? null;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${API_URL}${API_PREFIX}`,
    withCredentials: true,
    timeout: 30000,
  });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`);
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError<ApiErrorBody>) => {
      const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
      const status = error.response?.status;
      const isRefreshCall = original?.url?.includes('/auth/refresh');
      if (status === 401 && original && !original._retried && !isRefreshCall) {
        original._retried = true;
        const next = await refreshAccessToken(client);
        if (next) {
          original.headers.set('Authorization', `Bearer ${next}`);
          return client(original);
        }
        onUnauthorized?.();
      }
      return Promise.reject(error);
    },
  );

  return client;
}

/** Singleton axios instance used with TanStack Query everywhere. */
export const apiClient = createApiClient();

export function getApiMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.['retry-after'];
      return retryAfter ? `Too many requests. Retry in ${String(retryAfter)}s.` : 'Too many requests. Please wait and retry.';
    }
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string' && msg.length > 0) return msg;
    if (error.code === 'ECONNABORTED') return 'Request timed out. Please retry.';
    if (!error.response) return 'Network error. Check your connection and retry.';
  }
  return fallback;
}

export function getApiStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) return error.response?.status;
  return undefined;
}
