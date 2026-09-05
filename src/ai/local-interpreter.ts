import type { TinyLocale } from '../core/types';
import { moduleCatalog } from '../modules/catalog';
import { detectCurrency, normalizeDigits, parseAmount } from './number-parser';
import type { TinyAssistantInterpretation, TinyAssistantValue } from './types';

const cleanupProjectName = (value: string): string =>
  value
    .replace(/^(?:به\s+نام|با\s+نام)\s+/u, '')
    .replace(/\s+(?:با\s+بودجه|با\s+مبلغ|بودجه|مبلغ)\s*$/u, '')
    .replace(/\s+(?:ایجاد|ثبت|بساز|create|add|make).*$/iu, '')
    .replace(/[،,.]+$/u, '')
    .trim();

const projectNameFromPersian = (text: string): string | null => {
  const patterns = [
    /پروژه(?:‌|\s)*(?:ای|ای‌)?\s*(?:به\s+نام|با\s+نام)\s+(.+?)(?=\s+(?:با\s+بودجه|با\s+مبلغ|بودجه|مبلغ)|$)/u,
    /پروژه\s+(.+?)(?=\s+(?:با\s+بودجه|با\s+مبلغ|بودجه|مبلغ)|\s+(?:ایجاد|ثبت|بساز)|$)/u,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const name = match?.[1] ? cleanupProjectName(match[1]) : '';
    if (name) return name;
  }
  return null;
};

const projectNameFromEnglish = (text: string): string | null => {
  const patterns = [
    /(?:create|add|make)\s+(?:a\s+)?project\s+(?:named\s+|called\s+)?(.+?)(?=\s+(?:with\s+)?(?:budget|amount)|$)/i,
    /project\s+(?:named\s+|called\s+)?(.+?)(?=\s+(?:with\s+)?(?:budget|amount)|\s+(?:create|add|make)|$)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const name = match?.[1] ? cleanupProjectName(match[1]) : '';
    if (name) return name;
  }
  return null;
};

const findModule = (text: string, locale: TinyLocale) => {
  const normalized = text.toLocaleLowerCase();
  return moduleCatalog.find((module) => {
    const candidates = [module.id, module.name.fa, module.name.en];
    if (module.id === 'tiny-risk') candidates.push('ریسک', 'risk');
    if (module.id === 'tiny-waiting') candidates.push('منتظر پاسخ', 'waiting');
    if (module.id === 'tiny-delegation') candidates.push('تفویض', 'delegation');
    if (module.id === 'tiny-deadline') candidates.push('موعد', 'deadline');
    if (module.id === 'tiny-raci') candidates.push('raci');
    if (module.id === 'tiny-meeting-cost') candidates.push('هزینه جلسه', 'meeting cost');
    if (module.id === 'tiny-project-health') candidates.push('سلامت پروژه', 'project health');
    if (module.id === 'tiny-weekly-review') candidates.push('مرور هفتگی', 'weekly review');
    if (module.id === 'tiny-decision-matrix') candidates.push('ماتریس تصمیم', 'decision matrix');
    return candidates.some((candidate) => normalized.includes(candidate.toLocaleLowerCase()));
  }) ?? null;
};

export const interpretLocally = (text: string, locale: TinyLocale): TinyAssistantInterpretation => {
  const trimmed = text.trim();
  const normalized = normalizeDigits(trimmed).toLocaleLowerCase();
  const values: Record<string, TinyAssistantValue> = {};

  const isProjectCreate = locale === 'fa'
    ? /پروژه/.test(trimmed) && /(ایجاد|ثبت|بساز|اضافه)/.test(trimmed)
    : /\bproject\b/i.test(trimmed) && /\b(create|add|make)\b/i.test(trimmed);

  if (isProjectCreate) {
    const name = locale === 'fa' ? projectNameFromPersian(trimmed) : projectNameFromEnglish(trimmed);
    const amount = parseAmount(trimmed);
    const fallbackCurrency = locale === 'fa' ? 'TOMAN' : 'USD';
    if (name) values.name = name;
    if (amount !== null) values.budgetAmount = amount;
    values.currency = detectCurrency(trimmed, fallbackCurrency);
    return {
      actionId: 'core.project.create',
      confidence: name || amount !== null ? 0.96 : 0.82,
      values,
      source: 'local',
    };
  }

  const module = findModule(trimmed, locale);
  if (module) {
    const enable = locale === 'fa'
      ? /(فعال|روشن|اضافه)/.test(trimmed)
      : /\b(enable|activate|turn on)\b/i.test(normalized);
    const disable = locale === 'fa'
      ? /(غیرفعال|خاموش)/.test(trimmed)
      : /\b(disable|deactivate|turn off)\b/i.test(normalized);

    if (enable || disable) {
      return {
        actionId: enable ? 'core.module.enable' : 'core.module.disable',
        confidence: 0.98,
        values: { moduleId: module.id },
        source: 'local',
      };
    }

    if (locale === 'fa' ? /(باز|برو|نمایش)/.test(trimmed) : /\b(open|show|go to)\b/i.test(normalized)) {
      return {
        actionId: 'core.module.open',
        confidence: 0.96,
        values: { moduleId: module.id },
        source: 'local',
      };
    }
  }

  return {
    actionId: null,
    confidence: 0,
    values: {},
    source: 'local',
    reason: locale === 'fa' ? 'فرمان با اطمینان کافی تشخیص داده نشد.' : 'The command could not be recognized with enough confidence.',
  };
};
