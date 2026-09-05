import {
  JalaliConverter,
  toPersianDigits,
} from 'webtanan-jalali-date-engine';
import type { TinyDateService, TinyLocale } from './types';

const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

const asDate = (value: string | Date): Date => {
  const result = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(result.getTime())) {
    throw new RangeError('Invalid date value.');
  }
  return result;
};

const formatPersian = (date: Date, style: 'short' | 'long'): string => {
  const jalali = JalaliConverter.toJalali({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

  if (style === 'short') {
    return toPersianDigits(
      `${jalali.year}/${String(jalali.month).padStart(2, '0')}/${String(jalali.day).padStart(2, '0')}`,
    );
  }

  const month = PERSIAN_MONTHS[jalali.month - 1] ?? '';
  return toPersianDigits(`${jalali.day} ${month} ${jalali.year}`);
};

const formatEnglish = (date: Date, style: 'short' | 'long'): string =>
  new Intl.DateTimeFormat('en-US',
    style === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: '2-digit', day: '2-digit' },
  ).format(date);

export const tinyDateService: TinyDateService = {
  todayIso(): string {
    return new Date().toISOString();
  },

  format(value: string | Date, locale: TinyLocale, style = 'long'): string {
    const date = asDate(value);
    return locale === 'fa'
      ? formatPersian(date, style)
      : formatEnglish(date, style);
  },

  formatDateTime(value: string | Date, locale: TinyLocale): string {
    const date = asDate(value);
    const datePart = this.format(date, locale, 'long');
    const timePart = new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: locale !== 'fa',
    }).format(date);

    return `${datePart} · ${timePart}`;
  },
};
