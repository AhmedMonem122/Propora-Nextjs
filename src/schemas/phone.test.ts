import { describe, expect, it } from 'vitest';
import { isValidEgyptianNationalId, isValidPhone, nationalIdField, phoneField } from './phone';

describe('isValidPhone', () => {
  it.each(['+201001234567', '+20 100 123 4567', '01001234567', '+442071234567'])(
    'accepts %s',
    (v) => expect(isValidPhone(v)).toBe(true),
  );
  it.each(['abc', '123', '', '+20'])('rejects %s', (v) =>
    expect(isValidPhone(v)).toBe(false),
  );
});

describe('isValidEgyptianNationalId', () => {
  it.each(['29901011234567', '30002291234567', '28512311234567'])(
    'accepts %s',
    (v) => expect(isValidEgyptianNationalId(v)).toBe(true),
  );
  it.each(['19901011234567', '29913011234567', '29902301234567', '123', ''])(
    'rejects %s',
    (v) => expect(isValidEgyptianNationalId(v)).toBe(false),
  );
});

describe('zod fields (mirror backend rules)', () => {
  it('phoneField allows empty, validates content', () => {
    const schema = phoneField();
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse('').success).toBe(true);
    expect(schema.safeParse('+201001234567').success).toBe(true);
    expect(schema.safeParse('nope').success).toBe(false);
  });

  it('nationalIdField allows empty, validates content', () => {
    const schema = nationalIdField();
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse('29901011234567').success).toBe(true);
    expect(schema.safeParse('12345').success).toBe(false);
  });
});
