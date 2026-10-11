'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodSchemaResolver } from '@/lib/rhf';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField, FormSelect } from '@/components/common/FormField/FormField';
import { buildingSchema, type BuildingValues } from './schema';
import type { Building } from '@/types/api';

function toForm(b?: Building | null): BuildingValues {
  return {
    name: b?.name ?? '',
    code: b?.code ?? '',
    totalFloors: b?.totalFloors ?? undefined,
    address: b?.address ?? '',
    description: b?.description ?? '',
    status: (b?.status as BuildingValues['status']) ?? '',
  };
}

function clean(v: BuildingValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) {
    if (val === '' || val === undefined || (typeof val === 'number' && Number.isNaN(val))) continue;
    out[k] = val;
  }
  return out;
}

export function BuildingForm({
  open,
  onOpenChange,
  initial,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Building | null;
  pending: boolean;
  onSubmit: (body: Record<string, unknown>) => void;
}): React.JSX.Element {
  const { register, handleSubmit, reset, formState } = useForm<BuildingValues>({
    resolver: zodSchemaResolver(buildingSchema),
    defaultValues: toForm(initial),
  });

  useEffect(() => {
    if (open) reset(toForm(initial));
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-label={initial ? 'Edit building' : 'Create building'}>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit building' : 'New building'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => onSubmit(clean(v)))} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <FormField label="Name" htmlFor="bf-name" error={formState.errors.name?.message} className="sm:col-span-2">
            <Input id="bf-name" {...register('name')} />
          </FormField>
          <FormField label="Code" htmlFor="bf-code">
            <Input id="bf-code" {...register('code')} />
          </FormField>
          <FormField label="Total floors" htmlFor="bf-floors">
            <Input id="bf-floors" type="number" min={0} {...register('totalFloors')} />
          </FormField>
          <FormField label="Status" htmlFor="bf-status">
            <FormSelect id="bf-status" {...register('status')}>
              <option value="">—</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </FormSelect>
          </FormField>
          <FormField label="Address" htmlFor="bf-address" className="sm:col-span-2">
            <Input id="bf-address" {...register('address')} />
          </FormField>
          <FormField label="Description" htmlFor="bf-desc" className="sm:col-span-2">
            <Textarea id="bf-desc" rows={3} {...register('description')} />
          </FormField>
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" pending={pending}>
              {initial ? 'Save changes' : 'Create building'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
