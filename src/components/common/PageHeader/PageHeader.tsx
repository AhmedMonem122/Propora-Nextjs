'use client';

import { RotateCw, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';

interface PageHeaderProps {
  title: string;
  description?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  onReload?: () => void;
  reloading?: boolean;
  actions?: React.ReactNode;
}

/** Consistent dashboard header: title + server search + reload + actions. */
export function PageHeader({
  title,
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  onReload,
  reloading,
  actions,
}: PageHeaderProps): React.JSX.Element {
  const t = useTranslations('common');
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange ? (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder ?? t('searchPlaceholder')}
              aria-label={t('search')}
              className="w-56 pl-9"
            />
          </div>
        ) : null}
        {onReload ? (
          <Button variant="outline" size="sm" onClick={onReload} disabled={reloading} aria-label={t('reload')}>
            <RotateCw className={reloading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden="true" />
            {t('reload')}
          </Button>
        ) : null}
        {actions}
      </div>
    </div>
  );
}
