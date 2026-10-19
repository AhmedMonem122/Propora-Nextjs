import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorBody } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://propora-nestjs-postegresql.vercel.app';
const API_PREFIX = '/api/v1';

/** In-memory access token. Never persisted (no localStorage/sessionStorage/URL). */
let accessToken: string | null = null;
/** Separate platform-admin session (different credential store + endpoints). */
let platformToken: string | null = null;
/**
 * Tenant override for platform admins (X-Organization-Id). Set by the admin
 * "act as organization" switcher; sent on org API calls only. Persisted so a
 * reload mid-investigation keeps the scope (cleared on logout).
 */
const ORG_SCOPE_STORAGE_KEY = 'propora.orgScope';
let orgScope: string | null = (() => {
  try {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(ORG_SCOPE_STORAGE_KEY);
    }
  } catch {
    /* storage unavailable — scope starts empty */
  }
  return null;
})();
let platformRefreshPromise: Promise<string | null> | null = null;
/**
 * Single-flight refresh shared by the boot sequence AND the 401 interceptor.
 * The backend rotates refresh tokens: CONCURRENT refresh calls reuse the same
 * token and the API revokes all sessions as a precaution. Sharing one promise
 * guarantees at most one refresh request is ever in flight.
 */
let refreshPromise: Promise<string | null> | null = null;
let onUnauthorized: (() => void) | null = null;
let onPlatformUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setPlatformToken(token: string | null): void {
  platformToken = token;
}

export function getPlatformToken(): string | null {
  return platformToken;
}

export function setOrgScope(organizationId: string | null): void {
  orgScope = organizationId;
  try {
    if (typeof window !== 'undefined') {
      if (organizationId) window.localStorage.setItem(ORG_SCOPE_STORAGE_KEY, organizationId);
      else window.localStorage.removeItem(ORG_SCOPE_STORAGE_KEY);
    }
  } catch {
    /* storage unavailable — in-memory scope still applies */
  }
}

export function getOrgScope(): string | null {
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage.getItem(ORG_SCOPE_STORAGE_KEY);
    } catch {
      /* storage unavailable — fall back to in-memory scope */
    }
  }
  return orgScope;
}

/**
 * Cross-tab refresh coordination (the other half of reuse safety).
 *
 * Refresh tokens are SINGLE-USE with theft revocation: two tabs refreshing
 * simultaneously present the same cookie, the loser looks like an attacker,
 * and the backend revokes the whole family — forcing re-login everywhere.
 * A localStorage lock serializes refreshes across tabs so the rotation
 * chain never forks; a BroadcastChannel wakes followers instead of polling.
 */
const REFRESH_LOCK_TTL_MS = 10_000;
const REFRESH_WAIT_MS = 12_000;
const MAX_REFRESH_ATTEMPTS = 3;

export interface RefreshLockStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): RefreshLockStorage | null {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    // Probe: private mode / disabled storage throws on access.
    ls.getItem('propora:probe');
    return ls;
  } catch {
    return null;
  }
}

function lockKey(kind: string): string {
  return `propora:refresh-lock:${kind}`;
}

function doneChannel(kind: string): string {
  return `propora:refresh-done:${kind}`;
}

export function tryTakeRefreshLock(
  kind: string,
  storage: RefreshLockStorage | null = defaultStorage(),
  now: number = Date.now(),
): boolean {
  if (!storage) return true;
  try {
    const raw = storage.getItem(lockKey(kind));
    if (raw) {
      const { at } = JSON.parse(raw) as { at: number };
      // Held and fresh → another tab owns it. Stale (>TTL) → owner died, take over.
      if (now - at < REFRESH_LOCK_TTL_MS) return false;
    }
    storage.setItem(lockKey(kind), JSON.stringify({ at: now }));
    return true;
  } catch {
    return true;
  }
}

export function releaseRefreshLock(
  kind: string,
  storage: RefreshLockStorage | null = defaultStorage(),
): void {
  try {
    storage?.removeItem(lockKey(kind));
  } catch {
    /* ignore */
  }
}

function waitForRefreshDone(kind: string, storage: RefreshLockStorage | null = defaultStorage()): Promise<void> {
  void storage;
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    const timer = setTimeout(finish, REFRESH_WAIT_MS);
    try {
      const ch = new BroadcastChannel(doneChannel(kind));
      ch.onmessage = (e: MessageEvent) => {
        if (e.data?.type === 'refreshed') {
          clearTimeout(timer);
          ch.close();
          finish();
        }
      };
    } catch {
      clearTimeout(timer);
      finish();
    }
  });
}

