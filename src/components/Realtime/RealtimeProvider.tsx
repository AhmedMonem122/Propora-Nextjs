'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { getSupabaseBrowser, orgChannel, type RealtimeEvent } from '@/lib/supabase';

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
        // Prefix invalidation (['notifications'], NOT ['notifications','all']):
        // it matches every list/detail query under the prefix, including the
        // Topbar badge (['notifications', {unreadOnly…}]) that a full key misses.
        if (event === 'notification.created' || event === '*') {
          void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
        if (event === 'payment.paid' || event === '*') {
          void queryClient.invalidateQueries({ queryKey: ['payments'] });
          void queryClient.invalidateQueries({ queryKey: ['reports'] });
        }
        if (event === 'maintenance.assigned' || event === '*') {
          void queryClient.invalidateQueries({ queryKey: ['maintenance'] });
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
