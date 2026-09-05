import type { TinyLocale } from '../core/types';
import { moduleCatalog } from '../modules/catalog';
import {
  emptyTinyLanguageLexicon,
  getTinyLanguageTerms,
  resolveTinyLanguageConcept,
  tinyLanguageMatches,
  type TinyLanguageConceptId,
  type TinyLanguageLexicon,
} from './language-engine';
import { detectCurrency, normalizeDigits, parseAmount } from './number-parser';
import type { TinyAssistantInterpretation, TinyAssistantValue } from './types';

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const termAlternation = (terms: string[]): string =>
  [...terms].sort((a, b) => b.length - a.length).map(escapeRegex).join('|');

const cleanupProjectName = (
  value: string,
  locale: TinyLocale,
  lexicon: TinyLanguageLexicon,
): string => {
  const createTerms = termAlternation(getTinyLanguageTerms('action.create', locale, lexicon));
  return value
    .replace(/^(?:به\s+نام|با\s+نام|named|called)\s+/iu, '')
    .replace(createTerms ? new RegExp(`\\s+(?:${createTerms}).*$`, 'iu') : /$^/u, '')
    .replace(/[،,.]+$/u, '')
    .trim();
};

const projectNameFromText = (
  text: string,
  locale: TinyLocale,
  lexicon: TinyLanguageLexicon,
): string | null => {
  const projectTerms = termAlternation(getTinyLanguageTerms('entity.project', locale, lexicon));
  const budgetTerms = termAlternation(getTinyLanguageTerms('field.budget', locale, lexicon));
  const createTerms = termAlternation(getTinyLanguageTerms('action.create', locale, lexicon));
  if (!projectTerms) return null;

  const stopParts = [budgetTerms, createTerms].filter(Boolean);
  const stop = stopParts.length > 0 ? `(?=\\s+(?:${stopParts.join('|')})|$)` : '$';
  const patterns = locale === 'fa'
    ? [
        new RegExp(`(?:${projectTerms})(?:‌|\\s)*(?:ای|ای‌)?\\s*(?:به\\s+نام|با\\s+نام)\\s+(.+?)${stop}`, 'iu'),
        new RegExp(`(?:${projectTerms})\\s+(.+?)${stop}`, 'iu'),
      ]
    : [
        new RegExp(`(?:${createTerms || 'create|add|make'})\\s+(?:a\\s+)?(?:${projectTerms})\\s+(?:named\\s+|called\\s+)?(.+?)${stop}`, 'iu'),
        new RegExp(`(?:${projectTerms})\\s+(?:named\\s+|called\\s+)?(.+?)${stop}`, 'iu'),
      ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const name = match?.[1] ? cleanupProjectName(match[1], locale, lexicon) : '';
    if (name) return name;
  }
  return null;
};

const scaledNumber = String.raw`\d+(?:\.\d+)?(?:\s*(?:هزار|میلیون|میلیارد|thousand|million|billion|k))?`;

const extractMeetingCostValues = (text: string, locale: TinyLocale): Record<string, TinyAssistantValue> => {
  const normalized = normalizeDigits(text).toLocaleLowerCase();
  const values: Record<string, TinyAssistantValue> = {};

  const participantMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:نفره?|people|persons?|participants?)/iu);
  if (participantMatch?.[1]) values.participants = Number(participantMatch[1]);

  const durationMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:دقیقه|minutes?|mins?)/iu);
  if (durationMatch?.[1]) values.durationMinutes = Number(durationMatch[1]);

  const hourlyPatterns = locale === 'fa'
    ? [
        new RegExp(String.raw`(?:هزینه\s*)?ساعتی(?:\s+هر\s+نفر)?[^\d]{0,16}(${scaledNumber})`, 'iu'),
        new RegExp(String.raw`(${scaledNumber})\s*(?:تومان|ریال|دلار|یورو)?\s*(?:برای|به\s+ازای)\s*(?:هر\s*)?ساعت`, 'iu'),
      ]
    : [
        new RegExp(String.raw`(?:average\s+)?hourly(?:\s+cost)?[^\d$]{0,16}\$?\s*(${scaledNumber})`, 'iu'),
        new RegExp(String.raw`\$?\s*(${scaledNumber})\s*(?:usd|dollars?|eur|euros?)?\s*(?:\/\s*(?:hour|hr)|per\s+hour)`, 'iu'),
      ];

  for (const pattern of hourlyPatterns) {
    const match = normalized.match(pattern);
    if (!match?.[1]) continue;
    const amount = parseAmount(match[1]);
    if (amount !== null) values.averageHourlyCost = amount;
    break;
  }

  values.currency = detectCurrency(text, locale === 'fa' ? 'TOMAN' : 'USD');
  return values;
};

