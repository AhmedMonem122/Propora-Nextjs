import type { Metadata } from 'next';
import { AuthCard } from '@/components/domain/auth/AuthCard/AuthCard';
import { ForgotForm } from '@/components/domain/auth/ForgotForm/ForgotForm';

export const metadata: Metadata = { title: 'Forgot password', robots: { index: false, follow: false } };

export default function ForgotPasswordPage(): React.JSX.Element {
  return (
    <AuthCard title="Reset your password" subtitle="We will email you a one-time code.">
      <ForgotForm />
    </AuthCard>
  );
}
