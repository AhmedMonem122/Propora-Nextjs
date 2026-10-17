'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { getSessionKind, subscribeSessionKind } from '@/lib/session-flag';

/**
 * Marketing header auth area: Dashboard link when a session exists,
 * Login/Register otherwise. Session presence comes from local flags
 * (no network on the marketing pages by design).
 */
export function SiteAuthLinks({
  mobile,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}): React.JSX.Element {
  // Server snapshot is logged-out (no storage on the server); the client
  // re-reads on mount and on every session change — no network involved.
  const kind = useSyncExternalStore(subscribeSessionKind, getSessionKind, () => null);

  if (!kind) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" asChild onClick={onNavigate} className={mobile ? 'w-full' : undefined}>
          <Link href="/login">Log in</Link>
        </Button>
        <Button variant="accent" asChild onClick={onNavigate} className={mobile ? 'w-full' : undefined}>
          <Link href="/register">Get started</Link>
        </Button>
      </div>
    );
  }

  const href = kind === 'platform' ? '/platform' : '/dashboard';
  const label = kind === 'platform' ? 'Platform dashboard' : 'Dashboard';
  const Icon = kind === 'platform' ? ShieldCheck : LayoutDashboard;
  return (
    <Button variant="accent" asChild onClick={onNavigate} className={mobile ? 'w-full' : undefined}>
      <Link href={href}>
        <Icon className="h-4 w-4" aria-hidden="true" /> {label}
      </Link>
    </Button>
  );
}
