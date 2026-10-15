'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Building,
  DoorOpen,
  Users,
  FileText,
  CreditCard,
  Wrench,
  FolderOpen,
  Bell,
  BarChart3,
  Settings,
  UserCog,
  ShieldCheck,
  ScrollText,
  Webhook,
  Shapes,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const NAV: Array<{ href: string; label: string; icon: React.ElementType; perm?: string | string[] }> = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/properties', label: 'Properties', icon: Building2, perm: 'property:read' },
  { href: '/dashboard/buildings', label: 'Buildings', icon: Building, perm: 'building:read' },
  { href: '/dashboard/units', label: 'Units', icon: DoorOpen, perm: 'unit:read' },
  { href: '/dashboard/unit-types', label: 'Unit types', icon: Shapes, perm: 'unit:read' },
  { href: '/dashboard/residents', label: 'Residents', icon: Users, perm: 'resident:read' },
  { href: '/dashboard/leases', label: 'Leases', icon: FileText, perm: 'lease:read' },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard, perm: 'payment:read' },
  { href: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench, perm: 'maintenance:read' },
  { href: '/dashboard/documents', label: 'Documents', icon: FolderOpen, perm: 'document:read' },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell, perm: 'notification:read' },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3, perm: ['report:financial', 'report:occupancy'] },
  { href: '/dashboard/users', label: 'Users', icon: UserCog, perm: 'user:read' },
  { href: '/dashboard/roles', label: 'Roles', icon: ShieldCheck, perm: 'role:read' },
  { href: '/dashboard/audit-logs', label: 'Audit log', icon: ScrollText, perm: 'audit:read' },
  { href: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook, perm: 'webhook:read' },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const ADMIN_NAV: Array<{ href: string; label: string; icon: React.ElementType }> = [
  { href: '/platform', label: 'Platform overview', icon: LayoutDashboard },
  { href: '/platform/organizations', label: 'All organizations', icon: Building2 },
  { href: '/platform/managed-users', label: 'All members', icon: Users },
  { href: '/platform/platform-users', label: 'Platform users', icon: UserCog },
  { href: '/platform/roles', label: 'Org roles', icon: ShieldCheck },
];

/** Collapsible dashboard sidebar (Sheet on mobile via parent). */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }): React.JSX.Element {
  const pathname = usePathname();
  const { can, canAny, isLoading, isPlatformMode } = useAuth();
  const visible = NAV.filter((item) => {
    // Account settings are meaningless on a platform session (no member
    // profile); everything else is fully visible to platform admins.
    if (item.href === '/dashboard/settings' && isPlatformMode) return false;
    if (!isLoading && item.perm) {
      return Array.isArray(item.perm) ? canAny(item.perm) : can(item.perm);
    }
    return true;
  });
  return (
    <nav aria-label="Dashboard" className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      {visible.map((item) => {
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
      {isPlatformMode ? (
        <>
          <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Platform
          </p>
          {ADMIN_NAV.map((item) => {
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
        </>
      ) : null}
    </nav>
  );
}
