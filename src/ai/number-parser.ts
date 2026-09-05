import type { TinyProjectCurrency } from '../core/projects';

const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

export const normalizeDigits = (value: string): string =>
  value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));

const scaleForText = (value: string): number => {
  if (/\b(billion)\b/i.test(value) || /میلیارد/.test(value)) return 1_000_000_000;
  if (/\b(million)\b/i.test(value) || /میلیون/.test(value)) return 1_000_000;
  if (/\b(thousand|k)\b/i.test(value) || /هزار/.test(value)) return 1_000;
  return 1;
};

export const detectCurrency = (value: string, fallback: TinyProjectCurrency): TinyProjectCurrency => {
  if (/تومان|toman/i.test(value)) return 'TOMAN';
  if (/ریال|rial|irr/i.test(value)) return 'IRR';
  if (/دلار|\$|usd|dollar/i.test(value)) return 'USD';
  if (/یورو|€|eur|euro/i.test(value)) return 'EUR';
  return fallback;
};

export const parseAmount = (raw: string): number | null => {
  const normalized = normalizeDigits(raw).replace(/[,_٬،]/g, ' ');
  const match = normalized.match(/(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return null;
  return Math.round(base * scaleForText(normalized));
};

export const formatAmount = (amount: number, currency: TinyProjectCurrency, locale: 'fa' | 'en'): string => {
  const number = new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(amount);
  const labels: Record<TinyProjectCurrency, { fa: string; en: string }> = {
    TOMAN: { fa: 'تومان', en: 'toman' },
    IRR: { fa: 'ریال', en: 'IRR' },
    USD: { fa: 'دلار', en: 'USD' },
    EUR: { fa: 'یورو', en: 'EUR' },
    OTHER: { fa: '', en: '' },
  };
  return `${number} ${labels[currency][locale]}`.trim();
};
