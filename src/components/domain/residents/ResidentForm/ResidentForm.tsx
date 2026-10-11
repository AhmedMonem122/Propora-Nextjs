'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField, FormSelect } from '@/components/common/FormField/FormField';
import { residentSchema, type ResidentValues } from './schema';
import type { Resident } from '@/types/api';

function toForm(r?: Resident | null): ResidentValues {
  return {
    userId: r?.userId ?? '',
    firstName: r?.firstName ?? '',
    lastName: r?.lastName ?? '',
    email: r?.email ?? '',
    phone: r?.phone ?? '',
    idNumber: r?.idNumber ?? '',
    status: (r?.status as ResidentValues['status']) ?? '',
    emergencyContact: r?.emergencyContact ?? '',
    notes: r?.notes ?? '',
  };
}

function clean(v: ResidentValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) {
    if (val === '' || val === undefined) continue;
    out[k] = val;
  }
  return out;
}

export function ResidentForm({
  open,
  onOpenChange,
  initial,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Resident | null;
  pending: boolean;
  onSubmit: (body: Record<string, unknown>) => void;
}): React.JSX.Element {
  const { register, handleSubmit, reset, formState } = useForm<ResidentValues>({
    resolver: zodResolver(residentSchema),
    defaultValues: toForm(initial),
  });

  useEffect(() => {
    if (open) reset(toForm(initial));
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" aria-label={initial ? 'Edit resident' : 'Create resident'}>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit resident' : 'New resident'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => onSubmit(clean(v)))} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <FormField label="First name" htmlFor="rf-first" error={formState.errors.firstName?.message}>
            <Input id="rf-first" autoComplete="given-name" {...register('firstName')} />
          </FormField>
          <FormField label="Last name" htmlFor="rf-last" error={formState.errors.lastName?.message}>
            <Input id="rf-last" autoComplete="family-name" {...register('lastName')} />
          </FormField>
          <FormField label="Email" htmlFor="rf-email" error={formState.errors.email?.message}>
            <Input id="rf-email" type="email" autoComplete="email" {...register('email')} />
          </FormField>
          <FormField label="Phone" htmlFor="rf-phone">
            <Input id="rf-phone" type="tel" autoComplete="tel" placeholder="+2010…" {...register('phone')} />
          </FormField>
          <FormField label="ID number" htmlFor="rf-idn">
            <Input id="rf-idn" {...register('idNumber')} />
          </FormField>
          <FormField label="Status" htmlFor="rf-status">
            <FormSelect id="rf-status" {...register('status')}>
              <option value="">—</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </FormSelect>
          </FormField>
          {initial ? (
            <FormField label="Linked user ID" htmlFor="rf-user" className="sm:col-span-2">
              <Input id="rf-user" placeholder="Portal user account id (same organization)" {...register('userId')} />
            </FormField>
          ) : null}
          <FormField label="Emergency contact" htmlFor="rf-emg" className="sm:col-span-2">
            <Input id="rf-emg" {...register('emergencyContact')} />
          </FormField>
          <FormField label="Notes" htmlFor="rf-notes" className="sm:col-span-2">
            <Textarea id="rf-notes" rows={3} {...register('notes')} />
          </FormField>
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" pending={pending}>
              {initial ? 'Save changes' : 'Create resident'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
