'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { getSupabaseBrowser, orgChannel, type RealtimeEvent } from '@/lib/supabase';
import { qk } from '@/lib/query-client';

/**
 * Supabase Realtime broadcast → invalidate TanStack queries + toast + bell badge.
 * Channel: propora:org:<orgId>, events: notification.created | payment.paid | maintenance.assigned
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const orgId = user?.organizationId;

  useEffect(() => {
    if (!orgId) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const channel = supabase
      .channel(orgChannel(orgId))
      .on('broadcast', { event: '*' }, (payload: { event?: RealtimeEvent; payload?: { title?: string } }) => {
        const event = (payload.event ?? '*') as string;
        if (event === 'notification.created' || event === '*') {
          void queryClient.invalidateQueries({ queryKey: qk.notifications() });
        }
        if (event === 'payment.paid' || event === '*') {
          void queryClient.invalidateQueries({ queryKey: qk.payments() });
          void queryClient.invalidateQueries({ queryKey: qk.reportsFinancial });
        }
        if (event === 'maintenance.assigned' || event === '*') {
          void queryClient.invalidateQueries({ queryKey: qk.maintenance() });
        }
        const title = payload.payload?.title;
        if (event !== '*') toast.info(title ?? `Realtime update: ${event}`);
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orgId, queryClient]);

  return <>{children}</>;
}
