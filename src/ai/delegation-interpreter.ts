import type { TinyLocale } from '../core/types';
import { getTinyLanguageTerms, tinyLanguageMatches, type TinyLanguageLexicon } from './language-engine';
import type { TinyAssistantValue } from './types';

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const alternation = (terms: string[]): string =>
  [...terms].sort((a, b) => b.length - a.length).map(escapeRegex).join('|');
const clean = (value: string): string => value.replace(/[،,.!?؟]+$/u, '').replace(/\s+/g, ' ').trim();

export function isDelegationCommand(text: string, locale: TinyLocale, lexicon: TinyLanguageLexicon): boolean {
  return tinyLanguageMatches(text, 'action.delegate', locale, lexicon);
}

export function extractDelegationValues(
  text: string,
  locale: TinyLocale,
  lexicon: TinyLanguageLexicon,
): Record<string, TinyAssistantValue> {
  const values: Record<string, TinyAssistantValue> = {};
  const delegateTerms = alternation(getTinyLanguageTerms('action.delegate', locale, lexicon));
  const toTerms = alternation(getTinyLanguageTerms('connector.to', locale, lexicon));
  if (!delegateTerms) return values;

  const pattern = locale === 'fa'
    ? new RegExp(`(.+?)\\s+(?:را\\s+)?(?:${toTerms || 'به'})\\s+(.+?)\\s+(?:${delegateTerms})(?:\\s|$)`, 'iu')
    : new RegExp(`(?:${delegateTerms})\\s+(.+?)\\s+(?:${toTerms || 'to'})\\s+(.+?)(?=[.!?]|$)`, 'iu');

  const match = text.match(pattern);
  if (match?.[1]) values.task = clean(match[1]);
  if (match?.[2]) values.assigneeName = clean(match[2]);
  return values;
}
