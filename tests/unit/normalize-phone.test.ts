import { describe, it, expect } from 'vitest';
import { normalizePhone } from '../../worker/services/otp';

describe('normalizePhone', () => {
  it('prepends default +91 to a bare national number', () => {
    expect(normalizePhone('9876543210')).toBe('+919876543210');
  });

  it('strips spaces and other separators from a +91 formatted number', () => {
    expect(normalizePhone('+91 98765 43210')).toBe('+919876543210');
    expect(normalizePhone('98765-43210')).toBe('+919876543210');
    expect(normalizePhone('(98765) 43210')).toBe('+919876543210');
  });

  it('strips leading zeros from a national number before adding the country code', () => {
    expect(normalizePhone('09876543210')).toBe('+919876543210');
    expect(normalizePhone('009876543210')).toBe('+919876543210');
  });

  it('keeps an already-E.164 number untouched (different country)', () => {
    expect(normalizePhone('+14155552671')).toBe('+14155552671');
  });

  it('coerces a country code without a leading + (e.g. "91") to "+91"', () => {
    expect(normalizePhone('9876543210', '91')).toBe('+919876543210');
  });

  it('honours an explicit non-default country code', () => {
    expect(normalizePhone('4155552671', '+1')).toBe('+14155552671');
  });

  it('does not strip leading zeros when the input is already + prefixed', () => {
    // input already starts with + so the zero-strip branch is skipped
    expect(normalizePhone('+910987654321')).toBe('+910987654321');
  });

  it('returns null for empty / whitespace-only input', () => {
    expect(normalizePhone('')).toBeNull();
    // @ts-expect-error exercising the falsy guard with null
    expect(normalizePhone(null)).toBeNull();
  });

  it('returns null for too-short numbers (fewer than 8 digits after +)', () => {
    // '+91' + '123' = '+91123' -> 5 digits, below the 8-digit minimum
    expect(normalizePhone('123')).toBeNull();
  });

  it('returns null for too-long numbers (more than 15 digits after +)', () => {
    expect(normalizePhone('9'.repeat(20))).toBeNull();
  });

  it('returns null for garbage with no digits', () => {
    expect(normalizePhone('abcdef')).toBeNull();
    expect(normalizePhone('+++')).toBeNull();
  });
});
