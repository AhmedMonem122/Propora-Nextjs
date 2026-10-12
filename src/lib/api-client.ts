import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorBody } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://propora-nestjs-postegresql.vercel.app';
const API_PREFIX = '/api/v1';

/** In-memory access token. Never persisted (no localStorage/sessionStorage/URL). */
let accessToken: string | null = null;
/**
 * Single-flight refresh shared by the boot sequence AND the 401 interceptor.
 * The backend rotates refresh tokens: CONCURRENT refresh calls reuse the same
 * token and the API revokes all sessions as a precaution. Sharing one promise
 * guarantees at most one refresh request is ever in flight.
 */
let refreshPromise: Promise<string | null> | null = null;
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

/**
 * Silent refresh through the httpOnly cookie. Single-flight: concurrent
 * callers (boot effect running twice in StrictMode, racing 401s, …) share one
 * network request so the backend never sees token reuse.
 */
export function silentRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${API_URL}${API_PREFIX}/auth/refresh`,
        {},
        { withCredentials: true, timeout: 15000 },
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
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${API_URL}${API_PREFIX}`,
    withCredentials: true,
    timeout: 30000,
  });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`);
    // The API 400s on empty-string optionals — strip them centrally so an
    // untouched optional input means "unchanged", never "set to empty".
    // FormData (uploads) is left untouched; nulls are kept as explicit clears.
    const data = config.data as unknown;
    if (
      data &&
      typeof data === 'object' &&
      !(typeof FormData !== 'undefined' && data instanceof FormData) &&
      (config.method === 'post' || config.method === 'patch' || config.method === 'put')
    ) {
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
        if (v !== '') clean[k] = v;
      }
      config.data = clean;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError<ApiErrorBody>) => {
      const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
      const status = error.response?.status;
      const isRefreshCall = original?.url?.includes('/auth/refresh');
      // Only attempt a refresh when we actually sent a (possibly expired)
      // token. Token-less 401s (logged out) must NOT hit /auth/refresh —
      // that would be pointless traffic and risks reuse flags.
      const headers = original?.headers as unknown as { Authorization?: unknown } | undefined;
      const sentToken = Boolean(headers?.Authorization);
      if (status === 401 && original && !original._retried && !isRefreshCall && sentToken) {
        original._retried = true;
        const next = await silentRefresh();
        if (next) {
          original.headers.set('Authorization', `Bearer ${next}`);
          return client(original);
        }
      }
      if (status === 401 && !isRefreshCall) onUnauthorized?.();
      return Promise.reject(error);
    },
  );

  return client;
}

/** Singleton axios instance used with TanStack Query everywhere. */
export const apiClient = createApiClient();

export function getApiMessage(error: unknown, fallback = ''): string {
  return getApiMessages(error).join(', ') || fallback;
}

/** All backend messages as an array (string[] body, single string, or odd shapes). */
export function getApiMessages(error: unknown): string[] {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.['retry-after'];
      return [retryAfter ? `Too many requests. Retry in ${String(retryAfter)}s.` : 'Too many requests. Please wait and retry.'];
    }
    const msg = error.response?.data?.message as unknown;
    const out = normalizeMessage(msg);
    if (out.length > 0) return out;
    if (error.code === 'ECONNABORTED') return ['Request timed out. Please retry.'];
    if (!error.response) return ['Network error. Check your connection and retry.'];
  }
  return [];
}

function normalizeMessage(msg: unknown): string[] {
  if (typeof msg === 'string') return msg.length > 0 ? [msg] : [];
  if (Array.isArray(msg)) return msg.filter((m): m is string => typeof m === 'string' && m.length > 0);
  if (msg && typeof msg === 'object') {
    // Some backends nest details: { message: {...} } or constraint maps.
    const vals = Object.values(msg as Record<string, unknown>);
    const flat: string[] = [];
    for (const v of vals) flat.push(...normalizeMessage(v));
    return flat;
  }
  return [];
}

function fieldForms(name: string): string[] {
  const lower = name.toLowerCase();
  const spaced = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  const nospace = spaced.replace(/\s+/g, '');
  return [lower, spaced, nospace];
}

/**
 * Best-effort mapping of backend validation messages to form fields.
 * NestJS class-validator messages name the property
 * ("email must be an email") — match those against the form's fields so the
 * backend's own words land under the right input (plus the toast).
 */
export function extractFieldErrors(error: unknown, fields: string[]): Record<string, string> {
  const messages = getApiMessages(error);
  const out: Record<string, string> = {};
  const used = new Set<number>();
  const sorted = [...fields].sort((a, b) => b.length - a.length);
  messages.forEach((message, i) => {
    if (used.has(i)) return;
    const text = message.toLowerCase();
    for (const field of sorted) {
      if (out[field]) continue;
      if (fieldForms(field).some((f) => f.length > 1 && text.includes(f))) {
        out[field] = message;
        used.add(i);
        break;
      }
    }
  });
  return out;
}

/** Push backend field errors into React Hook Form (toast stays as summary). */
export function applyFormErrors(
  error: unknown,
  setError: (name: never, err: { message: string }) => void,
  fields: string[],
): void {
  const mapped = extractFieldErrors(error, fields);
  for (const [field, message] of Object.entries(mapped)) {
    setError(field as never, { message });
  }
}

export function getApiStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) return error.response?.status;
  return undefined;
}
