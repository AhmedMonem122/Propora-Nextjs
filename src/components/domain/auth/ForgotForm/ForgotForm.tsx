'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { apiClient, getApiMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Label } from '@/components/ui/Label/Label';

const schema = z.object({ email: z.string().email('Enter a valid email.') });
type Values = z.infer<typeof schema>;

export function ForgotForm(): React.JSX.Element {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Values): Promise<void> => {
    try {
      await apiClient.post('/auth/forgot-password', v);
      setSent(true);
      toast.success('If the email exists, a reset code is on its way.');
    } catch (e) {
      toast.error(getApiMessage(e, 'Request failed.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="fp-email">Email</Label>
        <Input id="fp-email" type="email" autoComplete="email" {...register('email')} />
        {formState.errors.email ? <p className="text-xs text-red-600" role="alert">{formState.errors.email.message}</p> : null}
      </div>
      <Button type="submit" className="w-full" pending={formState.isSubmitting}>
        Send reset code
      </Button>
      {sent ? <p className="text-center text-xs text-muted-foreground" role="status">Check your inbox for the one-time code, then continue.</p> : null}
      <p className="text-center text-sm">
        <Link href="/reset-password" className="text-emerald-700 hover:underline dark:text-emerald-400">I have a code — reset password</Link>
      </p>
    </form>
  );
}
