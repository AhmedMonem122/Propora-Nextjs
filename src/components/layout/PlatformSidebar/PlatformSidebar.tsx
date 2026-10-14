'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  ShieldCheck,
  Users,
  UserCog,
  KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV: Array<{ href: string; label: string; icon: React.ElementType }> = [
  { href: '/platform', label: 'Overview', icon: LayoutDashboard },
  { href: '/platform/organizations', label: 'Organizations', icon: Building2 },
  { href: '/platform/managed-users', label: 'Members', icon: Users },
  { href: '/platform/platform-users', label: 'Platform users', icon: UserCog },
  { href: '/platform/roles', label: 'Roles', icon: KeyRound },
];

export function PlatformSidebar({ onNavigate }: { onNavigate?: () => void }): React.JSX.Element {
  const pathname = usePathname();
  return (
    <nav aria-label="Platform" className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      <p className="flex items-center gap-2 px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Platform admin
      </p>
      {NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-emerald-600/10 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
