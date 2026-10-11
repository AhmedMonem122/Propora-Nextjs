import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';

export default function BillingCancelPage({ searchParams }: { searchParams: Promise<{ paymentId?: string }> }): React.JSX.Element {
  void searchParams;
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-3 p-10 text-center">
      <XCircle className="h-14 w-14 text-amber-500" aria-hidden="true" />
      <h1 className="text-2xl font-black">Payment cancelled</h1>
      <p className="text-sm text-muted-foreground">No charge was made. You can retry checkout anytime from the payments page.</p>
      <Button asChild>
        <Link href="/dashboard/payments">Back to payments</Link>
      </Button>
    </main>
  );
}
