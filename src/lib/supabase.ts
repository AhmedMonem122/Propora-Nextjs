'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

/** Browser client for Supabase Realtime broadcast only (anon key, no secrets). */
export function getSupabaseBrowser(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!browserClient) browserClient = createClient(url, key);
  return browserClient;
}

export type RealtimeEvent =
  | 'notification.created'
  | 'payment.paid'
  | 'maintenance.assigned'
  | (string & {});

export function orgChannel(orgId: string): string {
  return `propora:org:${orgId}`;
}
