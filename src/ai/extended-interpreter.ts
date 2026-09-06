import type { TinyLocale } from '../core/types';
import { extractDelegationValues, isDelegationCommand } from './delegation-interpreter';
import { tinyLanguageMatches, type TinyLanguageLexicon } from './language-engine';
import type { TinyAssistantInterpretation, TinyAssistantValue } from './types';

const clean = (value: string): string => value.replace(/[،,.!?؟]+$/u, '').replace(/\s+/g, ' ').trim();

const interpretation = (
  actionId: string,
  values: Record<string, TinyAssistantValue>,
  confidence = 0.94,
): TinyAssistantInterpretation => ({ actionId, values, confidence, source: 'local' });

const deadlineValues = (text: string, locale: TinyLocale): Record<string, TinyAssistantValue> => {
  const values: Record<string, TinyAssistantValue> = {};
  const pattern = locale === 'fa'
    ? /(?:موعد|مهلت)\s+(.+?)\s+(?:را\s+)?(?:برای|تا)\s+(.+?)(?=\s+(?:ثبت|ایجاد|بساز)(?:\s+کن)?|[.!؟?]|$)/iu
    : /(?:deadline|due date)\s+(?:for\s+)?(.+?)\s+(?:by|for)\s+(.+?)(?=\s+(?:create|add|register)|[.!?]|$)/iu;
  const match = text.match(pattern);
  if (match?.[1]) values.title = clean(match[1]);
  if (match?.[2]) values.datePhrase = clean(match[2]);
  return values;
};

const riskValues = (text: string, locale: TinyLocale): Record<string, TinyAssistantValue> => {
  const values: Record<string, TinyAssistantValue> = {};
  const pattern = locale === 'fa'
    ? /ریسک\s+(.+?)(?=\s+(?:را\s+)?(?:ثبت|اضافه|ایجاد)(?:\s+کن)?|[.!؟?]|$)/iu
    : /(?:add|create|register)\s+(?:a\s+)?risk\s+(.+?)(?=[.!?]|$)/iu;
  const match = text.match(pattern);
  if (match?.[1]) values.title = clean(match[1]);

  const probability = text.match(locale === 'fa' ? /احتمال\s*([1-5۱-۵])/u : /probability\s*([1-5])/i);
  const impact = text.match(locale === 'fa' ? /(?:اثر|شدت)\s*([1-5۱-۵])/u : /(?:impact|severity)\s*([1-5])/i);
  const digit = (value: string): number => Number(value.replace(/[۱-۵]/g, (char) => String('۱۲۳۴۵'.indexOf(char) + 1)));
  if (probability?.[1]) values.probability = digit(probability[1]);
  if (impact?.[1]) values.impact = digit(impact[1]);
  return values;
};

const raciValues = (text: string, locale: TinyLocale): Record<string, TinyAssistantValue> => {
  const values: Record<string, TinyAssistantValue> = {};
  if (locale === 'fa') {
    const match = text.match(/(?:raci|راسی)\s+(.+?)\s+مسئول(?:\s+اجرا)?\s+(.+?)\s+پاسخگو\s+(.+?)(?=[.!؟?]|$)/iu);
    if (match?.[1]) values.activity = clean(match[1]);
    if (match?.[2]) values.responsible = clean(match[2]);
    if (match?.[3]) values.accountable = clean(match[3]);
  } else {
    const match = text.match(/raci\s+(.+?)\s+responsible\s+(.+?)\s+accountable\s+(.+?)(?=[.!?]|$)/iu);
    if (match?.[1]) values.activity = clean(match[1]);
    if (match?.[2]) values.responsible = clean(match[2]);
    if (match?.[3]) values.accountable = clean(match[3]);
  }
  return values;
};

export function interpretExtended(
  text: string,
  locale: TinyLocale,
  lexicon: TinyLanguageLexicon,
): TinyAssistantInterpretation | null {
  const trimmed = text.trim();

  if (isDelegationCommand(trimmed, locale, lexicon)) {
    return interpretation('tiny-delegation.create', extractDelegationValues(trimmed, locale, lexicon), 0.97);
  }

  const isDeadline = tinyLanguageMatches(trimmed, 'entity.deadline', locale, lexicon)
    && tinyLanguageMatches(trimmed, 'action.create', locale, lexicon);
  if (isDeadline) return interpretation('tiny-deadline.create', deadlineValues(trimmed, locale));

  const isRiskCreate = tinyLanguageMatches(trimmed, 'action.add-risk', locale, lexicon)
    || (tinyLanguageMatches(trimmed, 'module.risk', locale, lexicon) && tinyLanguageMatches(trimmed, 'action.create', locale, lexicon));
  if (isRiskCreate) return interpretation('tiny-risk.create', riskValues(trimmed, locale));

  const isRaciCreate = tinyLanguageMatches(trimmed, 'entity.raci', locale, lexicon)
    && tinyLanguageMatches(trimmed, 'action.create', locale, lexicon);
  if (isRaciCreate) return interpretation('tiny-raci.create', raciValues(trimmed, locale));

  const wantsOpen = tinyLanguageMatches(trimmed, 'action.open', locale, lexicon);
  if (!wantsOpen && tinyLanguageMatches(trimmed, 'module.weekly-review', locale, lexicon)) {
    return interpretation('tiny-weekly-review.generate', {}, 0.96);
  }

  if (!wantsOpen && (
    tinyLanguageMatches(trimmed, 'module.project-health', locale, lexicon)
    || (tinyLanguageMatches(trimmed, 'entity.health', locale, lexicon) && tinyLanguageMatches(trimmed, 'entity.project', locale, lexicon))
  )) {
    return interpretation('tiny-project-health.calculate', {}, 0.96);
  }

  return null;
}
