import { Label } from '@/components/ui/Label/Label';
import { cn } from '@/lib/utils';

/** Label + control + error text — cuts form repetition. */
export function FormField({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const selectClass =
  'flex h-9 w-full items-center rounded-lg border border-input bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

/** Accessible native select styled like the other inputs (works with RHF register). */
export function FormSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>): React.JSX.Element {
  const { className, children, ...rest } = props;
  return (
    <select className={cn(selectClass, className)} {...rest}>
      {children}
    </select>
  );
}

export { selectClass };
