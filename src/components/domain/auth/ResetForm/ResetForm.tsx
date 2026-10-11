'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { apiClient, getApiMessage, setAccessToken } from '@/lib/api-client';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Label } from '@/components/ui/Label/Label';

const schema = z.object({
  email: z.string().email('Enter a valid email.'),
  otp: z.string().min(4, 'Enter the code from your email.'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
});

type Values = z.infer<typeof schema>;

export function ResetForm(): React.JSX.Element {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Values): Promise<void> => {
    try {
      const res = await apiClient.post('/auth/reset-password', v);
      if (res.data?.accessToken) setAccessToken(res.data.accessToken);
      toast.success('Password reset. You are logged in.');
      router.replace('/dashboard');
    } catch (e) {
      toast.error(getApiMessage(e, 'Reset failed.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="rp-email">Email</Label>
        <Input id="rp-email" type="email" autoComplete="email" {...register('email')} />
        {formState.errors.email ? <p className="text-xs text-red-600" role="alert">{formState.errors.email.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rp-otp">One-time code</Label>
        <Input id="rp-otp" inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" {...register('otp')} />
        {formState.errors.otp ? <p className="text-xs text-red-600" role="alert">{formState.errors.otp.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rp-password">New password</Label>
        <Input id="rp-password" type="password" autoComplete="new-password" {...register('newPassword')} />
        {formState.errors.newPassword ? <p className="text-xs text-red-600" role="alert">{formState.errors.newPassword.message}</p> : null}
      </div>
      <Button type="submit" className="w-full" pending={formState.isSubmitting}>
        Reset & log in
      </Button>
    </form>
  );
}
