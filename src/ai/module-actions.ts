import { TinyDeadlineRepository, resolveDatePhrase } from 'tiny-deadline';
import { TinyDelegationRepository } from 'tiny-delegation';
import { calculateProjectHealth } from 'tiny-project-health';
import { TinyRaciRepository } from 'tiny-raci';
import { TinyRiskRepository } from 'tiny-risk';
import { TinyWaitingRepository } from 'tiny-waiting';
import { buildWeeklyReview } from 'tiny-weekly-review';
import { TinyPeopleRepository } from '../core/people';
import type { TinyManagerStorage } from '../core/types';
import type { TinyAssistantActionDefinition, TinyAssistantValue } from './types';

const asString = (value: TinyAssistantValue | undefined): string => typeof value === 'string' ? value.trim() : '';
const asOptionalNumber = (value: TinyAssistantValue | undefined): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const changed = (name: string) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name));
};

async function resolvePerson(name: string, storage: TinyManagerStorage) {
  const people = new TinyPeopleRepository(storage);
  const resolution = await people.resolveUnique(name);
  if (resolution.ambiguous.length > 1) {
    return {
      person: null,
      error: {
        fa: `چند نفر با نام «${name}» پیدا شد. نام کامل‌تر را وارد کن.`,
        en: `More than one person matches “${name}”. Enter a fuller name.`,
      },
    } as const;
  }
  return { person: resolution.person ?? await people.createMinimal(name), error: null } as const;
}

const createWaiting: TinyAssistantActionDefinition = {
  id: 'tiny-waiting.create',
  moduleId: 'tiny-waiting',
  title: { fa: 'ثبت منتظر پاسخ', en: 'Create Waiting For item' },
  description: { fa: 'ثبت مورد منتظر پاسخ با Shared People.', en: 'Create a Waiting For item using Shared People.' },
  fields: [
    { id: 'subject', label: { fa: 'منتظر چه چیزی هستی؟', en: 'What are you waiting for?' }, required: true, type: 'text' },
    { id: 'waitingOn', label: { fa: 'از چه کسی؟', en: 'Who are you waiting on?' }, required: true, type: 'text' },
  ],
  requiresConfirmation: true,
  summarize(values, locale) {
    return locale === 'fa'
      ? `ثبت «${asString(values.subject)}» در منتظر پاسخ از «${asString(values.waitingOn)}»`
      : `Track “${asString(values.subject)}” as waiting on “${asString(values.waitingOn)}”`;
  },
  async execute(values, context) {
    const name = asString(values.waitingOn);
    const resolution = await resolvePerson(name, context.storage);
    if (!resolution.person) return { ok: false, message: resolution.error };
    const repository = new TinyWaitingRepository(context.storage);
    const item = await repository.create({
      subject: asString(values.subject),
      waitingOn: resolution.person.displayName,
      personId: resolution.person.id,
    });
    changed('tinymanager:waiting-changed');
    return {
      ok: true,
      entityId: item.id,
      route: '/modules/waiting',
      message: {
        fa: `«${item.subject}» ثبت شد؛ منتظر پاسخ ${item.waitingOn} هستی.`,
        en: `“${item.subject}” is now waiting on ${item.waitingOn}.`,
      },
    };
  },
};

const createDelegation: TinyAssistantActionDefinition = {
  id: 'tiny-delegation.create',
  moduleId: 'tiny-delegation',
  title: { fa: 'تفویض کار', en: 'Delegate work' },
  description: { fa: 'سپردن یک کار با حداقل ورودی کار + شخص.', en: 'Delegate work with task + person as the minimum input.' },
  fields: [
    { id: 'task', label: { fa: 'چه کاری؟', en: 'Task' }, required: true, type: 'text' },
    { id: 'assigneeName', label: { fa: 'به چه کسی؟', en: 'Assignee' }, required: true, type: 'text' },
  ],
  requiresConfirmation: true,
  summarize(values, locale) {
    return locale === 'fa'
      ? `سپردن «${asString(values.task)}» به «${asString(values.assigneeName)}»`
      : `Delegate “${asString(values.task)}” to “${asString(values.assigneeName)}”`;
  },
  async execute(values, context) {
    const name = asString(values.assigneeName);
    const resolution = await resolvePerson(name, context.storage);
    if (!resolution.person) return { ok: false, message: resolution.error };
    const repository = new TinyDelegationRepository(context.storage);
    const item = await repository.create({
      task: asString(values.task),
      assigneeName: resolution.person.displayName,
      personId: resolution.person.id,
    });
    changed('tinymanager:delegation-changed');
    return {
      ok: true,
      entityId: item.id,
      route: '/modules/delegation',
      message: {
        fa: `«${item.task}» به ${item.assigneeName} سپرده شد.`,
        en: `“${item.task}” was delegated to ${item.assigneeName}.`,
      },
    };
  },
};

