import { calculateMeetingCost, type TinyMeetingCurrency } from 'tiny-meeting-cost';
import { TinyWaitingRepository } from 'tiny-waiting';
import { TinyManagerModuleRegistry } from '../core/module-registry';
import { TinyProjectRepository, type TinyProjectCurrency } from '../core/projects';
import { moduleCatalog } from '../modules/catalog';
import { formatAmount } from './number-parser';
import type {
  TinyAssistantActionDefinition,
  TinyAssistantExecutionContext,
  TinyAssistantValue,
} from './types';

const asString = (value: TinyAssistantValue | undefined): string => typeof value === 'string' ? value : '';
const asNumber = (value: TinyAssistantValue | undefined): number => typeof value === 'number' ? value : Number.NaN;

const currencyOf = (value: TinyAssistantValue | undefined): TinyProjectCurrency => {
  if (value === 'TOMAN' || value === 'IRR' || value === 'USD' || value === 'EUR' || value === 'OTHER') return value;
  return 'OTHER';
};

const meetingCurrencyOf = (value: TinyAssistantValue | undefined): TinyMeetingCurrency => currencyOf(value);

const moduleName = (id: string, locale: 'fa' | 'en'): string =>
  moduleCatalog.find((module) => module.id === id)?.name[locale] ?? id;

const formatMeetingResult = (value: number, currency: TinyMeetingCurrency, locale: 'fa' | 'en'): string => {
  const formatted = new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(value);
  const labels: Record<TinyMeetingCurrency, { fa: string; en: string }> = {
    TOMAN: { fa: 'تومان', en: 'toman' },
    IRR: { fa: 'ریال', en: 'IRR' },
    USD: { fa: 'دلار', en: 'USD' },
    EUR: { fa: 'یورو', en: 'EUR' },
    OTHER: { fa: 'واحد', en: 'units' },
  };
  return `${formatted} ${labels[currency][locale]}`;
};

const createProject: TinyAssistantActionDefinition = {
  id: 'core.project.create',
  moduleId: 'core',
  title: { fa: 'ایجاد پروژه', en: 'Create project' },
  description: {
    fa: 'ایجاد یک پروژه مشترک برای استفاده همه ماژول‌ها.',
    en: 'Create a shared project that every module can reference.',
  },
  fields: [
    { id: 'name', label: { fa: 'نام پروژه', en: 'Project name' }, required: true, type: 'text' },
    { id: 'budgetAmount', label: { fa: 'مبلغ/بودجه', en: 'Budget amount' }, required: true, type: 'number' },
    { id: 'currency', label: { fa: 'واحد پول', en: 'Currency' }, required: true, type: 'currency' },
  ],
  requiresConfirmation: true,
  summarize(values, locale) {
    const name = asString(values.name);
    const amount = asNumber(values.budgetAmount);
    const currency = currencyOf(values.currency);
    if (locale === 'fa') return `پروژه «${name}» با بودجه ${formatAmount(amount, currency, 'fa')}`;
    return `Project “${name}” with a budget of ${formatAmount(amount, currency, 'en')}`;
  },
  async execute(values, context) {
    const repository = new TinyProjectRepository(context.storage);
    const name = asString(values.name);
    const existing = await repository.findByName(name);
    if (existing) {
      return {
        ok: false,
        message: {
          fa: `پروژه‌ای با نام «${name}» از قبل وجود دارد.`,
          en: `A project named “${name}” already exists.`,
        },
        entityId: existing.id,
      };
    }

    const project = await repository.create({
      name,
      budgetAmount: asNumber(values.budgetAmount),
      currency: currencyOf(values.currency),
    });

    return {
      ok: true,
      entityId: project.id,
      message: {
        fa: `پروژه «${project.name}» ثبت شد.`,
        en: `Project “${project.name}” was created.`,
      },
    };
  },
};

