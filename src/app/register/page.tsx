import type { Metadata } from 'next';
import { AuthCard } from '@/components/domain/auth/AuthCard/AuthCard';
import { RegisterForm } from '@/components/domain/auth/RegisterForm/RegisterForm';

export const metadata: Metadata = { title: 'Get started', robots: { index: false, follow: false } };

export default function RegisterPage(): React.JSX.Element {
  return (
    <AuthCard title="Create your organization" subtitle="One account for your whole portfolio.">
      <RegisterForm />
    </AuthCard>
  );
}
