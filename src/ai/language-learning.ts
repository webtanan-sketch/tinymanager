import type { TinyLocale } from '../core/types';
import {
  getTinyLanguageTerms,
  normalizeTinyLanguageText,
  tinyLanguageMatches,
  type TinyLanguageConceptId,
  type TinyLanguageLexicon,
} from './language-engine';
import type { TinyLanguageLearningPrompt } from './types';

const numericWords = new Set([
  'هزار', 'میلیون', 'میلیارد', 'تومان', 'ریال', 'دلار', 'یورو',
  'thousand', 'million', 'billion', 'usd', 'eur', 'dollar', 'dollars', 'euro', 'euros',
]);

const fillerWords = new Set([
  'با', 'به', 'را', 'برای', 'از', 'در', 'کن', 'بکن', 'لطفا', 'لطفاً',
  'with', 'to', 'for', 'from', 'the', 'a', 'an', 'please',
]);

const tokenize = (text: string): string[] => normalizeTinyLanguageText(text).split(' ').filter(Boolean);

const knownTokenSet = (locale: TinyLocale, lexicon: TinyLanguageLexicon): Set<string> => {
  const result = new Set<string>();
  const concepts: TinyLanguageConceptId[] = [
    'entity.project', 'action.create', 'field.budget', 'entity.meeting', 'field.cost', 'state.waiting',
    'connector.from', 'entity.module', 'action.enable', 'action.disable', 'action.open', 'system.confirm',
    'system.cancel', 'system.teach', 'module.risk', 'module.waiting', 'module.delegation', 'module.deadline',
    'module.raci', 'module.meeting-cost', 'module.project-health', 'module.weekly-review', 'module.decision-matrix',
  ];
  for (const conceptId of concepts) {
    for (const term of getTinyLanguageTerms(conceptId, locale, lexicon)) {
      for (const token of tokenize(term)) result.add(token);
    }
  }
  return result;
};

const isNumericToken = (token: string): boolean => /^\d+(?:[.,]\d+)?$/u.test(token) || numericWords.has(token);

const bestUnknownPhrase = (text: string, locale: TinyLocale, lexicon: TinyLanguageLexicon): string => {
  const tokens = tokenize(text);
  const known = knownTokenSet(locale, lexicon);
  const candidateIndexes: number[] = [];

  tokens.forEach((token, index) => {
    if (!known.has(token) && !isNumericToken(token) && !fillerWords.has(token)) candidateIndexes.push(index);
  });

  if (candidateIndexes.length === 0) return normalizeTinyLanguageText(text);

  // Prefer a short trailing control phrase. Managerial commands commonly put the action at the end.
  const trailing: string[] = [];
  for (let index = tokens.length - 1; index >= 0 && trailing.length < 3; index -= 1) {
    const token = tokens[index];
    if (!token) continue;
    if (known.has(token) || isNumericToken(token)) {
      if (trailing.length > 0) break;
      continue;
    }
    if (fillerWords.has(token)) {
      if (trailing.length > 0) continue;
      continue;
    }
    trailing.unshift(token);
  }
  if (trailing.length > 0) return trailing.join(' ');

  const first = candidateIndexes[0];
  if (first === undefined) return normalizeTinyLanguageText(text);
  return tokens.slice(first, Math.min(first + 3, tokens.length)).join(' ');
};

const suggestionsForContext = (
  text: string,
  locale: TinyLocale,
  lexicon: TinyLanguageLexicon,
): TinyLanguageConceptId[] => {
  const suggestions: TinyLanguageConceptId[] = [];

  const project = tinyLanguageMatches(text, 'entity.project', locale, lexicon);
  const budget = tinyLanguageMatches(text, 'field.budget', locale, lexicon);
  const create = tinyLanguageMatches(text, 'action.create', locale, lexicon);
  if (project && budget && !create) suggestions.push('action.create');
  if (project && create && !budget && /\d/u.test(text)) suggestions.push('field.budget');

  const moduleEntity = tinyLanguageMatches(text, 'entity.module', locale, lexicon);
  if (moduleEntity
    && !tinyLanguageMatches(text, 'action.enable', locale, lexicon)
    && !tinyLanguageMatches(text, 'action.disable', locale, lexicon)
    && !tinyLanguageMatches(text, 'action.open', locale, lexicon)) {
    suggestions.push('action.enable', 'action.disable', 'action.open');
  }

  return suggestions;
};

export const createTinyLanguageLearningPrompt = (
  text: string,
  locale: TinyLocale,
  lexicon: TinyLanguageLexicon,
): TinyLanguageLearningPrompt => ({
  phrase: bestUnknownPhrase(text, locale, lexicon),
  locale,
  originalText: text,
  suggestedConceptIds: suggestionsForContext(text, locale, lexicon),
});
