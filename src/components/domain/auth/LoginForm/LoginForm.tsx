'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { applyFormErrors, getApiMessage } from '@/lib/api-client';
import { LOGIN_ROLE_OPTIONS } from '@/lib/roles';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { PasswordInput } from '@/components/ui/PasswordInput/PasswordInput';
import { Label } from '@/components/ui/Label/Label';
import { FormSelect } from '@/components/common/FormField/FormField';

const schema = z.object({
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(1, 'Enter your password.'),
  role: z.string().min(1, 'Choose a role.'),
});

type Values = z.infer<typeof schema>;

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const search = useSearchParams();
  const { login } = useAuth();
  const { register, handleSubmit, control, formState, setError } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { role: search.get('role') === 'ADMIN' ? 'ADMIN' : 'OWNER' },
  });

  const onSubmit = async (v: Values): Promise<void> => {
    try {
      // The server verifies the role and tells us where to land — no
      // second-guessing with extra /me probes.
      const target = await login(v);
      toast.success('Logged in successfully.');
      if (target === '/platform') {
        router.replace('/platform');
        return;
      }
      const next = search.get('next');
      router.replace(next && next.startsWith('/') && !next.startsWith('/platform') ? next : '/dashboard');
    } catch (e) {
      toast.error(getApiMessage(e, 'Login failed.'));
      applyFormErrors(e, setError, ['email', 'password', 'role']);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" autoComplete="email" {...register('email')} aria-invalid={Boolean(formState.errors.email)} />
        {formState.errors.email ? <p className="text-xs text-red-600" role="alert">{formState.errors.email.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">Password</Label>
        <PasswordInput id="login-password" autoComplete="current-password" {...register('password')} aria-invalid={Boolean(formState.errors.password)} />
        {formState.errors.password ? <p className="text-xs text-red-600" role="alert">{formState.errors.password.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-role">Sign in as</Label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <FormSelect id="login-role" {...field} aria-invalid={Boolean(formState.errors.role)}>
              {LOGIN_ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label} — {r.hint}
                </option>
              ))}
            </FormSelect>
          )}
        />
        {formState.errors.role ? <p className="text-xs text-red-600" role="alert">{formState.errors.role.message}</p> : null}
        <p className="text-xs text-muted-foreground">
          The server checks you actually hold this role — picking one you don’t have is rejected.
        </p>
      </div>
      <Button type="submit" className="w-full" pending={formState.isSubmitting}>
        Log in
      </Button>
      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-emerald-700 hover:underline dark:text-emerald-400">Forgot password?</Link>
        <Link href="/register" className="text-muted-foreground hover:underline">No account yet?</Link>
      </div>
    </form>
  );
}
