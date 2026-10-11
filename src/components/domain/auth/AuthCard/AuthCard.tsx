import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card/Card';

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1f3a] px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-bold text-white" aria-label="Propora home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-emerald-950">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
          Propora
        </Link>
        <Card>
          <CardContent className="space-y-5 p-6 pt-6">
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription className="mt-1">{subtitle}</CardDescription>
            </div>
            {children}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
