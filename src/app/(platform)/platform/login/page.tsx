'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { usePlatform } from '@/lib/platform-context';
import { getApiMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { PasswordInput } from '@/components/ui/PasswordInput/PasswordInput';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card/Card';
import { FormField } from '@/components/common/FormField/FormField';

const schema = z.object({
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
});

type Values = z.infer<typeof schema>;

export default function PlatformLoginPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading } = usePlatform();
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/platform');
  }, [isLoading, isAuthenticated, router]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center p-6">
      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle>Platform admin</CardTitle>
              <CardDescription>System level — separate from organization accounts.</CardDescription>
            </div>
          </div>
          <form
            className="space-y-4"
            noValidate
            onSubmit={handleSubmit(async (v) => {
              try {
                await login(v);
                router.replace(searchParams.get('next') ?? '/platform');
              } catch (e) {
                toast.error(getApiMessage(e, 'Login failed.'));
              }
            })}
          >
            <FormField label="Email" htmlFor="pl-email" error={formState.errors.email?.message}>
              <Input id="pl-email" type="email" autoComplete="username" {...register('email')} />
            </FormField>
            <FormField label="Password" htmlFor="pl-password" error={formState.errors.password?.message}>
              <PasswordInput id="pl-password" autoComplete="current-password" {...register('password')} />
            </FormField>
            <Button type="submit" className="w-full" pending={formState.isSubmitting}>
              Sign in to platform
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