const cleanWaitingValue = (value: string): string =>
  value.replace(/[،,.!?؟]+$/u, '').replace(/\s+/g, ' ').trim();

const extractWaitingValues = (
  text: string,
  locale: TinyLocale,
  lexicon: TinyLanguageLexicon,
): Record<string, TinyAssistantValue> => {
  const values: Record<string, TinyAssistantValue> = {};
  const waitingTerms = termAlternation(getTinyLanguageTerms('state.waiting', locale, lexicon));
  const fromTerms = termAlternation(getTinyLanguageTerms('connector.from', locale, lexicon));
  if (!waitingTerms) return values;

  const complete = locale === 'fa'
    ? new RegExp(`(?:${waitingTerms})\\s+(.+?)\\s+(?:${fromTerms || 'از'})\\s+(.+?)(?=\\s+(?:هستم|هستیم|ام|ایم)|[.!؟?]|$)`, 'iu')
    : new RegExp(`(?:i(?:'m| am)\\s+)?(?:${waitingTerms})\\s+(.+?)\\s+(?:${fromTerms || 'from'})\\s+(.+?)(?=[.!?]|$)`, 'iu');

  const match = text.match(complete);
  if (match?.[1]) values.subject = cleanWaitingValue(match[1]);
  if (match?.[2]) values.waitingOn = cleanWaitingValue(match[2]);

  if (!values.subject) {
    const subjectOnly = locale === 'fa'
      ? new RegExp(`(?:${waitingTerms})\\s+(.+?)(?=\\s+(?:هستم|هستیم|ام|ایم)|[.!؟?]|$)`, 'iu')
      : new RegExp(`(?:i(?:'m| am)\\s+)?(?:${waitingTerms})\\s+(.+?)(?=[.!?]|$)`, 'iu');
    const subjectMatch = text.match(subjectOnly);
    const candidate = subjectMatch?.[1] ?? '';
    const containsFrom = getTinyLanguageTerms('connector.from', locale, lexicon)
      .some((term) => new RegExp(`\\s${escapeRegex(term)}\\s`, 'iu').test(` ${candidate} `));
    if (candidate && !containsFrom) values.subject = cleanWaitingValue(candidate);
  }
  return values;
};

const moduleConceptById: Partial<Record<string, TinyLanguageConceptId>> = {
  'tiny-risk': 'module.risk',
  'tiny-waiting': 'module.waiting',
  'tiny-delegation': 'module.delegation',
  'tiny-deadline': 'module.deadline',
  'tiny-raci': 'module.raci',
  'tiny-meeting-cost': 'module.meeting-cost',
  'tiny-project-health': 'module.project-health',
  'tiny-weekly-review': 'module.weekly-review',
  'tiny-decision-matrix': 'module.decision-matrix',
};

const findModule = (
  text: string,
  locale: TinyLocale,
  lexicon: TinyLanguageLexicon,
) => moduleCatalog.find((module) => {
  const conceptId = moduleConceptById[module.id];
  if (conceptId && tinyLanguageMatches(text, conceptId, locale, lexicon)) return true;
  const normalized = text.toLocaleLowerCase();
  return [module.id, module.name.fa, module.name.en]
    .some((candidate) => normalized.includes(candidate.toLocaleLowerCase()));
}) ?? null;

