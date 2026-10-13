/** Permission-name helpers mirroring the backend catalog (53 permissions). */

export const PERMISSIONS = {
  property: ['property:create', 'property:read', 'property:update', 'property:delete'],
  building: ['building:create', 'building:read', 'building:update', 'building:delete'],
  unit: ['unit:create', 'unit:read', 'unit:update', 'unit:delete'],
  resident: ['resident:create', 'resident:read', 'resident:update', 'resident:delete'],
  lease: ['lease:create', 'lease:read', 'lease:update', 'lease:delete'],
  payment: ['payment:create', 'payment:read', 'payment:update', 'payment:delete'],
  maintenance: ['maintenance:create', 'maintenance:read', 'maintenance:update', 'maintenance:delete'],
  document: ['document:create', 'document:read', 'document:update', 'document:delete'],
  notification: ['notification:read'],
  report: ['report:financial', 'report:occupancy'],
  user: ['user:create', 'user:read', 'user:update', 'user:delete'],
  role: ['role:create', 'role:read', 'role:update', 'role:delete'],
  audit: ['audit:read'],
  webhook: ['webhook:create', 'webhook:read', 'webhook:update', 'webhook:delete'],
  settings: ['settings:read', 'settings:update'],
} as const;

export type PermissionName =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS][number] | (string & {});

export function normalizePermissions(input: unknown): string[] {
  if (Array.isArray(input)) {
    const out: string[] = [];
    for (const item of input) {
      if (typeof item === 'string') out.push(item);
      else if (item && typeof item === 'object' && 'name' in item && typeof item.name === 'string')
        out.push(item.name);
    }
    return [...new Set(out)];
  }
  // The API may serialize grants as a map: { "property:read": true, ... }
  if (input && typeof input === 'object') {
    return Object.entries(input as Record<string, unknown>)
      .filter(([, v]) => Boolean(v) && typeof v !== 'object')
      .map(([k]) => k);
  }
  return [];
}

export function roleNames(roles: unknown): string[] {
  if (!Array.isArray(roles)) return [];
  return roles
    .map((r) => (typeof r === 'string' ? r : r?.name))
    .filter((n): n is string => typeof n === 'string');
}

/**
 * The org owner is omnipotent server-side but the API returns an empty
 * permission set for the role — gate them open client-side (a wrongly shown
 * button still 403s cleanly, enforced by the backend).
 */
export function isOwnerRole(roles: string[]): boolean {
  return roles.some((r) => {
    const n = r.toLowerCase();
    return n === 'organization_owner' || n === 'owner' || n === 'superadmin' || n === 'super_admin';
  });
}

/** UI gating only — authorization is enforced by the backend. Never trust the client. */
export function hasPermission(granted: string[] | Set<string>, name: string): boolean {
  if (granted instanceof Set) return granted.has(name);
  return granted.includes(name);
}

/** True when ANY of the names is granted (e.g. either financial report). */
export function hasAnyPermission(granted: string[] | Set<string>, names: string[]): boolean {
  return names.some((name) => hasPermission(granted, name));
}
