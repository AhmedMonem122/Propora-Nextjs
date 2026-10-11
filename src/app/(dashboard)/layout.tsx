'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import { Topbar } from '@/components/layout/Topbar/Topbar';
import { CommandPalette } from '@/components/common/CommandPalette/CommandPalette';
import { RealtimeProvider } from '@/components/Realtime/RealtimeProvider';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();
  const [mobileNav, setMobileNav] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isLoading, isAuthenticated, router, pathname]);

  const toggleCmd = useCallback(() => setCmdOpen((v) => !v), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleCmd();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleCmd]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen" role="status" aria-label="Loading">
        <div className="hidden w-60 shrink-0 border-r p-3 lg:block">
          <Skeleton className="h-8 w-3/4" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-4 p-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <RealtimeProvider>
      <div className="flex min-h-screen bg-background">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r bg-card lg:block">
          <div className="flex h-16 items-center border-b px-4 text-lg font-bold">
            <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b3b5c] text-sm text-emerald-400 dark:bg-emerald-500 dark:text-emerald-950">P</span>
            Propora
          </div>
          <div className="h-[calc(100vh-4rem)]">
            <Sidebar />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setMobileNav(true)} onCommand={() => setCmdOpen(true)} />
          <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 md:p-6">{children}</main>
        </div>
      </div>
      <Dialog open={mobileNav} onOpenChange={setMobileNav}>
        <DialogContent className="left-0 top-0 h-full w-72 max-w-[80vw] translate-x-0 translate-y-0 rounded-none p-0" aria-label="Navigation">
          <DialogTitle className="border-b p-4 font-bold">Propora</DialogTitle>
          <div className="h-[calc(100%-4rem)]">
            <Sidebar onNavigate={() => setMobileNav(false)} />
          </div>
        </DialogContent>
      </Dialog>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </RealtimeProvider>
  );
}