const createDeadline: TinyAssistantActionDefinition = {
  id: 'tiny-deadline.create',
  moduleId: 'tiny-deadline',
  title: { fa: 'ثبت موعد', en: 'Create deadline' },
  description: { fa: 'ثبت موعد با عنوان و عبارت زمانی.', en: 'Create a deadline from a title and date phrase.' },
  fields: [
    { id: 'title', label: { fa: 'چه چیزی موعد دارد؟', en: 'Deadline title' }, required: true, type: 'text' },
    { id: 'datePhrase', label: { fa: 'چه زمانی؟', en: 'When' }, required: true, type: 'text' },
  ],
  requiresConfirmation: true,
  summarize(values, locale) {
    return locale === 'fa'
      ? `ثبت موعد «${asString(values.title)}» برای «${asString(values.datePhrase)}»`
      : `Create deadline “${asString(values.title)}” for “${asString(values.datePhrase)}”`;
  },
  async execute(values, context) {
    const dueAt = resolveDatePhrase(asString(values.datePhrase), context.locale);
    if (!dueAt) {
      return { ok: false, message: { fa: 'عبارت زمانی را متوجه نشدم.', en: 'I could not resolve that date phrase.' } };
    }
    const repository = new TinyDeadlineRepository(context.storage);
    const item = await repository.create({ title: asString(values.title), dueAt });
    changed('tinymanager:deadline-changed');
    return {
      ok: true,
      entityId: item.id,
      route: '/modules/deadline',
      message: { fa: `موعد «${item.title}» ثبت شد.`, en: `Deadline “${item.title}” was created.` },
    };
  },
};

const createRisk: TinyAssistantActionDefinition = {
  id: 'tiny-risk.create',
  moduleId: 'tiny-risk',
  title: { fa: 'ثبت ریسک', en: 'Create risk' },
  description: { fa: 'ثبت سریع ریسک؛ احتمال و اثر در صورت نبود روی ۳ قرار می‌گیرند.', en: 'Quick risk capture; probability and impact default to 3.' },
  fields: [
    { id: 'title', label: { fa: 'عنوان ریسک', en: 'Risk title' }, required: true, type: 'text' },
    { id: 'probability', label: { fa: 'احتمال ۱ تا ۵', en: 'Probability 1–5' }, required: false, type: 'number' },
    { id: 'impact', label: { fa: 'اثر ۱ تا ۵', en: 'Impact 1–5' }, required: false, type: 'number' },
  ],
  requiresConfirmation: true,
  summarize(values, locale) {
    const probability = asOptionalNumber(values.probability) ?? 3;
    const impact = asOptionalNumber(values.impact) ?? 3;
    return locale === 'fa'
      ? `ثبت ریسک «${asString(values.title)}» با احتمال ${probability} و اثر ${impact}`
      : `Create risk “${asString(values.title)}” with probability ${probability} and impact ${impact}`;
  },
  async execute(values, context) {
    const repository = new TinyRiskRepository(context.storage);
    const probability = asOptionalNumber(values.probability);
    const impact = asOptionalNumber(values.impact);
    const item = await repository.create({
      title: asString(values.title),
      ...(probability !== undefined ? { probability } : {}),
      ...(impact !== undefined ? { impact } : {}),
    });
    changed('tinymanager:risk-changed');
    return {
      ok: true,
      entityId: item.id,
      route: '/modules/risk',
      message: { fa: `ریسک «${item.title}» با امتیاز ${item.score}/25 ثبت شد.`, en: `Risk “${item.title}” was created with score ${item.score}/25.` },
    };
  },
};

const createRaci: TinyAssistantActionDefinition = {
  id: 'tiny-raci.create',
  moduleId: 'tiny-raci',
  title: { fa: 'ثبت RACI', en: 'Create RACI entry' },
  description: { fa: 'حداقل فعالیت + مسئول اجرا + پاسخگو.', en: 'Minimum input: activity + Responsible + Accountable.' },
  fields: [
    { id: 'activity', label: { fa: 'فعالیت', en: 'Activity' }, required: true, type: 'text' },
    { id: 'responsible', label: { fa: 'مسئول اجرا', en: 'Responsible' }, required: true, type: 'text' },
    { id: 'accountable', label: { fa: 'پاسخگو', en: 'Accountable' }, required: true, type: 'text' },
  ],
  requiresConfirmation: true,
  summarize(values, locale) {
    return locale === 'fa'
      ? `RACI «${asString(values.activity)}» — مسئول: ${asString(values.responsible)} — پاسخگو: ${asString(values.accountable)}`
      : `RACI “${asString(values.activity)}” — Responsible: ${asString(values.responsible)} — Accountable: ${asString(values.accountable)}`;
  },
  async execute(values, context) {
    const people = new TinyPeopleRepository(context.storage);
    const responsible = await people.resolveOrCreate(asString(values.responsible));
    const accountable = await people.resolveOrCreate(asString(values.accountable));
    const repository = new TinyRaciRepository(context.storage);
    const item = await repository.create({
      activity: asString(values.activity),
      responsible: [responsible.displayName],
      accountable: accountable.displayName,
    });
    changed('tinymanager:raci-changed');
    return {
      ok: true,
      entityId: item.id,
      route: '/modules/raci',
      message: { fa: `RACI «${item.activity}» ثبت شد.`, en: `RACI entry “${item.activity}” was created.` },
    };
  },
};

