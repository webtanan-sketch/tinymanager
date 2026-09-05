import type { TinyLocale, TinyManagerStorage } from '../core/types';
import { getAssistantAction } from './action-registry';
import { createTinyLanguageLearningPrompt } from './language-learning';
import {
  TinyLanguageRepository,
  tinyLanguageConcepts,
  tinyLanguageMatches,
  type TinyLanguageConceptId,
  type TinyLanguageLexicon,
} from './language-engine';
import { detectCurrency, parseAmount } from './number-parser';
import { interpretLocally } from './local-interpreter';
import type {
  TinyAssistantDraft,
  TinyAssistantInterpretation,
  TinyAssistantValue,
  TinyLanguageLearningPrompt,
} from './types';

export interface TinyAssistantReply {
  text: string;
  kind: 'message' | 'question' | 'learning' | 'confirmation' | 'success' | 'error';
  draft: TinyAssistantDraft | null;
  learning?: TinyLanguageLearningPrompt;
  route?: string | undefined;
}

const hasValue = (value: TinyAssistantValue | undefined): boolean =>
  value !== undefined && value !== null && value !== '' && !(typeof value === 'number' && Number.isNaN(value));

const missingFields = (actionId: string, values: Record<string, TinyAssistantValue>): string[] => {
  const action = getAssistantAction(actionId);
  if (!action) return [];
  return action.fields
    .filter((field) => field.required && !hasValue(values[field.id]))
    .map((field) => field.id);
};

const questionFor = (draft: TinyAssistantDraft, locale: TinyLocale): string => {
  const action = getAssistantAction(draft.actionId);
  const field = action?.fields.find((item) => item.id === draft.missingFieldIds[0]);
  if (!field) return locale === 'fa' ? 'اطلاعات بیشتری لازم دارم.' : 'I need a little more information.';
  return locale === 'fa'
    ? `${field.label.fa} را وارد کن.`
    : `Enter the ${field.label.en.toLocaleLowerCase()}.`;
};

const confirmationText = (draft: TinyAssistantDraft, locale: TinyLocale): string => {
  const action = getAssistantAction(draft.actionId);
  if (!action) return locale === 'fa' ? 'این عملیات را تأیید می‌کنی؟' : 'Confirm this action?';
  const summary = action.summarize(draft.values, locale);
  return locale === 'fa'
    ? `${summary}\n\nتأیید می‌کنی؟`
    : `${summary}\n\nConfirm?`;
};

const fillMissingValue = (
  draft: TinyAssistantDraft,
  text: string,
  locale: TinyLocale,
): TinyAssistantDraft => {
  const action = getAssistantAction(draft.actionId);
  const fieldId = draft.missingFieldIds[0];
  const field = action?.fields.find((item) => item.id === fieldId);
  if (!fieldId || !field) return draft;

  let value: TinyAssistantValue = text.trim();
  if (field.type === 'number') {
    value = parseAmount(text);
  } else if (field.type === 'currency') {
    value = detectCurrency(text, locale === 'fa' ? 'TOMAN' : 'USD');
  }

  const values = { ...draft.values, [fieldId]: value };
  const missingFieldIds = missingFields(draft.actionId, values);
  return {
    actionId: draft.actionId,
    values,
    missingFieldIds,
    phase: missingFieldIds.length > 0 ? 'collecting' : 'confirming',
  };
};

const isConceptId = (value: string): value is TinyLanguageConceptId =>
  tinyLanguageConcepts.some((concept) => concept.id === value);

export class TinyAssistantOrchestrator {
  private readonly language: TinyLanguageRepository;

  constructor(private readonly storage: TinyManagerStorage) {
    this.language = new TinyLanguageRepository(storage);
  }

  private async loadLexicon(): Promise<TinyLanguageLexicon> {
    return this.language.load();
  }

  private async interpret(text: string, locale: TinyLocale): Promise<TinyAssistantInterpretation> {
    const lexicon = await this.loadLexicon();
    return interpretLocally(text, locale, lexicon);
  }

