'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { applyFormErrors, getApiMessage } from '@/lib/api-client';
import { REGISTER_ROLE_OPTIONS, roleNeedsInviteCode } from '@/lib/roles';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { PasswordInput } from '@/components/ui/PasswordInput/PasswordInput';
import { Label } from '@/components/ui/Label/Label';
import { FormSelect } from '@/components/common/FormField/FormField';
import { cn } from '@/lib/utils';

const schema = z
  .object({
    organizationName: z.string().optional().or(z.literal('')),
    inviteCode: z.string().optional().or(z.literal('')),
    role: z.string().min(1, 'Choose a role.'),
    firstName: z.string().min(2, 'Enter your first name.'),
    lastName: z.string().min(2, 'Enter your last name.'),
    email: z.string().email('Enter a valid email.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
  })
  .superRefine((v, ctx) => {
    // Mirrors the API contract: OWNER provisions a new org (name required),
    // every other role joins one (invite code required).
    if (roleNeedsInviteCode(v.role)) {
      if (!v.inviteCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['inviteCode'],
          message: 'Ask your organization admin for the invite code.',
        });
      }
    } else if (!v.organizationName || v.organizationName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['organizationName'],
        message: 'Enter your organization name.',
      });
    }
  });

type Values = z.infer<typeof schema>;

export function RegisterForm(): React.JSX.Element {
  const router = useRouter();
  const { register: signup } = useAuth();
  const { register, handleSubmit, control, watch, formState, setError } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'OWNER' },
  });
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const role = watch('role');

  const onSubmit = async (v: Values): Promise<void> => {
    try {
      await signup({
        organizationName: v.organizationName || undefined,
        inviteCode: v.inviteCode || undefined,
        role: v.role,
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        password: v.password,
      });
      toast.success(v.role === 'OWNER' ? 'Organization created. Welcome!' : 'Welcome aboard!');
      router.replace('/dashboard');
    } catch (e) {
      toast.error(getApiMessage(e, 'Registration failed.'));
      applyFormErrors(e, setError, ['organizationName', 'inviteCode', 'role', 'firstName', 'lastName', 'email', 'password']);
    }
  };

  const creating = !roleNeedsInviteCode(role);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Registration mode">
        {(
          [
            { id: 'create', label: 'Create organization' },
            { id: 'join', label: 'Join with code' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={mode === t.id}
            onClick={() => setMode(t.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              mode === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="reg-role">Register as</Label>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <FormSelect
                id="reg-role"
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  setMode(roleNeedsInviteCode(e.target.value) ? 'join' : 'create');
                }}
                aria-invalid={Boolean(formState.errors.role)}
              >
                {REGISTER_ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} — {r.hint}
                  </option>
                ))}
              </FormSelect>
            )}
          />
          {formState.errors.role ? <p className="text-xs text-red-600" role="alert">{formState.errors.role.message}</p> : null}
          <p className="text-xs text-muted-foreground">
            Platform admins can’t self-register — those accounts are created server-side.
          </p>
        </div>
        {creating || mode === 'create' ? (
          <div className="space-y-1.5">
            <Label htmlFor="reg-org">Organization name</Label>
            <Input id="reg-org" autoComplete="organization" {...register('organizationName')} />
            {formState.errors.organizationName ? <p className="text-xs text-red-600" role="alert">{formState.errors.organizationName.message}</p> : null}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="reg-code">Invite code</Label>
            <Input id="reg-code" placeholder="Paste the code from your admin" {...register('inviteCode')} aria-invalid={Boolean(formState.errors.inviteCode)} />
            {formState.errors.inviteCode ? <p className="text-xs text-red-600" role="alert">{formState.errors.inviteCode.message}</p> : null}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reg-first">First name</Label>
            <Input id="reg-first" autoComplete="given-name" {...register('firstName')} />
            {formState.errors.firstName ? <p className="text-xs text-red-600" role="alert">{formState.errors.firstName.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-last">Last name</Label>
            <Input id="reg-last" autoComplete="family-name" {...register('lastName')} />
            {formState.errors.lastName ? <p className="text-xs text-red-600" role="alert">{formState.errors.lastName.message}</p> : null}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-email">Email</Label>
          <Input id="reg-email" type="email" autoComplete="email" {...register('email')} />
          {formState.errors.email ? <p className="text-xs text-red-600" role="alert">{formState.errors.email.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-password">Password</Label>
          <PasswordInput id="reg-password" autoComplete="new-password" {...register('password')} />
          {formState.errors.password ? <p className="text-xs text-red-600" role="alert">{formState.errors.password.message}</p> : null}
        </div>
        <Button type="submit" className="w-full" pending={formState.isSubmitting}>
          {creating && mode === 'create' ? 'Create organization' : 'Join organization'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="text-emerald-700 hover:underline dark:text-emerald-400">Log in</Link>
        </p>
      </form>
    </div>
  );
}
