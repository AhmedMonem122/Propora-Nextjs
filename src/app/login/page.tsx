import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard } from '@/components/domain/auth/AuthCard/AuthCard';
import { LoginForm } from '@/components/domain/auth/LoginForm/LoginForm';

export const metadata: Metadata = { title: 'Log in', robots: { index: false, follow: false } };

export default function LoginPage(): React.JSX.Element {
  return (
    <AuthCard title="Welcome back" subtitle="Log in to manage your properties.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
