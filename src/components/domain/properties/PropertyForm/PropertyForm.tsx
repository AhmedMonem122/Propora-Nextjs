'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodSchemaResolver } from '@/lib/rhf';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField, FormSelect } from '@/components/common/FormField/FormField';
import { propertySchema, type PropertyValues } from './schema';
import type { Property } from '@/types/api';

function toForm(p?: Property | null): PropertyValues {
  return {
    name: p?.name ?? '',
    type: (p?.type as PropertyValues['type']) ?? '',
    addressLine1: p?.addressLine1 ?? '',
    addressLine2: p?.addressLine2 ?? '',
    city: p?.city ?? '',
    state: p?.state ?? '',
    country: p?.country ?? '',
    postalCode: p?.postalCode ?? '',
    latitude: p && 'latitude' in p ? ((p as unknown as { latitude?: number }).latitude ?? undefined) : undefined,
    longitude: p && 'longitude' in p ? ((p as unknown as { longitude?: number }).longitude ?? undefined) : undefined,
    description: p?.description ?? '',
  };
}

function clean(v: PropertyValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) {
    if (val === '' || val === undefined || (typeof val === 'number' && Number.isNaN(val))) continue;
    out[k] = val;
  }
  return out;
}

export function PropertyForm({
  open,
  onOpenChange,
  initial,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Property | null;
  pending: boolean;
  onSubmit: (body: Record<string, unknown>) => void;
}): React.JSX.Element {
  const { register, handleSubmit, reset, formState } = useForm<PropertyValues>({
    resolver: zodSchemaResolver(propertySchema),
    defaultValues: toForm(initial),
  });

  useEffect(() => {
    if (open) reset(toForm(initial));
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" aria-label={initial ? 'Edit property' : 'Create property'}>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit property' : 'New property'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => onSubmit(clean(v)))} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <FormField label="Name" htmlFor="pf-name" error={formState.errors.name?.message} className="sm:col-span-2">
            <Input id="pf-name" {...register('name')} />
          </FormField>
          <FormField label="Type" htmlFor="pf-type">
            <FormSelect id="pf-type" {...register('type')}>
              <option value="">—</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="MIXED_USE">Mixed use</option>
              <option value="INDUSTRIAL">Industrial</option>
              <option value="LAND">Land</option>
            </FormSelect>
          </FormField>
          <FormField label="City" htmlFor="pf-city">
            <Input id="pf-city" {...register('city')} />
          </FormField>
          <FormField label="Address line 1" htmlFor="pf-a1" className="sm:col-span-2">
            <Input id="pf-a1" {...register('addressLine1')} />
          </FormField>
          <FormField label="Address line 2" htmlFor="pf-a2">
            <Input id="pf-a2" {...register('addressLine2')} />
          </FormField>
          <FormField label="State" htmlFor="pf-state">
            <Input id="pf-state" {...register('state')} />
          </FormField>
          <FormField label="Country" htmlFor="pf-country">
            <Input id="pf-country" {...register('country')} />
          </FormField>
          <FormField label="Postal code" htmlFor="pf-postal">
            <Input id="pf-postal" {...register('postalCode')} />
          </FormField>
          <FormField label="Description" htmlFor="pf-desc" className="sm:col-span-2">
            <Textarea id="pf-desc" rows={3} {...register('description')} />
          </FormField>
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" pending={pending}>
              {initial ? 'Save changes' : 'Create property'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
