'use client';

import PhoneInputBase, { type Value } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
}

/**
 * International phone input (Google libphonenumber under the hood):
 * country picker + national formatting + E.164 output. Pairs with
 * `phoneField()` from `@/schemas/phone` (same validity rules as the API).
 */
export function PhoneInput({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  placeholder = '+2010…',
  error,
}: PhoneInputProps): React.JSX.Element {
  return (
    <PhoneInputBase
      international
      defaultCountry="EG"
      limitMaxLength
      value={(value || undefined) as Value | undefined}
      onChange={(v) => onChange((v ?? '') as string)}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={placeholder ?? '+2010…'}
      aria-invalid={Boolean(error)}
      aria-label={id ? undefined : 'Phone number'}
      numberInputProps={{
        id,
        className: cn(
          'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus-visible:ring-red-500',
        ),
      }}
      // Flag + calling code stay visible (the whole point of the picker);
      // only the default oversized icon margins are tamed.
      className={cn(
        '[&_.PhoneInputCountry]:mr-1 [&_.PhoneInputCountrySelect]:h-9 [&_.PhoneInputCountrySelect]:rounded-lg',
        '[&_.PhoneInputCountrySelect]:border [&_.PhoneInputCountrySelect]:border-input [&_.PhoneInputCountrySelect]:bg-transparent',
        '[&_.PhoneInputCountrySelect]:pr-1 [&_.PhoneInputCountryIcon]:h-4 [&_.PhoneInputCountryIcon]:w-6',
        '[&_.PhoneInputCountryIcon--border]:rounded-sm [&_.PhoneInputCountryIcon--border]:shadow-sm',
      )}
    />
  );
}
