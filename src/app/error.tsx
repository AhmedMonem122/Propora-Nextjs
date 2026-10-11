'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Button } from '@/components/ui/Button/Button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }): React.JSX.Element {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [error ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 p-8">
      <ErrorState message="Something went wrong while rendering this page." onRetry={reset} />
      <Button variant="link" asChild>
        <a href="/">Back to home</a>
      </Button>
    </main>
  );
}