const calculateMeeting: TinyAssistantActionDefinition = {
  id: 'tiny-meeting-cost.calculate',
  moduleId: 'tiny-meeting-cost',
  title: { fa: 'محاسبه هزینه جلسه', en: 'Calculate meeting cost' },
  description: {
    fa: 'محاسبه هزینه مالی و نفر-ساعت جلسه بدون ثبت داده.',
    en: 'Calculate meeting cost and person-hours without writing data.',
  },
  fields: [
    { id: 'participants', label: { fa: 'تعداد افراد', en: 'Number of participants' }, required: true, type: 'number' },
    { id: 'durationMinutes', label: { fa: 'مدت جلسه به دقیقه', en: 'Meeting duration in minutes' }, required: true, type: 'number' },
    { id: 'averageHourlyCost', label: { fa: 'هزینه ساعتی متوسط هر نفر', en: 'Average hourly cost per person' }, required: true, type: 'number' },
    { id: 'currency', label: { fa: 'واحد پول', en: 'Currency' }, required: true, type: 'currency' },
  ],
  requiresConfirmation: false,
  summarize(values, locale) {
    const participants = asNumber(values.participants);
    const duration = asNumber(values.durationMinutes);
    return locale === 'fa'
      ? `محاسبه هزینه جلسه ${participants} نفره با مدت ${duration} دقیقه`
      : `Calculate a ${duration}-minute meeting for ${participants} people`;
  },
  async execute(values) {
    const currency = meetingCurrencyOf(values.currency);
    const result = calculateMeetingCost({
      participants: asNumber(values.participants),
      durationMinutes: asNumber(values.durationMinutes),
      averageHourlyCost: asNumber(values.averageHourlyCost),
      currency,
    });
    const faPersonHours = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(result.personHours);
    const enPersonHours = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(result.personHours);
    return {
      ok: true,
      message: {
        fa: `هزینه تقریبی جلسه ${formatMeetingResult(result.totalCost, currency, 'fa')} است؛ مجموع زمان مصرف‌شده ${faPersonHours} نفر-ساعت است.`,
        en: `Estimated meeting cost is ${formatMeetingResult(result.totalCost, currency, 'en')}; total time is ${enPersonHours} person-hours.`,
      },
    };
  },
};

