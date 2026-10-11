import type { Metadata } from 'next';
import { AuthCard } from '@/components/domain/auth/AuthCard/AuthCard';
import { ResetForm } from '@/components/domain/auth/ResetForm/ResetForm';

export const metadata: Metadata = { title: 'Reset password', robots: { index: false, follow: false } };

export default function ResetPasswordPage(): React.JSX.Element {
  return (
    <AuthCard title="Choose a new password" subtitle="Enter the code from your email, then a new password.">
      <ResetForm />
    </AuthCard>
  );
}
