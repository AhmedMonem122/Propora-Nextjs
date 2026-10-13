'use client';

import Link from 'next/link';
import { Bell, Menu, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { qk } from '@/lib/query-client';
import { Avatar, AvatarFallback, initialsOf } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu/DropdownMenu';
import { ThemeToggle } from '@/components/common/ThemeToggle/ThemeToggle';

export function Topbar({ onMenu, onCommand }: { onMenu: () => void; onCommand: () => void }): React.JSX.Element {
  const { user, logout } = useAuth();
  const unread = useQuery({
    queryKey: qk.notifications({ unreadOnly: true, limit: 1 }),
    queryFn: async () => {
      const res = await apiClient.get('/notifications', { params: { unreadOnly: true, limit: 1 } });
      return (res.data?.meta?.total ?? 0) as number;
    },
    staleTime: 30_000,
    // Cheap single-row poll so the badge stays fresh even without Realtime;
    // realtime invalidation keeps it instant when available.
    refetchInterval: 30_000,
  });

  const count = unread.data ?? 0;

  return (
    <div className="flex h-16 items-center gap-2 border-b bg-card px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open navigation menu">
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>
      <button
        type="button"
        onClick={onCommand}
        className="hidden items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted sm:flex md:w-72 cursor-pointer"
        aria-label="Global search (Control K)"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="rounded border bg-muted px-1.5 text-xs">⌘K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="icon" asChild aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}`}>
          <Link href="/dashboard/notifications" className="relative">
            <Bell className="h-5 w-5" aria-hidden="true" />
            {count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] font-bold text-white" aria-hidden="true">
                {count > 99 ? '99+' : count}
              </span>
            ) : null}
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="ml-1 flex items-center gap-2 rounded-full p-1 hover:bg-muted cursor-pointer" aria-label="User menu">
              <Avatar>
                <AvatarFallback>{initialsOf(user?.firstName, user?.lastName, user?.email)}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <span className="block max-w-48 truncate font-medium">{user?.email ?? '…'}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">Profile & settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                void logout();
              }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
