'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PlatformAuthProvider, usePlatform } from '@/lib/platform-context';
import { PlatformSidebar } from '@/components/layout/PlatformSidebar/PlatformSidebar';
import { OrgScopeBanner } from '@/components/common/OrgScopePicker/OrgScopePicker';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';

function Shell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated, admin, logout } = usePlatform();
  // "Back to app" only makes sense with a live organization session —
  // otherwise it lands on a dashboard that instantly bounces to login.
  const { isAuthenticated: hasOrgSession } = useAuth();
  const isLogin = pathname === '/platform/login';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLogin) {
      router.replace('/platform/login');
    }
  }, [isLoading, isAuthenticated, isLogin, router]);

  if (isLogin) return <>{children}</>;

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen" role="status" aria-label="Loading">
        <div className="hidden w-60 shrink-0 border-r p-3 lg:block">
          <Skeleton className="h-8 w-3/4" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
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
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r bg-card lg:block">
        <div className="flex h-16 items-center justify-between border-b px-4">
          <span className="text-lg font-bold">
            <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm text-white">P</span>
            Platform
          </span>
        </div>
        <div className="h-[calc(100vh-4rem)]">
          <PlatformSidebar />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center gap-2 border-b bg-card px-4">
          <span className="truncate text-sm text-muted-foreground">{admin?.email ?? ''}</span>
          <span className="ml-auto" />
          {hasOrgSession ? (
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Back to app
            </Link>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void logout()}
            aria-label="Log out of platform"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
          </Button>
        </div>
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 md:p-6">
          <OrgScopeBanner />
          {children}
        </main>
      </div>
    </div>
  );
}

export default function PlatformLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <PlatformAuthProvider>
      <Shell>{children}</Shell>
    </PlatformAuthProvider>
  );
}
