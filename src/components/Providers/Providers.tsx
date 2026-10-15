'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from '@/components/ui/Sonner/Sonner';
import { AuthProvider } from '@/lib/auth-context';
import { PlatformAuthProvider } from '@/lib/platform-context';
import { createQueryClient } from '@/lib/query-client';
import enMessages from '@/messages/en.json';

export function Providers({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [queryClient] = useState(createQueryClient);
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <PlatformAuthProvider>
            <AuthProvider>
              {children}
              <Toaster richColors position="top-right" />
            </AuthProvider>
          </PlatformAuthProvider>
        </NextIntlClientProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
