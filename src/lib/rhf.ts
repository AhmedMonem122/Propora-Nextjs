import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * zod v4 infers `unknown` for coerced inputs, which react-hook-form's Resolver
 * rejects. Our schemas clean/omit empty values on submit, so aligning the
 * resolver to the output shape is sound.
 */
export function zodSchemaResolver<T extends Record<string, unknown>>(schema: {
  _output: T;
}): Resolver<T> {
  return zodResolver(schema as never) as unknown as Resolver<T>;
}
