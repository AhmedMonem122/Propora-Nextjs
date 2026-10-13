'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, FileText } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog/Dialog';
import type { Lease, Property, Resident } from '@/types/api';

/**
 * ⌘K global search across entities using existing ?search= endpoints.
 * The single most impressive 2-hour feature — jump anywhere by name.
 */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }): React.JSX.Element {
  const router = useRouter();
  const [q, setQ] = useState('');

  const handleOpenChange = (v: boolean): void => {
    if (!v) setQ('');
    onOpenChange(v);
  };

  const enabled = open && q.trim().length >= 2;
  const params = { search: q.trim(), limit: 4 };

  const props = useQuery({
    queryKey: ['cmd', 'properties', q],
    queryFn: async () => (await apiClient.get('/properties', { params })).data?.data as Property[],
    enabled,
  });
  const residents = useQuery({
    queryKey: ['cmd', 'residents', q],
    queryFn: async () => (await apiClient.get('/residents', { params })).data?.data as Resident[],
    enabled,
  });
  const leases = useQuery({
    queryKey: ['cmd', 'leases', q],
    queryFn: async () => (await apiClient.get('/leases', { params })).data?.data as Lease[],
    enabled,
  });

  const go = (href: string): void => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl" aria-label="Global search">
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <Command label="Global search" className="[&_[cmdk-input]]:w-full">
          <div className="border-b px-4">
            <Command.Input
              value={q}
              onValueChange={setQ}
              placeholder="Search properties, residents, leases…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
              {q.trim().length < 2 ? 'Type at least 2 characters to search.' : 'No results.'}
            </Command.Empty>
            {(props.data?.length ?? 0) > 0 && (
              <Command.Group heading="Properties" className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {props.data?.map((p) => (
                  <Command.Item
                    key={p.id}
                    value={`property-${p.id}-${p.name}`}
                    onSelect={() => go(`/dashboard/properties/${p.id}`)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-muted"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    {p.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            {(residents.data?.length ?? 0) > 0 && (
              <Command.Group heading="Residents" className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {residents.data?.map((r) => (
                  <Command.Item
                    key={r.id}
                    value={`resident-${r.id}-${r.firstName}-${r.lastName}`}
                    onSelect={() => go(`/dashboard/residents`)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-muted"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    {r.firstName} {r.lastName}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            {(leases.data?.length ?? 0) > 0 && (
              <Command.Group heading="Leases" className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {leases.data?.map((l) => (
                  <Command.Item
                    key={l.id}
                    value={`lease-${l.id}`}
                    onSelect={() => go(`/dashboard/leases`)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-muted"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    Lease · {l.id.slice(0, 8)}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