  async prepareLanguageAlias(
    phrase: string,
    conceptId: string,
    locale: TinyLocale,
  ): Promise<TinyAssistantReply> {
    const cleanedPhrase = phrase.trim();
    if (!cleanedPhrase || !isConceptId(conceptId) || conceptId === 'system.teach') {
      return {
        text: locale === 'fa' ? 'عبارت و بخش مربوط را انتخاب کن.' : 'Choose the phrase and the related system concept.',
        kind: 'learning',
        draft: null,
      };
    }

    const draft: TinyAssistantDraft = {
      actionId: 'core.language.alias.add',
      values: { phrase: cleanedPhrase, conceptId, locale },
      missingFieldIds: [],
      phase: 'confirming',
    };
    return {
      text: confirmationText(draft, locale),
      kind: 'confirmation',
      draft,
    };
  }

  async submit(
    text: string,
    locale: TinyLocale,
    draft: TinyAssistantDraft | null,
  ): Promise<TinyAssistantReply> {
    const cleaned = text.trim();
    if (!cleaned) {
      return {
        text: locale === 'fa' ? 'یک درخواست کوتاه بنویس.' : 'Write a short request.',
        kind: 'question',
        draft,
      };
    }

    const lexicon = await this.loadLexicon();
    const affirmative = tinyLanguageMatches(cleaned, 'system.confirm', locale, lexicon);
    const negative = tinyLanguageMatches(cleaned, 'system.cancel', locale, lexicon);

    if (draft && negative) {
      return {
        text: locale === 'fa' ? 'لغو شد؛ چیزی ذخیره نشد.' : 'Cancelled. Nothing was saved.',
        kind: 'message',
        draft: null,
      };
    }

    if (draft?.phase === 'confirming') {
      if (!affirmative) {
        return {
          text: locale === 'fa'
            ? 'اگر اطلاعات درست است یکی از واژه‌های تأیید تعریف‌شده را بنویس؛ برای توقف از واژه لغو استفاده کن.'
            : 'Use one of the defined confirmation words if this is correct, or a cancel word to stop.',
          kind: 'confirmation',
          draft,
        };
      }

      const action = getAssistantAction(draft.actionId);
      if (!action) {
        return {
          text: locale === 'fa' ? 'این عملیات دیگر در دسترس نیست.' : 'This action is no longer available.',
          kind: 'error',
          draft: null,
        };
      }
      const result = await action.execute(draft.values, { locale, storage: this.storage });
      return {
        text: result.message[locale],
        kind: result.ok ? 'success' : 'error',
        draft: null,
        route: result.route,
      };
    }

    if (draft?.phase === 'collecting') {
      const next = fillMissingValue(draft, cleaned, locale);
      const firstMissing = next.missingFieldIds[0];
      if (firstMissing) {
        const supplied = next.values[firstMissing];
        if (supplied === null || supplied === '') {
          return { text: questionFor(next, locale), kind: 'question', draft: next };
        }
        return { text: questionFor(next, locale), kind: 'question', draft: next };
      }
      return {
        text: confirmationText(next, locale),
        kind: 'confirmation',
        draft: next,
      };
    }

    const interpretation = await this.interpret(cleaned, locale);
    if (!interpretation.actionId) {
      const learning = createTinyLanguageLearningPrompt(cleaned, locale, lexicon);
      return {
        text: locale === 'fa'
          ? `عبارت «${learning.phrase}» را نمی‌شناسم. این عبارت مربوط به کدام بخش TinyManager است؟`
          : `I do not recognize “${learning.phrase}”. Which TinyManager concept does it belong to?`,
        kind: 'learning',
        draft: null,
        learning,
      };
    }

    const action = getAssistantAction(interpretation.actionId);
    if (!action) {
      return {
        text: locale === 'fa' ? 'این عملیات هنوز در TinyManager پیاده‌سازی نشده است.' : 'That action is not implemented in TinyManager yet.',
        kind: 'error',
        draft: null,
      };
    }

    const missingFieldIds = missingFields(action.id, interpretation.values);
    const nextDraft: TinyAssistantDraft = {
      actionId: action.id,
      values: interpretation.values,
      missingFieldIds,
      phase: missingFieldIds.length > 0 ? 'collecting' : 'confirming',
    };

    if (missingFieldIds.length > 0) {
      return {
        text: questionFor(nextDraft, locale),
        kind: 'question',
        draft: nextDraft,
      };
    }

    if (!action.requiresConfirmation) {
      const result = await action.execute(nextDraft.values, { locale, storage: this.storage });
      return {
        text: result.message[locale],
        kind: result.ok ? 'success' : 'error',
        draft: null,
        route: result.route,
      };
    }

    return {
      text: confirmationText(nextDraft, locale),
      kind: 'confirmation',
      draft: nextDraft,
    };
  }
}