function notifyRefreshed(kind: string): void {
  try {
    const ch = new BroadcastChannel(doneChannel(kind));
    ch.postMessage({ type: 'refreshed', at: Date.now() });
    ch.close();
  } catch {
    /* BroadcastChannel unavailable — followers fall back to timeout */
  }
}

/** Root layout registers this so a failed refresh logs out everywhere. */
export function setOnUnauthorized(cb: (() => void) | null): void {
  onUnauthorized = cb;
}

/** Platform layout registers this for platform-session expiry. */
export function setOnPlatformUnauthorized(cb: (() => void) | null): void {
  onPlatformUnauthorized = cb;
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
async function doRefreshNetwork(kind: 'org' | 'platform'): Promise<string | null> {
  const url =
    kind === 'org'
      ? `${API_URL}${API_PREFIX}/auth/refresh`
      : `${API_URL}${API_PREFIX}/platform/auth/refresh`;
  try {
    const res = await axios.post(url, {}, { withCredentials: true, timeout: 15000 });
    const token = res.data?.accessToken as string | undefined;
    if (kind === 'org') setAccessToken(token ?? null);
    else setPlatformToken(token ?? null);
    return token ?? null;
  } catch {
    if (kind === 'org') setAccessToken(null);
    else setPlatformToken(null);
    return null;
  }
}

/**
 * One network refresh at a time across ALL tabs (see lock above): the
 * leader rotates, followers wait then rotate sequentially on the fresh
 * cookie. Sequential rotation extends the chain safely; concurrent
 * rotation trips reuse detection and kills every session.
 */
async function lockedRefresh(kind: 'org' | 'platform'): Promise<string | null> {
  for (let attempt = 0; attempt < MAX_REFRESH_ATTEMPTS; attempt++) {
    if (tryTakeRefreshLock(kind)) {
      try {
        return await doRefreshNetwork(kind);
      } finally {
        releaseRefreshLock(kind);
        notifyRefreshed(kind);
      }
    }
    await waitForRefreshDone(kind);
  }
  // Could not coordinate: return local state so the retried request takes
  // the normal 401→logout path instead of forging a racing refresh.
  return kind === 'org' ? getAccessToken() : getPlatformToken();
}

export function silentRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = lockedRefresh('org').finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/** Platform silent refresh (separate cookie path on the API). */
export function platformSilentRefresh(): Promise<string | null> {
  if (!platformRefreshPromise) {
    platformRefreshPromise = lockedRefresh('platform').finally(() => {
      platformRefreshPromise = null;
    });
  }
  return platformRefreshPromise;
}

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${API_URL}${API_PREFIX}`,
    withCredentials: true,
    timeout: 30000,
  });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const url = config.url ?? '';
    const isPlatformPath = url.startsWith('/platform');
    // Which credential actually goes out (tracked for the 401 handler):
    // org token normally; platform token on /platform/* OR — when there is
    // no org session — on org paths together with X-Organization-Id
    // (platform admin acting within a tenant).
    let kind: 'org' | 'platform' | null = null;
    if (isPlatformPath) {
      if (platformToken) {
        config.headers.set('Authorization', `Bearer ${platformToken}`);
        kind = 'platform';
      }
    } else if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
      kind = 'org';
    } else if (platformToken && orgScope) {
      config.headers.set('Authorization', `Bearer ${platformToken}`);
      config.headers.set('X-Organization-Id', orgScope);
      kind = 'platform';
    }
    (config as { _tokenKind?: 'org' | 'platform' | null })._tokenKind = kind;
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
      const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean; _tokenKind?: 'org' | 'platform' | null }) | undefined;
      const status = error.response?.status;
      const url = original?.url ?? '';
      const isRefreshCall = url.includes('/auth/refresh');
      const isPlatformPath = url.startsWith('/platform');
      const kind = original?._tokenKind ?? null;
      // Only attempt a refresh when we actually sent a (possibly expired)
      // token. Token-less 401s (logged out) must NOT hit refresh —
      // that would be pointless traffic and risks reuse flags.
      const sentToken = kind !== null;
      if (status === 401 && original && !original._retried && !isRefreshCall && sentToken) {
        original._retried = true;
        const next = kind === 'platform' ? await platformSilentRefresh() : await silentRefresh();
        if (next) {
          original.headers.set('Authorization', `Bearer ${next}`);
          return client(original);
        }
      }
      if (status === 401 && !isRefreshCall) {
        // Route the expiry to the session that actually sent the token
        // (public calls fall back to the path convention).
        if (kind === 'platform' || (kind === null && isPlatformPath)) onPlatformUnauthorized?.();
        else onUnauthorized?.();
      }
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
