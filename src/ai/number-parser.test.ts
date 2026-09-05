import { describe, expect, it } from 'vitest';
import { detectCurrency, normalizeDigits, parseAmount } from './number-parser';

describe('Tiny AI amount parser', () => {
  it('normalizes Persian digits', () => {
    expect(normalizeDigits('۱۲۳۴۵')).toBe('12345');
  });

  it('parses Persian million amounts', () => {
    expect(parseAmount('۳۰۰ میلیون تومان')).toBe(300_000_000);
  });

  it('parses English billion amounts', () => {
    expect(parseAmount('1.5 billion USD')).toBe(1_500_000_000);
  });

  it('detects explicit currency and otherwise keeps the fallback', () => {
    expect(detectCurrency('۵۰۰ میلیون ریال', 'TOMAN')).toBe('IRR');
    expect(detectCurrency('500 million', 'USD')).toBe('USD');
  });
});
