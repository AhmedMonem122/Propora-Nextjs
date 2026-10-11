'use client';

import { NumericFormat, type NumericFormatProps } from 'react-number-format';
import { Input } from '@/components/ui/Input/Input';

type CurrencyInputProps = Omit<NumericFormatProps, 'customInput' | 'thousandSeparator'> & {
  id?: string;
};

/** Money inputs: numeric value in, plain number out (API takes numbers). */
export function CurrencyInput({ id, ...props }: CurrencyInputProps): React.JSX.Element {
  return (
    <NumericFormat
      id={id}
      customInput={Input}
      thousandSeparator=","
      decimalScale={2}
      allowNegative={false}
      inputMode="decimal"
      {...props}
    />
  );
}
