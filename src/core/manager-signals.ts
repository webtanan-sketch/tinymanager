import {
  calculateProjectHealth,
  type ProjectHealthInput,
  type ProjectHealthResult,
} from 'tiny-project-health';
import type { TinyManagerStorage } from './types';

export const MANAGER_SIGNAL_EVENTS = [
  'tinymanager:delegation-changed',
  'tinymanager:deadline-changed',
  'tinymanager:risk-changed',
  'tinymanager:waiting-changed',
] as const;

const STORAGE_KEYS = {
  delegations: 'module.tiny-delegation.items',
  deadlines: 'module.tiny-deadline.items',
  risks: 'module.tiny-risk.items',
  waiting: 'module.tiny-waiting.items',
} as const;

interface DelegationSignal {
  status?: string;
  dueAt?: string;
  createdAt?: string;
  updatedAt?: string;
  lastFollowUpAt?: string;
}

interface DeadlineSignal {
  status?: string;
  dueAt?: string;
}

interface RiskSignal {
  status?: string;
  score?: number;
}

interface WaitingSignal {
  status?: string;
  followUpAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagerSignals {
  openWaiting: number;
  staleWaiting: number;
  followUpsDue: number;
  openDelegations: number;
  completedDelegations: number;
  staleDelegations: number;
  overdueDelegations: number;
  openDeadlines: number;
  overdueDeadlines: number;
  dueSoonDeadlines: number;
  openRisks: number;
  highRisks: number;
  criticalRisks: number;
  attentionTotal: number;
  healthInput: ProjectHealthInput;
  health: ProjectHealthResult;
}

const DAY_MS = 86_400_000;

const validTime = (value: string | undefined): number | null => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

export const ageDays = (value: string | undefined, now: number): number => {
  const time = validTime(value);
  if (time === null) return 0;
  return Math.max(0, Math.floor((now - time) / DAY_MS));
};

export async function collectManagerSignals(
  storage: TinyManagerStorage,
  now = Date.now(),
): Promise<ManagerSignals> {
  const [delegations, deadlines, risks, waiting] = await Promise.all([
    storage.get<DelegationSignal[]>(STORAGE_KEYS.delegations),
    storage.get<DeadlineSignal[]>(STORAGE_KEYS.deadlines),
    storage.get<RiskSignal[]>(STORAGE_KEYS.risks),
    storage.get<WaitingSignal[]>(STORAGE_KEYS.waiting),
  ]);

  const delegationItems = delegations ?? [];
  const openDelegations = delegationItems.filter((item) => item.status === 'open');
  const completedDelegations = delegationItems.filter((item) => item.status === 'done').length;
  const openDeadlines = (deadlines ?? []).filter((item) => item.status === 'open');
  const openRisks = (risks ?? []).filter((item) => item.status === 'open');
  const openWaiting = (waiting ?? []).filter((item) => item.status === 'open');

  const staleDelegations = openDelegations.filter(
    (item) => ageDays(item.lastFollowUpAt ?? item.updatedAt ?? item.createdAt, now) >= 5,
  ).length;
  const overdueDelegations = openDelegations.filter((item) => {
    const due = validTime(item.dueAt);
    return due !== null && due < now;
  }).length;

  const overdueDeadlines = openDeadlines.filter((item) => {
    const due = validTime(item.dueAt);
    return due !== null && due < now;
  }).length;
  const dueSoonDeadlines = openDeadlines.filter((item) => {
    const due = validTime(item.dueAt);
    return due !== null && due >= now && due <= now + (7 * DAY_MS);
  }).length;

  const staleWaiting = openWaiting.filter(
    (item) => ageDays(item.updatedAt ?? item.createdAt, now) >= 5,
  ).length;
  const followUpsDue = openWaiting.filter((item) => {
    const followUp = validTime(item.followUpAt);
    return followUp !== null && followUp <= now;
  }).length;

  const highRisks = openRisks.filter((item) => (item.score ?? 0) >= 12).length;
  const criticalRisks = openRisks.filter((item) => (item.score ?? 0) >= 20).length;

  const healthInput: ProjectHealthInput = {
    overdueDeadlines,
    highRisks,
    staleWaiting,
    staleDelegations,
    daysSinceUpdate: 0,
  };
  const health = calculateProjectHealth(healthInput);

  return {
    openWaiting: openWaiting.length,
    staleWaiting,
    followUpsDue,
    openDelegations: openDelegations.length,
    completedDelegations,
    staleDelegations,
    overdueDelegations,
    openDeadlines: openDeadlines.length,
    overdueDeadlines,
    dueSoonDeadlines,
    openRisks: openRisks.length,
    highRisks,
    criticalRisks,
    attentionTotal: overdueDeadlines + highRisks + followUpsDue + overdueDelegations,
    healthInput,
    health,
  };
}
