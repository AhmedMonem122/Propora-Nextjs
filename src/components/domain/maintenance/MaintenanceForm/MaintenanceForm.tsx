'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField, FormSelect } from '@/components/common/FormField/FormField';
import { UnitPicker, ResidentPicker } from '@/components/common/EntityPicker/pickers';
import { maintenanceSchema, type MaintenanceValues } from './schema';
import type { MaintenanceRequest } from '@/types/api';

function toForm(m?: MaintenanceRequest | null): MaintenanceValues {
  return {
    unitId: m?.unitId ?? '',
    residentId: m?.residentId ?? '',
    title: m?.title ?? '',
    description: m?.description ?? '',
    priority: (m?.priority as MaintenanceValues['priority']) ?? '',
    notes: m?.notes ?? '',
  };
}

function clean(v: MaintenanceValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) {
    if (val === '' || val === undefined) continue;
    out[k] = val;
  }
  return out;
}

export function MaintenanceForm({
  open,
  onOpenChange,
  initial,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: MaintenanceRequest | null;
  pending: boolean;
  onSubmit: (body: Record<string, unknown>) => void;
}): React.JSX.Element {
  const { register, handleSubmit, reset, control, formState } = useForm<MaintenanceValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: toForm(initial),
  });

  useEffect(() => {
    if (open) reset(toForm(initial));
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-label={initial ? 'Edit request' : 'Create request'}>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit request' : 'New maintenance request'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => onSubmit(clean(v)))} className="space-y-4" noValidate>
          <FormField label="Title" htmlFor="mf-title" error={formState.errors.title?.message}>
            <Input id="mf-title" {...register('title')} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Unit" htmlFor="mf-unit" error={formState.errors.unitId?.message}>
              <Controller
                control={control}
                name="unitId"
                render={({ field }) => (
                  <UnitPicker
                    id="mf-unit"
                    value={field.value || null}
                    onChange={(id) => field.onChange(id ?? '')}
                    error={formState.errors.unitId?.message}
                  />
                )}
              />
            </FormField>
            <FormField label="Priority" htmlFor="mf-prio">
              <FormSelect id="mf-prio" {...register('priority')}>
                <option value="">—</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </FormSelect>
            </FormField>
          </div>
          <FormField label="Description" htmlFor="mf-desc">
            <Textarea id="mf-desc" rows={3} {...register('description')} />
          </FormField>
          <FormField label="Resident (optional)" htmlFor="mf-res" error={formState.errors.residentId?.message}>
            <Controller
              control={control}
              name="residentId"
              render={({ field }) => (
                <ResidentPicker
                  id="mf-res"
                  value={field.value || null}
                  onChange={(id) => field.onChange(id ?? '')}
                  error={formState.errors.residentId?.message}
                  placeholder="No resident linked"
                />
              )}
            />
          </FormField>
          <DialogFooter>
            <Button type="submit" pending={pending}>
              {initial ? 'Save changes' : 'Create request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
