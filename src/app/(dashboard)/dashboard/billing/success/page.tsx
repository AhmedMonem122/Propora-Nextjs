import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';

export default function BillingSuccessPage({ searchParams }: { searchParams: Promise<{ paymentId?: string }> }): React.JSX.Element {
  void searchParams;
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-3 p-10 text-center">
      <CheckCircle2 className="h-14 w-14 text-emerald-600" aria-hidden="true" />
      <h1 className="text-2xl font-black">Payment successful</h1>
      <p className="text-sm text-muted-foreground">Your payment was confirmed. A receipt is available on the payments page.</p>
      <Button asChild>
        <Link href="/dashboard/payments">Back to payments</Link>
      </Button>
    </main>
  );
}
