import type { TinyLocale, TinyManagerStorage } from '../core/types';

export type TinyLanguageConceptId =
  | 'entity.project'
  | 'action.create'
  | 'field.budget'
  | 'entity.meeting'
  | 'field.cost'
  | 'state.waiting'
  | 'connector.from'
  | 'entity.module'
  | 'action.enable'
  | 'action.disable'
  | 'action.open'
  | 'system.confirm'
  | 'system.cancel'
  | 'system.teach'
  | 'module.risk'
  | 'module.waiting'
  | 'module.delegation'
  | 'module.deadline'
  | 'module.raci'
  | 'module.meeting-cost'
  | 'module.project-health'
  | 'module.weekly-review'
  | 'module.decision-matrix';

export interface TinyLanguageConceptDefinition {
  id: TinyLanguageConceptId;
  label: { fa: string; en: string };
  builtIn: { fa: string[]; en: string[] };
}

export interface TinyLanguageAlias {
  id: string;
  conceptId: TinyLanguageConceptId;
  locale: TinyLocale;
  phrase: string;
  createdAt: string;
}

export interface TinyLanguageLexicon {
  aliases: TinyLanguageAlias[];
}

const STORAGE_KEY = 'core.language.aliases.v1';

export const tinyLanguageConcepts: TinyLanguageConceptDefinition[] = [
  { id: 'entity.project', label: { fa: 'پروژه', en: 'project' }, builtIn: { fa: ['پروژه'], en: ['project'] } },
  { id: 'action.create', label: { fa: 'ایجاد', en: 'create' }, builtIn: { fa: ['ایجاد', 'ثبت', 'بساز', 'اضافه'], en: ['create', 'add', 'make', 'register'] } },
  { id: 'field.budget', label: { fa: 'بودجه', en: 'budget' }, builtIn: { fa: ['بودجه', 'مبلغ'], en: ['budget', 'amount'] } },
  { id: 'entity.meeting', label: { fa: 'جلسه', en: 'meeting' }, builtIn: { fa: ['جلسه'], en: ['meeting'] } },
  { id: 'field.cost', label: { fa: 'هزینه', en: 'cost' }, builtIn: { fa: ['هزینه', 'قیمت', 'چقدر'], en: ['cost', 'price', 'how much'] } },
  { id: 'state.waiting', label: { fa: 'منتظر', en: 'waiting' }, builtIn: { fa: ['منتظر', 'منتظر پاسخ'], en: ['waiting', 'waiting for'] } },
  { id: 'connector.from', label: { fa: 'از', en: 'from' }, builtIn: { fa: ['از'], en: ['from'] } },
  { id: 'entity.module', label: { fa: 'ماژول', en: 'module' }, builtIn: { fa: ['ماژول'], en: ['module'] } },
  { id: 'action.enable', label: { fa: 'فعال', en: 'enable' }, builtIn: { fa: ['فعال', 'روشن'], en: ['enable', 'activate', 'turn on'] } },
  { id: 'action.disable', label: { fa: 'غیرفعال', en: 'disable' }, builtIn: { fa: ['غیرفعال', 'خاموش'], en: ['disable', 'deactivate', 'turn off'] } },
  { id: 'action.open', label: { fa: 'باز کردن', en: 'open' }, builtIn: { fa: ['باز', 'برو', 'نمایش'], en: ['open', 'show', 'go to'] } },
  { id: 'system.confirm', label: { fa: 'تأیید', en: 'confirm' }, builtIn: { fa: ['بله', 'آره', 'اوکی', 'باشه', 'تایید', 'تأیید', 'تایید کن', 'تأیید کن', 'ثبت کن', 'انجام بده'], en: ['yes', 'ok', 'okay', 'confirm', 'do it'] } },
  { id: 'system.cancel', label: { fa: 'لغو', en: 'cancel' }, builtIn: { fa: ['نه', 'خیر', 'لغو', 'لغو کن', 'بیخیال'], en: ['cancel', 'no', 'stop'] } },
  { id: 'system.teach', label: { fa: 'یادگیری واژه', en: 'teach word' }, builtIn: { fa: ['واژه', 'کلمه', 'بشناس', 'یاد بگیر'], en: ['word', 'phrase', 'learn', 'recognize'] } },
  { id: 'module.risk', label: { fa: 'ریسک', en: 'risk' }, builtIn: { fa: ['ریسک'], en: ['risk'] } },
  { id: 'module.waiting', label: { fa: 'منتظر پاسخ', en: 'waiting for' }, builtIn: { fa: ['منتظر پاسخ'], en: ['waiting for'] } },
  { id: 'module.delegation', label: { fa: 'تفویض', en: 'delegation' }, builtIn: { fa: ['تفویض'], en: ['delegation'] } },
  { id: 'module.deadline', label: { fa: 'موعد', en: 'deadline' }, builtIn: { fa: ['موعد', 'مهلت'], en: ['deadline'] } },
  { id: 'module.raci', label: { fa: 'راسی', en: 'RACI' }, builtIn: { fa: ['راسی', 'raci'], en: ['raci'] } },
  { id: 'module.meeting-cost', label: { fa: 'هزینه جلسه', en: 'meeting cost' }, builtIn: { fa: ['هزینه جلسه'], en: ['meeting cost'] } },
  { id: 'module.project-health', label: { fa: 'سلامت پروژه', en: 'project health' }, builtIn: { fa: ['سلامت پروژه'], en: ['project health'] } },
  { id: 'module.weekly-review', label: { fa: 'مرور هفتگی', en: 'weekly review' }, builtIn: { fa: ['مرور هفتگی'], en: ['weekly review'] } },
  { id: 'module.decision-matrix', label: { fa: 'ماتریس تصمیم', en: 'decision matrix' }, builtIn: { fa: ['ماتریس تصمیم'], en: ['decision matrix'] } },
];

