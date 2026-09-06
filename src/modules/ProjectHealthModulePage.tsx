import { useEffect, useState } from 'react';
import { ProjectHealthWorkspace, type ProjectHealthInput } from 'tiny-project-health';
import 'tiny-project-health/style.css';
import { useI18n } from '../core/i18n';
import { tinyStorage } from '../core/storage';

type DeadlineSignal = { status?: string; dueAt?: string };
type RiskSignal = { status?: string; score?: number };
type WaitingSignal = { status?: string; createdAt?: string; updatedAt?: string };
type DelegationSignal = { status?: string; createdAt?: string; updatedAt?: string; lastFollowUpAt?: string };

const ageDays = (iso: string | undefined, now: number): number => {
  if (!iso) return 0;
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? 0 : Math.max(0, Math.floor((now - time) / 86_400_000));
};

async function collectHealth(): Promise<ProjectHealthInput> {
  const [deadlines, risks, waiting, delegations] = await Promise.all([
    tinyStorage.get<DeadlineSignal[]>('module.tiny-deadline.items'),
    tinyStorage.get<RiskSignal[]>('module.tiny-risk.items'),
    tinyStorage.get<WaitingSignal[]>('module.tiny-waiting.items'),
    tinyStorage.get<DelegationSignal[]>('module.tiny-delegation.items'),
  ]);
  const now = Date.now();

  return {
    overdueDeadlines: (deadlines ?? []).filter((item) => item.status === 'open' && item.dueAt && new Date(item.dueAt).getTime() < now).length,
    highRisks: (risks ?? []).filter((item) => item.status === 'open' && (item.score ?? 0) >= 12).length,
    staleWaiting: (waiting ?? []).filter((item) => item.status === 'open' && ageDays(item.updatedAt ?? item.createdAt, now) >= 5).length,
    staleDelegations: (delegations ?? []).filter((item) => item.status === 'open' && ageDays(item.lastFollowUpAt ?? item.updatedAt ?? item.createdAt, now) >= 5).length,
    daysSinceUpdate: 0,
  };
}

export function ProjectHealthModulePage() {
  const { locale, direction } = useI18n();
  const [input, setInput] = useState<ProjectHealthInput>({
    overdueDeadlines: 0,
    highRisks: 0,
    staleWaiting: 0,
    staleDelegations: 0,
    daysSinceUpdate: 0,
  });

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const next = await collectHealth();
      if (active) setInput(next);
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
      <ProjectHealthWorkspace locale={locale} direction={direction} input={input} />
    </div>
  );
}

export default ProjectHealthModulePage;
