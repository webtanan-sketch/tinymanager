import { TinyManagerModuleRegistry } from '../core/module-registry';
import { TinyProjectRepository, type TinyProjectCurrency } from '../core/projects';
import { moduleCatalog } from '../modules/catalog';
import { formatAmount } from './number-parser';
import type {
  TinyAssistantActionDefinition,
  TinyAssistantExecutionContext,
  TinyAssistantValue,
} from './types';

const asString = (value: TinyAssistantValue): string => typeof value === 'string' ? value : '';
const asNumber = (value: TinyAssistantValue): number => typeof value === 'number' ? value : Number.NaN;

const currencyOf = (value: TinyAssistantValue): TinyProjectCurrency => {
  if (value === 'TOMAN' || value === 'IRR' || value === 'USD' || value === 'EUR' || value === 'OTHER') return value;
  return 'OTHER';
};

const moduleName = (id: string, locale: 'fa' | 'en'): string =>
  moduleCatalog.find((module) => module.id === id)?.name[locale] ?? id;

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
    const registry = new TinyManagerModuleRegistry(moduleCatalog, context.storage);
    await registry.hydrate();
    await registry.setEnabled(id, enabled);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tinymanager:modules-changed'));
    }
    return {
      ok: true,
      message: enabled
        ? { fa: `ماژول «${moduleName(id, 'fa')}» فعال شد.`, en: `The “${moduleName(id, 'en')}” module was enabled.` }
        : { fa: `ماژول «${moduleName(id, 'fa')}» غیرفعال شد.`, en: `The “${moduleName(id, 'en')}” module was disabled.` },
      route: enabled ? moduleCatalog.find((module) => module.id === id)?.route : undefined,
    };
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
  moduleToggle(true),
  moduleToggle(false),
  openModule,
];

export const getAssistantAction = (id: string): TinyAssistantActionDefinition | null =>
  assistantActions.find((action) => action.id === id) ?? null;
