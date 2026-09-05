import type { TinyLocale, TinyManagerStorage } from '../core/types';
import { getAssistantAction, assistantActions } from './action-registry';
import { detectCurrency, parseAmount } from './number-parser';
import { interpretLocally } from './local-interpreter';
import type {
  TinyAssistantDraft,
  TinyAssistantInterpretation,
  TinyAssistantProvider,
  TinyAssistantValue,
} from './types';

export interface TinyAssistantReply {
  text: string;
  kind: 'message' | 'question' | 'confirmation' | 'success' | 'error';
  draft: TinyAssistantDraft | null;
  route?: string | undefined;
}

const affirmative = (text: string): boolean =>
  /^(?:بله|آره|اوکی|باشه|تایید|تأیید|تایید کن|تأیید کن|ثبت کن|انجام بده|yes|ok|okay|confirm|do it)$/iu.test(text.trim());

const negative = (text: string): boolean =>
  /^(?:نه|خیر|لغو|لغو کن|بیخیال|cancel|no|stop)$/iu.test(text.trim());

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

export class TinyAssistantOrchestrator {
  constructor(
    private readonly storage: TinyManagerStorage,
    private readonly provider?: TinyAssistantProvider,
  ) {}

  private async interpret(text: string, locale: TinyLocale): Promise<TinyAssistantInterpretation> {
    if (this.provider) {
      try {
        const result = await this.provider.interpret({
          text,
          locale,
          actions: assistantActions.map((action) => ({
            id: action.id,
            moduleId: action.moduleId,
            title: action.title,
            fields: action.fields,
          })),
        });
        if (result?.actionId && result.confidence >= 0.7 && getAssistantAction(result.actionId)) {
          return { ...result, source: 'provider' };
        }
      } catch {
        // The local interpreter remains available if a remote/local model adapter fails.
      }
    }
    return interpretLocally(text, locale);
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

    if (draft && negative(cleaned)) {
      return {
        text: locale === 'fa' ? 'لغو شد؛ چیزی ذخیره نشد.' : 'Cancelled. Nothing was saved.',
        kind: 'message',
        draft: null,
      };
    }

    if (draft?.phase === 'confirming') {
      if (!affirmative(cleaned)) {
        return {
          text: locale === 'fa'
            ? 'اگر اطلاعات درست است «تأیید» بنویس؛ برای لغو «لغو» بنویس.'
            : 'Reply “confirm” if it looks right, or “cancel” to stop.',
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
      return {
        text: locale === 'fa'
          ? 'متوجه نشدم این درخواست مربوط به کدام بخش است. ساده‌تر بنویس؛ مثلاً «پروژه نمایشگاه با بودجه ۳۰۰ میلیون ایجاد کن» یا «ماژول ریسک را فعال کن».'
          : 'I could not determine the right action. Try something simpler, such as “create project Expo with a 300,000 budget” or “enable the Risk module”.',
        kind: 'question',
        draft: null,
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
