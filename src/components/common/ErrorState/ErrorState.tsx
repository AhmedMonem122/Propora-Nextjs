'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button/Button';

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }): React.JSX.Element {
  const t = useTranslations('common');
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center dark:border-red-900/50 dark:bg-red-950/20" role="alert">
      <TriangleAlert className="h-8 w-8 text-red-500" aria-hidden="true" />
      <p className="font-semibold">{t('errorTitle')}</p>
      <p className="max-w-md text-sm text-muted-foreground">{message ?? t('errorBody')}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('retry')}
        </Button>
      ) : null}
    </div>
  );
}