const extractTeachValues = (
  text: string,
  locale: TinyLocale,
  lexicon: TinyLanguageLexicon,
): Record<string, TinyAssistantValue> | null => {
  const patterns = locale === 'fa'
    ? [
        /(?:واژه|کلمه)\s+[«"]?(.+?)[»"]?\s+را\s+برای\s+[«"]?(.+?)[»"]?\s+(?:اضافه کن|بشناس|یاد بگیر)/u,
        /برای\s+[«"]?(.+?)[»"]?\s+(?:واژه|کلمه)\s+[«"]?(.+?)[»"]?\s+را\s+(?:اضافه کن|بشناس|یاد بگیر)/u,
      ]
    : [
        /(?:add|learn)\s+(?:the\s+)?(?:word|phrase)?\s*["']?(.+?)["']?\s+(?:for|as)\s+["']?(.+?)["']?(?:\s|$)/i,
      ];

  for (const [index, pattern] of patterns.entries()) {
    const match = text.match(pattern);
    if (!match?.[1] || !match?.[2]) continue;
    const swapped = locale === 'fa' && index === 1;
    const phrase = (swapped ? match[2] : match[1]).trim();
    const target = (swapped ? match[1] : match[2]).trim();
    const conceptId = resolveTinyLanguageConcept(target, locale, lexicon);
    if (!conceptId || conceptId === 'system.teach') return null;
    return { phrase, conceptId, locale };
  }
  return null;
};

export const interpretLocally = (
  text: string,
  locale: TinyLocale,
  lexicon: TinyLanguageLexicon = emptyTinyLanguageLexicon(),
): TinyAssistantInterpretation => {
  const trimmed = text.trim();
  const values: Record<string, TinyAssistantValue> = {};

  if (tinyLanguageMatches(trimmed, 'system.teach', locale, lexicon)) {
    const teachValues = extractTeachValues(trimmed, locale, lexicon);
    if (teachValues) {
      return {
        actionId: 'core.language.alias.add',
        confidence: 0.99,
        values: teachValues,
        source: 'local',
      };
    }
  }

  const isMeetingCost =
    tinyLanguageMatches(trimmed, 'entity.meeting', locale, lexicon)
    && tinyLanguageMatches(trimmed, 'field.cost', locale, lexicon);

  if (isMeetingCost) {
    return {
      actionId: 'tiny-meeting-cost.calculate',
      confidence: 0.98,
      values: extractMeetingCostValues(trimmed, locale),
      source: 'local',
    };
  }

  if (tinyLanguageMatches(trimmed, 'state.waiting', locale, lexicon)) {
    return {
      actionId: 'tiny-waiting.create',
      confidence: 0.95,
      values: extractWaitingValues(trimmed, locale, lexicon),
      source: 'local',
    };
  }

  const isProjectCreate =
    tinyLanguageMatches(trimmed, 'entity.project', locale, lexicon)
    && tinyLanguageMatches(trimmed, 'action.create', locale, lexicon);

  if (isProjectCreate) {
    const name = projectNameFromText(trimmed, locale, lexicon);
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

  const module = findModule(trimmed, locale, lexicon);
  if (module) {
    const disable = tinyLanguageMatches(trimmed, 'action.disable', locale, lexicon);
    const enable = !disable && tinyLanguageMatches(trimmed, 'action.enable', locale, lexicon);

    if (enable || disable) {
      return {
        actionId: enable ? 'core.module.enable' : 'core.module.disable',
        confidence: 0.98,
        values: { moduleId: module.id },
        source: 'local',
      };
    }

    if (tinyLanguageMatches(trimmed, 'action.open', locale, lexicon)) {
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
    reason: locale === 'fa'
      ? 'هیچ الگوی تعریف‌شده‌ای با این درخواست تطبیق نداشت.'
      : 'The request did not match any defined language pattern.',
  };
};
