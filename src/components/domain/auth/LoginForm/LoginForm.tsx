'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { getApiMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Label } from '@/components/ui/Label/Label';

const schema = z.object({
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(1, 'Enter your password.'),
});

type Values = z.infer<typeof schema>;

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const search = useSearchParams();
  const { login } = useAuth();
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Values): Promise<void> => {
    try {
      await login(v);
      toast.success('Logged in successfully.');
      router.replace(search.get('next') ?? '/dashboard');
    } catch (e) {
      toast.error(getApiMessage(e, 'Login failed.'));
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
        <Input id="login-password" type="password" autoComplete="current-password" {...register('password')} aria-invalid={Boolean(formState.errors.password)} />
        {formState.errors.password ? <p className="text-xs text-red-600" role="alert">{formState.errors.password.message}</p> : null}
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
