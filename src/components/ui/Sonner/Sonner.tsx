'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster(props: React.ComponentProps<typeof SonnerToaster>): React.JSX.Element {
  return <SonnerToaster theme="system" {...props} />;
}
