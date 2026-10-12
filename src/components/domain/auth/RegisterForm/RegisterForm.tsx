'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { applyFormErrors, getApiMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { PasswordInput } from '@/components/ui/PasswordInput/PasswordInput';
import { Label } from '@/components/ui/Label/Label';

const schema = z.object({
  organizationName: z.string().min(2, 'Enter your organization name.'),
  firstName: z.string().min(2, 'Enter your first name.'),
  lastName: z.string().min(2, 'Enter your last name.'),
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type Values = z.infer<typeof schema>;

export function RegisterForm(): React.JSX.Element {
  const router = useRouter();
  const { register: signup } = useAuth();
  const { register, handleSubmit, formState, setError } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (v: Values): Promise<void> => {
    try {
      await signup(v);
      toast.success('Organization created. Welcome!');
      router.replace('/dashboard');
    } catch (e) {
      toast.error(getApiMessage(e, 'Registration failed.'));
      applyFormErrors(e, setError, ['organizationName', 'firstName', 'lastName', 'email', 'password']);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="reg-org">Organization name</Label>
        <Input id="reg-org" autoComplete="organization" {...register('organizationName')} />
        {formState.errors.organizationName ? <p className="text-xs text-red-600" role="alert">{formState.errors.organizationName.message}</p> : null}
      </div>
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
        Create organization
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="text-emerald-700 hover:underline dark:text-emerald-400">Log in</Link>
      </p>
    </form>
  );
}

