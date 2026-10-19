'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthContext, useAuth } from '@/lib/auth-context';
import type { AuthUser } from '@/types/api';
import { getApiMessage } from '@/lib/api-client';
import { usePlatform } from '@/lib/platform-context';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import { Topbar } from '@/components/layout/Topbar/Topbar';
import { CommandPalette } from '@/components/common/CommandPalette/CommandPalette';
import { RealtimeProvider } from '@/components/Realtime/RealtimeProvider';
import { OrgScopeBanner, OrgScopePicker } from '@/components/common/OrgScopePicker/OrgScopePicker';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { Button } from '@/components/ui/Button/Button';

export default function DashboardLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const org = useAuth();
  const platform = usePlatform();
  const [mobileNav, setMobileNav] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  // Platform admins without an org session operate the whole dashboard
  // through X-Organization-Id: same pages, omnipotent, audited as platform.
  const platformMode =
    !org.isLoading &&
    !org.isAuthenticated &&
    !org.sessionError &&
    !platform.isLoading &&
    platform.isAuthenticated;

  const effective = useMemo(() => {
    if (!platformMode || !platform.admin) return null;
    const admin = platform.admin;
    const user: AuthUser = {
      id: `platform:${admin.id}`,
      email: admin.email,
      firstName: admin.firstName ?? 'Platform',
      lastName: admin.lastName ?? 'Admin',
      status: 'ACTIVE',
      roles: ['PLATFORM_ADMIN'],
      permissions: [],
    };
    return {
      ...org,
      user,
      permissions: [] as string[],
      roleLabels: ['PLATFORM_ADMIN'],
      isLoading: false,
      isAuthenticated: true,
      sessionError: null,
      can: () => true,
      canAny: () => true,
      isPlatformMode: true,
      logout: () => platform.logout(),
      refreshUser: async () => undefined,
    };
  }, [platformMode, platform, org]);

  // Definitive logout only (no session / revoked). Transient session errors
  // keep the user here with a retry — they must never bounce to login.
  useEffect(() => {
    if (!org.isLoading && !org.isAuthenticated && !org.sessionError && !platformMode && !platform.isLoading) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [org.isLoading, org.isAuthenticated, org.sessionError, platformMode, platform.isLoading, router, pathname]);

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

  const shell = effective ?? org;

  if (shell.isLoading || !shell.isAuthenticated) {
    // Transient session failure (flaky network): stay + retry, never bounce.
    if (!shell.isLoading && shell.sessionError) {
      return (
        <main className="mx-auto flex min-h-screen w-full max-w-xl flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-lg font-bold">Connection interrupted</p>
          <p className="text-sm text-muted-foreground">
            {getApiMessage(shell.sessionError, 'We could not reach your session. Your login is still valid — retry.')}
          </p>
          <Button variant="outline" onClick={() => void shell.retrySession()}>
            Retry
          </Button>
        </main>
      );
    }
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
    <AuthContext.Provider value={shell}>
      <RealtimeProvider>
        <div className="flex min-h-screen bg-background">
          <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r bg-card lg:block">
            <div className="flex h-16 items-center border-b px-4 text-lg font-bold">
              <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-sm text-white dark:bg-emerald-500 dark:text-emerald-950">P</span>
              Propora
            </div>
            <div className="h-[calc(100vh-4rem)]">
              <Sidebar />
            </div>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar onMenu={() => setMobileNav(true)} onCommand={() => setCmdOpen(true)} />
            <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 md:p-6">
              {platformMode && !platform.orgScope ? (
                <ScopeGate />
              ) : (
                <>
                  {platformMode ? <OrgScopeBanner /> : null}
                  {children}
                </>
              )}
            </main>
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
    </AuthContext.Provider>
  );
}

/** Platform session without a chosen tenant: pick one before any content. */
function ScopeGate(): React.JSX.Element {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center gap-4 text-center">
      <p className="text-lg font-bold">Choose an organization</p>
      <p className="text-sm text-muted-foreground">
        You are signed in as a platform admin. Pick a tenant to operate its dashboard — every
        action is audited under your admin identity.
      </p>
      <div className="w-full">
        <OrgScopePicker />
      </div>
    </div>
  );
}
