'use client';

import { Building2, X } from 'lucide-react';
import { usePlatform } from '@/lib/platform-context';
import { EntityPicker } from '@/components/common/EntityPicker/EntityPicker';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button/Button';

/**
 * "Act as organization" switcher for platform admins. Sets
 * X-Organization-Id on subsequent org API calls (backend override).
 */
export function OrgScopePicker({ compact }: { compact?: boolean }): React.JSX.Element {
  const { orgScope, setScope } = usePlatform();

  return (
    <EntityPicker
      value={orgScope}
      onChange={(id) => {
        if (!id) {
          setScope(null);
          return;
        }
        void apiClient.get(`/platform/organizations/${id}`).then((res) => {
          const data = res.data as { name?: string } | undefined;
          setScope(id, data?.name ?? id.slice(0, 8));
        });
      }}
      cacheKey="picker-platform-orgs"
      dialogTitle="Act as organization"
      placeholder={compact ? 'Act as…' : 'Platform scope — pick an org to act as…'}
      fetchPage={async ({ search, page }) => {
        const res = await apiClient.get('/platform/organizations', {
          params: { search: search || undefined, page, limit: 20 },
        });
        const body = res.data as {
          data?: Array<Record<string, unknown>>;
          meta?: { hasNext?: boolean };
        };
        return { data: body.data ?? [], meta: body.meta ?? null };
      }}
      getLabel={(r) => String(r.name ?? String(r.id).slice(0, 8))}
      getSub={(r) => {
        const slug = r.slug;
        return typeof slug === 'string' && slug !== '' ? slug : undefined;
      }}
    />
  );
}

export function OrgScopeBanner(): React.JSX.Element | null {
  const { orgScope, orgScopeName, setScope } = usePlatform();
  if (!orgScope) return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-800 dark:bg-emerald-950"
    >
      <Building2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
      <span>
        Acting as <strong>{orgScopeName ?? orgScope.slice(0, 8)}</strong> — org API calls carry this scope.
      </span>
      <span className="ml-auto flex items-center gap-1">
        <span className="w-52">
          <OrgScopePicker compact />
        </span>
        <Button variant="ghost" size="sm" onClick={() => setScope(null)} aria-label="Clear organization scope">
          <X className="h-4 w-4" aria-hidden="true" /> Platform scope
        </Button>
      </span>
    </div>
  );
}