type DelegationSignal = { status?: string };
type DeadlineSignal = { status?: string; dueAt?: string };
type RiskSignal = { status?: string; score?: number };
type WaitingSignal = { status?: string; createdAt?: string; updatedAt?: string };
type StaleDelegationSignal = DelegationSignal & { createdAt?: string; updatedAt?: string; lastFollowUpAt?: string };

const ageDays = (iso: string | undefined, now: number): number => {
  if (!iso) return 0;
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? 0 : Math.max(0, Math.floor((now - time) / 86_400_000));
};

async function readSignals(storage: TinyManagerStorage) {
  const [delegations, deadlines, risks, waiting] = await Promise.all([
    storage.get<StaleDelegationSignal[]>('module.tiny-delegation.items'),
    storage.get<DeadlineSignal[]>('module.tiny-deadline.items'),
    storage.get<RiskSignal[]>('module.tiny-risk.items'),
    storage.get<WaitingSignal[]>('module.tiny-waiting.items'),
  ]);
  const now = Date.now();
  return {
    delegations: delegations ?? [], deadlines: deadlines ?? [], risks: risks ?? [], waiting: waiting ?? [], now,
  };
}

const generateWeeklyReview: TinyAssistantActionDefinition = {
  id: 'tiny-weekly-review.generate',
  moduleId: 'tiny-weekly-review',
  title: { fa: 'مرور هفتگی', en: 'Weekly review' },
  description: { fa: 'مرور هفتگی خودکار از داده ماژول‌ها.', en: 'Generate a weekly review from module data.' },
  fields: [], requiresConfirmation: false,
  summarize(_values, locale) { return locale === 'fa' ? 'مرور هفتگی' : 'Weekly review'; },
  async execute(_values, context) {
    const { delegations, deadlines, risks, waiting, now } = await readSignals(context.storage);
    const review = buildWeeklyReview({
      completedDelegations: delegations.filter((x) => x.status === 'done').length,
      openDelegations: delegations.filter((x) => x.status === 'open').length,
      overdueDeadlines: deadlines.filter((x) => x.status === 'open' && x.dueAt && new Date(x.dueAt).getTime() < now).length,
      highRisks: risks.filter((x) => x.status === 'open' && (x.score ?? 0) >= 12).length,
      staleWaiting: waiting.filter((x) => x.status === 'open' && ageDays(x.updatedAt ?? x.createdAt, now) >= 5).length,
      decisionsMade: 0,
    }, context.locale);
    const sections = [...review.headline, ...review.attention, ...review.next];
    return { ok: true, route: '/modules/weekly-review', message: { fa: sections.join('\n'), en: sections.join('\n') } };
  },
};

const calculateHealth: TinyAssistantActionDefinition = {
  id: 'tiny-project-health.calculate',
  moduleId: 'tiny-project-health',
  title: { fa: 'سلامت پروژه', en: 'Project health' },
  description: { fa: 'محاسبه سلامت از سیگنال‌های سیستم.', en: 'Calculate health from system signals.' },
  fields: [], requiresConfirmation: false,
  summarize(_values, locale) { return locale === 'fa' ? 'محاسبه سلامت پروژه' : 'Calculate project health'; },
  async execute(_values, context) {
    const { delegations, deadlines, risks, waiting, now } = await readSignals(context.storage);
    const result = calculateProjectHealth({
      overdueDeadlines: deadlines.filter((x) => x.status === 'open' && x.dueAt && new Date(x.dueAt).getTime() < now).length,
      highRisks: risks.filter((x) => x.status === 'open' && (x.score ?? 0) >= 12).length,
      staleWaiting: waiting.filter((x) => x.status === 'open' && ageDays(x.updatedAt ?? x.createdAt, now) >= 5).length,
      staleDelegations: delegations.filter((x) => x.status === 'open' && ageDays(x.lastFollowUpAt ?? x.updatedAt ?? x.createdAt, now) >= 5).length,
      daysSinceUpdate: 0,
    });
    const statusFa = result.status === 'healthy' ? 'سالم' : result.status === 'attention' ? 'نیازمند توجه' : 'بحرانی';
    return {
      ok: true,
      route: '/modules/project-health',
      message: {
        fa: `امتیاز سلامت: ${result.score}/100 — ${statusFa}${result.reasons.length ? `\n${result.reasons.join('\n')}` : ''}`,
        en: `Health score: ${result.score}/100 — ${result.status}${result.reasons.length ? `\n${result.reasons.join('\n')}` : ''}`,
      },
    };
  },
};

export const moduleAssistantActions: TinyAssistantActionDefinition[] = [
  createWaiting,
  createDelegation,
  createDeadline,
  createRisk,
  createRaci,
  generateWeeklyReview,
  calculateHealth,
];

export const getModuleAssistantAction = (id: string): TinyAssistantActionDefinition | null =>
  moduleAssistantActions.find((action) => action.id === id) ?? null;
