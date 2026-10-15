'use client';

/**
 * Which sessions exist, without network calls. Tokens themselves stay
 * in memory + httpOnly cookies; these are mere presence hints so the
 * marketing header can link to the right dashboard instantly.
 */
const ORG_KEY = 'propora:session:org';
const PLATFORM_KEY = 'propora:session:platform';

export type SessionKind = 'org' | 'platform' | null;

function read(key: string): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function write(key: string, on: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    if (on) window.localStorage.setItem(key, '1');
    else window.localStorage.removeItem(key);
    // The `storage` event never fires in the tab that wrote — notify locally too.
    window.dispatchEvent(new Event('propora:session'));
  } catch {
    /* storage unavailable — header falls back to logged-out links */
  }
}

export function getSessionKind(): SessionKind {
  if (read(ORG_KEY)) return 'org';
  if (read(PLATFORM_KEY)) return 'platform';
  return null;
}

export function setSessionKind(kind: Exclude<SessionKind, null>, on: boolean): void {
  write(kind === 'org' ? ORG_KEY : PLATFORM_KEY, on);
}

export function subscribeSessionKind(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handler = (e: StorageEvent | Event) => {
    if (e instanceof StorageEvent && e.key !== ORG_KEY && e.key !== PLATFORM_KEY) return;
    cb();
  };
  const asListener = handler as EventListener;
  window.addEventListener('storage', asListener);
  window.addEventListener('propora:session', asListener);
  return () => {
    window.removeEventListener('storage', asListener);
    window.removeEventListener('propora:session', asListener);
  };
}
