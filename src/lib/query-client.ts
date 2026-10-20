import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

/** Central query-key factory — realtime invalidation targets these prefixes. */
export const qk = {
  me: ['me'] as const,
  org: ['org'] as const,
  orgSettings: ['org', 'settings'] as const,
  orgInvite: ['org', 'invite-code'] as const,
  properties: (params?: unknown) => ['properties', params ?? 'all'] as const,
  property: (id: string) => ['properties', id] as const,
  buildings: (params?: unknown) => ['buildings', params ?? 'all'] as const,
  building: (id: string) => ['buildings', id] as const,
  units: (params?: unknown) => ['units', params ?? 'all'] as const,
  unit: (id: string) => ['units', id] as const,
  unitTypes: ['unit-types'] as const,
  // Picker-shaped copy of the catalog (bare rows array). NEVER reuse
  // `unitTypes` for option lists: the catalog page caches {rows,meta} and a
  // shape collision here once crashed the whole units page.
  unitTypeOptions: ['unit-types', 'options'] as const,
  residents: (params?: unknown) => ['residents', params ?? 'all'] as const,
  resident: (id: string) => ['residents', id] as const,
  leases: (params?: unknown) => ['leases', params ?? 'all'] as const,
  lease: (id: string) => ['leases', id] as const,
  payments: (params?: unknown) => ['payments', params ?? 'all'] as const,
  payment: (id: string) => ['payments', id] as const,
  maintenance: (params?: unknown) => ['maintenance', params ?? 'all'] as const,
  maintenanceOne: (id: string) => ['maintenance', id] as const,
  documents: (params?: unknown) => ['documents', params ?? 'all'] as const,
  notifications: (params?: unknown) => ['notifications', params ?? 'all'] as const,
  reportsFinancial: ['reports', 'financial'] as const,
  reportsOccupancy: ['reports', 'occupancy'] as const,
  users: (params?: unknown) => ['users', params ?? 'all'] as const,
  roles: ['roles'] as const,
  permissions: ['roles', 'permissions'] as const,
  auditLogs: (params?: unknown) => ['audit-logs', params ?? 'all'] as const,
  webhooks: ['webhooks'] as const,
  webhookDeliveries: (id: string) => ['webhooks', id, 'deliveries'] as const,
};
