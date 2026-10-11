import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';

export default function NotFound(): React.JSX.Element {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-6xl font-black text-emerald-600">404</p>
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="text-sm text-muted-foreground">The page you are looking for does not exist or is not yours.</p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
