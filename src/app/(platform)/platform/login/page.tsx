'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePlatform } from '@/lib/platform-context';

/**
 * Back-compat alias: sign-in moved to the unified /login form (pick the
 * "Platform admin" role there). This route just forwards, preserving ?next=.
 */
export default function PlatformLoginPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = usePlatform();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace('/platform');
      return;
    }
    const next = searchParams.get('next');
    router.replace(
      next ? `/login?role=ADMIN&next=${encodeURIComponent(next)}` : '/login?role=ADMIN',
    );
  }, [isLoading, isAuthenticated, router, searchParams]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
    </main>
  );
}