const normalizePersian = (value: string): string =>
  value
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200c\u200f\u202a-\u202e]/g, ' ');

export const normalizeTinyLanguageText = (value: string): string =>
  normalizePersian(value)
    .toLocaleLowerCase()
    .replace(/[«»"'`()\[\]{}،,:;.!?؟/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const phraseInText = (text: string, phrase: string): boolean => {
  const normalizedText = ` ${normalizeTinyLanguageText(text)} `;
  const normalizedPhrase = normalizeTinyLanguageText(phrase);
  if (!normalizedPhrase) return false;
  return normalizedText.includes(` ${normalizedPhrase} `);
};

export const emptyTinyLanguageLexicon = (): TinyLanguageLexicon => ({ aliases: [] });

export const getTinyLanguageTerms = (
  conceptId: TinyLanguageConceptId,
  locale: TinyLocale,
  lexicon: TinyLanguageLexicon = emptyTinyLanguageLexicon(),
): string[] => {
  const concept = tinyLanguageConcepts.find((item) => item.id === conceptId);
  const builtIn = concept?.builtIn[locale] ?? [];
  const custom = lexicon.aliases
    .filter((alias) => alias.conceptId === conceptId && alias.locale === locale)
    .map((alias) => alias.phrase);
  return [...new Set([...builtIn, ...custom])];
};

export const tinyLanguageMatches = (
  text: string,
  conceptId: TinyLanguageConceptId,
  locale: TinyLocale,
  lexicon: TinyLanguageLexicon = emptyTinyLanguageLexicon(),
): boolean => getTinyLanguageTerms(conceptId, locale, lexicon).some((term) => phraseInText(text, term));

export const resolveTinyLanguageConcept = (
  value: string,
  locale: TinyLocale,
  lexicon: TinyLanguageLexicon = emptyTinyLanguageLexicon(),
): TinyLanguageConceptId | null => {
  const normalized = normalizeTinyLanguageText(value);
  if (!normalized) return null;

  for (const concept of tinyLanguageConcepts) {
    if (normalizeTinyLanguageText(concept.id) === normalized) return concept.id;
    if (normalizeTinyLanguageText(concept.label[locale]) === normalized) return concept.id;
    if (getTinyLanguageTerms(concept.id, locale, lexicon).some((term) => normalizeTinyLanguageText(term) === normalized)) {
      return concept.id;
    }
  }
  return null;
};

export class TinyLanguageRepository {
  constructor(private readonly storage: TinyManagerStorage) {}

  async load(): Promise<TinyLanguageLexicon> {
    const aliases = await this.storage.get<TinyLanguageAlias[]>(STORAGE_KEY);
    return { aliases: Array.isArray(aliases) ? aliases : [] };
  }

  async addAlias(input: { conceptId: TinyLanguageConceptId; locale: TinyLocale; phrase: string }): Promise<TinyLanguageAlias> {
    const lexicon = await this.load();
    const phrase = normalizeTinyLanguageText(input.phrase);
    if (!phrase) throw new Error('Language alias cannot be empty.');

    const duplicate = lexicon.aliases.find(
      (alias) => alias.conceptId === input.conceptId && alias.locale === input.locale && normalizeTinyLanguageText(alias.phrase) === phrase,
    );
    if (duplicate) return duplicate;

    const alias: TinyLanguageAlias = {
      id: globalThis.crypto?.randomUUID?.() ?? `lang-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      conceptId: input.conceptId,
      locale: input.locale,
      phrase: input.phrase.trim(),
      createdAt: new Date().toISOString(),
    };
    await this.storage.set(STORAGE_KEY, [...lexicon.aliases, alias]);
    return alias;
  }

  async removeAlias(id: string): Promise<void> {
    const lexicon = await this.load();
    await this.storage.set(STORAGE_KEY, lexicon.aliases.filter((alias) => alias.id !== id));
  }
}

export const TINY_LANGUAGE_STORAGE_KEY = STORAGE_KEY;
