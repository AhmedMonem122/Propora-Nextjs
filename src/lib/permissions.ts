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
  report: ['report:read'],
  user: ['user:create', 'user:read', 'user:update', 'user:delete'],
  role: ['role:create', 'role:read', 'role:update', 'role:delete'],
  audit: ['audit:read'],
  webhook: ['webhook:create', 'webhook:read', 'webhook:update', 'webhook:delete'],
  settings: ['settings:read', 'settings:update'],
} as const;

export type PermissionName =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS][number] | (string & {});

export function normalizePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const item of input) {
    if (typeof item === 'string') out.push(item);
    else if (item && typeof item === 'object' && 'name' in item && typeof item.name === 'string')
      out.push(item.name);
  }
  return [...new Set(out)];
}

export function roleNames(roles: unknown): string[] {
  if (!Array.isArray(roles)) return [];
  return roles
    .map((r) => (typeof r === 'string' ? r : r?.name))
    .filter((n): n is string => typeof n === 'string');
}

/** UI gating only — authorization is enforced by the backend. Never trust the client. */
export function hasPermission(granted: string[] | Set<string>, name: string): boolean {
  if (granted instanceof Set) return granted.has(name);
  return granted.includes(name);
}
