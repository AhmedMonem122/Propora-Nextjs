'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodSchemaResolver } from '@/lib/rhf';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { qk } from '@/lib/query-client';
import { normalizeList } from '@/lib/list';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField, FormSelect } from '@/components/common/FormField/FormField';
import { CurrencyInput } from '@/components/common/CurrencyInput/CurrencyInput';
import { unitSchema, type UnitValues } from './schema';
import type { Unit, UnitType } from '@/types/api';

function toForm(u?: Unit | null): UnitValues {
  return {
    name: u?.name ?? '',
    unitNumber: u?.unitNumber ?? '',
    type: u?.type ?? '',
    unitTypeId: u?.unitTypeId ?? '',
    bedrooms: u?.bedrooms ?? undefined,
    bathrooms: u?.bathrooms ?? undefined,
    areaSqm: u?.areaSqm ?? undefined,
    floor: u?.floor ?? undefined,
    rentAmount: u?.rentAmount ?? undefined,
    depositAmount: u?.depositAmount ?? undefined,
    status: (u?.status as UnitValues['status']) ?? '',
    description: u?.description ?? '',
  };
}

function clean(v: UnitValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) {
    if (val === '' || val === undefined || (typeof val === 'number' && Number.isNaN(val))) continue;
    out[k] = val;
  }
  return out;
}

export function UnitForm({
  open,
  onOpenChange,
  initial,
  pending,
  onSubmit,
  buildingSlot,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Unit | null;
  pending: boolean;
  onSubmit: (body: Record<string, unknown>) => void;
  /** Optional node rendered first (e.g. a building picker when the parent is unknown). */
  buildingSlot?: React.ReactNode;
}): React.JSX.Element {
  const { register, handleSubmit, reset, control, formState } = useForm<UnitValues>({
    resolver: zodSchemaResolver(unitSchema),
    defaultValues: toForm(initial),
  });

  // Picker-only fetch on its own key, gated to the open dialog: it must never
  // share the catalog key (shape collision crashed /units before). The
  // Array guard is belt-and-braces — a shape regression degrades to an
  // empty picker instead of a render throw.
  const typesQuery = useQuery({
    queryKey: qk.unitTypeOptions,
    queryFn: async () => normalizeList<UnitType>((await apiClient.get('/unit-types')).data).rows,
    staleTime: 5 * 60_000,
    enabled: open,
  });
  const typeOptions: UnitType[] = Array.isArray(typesQuery.data)
    ? typesQuery.data
    : (typesQuery.data as unknown as { rows?: UnitType[] } | undefined)?.rows ?? [];

  useEffect(() => {
    if (open) reset(toForm(initial));
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" aria-label={initial ? 'Edit unit' : 'Create unit'}>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit unit' : 'New unit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => onSubmit(clean(v)))} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          {buildingSlot ? <div className="sm:col-span-2">{buildingSlot}</div> : null}
          <FormField label="Name" htmlFor="uf-name" error={formState.errors.name?.message} className="sm:col-span-2">
            <Input id="uf-name" {...register('name')} />
          </FormField>
          <FormField label="Unit number" htmlFor="uf-num">
            <Input id="uf-num" {...register('unitNumber')} />
          </FormField>
          <FormField label="Unit type" htmlFor="uf-utype">
            <FormSelect id="uf-utype" {...register('unitTypeId')}>
              <option value="">—</option>
              {(typeOptions).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Bedrooms" htmlFor="uf-bed">
            <Input id="uf-bed" type="number" min={0} {...register('bedrooms')} />
          </FormField>
          <FormField label="Bathrooms" htmlFor="uf-bath">
            <Input id="uf-bath" type="number" min={0} step="0.5" {...register('bathrooms')} />
          </FormField>
          <FormField label="Area (sqm)" htmlFor="uf-area">
            <Input id="uf-area" type="number" min={0} step="0.1" {...register('areaSqm')} />
          </FormField>
          <FormField label="Floor" htmlFor="uf-floor">
            <Input id="uf-floor" type="number" {...register('floor')} />
          </FormField>
          <FormField label="Rent amount" htmlFor="uf-rent">
            <Controller
              control={control}
              name="rentAmount"
              render={({ field }) => (
                <CurrencyInput id="uf-rent" value={field.value ?? ''} onValueChange={(v) => field.onChange(v.floatValue)} />
              )}
            />
          </FormField>
          <FormField label="Deposit amount" htmlFor="uf-dep">
            <Controller
              control={control}
              name="depositAmount"
              render={({ field }) => (
                <CurrencyInput id="uf-dep" value={field.value ?? ''} onValueChange={(v) => field.onChange(v.floatValue)} />
              )}
            />
          </FormField>
          <FormField label="Status" htmlFor="uf-status">
            <FormSelect id="uf-status" {...register('status')}>
              <option value="">—</option>
              <option value="VACANT">Vacant</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="UNDER_MAINTENANCE">Under maintenance</option>
              <option value="INACTIVE">Inactive</option>
            </FormSelect>
          </FormField>
          <FormField label="Type label" htmlFor="uf-type">
            <Input id="uf-type" placeholder="e.g. 2 Bedroom" {...register('type')} />
          </FormField>
          <FormField label="Description" htmlFor="uf-desc" className="sm:col-span-2">
            <Textarea id="uf-desc" rows={3} {...register('description')} />
          </FormField>
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" pending={pending}>
              {initial ? 'Save changes' : 'Create unit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
