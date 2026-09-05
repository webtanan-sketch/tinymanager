import { useEffect, useState } from 'react';
import { WeeklyReviewWorkspace, type WeeklySignals } from 'tiny-weekly-review';
import 'tiny-weekly-review/style.css';
import { useI18n } from '../core/i18n';
import { tinyStorage } from '../core/storage';

type DelegationSignal = { status?: string };
type DeadlineSignal = { status?: string; dueAt?: string };
type RiskSignal = { status?: string; score?: number };
type WaitingSignal = { status?: string; createdAt?: string; updatedAt?: string };

const ageDays = (iso: string | undefined, now: number): number => {
  if (!iso) return 0;
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? 0 : Math.max(0, Math.floor((now - time) / 86_400_000));
};

async function collectSignals(): Promise<WeeklySignals> {
  const [delegations, deadlines, risks, waiting] = await Promise.all([
    tinyStorage.get<DelegationSignal[]>('module.tiny-delegation.items'),
    tinyStorage.get<DeadlineSignal[]>('module.tiny-deadline.items'),
    tinyStorage.get<RiskSignal[]>('module.tiny-risk.items'),
    tinyStorage.get<WaitingSignal[]>('module.tiny-waiting.items'),
  ]);
  const now = Date.now();

  return {
    completedDelegations: (delegations ?? []).filter((item) => item.status === 'done').length,
    openDelegations: (delegations ?? []).filter((item) => item.status === 'open').length,
    overdueDeadlines: (deadlines ?? []).filter((item) => item.status === 'open' && item.dueAt && new Date(item.dueAt).getTime() < now).length,
    highRisks: (risks ?? []).filter((item) => item.status === 'open' && (item.score ?? 0) >= 12).length,
    staleWaiting: (waiting ?? []).filter((item) => item.status === 'open' && ageDays(item.updatedAt ?? item.createdAt, now) >= 5).length,
    decisionsMade: 0,
  };
}

export function WeeklyReviewModulePage() {
  const { locale, direction } = useI18n();
  const [signals, setSignals] = useState<WeeklySignals>({
    completedDelegations: 0,
    openDelegations: 0,
    overdueDeadlines: 0,
    highRisks: 0,
    staleWaiting: 0,
    decisionsMade: 0,
  });

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const next = await collectSignals();
      if (active) setSignals(next);
    };
    void refresh();
    const events = ['tinymanager:delegation-changed', 'tinymanager:deadline-changed', 'tinymanager:risk-changed', 'tinymanager:waiting-changed'];
    events.forEach((name) => window.addEventListener(name, refresh));
    return () => {
      active = false;
      events.forEach((name) => window.removeEventListener(name, refresh));
    };
  }, []);

  return (
    <div className="tm-module-host">
      <WeeklyReviewWorkspace locale={locale} direction={direction} signals={signals} />
    </div>
  );
}

export default WeeklyReviewModulePage;