const createWaiting: TinyAssistantActionDefinition = {
  id: 'tiny-waiting.create',
  moduleId: 'tiny-waiting',
  title: { fa: 'ثبت منتظر پاسخ', en: 'Create Waiting For item' },
  description: {
    fa: 'ثبت چیزی که ادامه آن منتظر پاسخ شخص دیگری است.',
    en: 'Track something that cannot continue until somebody else responds.',
  },
  fields: [
    { id: 'subject', label: { fa: 'منتظر چه چیزی هستی؟', en: 'What are you waiting for?' }, required: true, type: 'text' },
    { id: 'waitingOn', label: { fa: 'از چه کسی؟', en: 'Who are you waiting on?' }, required: true, type: 'text' },
  ],
  requiresConfirmation: true,
  summarize(values, locale) {
    const subject = asString(values.subject);
    const waitingOn = asString(values.waitingOn);
    return locale === 'fa'
      ? `ثبت «${subject}» در منتظر پاسخ از «${waitingOn}»`
      : `Track “${subject}” as waiting on “${waitingOn}”`;
  },
  async execute(values, context) {
    const repository = new TinyWaitingRepository(context.storage);
    const item = await repository.create({
      subject: asString(values.subject),
      waitingOn: asString(values.waitingOn),
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tinymanager:waiting-changed'));
    }
    return {
      ok: true,
      entityId: item.id,
      message: {
        fa: `«${item.subject}» ثبت شد؛ منتظر پاسخ ${item.waitingOn} هستی.`,
        en: `“${item.subject}” is now tracked as waiting on ${item.waitingOn}.`,
      },
    };
  },
};

const moduleToggle = (enabled: boolean): TinyAssistantActionDefinition => ({
  id: enabled ? 'core.module.enable' : 'core.module.disable',
  moduleId: 'core',
  title: enabled ? { fa: 'فعال‌سازی ماژول', en: 'Enable module' } : { fa: 'غیرفعال‌سازی ماژول', en: 'Disable module' },
  description: enabled
    ? { fa: 'فعال کردن یک ماژول TinyManager.', en: 'Enable a TinyManager module.' }
    : { fa: 'غیرفعال کردن یک ماژول TinyManager.', en: 'Disable a TinyManager module.' },
  fields: [
    { id: 'moduleId', label: { fa: 'ماژول', en: 'Module' }, required: true, type: 'module' },
  ],
  requiresConfirmation: true,
  summarize(values, locale) {
    const id = asString(values.moduleId);
    const name = moduleName(id, locale);
    return locale === 'fa'
      ? `${enabled ? 'فعال‌سازی' : 'غیرفعال‌سازی'} ماژول «${name}»`
      : `${enabled ? 'Enable' : 'Disable'} the “${name}” module`;
  },
  async execute(values, context: TinyAssistantExecutionContext) {
    const id = asString(values.moduleId);
    const module = moduleCatalog.find((item) => item.id === id);
    if (!module) {
      return {
        ok: false,
        message: { fa: 'ماژول پیدا نشد.', en: 'Module not found.' },
      };
    }

    const registry = new TinyManagerModuleRegistry(moduleCatalog, context.storage);
    await registry.hydrate();
    await registry.setEnabled(id, enabled);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tinymanager:modules-changed'));
    }

    const result = {
      ok: true,
      message: enabled
        ? { fa: `ماژول «${module.name.fa}» فعال شد.`, en: `The “${module.name.en}” module was enabled.` }
        : { fa: `ماژول «${module.name.fa}» غیرفعال شد.`, en: `The “${module.name.en}” module was disabled.` },
    };

    if (enabled && module.maturity !== 'foundation') {
      return { ...result, route: module.route };
    }
    return result;
  },
});

const openModule: TinyAssistantActionDefinition = {
  id: 'core.module.open',
  moduleId: 'core',
  title: { fa: 'باز کردن ماژول', en: 'Open module' },
  description: { fa: 'رفتن مستقیم به یک ماژول.', en: 'Navigate directly to a module.' },
  fields: [
    { id: 'moduleId', label: { fa: 'ماژول', en: 'Module' }, required: true, type: 'module' },
  ],
  requiresConfirmation: false,
  summarize(values, locale) {
    return locale === 'fa'
      ? `باز کردن «${moduleName(asString(values.moduleId), 'fa')}»`
      : `Open “${moduleName(asString(values.moduleId), 'en')}”`;
  },
  async execute(values) {
    const id = asString(values.moduleId);
    const module = moduleCatalog.find((item) => item.id === id);
    if (!module) {
      return {
        ok: false,
        message: { fa: 'ماژول پیدا نشد.', en: 'Module not found.' },
      };
    }
    if (module.maturity === 'foundation') {
      return {
        ok: false,
        route: '/modules',
        message: {
          fa: `ماژول «${module.name.fa}» هنوز در مرحله پایه است؛ صفحه ماژول‌ها را باز کردم.`,
          en: `The “${module.name.en}” module is still in foundation stage; I opened the Modules screen.`,
        },
      };
    }
    return {
      ok: true,
      route: module.route,
      message: {
        fa: `در حال باز کردن «${module.name.fa}».`,
        en: `Opening “${module.name.en}”.`,
      },
    };
  },
};

export const assistantActions: TinyAssistantActionDefinition[] = [
  createProject,
  calculateMeeting,
  createWaiting,
  moduleToggle(true),
  moduleToggle(false),
  openModule,
];

export const getAssistantAction = (id: string): TinyAssistantActionDefinition | null =>
  assistantActions.find((action) => action.id === id) ?? null;
