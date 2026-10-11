'use client';

import { Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function EmptyState({ title, body }: { title?: string; body?: string }): React.JSX.Element {
  const t = useTranslations('common');
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-14 text-center">
      <span className="rounded-full bg-muted p-3">
        <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </span>
      <p className="font-semibold">{title ?? t('emptyTitle')}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{body ?? t('emptyBody')}</p>
    </div>
  );
}
