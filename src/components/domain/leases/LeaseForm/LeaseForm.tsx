'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodSchemaResolver } from '@/lib/rhf';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField, FormSelect } from '@/components/common/FormField/FormField';
import { CurrencyInput } from '@/components/common/CurrencyInput/CurrencyInput';
import { UnitPicker, ResidentPicker } from '@/components/common/EntityPicker/pickers';
import { toDateInput } from '@/lib/format';
import { leaseSchema, type LeaseValues } from './schema';
import type { Lease } from '@/types/api';

function toForm(l?: Lease | null): LeaseValues {
  return {
    unitId: l?.unitId ?? '',
    residentId: l?.residentId ?? '',
    startDate: toDateInput(l?.startDate),
    endDate: toDateInput(l?.endDate),
    rentAmount: l?.rentAmount ?? (undefined as unknown as number),
    depositAmount: l?.depositAmount ?? undefined,
    paymentFrequency: (l?.paymentFrequency as LeaseValues['paymentFrequency']) ?? '',
    status: (l?.status as LeaseValues['status']) ?? '',
    notes: l?.notes ?? '',
  };
}

function clean(v: LeaseValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) {
    if (val === '' || val === undefined || (typeof val === 'number' && Number.isNaN(val))) continue;
    out[k] = val;
  }
  return out;
}

export function LeaseForm({
  open,
  onOpenChange,
  initial,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Lease | null;
  pending: boolean;
  onSubmit: (body: Record<string, unknown>) => void;
}): React.JSX.Element {
  const { register, handleSubmit, reset, control, formState } = useForm<LeaseValues>({
    resolver: zodSchemaResolver(leaseSchema),
    defaultValues: toForm(initial),
  });

  useEffect(() => {
    if (open) reset(toForm(initial));
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" aria-label={initial ? 'Edit lease' : 'Create lease'}>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit lease' : 'New lease'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => onSubmit(clean(v)))} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <FormField label="Unit" htmlFor="lf-unit" error={formState.errors.unitId?.message}>
            <Controller
              control={control}
              name="unitId"
              render={({ field }) => (
                <UnitPicker
                  id="lf-unit"
                  value={field.value || null}
                  onChange={(id) => field.onChange(id ?? '')}
                  error={formState.errors.unitId?.message}
                  selectedLabel={
                    initial?.unit
                      ? `${initial.unit.name}${initial.unit.unitNumber ? ` #${initial.unit.unitNumber}` : ''}`
                      : undefined
                  }
                />
              )}
            />
          </FormField>
          <FormField label="Resident" htmlFor="lf-res" error={formState.errors.residentId?.message}>
            <Controller
              control={control}
              name="residentId"
              render={({ field }) => (
                <ResidentPicker
                  id="lf-res"
                  value={field.value || null}
                  onChange={(id) => field.onChange(id ?? '')}
                  error={formState.errors.residentId?.message}
                  selectedLabel={
                    initial?.resident
                      ? `${initial.resident.firstName} ${initial.resident.lastName}`.trim() || undefined
                      : undefined
                  }
                />
              )}
            />
          </FormField>
          <FormField label="Start date" htmlFor="lf-start" error={formState.errors.startDate?.message}>
            <Input id="lf-start" type="date" {...register('startDate')} />
          </FormField>
          <FormField label="End date" htmlFor="lf-end">
            <Input id="lf-end" type="date" {...register('endDate')} />
          </FormField>
          <FormField label="Rent amount" htmlFor="lf-rent" error={formState.errors.rentAmount?.message}>
            <Controller
              control={control}
              name="rentAmount"
              render={({ field }) => (
                <CurrencyInput id="lf-rent" value={field.value ?? ''} onValueChange={(v) => field.onChange(v.floatValue)} />
              )}
            />
          </FormField>
          <FormField label="Deposit amount" htmlFor="lf-dep">
            <Controller
              control={control}
              name="depositAmount"
              render={({ field }) => (
                <CurrencyInput id="lf-dep" value={field.value ?? ''} onValueChange={(v) => field.onChange(v.floatValue)} />
              )}
            />
          </FormField>
          <FormField label="Frequency" htmlFor="lf-freq">
            <FormSelect id="lf-freq" {...register('paymentFrequency')}>
              <option value="">—</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="SEMI_ANNUAL">Semi-annual</option>
              <option value="ANNUAL">Annual</option>
            </FormSelect>
          </FormField>
          <FormField label="Status" htmlFor="lf-status">
            <FormSelect id="lf-status" {...register('status')}>
              <option value="">—</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ACTIVE">Active</option>
              <option value="ENDED">Ended</option>
              <option value="TERMINATED">Terminated</option>
            </FormSelect>
          </FormField>
          <FormField label="Notes" htmlFor="lf-notes" className="sm:col-span-2">
            <Textarea id="lf-notes" rows={3} {...register('notes')} />
          </FormField>
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" pending={pending}>
              {initial ? 'Save changes' : 'Create lease'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
