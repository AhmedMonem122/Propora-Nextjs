'use client';

import { apiClient } from '@/lib/api-client';
import { EntityPicker, type EntityPage } from './EntityPicker';

interface PickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
  selectedLabel?: string;
}

type Row = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const joinSub = (...parts: Array<string | undefined>): string | undefined => {
  const s = parts.filter((p): p is string => Boolean(p)).join(' · ');
  return s === '' ? undefined : s;
};

async function getPage(
  path: string,
  search: string,
  page: number,
  extra?: Record<string, unknown>,
): Promise<EntityPage> {
  const params: Record<string, unknown> = { page, limit: 20, ...(extra ?? {}) };
  if (search.trim() !== '') params.search = search.trim();
  const res = await apiClient.get(path, { params });
  const body = res.data as { data?: Row[] } & Row;
  const rows: Row[] = Array.isArray(body) ? (body as Row[]) : ((body.data as Row[]) ?? []);
  const meta = (Array.isArray(body) ? null : (body.meta as EntityPage['meta'])) ?? null;
  return { data: rows, meta };
}

function personLabel(r: Row): string {
  const name = `${str(r.firstName)} ${str(r.lastName)}`.trim();
  return name === '' ? str(r.email) || str(r.id).slice(0, 8) : name;
}

export function PropertyPicker(props: PickerProps): React.JSX.Element {
  return (
    <EntityPicker
      {...props}
      cacheKey="picker-properties"
      dialogTitle="Select property"
      fetchPage={({ search, page }) => getPage('/properties', search, page)}
      getLabel={(r) => str(r.name) || str(r.id).slice(0, 8)}
      getSub={(r) => joinSub(str(r.city) || undefined, str(r.country) || undefined)}
    />
  );
}

export function BuildingPicker(
  props: PickerProps & { propertyId: string },
): React.JSX.Element {
  const { propertyId, ...rest } = props;
  return (
    <EntityPicker
      {...rest}
      cacheKey={`picker-buildings-${propertyId}`}
      dialogTitle="Select building"
      fetchPage={({ search, page }) =>
        getPage(`/properties/${propertyId}/buildings`, search, page)
      }
      getLabel={(r) => str(r.name) || str(r.id).slice(0, 8)}
      getSub={(r) => joinSub(str(r.code) || undefined)}
    />
  );
}

export function UnitPicker(
  props: PickerProps & { buildingId?: string; propertyId?: string },
): React.JSX.Element {
  const { buildingId, propertyId, ...rest } = props;
  const path = buildingId
    ? `/buildings/${buildingId}/units`
    : propertyId
      ? `/properties/${propertyId}/units`
      : '/units';
  return (
    <EntityPicker
      {...rest}
      cacheKey={`picker-units-${buildingId ?? propertyId ?? 'all'}`}
      dialogTitle="Select unit"
      fetchPage={({ search, page }) => getPage(path, search, page)}
      getLabel={(r) => joinSub(str(r.name) || undefined, str(r.unitNumber) ? `#${str(r.unitNumber)}` : undefined) ?? str(r.id).slice(0, 8)}
      getSub={(r) => {
        const b = r.building as Row | undefined;
        const p = (b?.property ?? r.property) as Row | undefined;
        return joinSub(
          b ? str(b.name) || undefined : undefined,
          p ? str(p.name) || undefined : undefined,
          str(r.status) || undefined,
        );
      }}
    />
  );
}

export function ResidentPicker(props: PickerProps): React.JSX.Element {
  return (
    <EntityPicker
      {...props}
      cacheKey="picker-residents"
      dialogTitle="Select resident"
      fetchPage={({ search, page }) => getPage('/residents', search, page)}
      getLabel={personLabel}
      getSub={(r) => joinSub(str(r.email) || undefined, str(r.phone) || undefined)}
    />
  );
}

export function UserPicker(props: PickerProps): React.JSX.Element {
  return (
    <EntityPicker
      {...props}
      cacheKey="picker-users"
      dialogTitle="Select user"
      fetchPage={({ search, page }) => getPage('/users', search, page)}
      getLabel={personLabel}
      getSub={(r) => str(r.email) || undefined}
    />
  );
}

export function LeasePicker(props: PickerProps): React.JSX.Element {
  return (
    <EntityPicker
      {...props}
      cacheKey="picker-leases"
      dialogTitle="Select lease"
      fetchPage={({ search, page }) => getPage('/leases', search, page)}
      getLabel={(r) => `Lease ${str(r.id).slice(0, 8)}`}
      getSub={(r) => str(r.status) || undefined}
    />
  );
}

export function PaymentPicker(props: PickerProps): React.JSX.Element {
  return (
    <EntityPicker
      {...props}
      cacheKey="picker-payments"
      dialogTitle="Select payment"
      fetchPage={({ search, page }) => getPage('/payments', search, page)}
      getLabel={(r) => str(r.invoiceNo) || `Payment ${str(r.id).slice(0, 8)}`}
      getSub={(r) => joinSub(str(r.status) || undefined)}
    />
  );
}

export function MaintenancePicker(props: PickerProps): React.JSX.Element {
  return (
    <EntityPicker
      {...props}
      cacheKey="picker-maintenance"
      dialogTitle="Select maintenance request"
      fetchPage={({ search, page }) => getPage('/maintenance/requests', search, page)}
      getLabel={(r) => str(r.title) || str(r.id).slice(0, 8)}
      getSub={(r) => str(r.status) || undefined}
    />
  );
}
