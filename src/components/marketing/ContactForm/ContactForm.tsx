'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Label } from '@/components/ui/Label/Label';
import { Textarea } from '@/components/ui/Textarea/Textarea';

const schema = z.object({
  name: z.string().min(2, 'Please enter your name.'),
  email: z.string().email('Please enter a valid email.'),
  message: z.string().min(10, 'Tell us a little more (10+ characters).'),
});

type Values = z.infer<typeof schema>;

/**
 * No backend endpoint exists yet → validated UI + mailto: fallback (handoff §7).
 */
export function ContactForm(): React.JSX.Element {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = (v: Values): void => {
    const subject = encodeURIComponent(`Propora inquiry from ${v.name}`);
    const body = encodeURIComponent(`${v.message}\n\n— ${v.name} <${v.email}>`);
    window.location.href = `mailto:hello@propora.app?subject=${subject}&body=${body}`;
    setSent(true);
    toast.success('Message ready in your email app. We will reply soon!');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="cf-name">Full name</Label>
        <Input id="cf-name" autoComplete="name" {...register('name')} aria-invalid={Boolean(formState.errors.name)} />
        {formState.errors.name ? <p className="text-xs text-red-600" role="alert">{formState.errors.name.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cf-email">Work email</Label>
        <Input id="cf-email" type="email" autoComplete="email" {...register('email')} aria-invalid={Boolean(formState.errors.email)} />
        {formState.errors.email ? <p className="text-xs text-red-600" role="alert">{formState.errors.email.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cf-message">How can we help?</Label>
        <Textarea id="cf-message" rows={5} {...register('message')} aria-invalid={Boolean(formState.errors.message)} />
        {formState.errors.message ? <p className="text-xs text-red-600" role="alert">{formState.errors.message.message}</p> : null}
      </div>
      <Button type="submit" variant="accent" className="w-full" pending={formState.isSubmitting}>
        Send message
      </Button>
      {sent ? <p className="text-center text-xs text-muted-foreground" role="status">Message ready in your email app. We will reply soon!</p> : null}
    </form>
  );
}
