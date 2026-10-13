import { z } from 'zod';
import { isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';

/**
 * Shared phone / national-ID validation mirroring the backend
 * (IsPhoneNumber / IsEgyptianNationalId). Single source of truth for
 * every form so client and server never disagree.
 */

function defaultCountry(): CountryCode {
  const raw = (process.env.NEXT_PUBLIC_PHONE_DEFAULT_COUNTRY ?? 'EG').trim().toUpperCase();
  return (raw.length === 2 ? raw : 'EG') as CountryCode;
}

export function isValidPhone(value: string): boolean {
  try {
    return isValidPhoneNumber(value, defaultCountry());
  } catch {
    return false;
  }
}

export function isValidEgyptianNationalId(value: string): boolean {
  if (!/^\d{14}$/.test(value)) return false;
  const century = Number(value[0]);
  if (century !== 2 && century !== 3) return false;
  const fullYear = (century === 2 ? 1900 : 2000) + Number(value.slice(1, 3));
  const month = Number(value.slice(3, 5));
  const day = Number(value.slice(5, 7));
  if (month < 1 || month > 12) return false;
  const leap = (fullYear % 4 === 0 && fullYear % 100 !== 0) || fullYear % 400 === 0;
  const dim = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
  if (day < 1 || day > dim) return false;
  if (fullYear > new Date().getFullYear()) return false;
  return true;
}

/** Optional phone field: empty stays empty, content must be dialable. */
export function phoneField(message = 'Enter a valid phone number (e.g. +201001234567).') {
  return z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || isValidPhone(v), { message });
}

/** Optional Egyptian national ID (14 digits + real birthdate). */
export function nationalIdField(message = 'Enter a valid 14-digit national ID.') {
  return z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || isValidEgyptianNationalId(v), { message });
}
