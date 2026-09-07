import { useEffect, useState } from 'react';
import { WeeklyReviewWorkspace, type WeeklySignals } from 'tiny-weekly-review';
import 'tiny-weekly-review/style.css';
import { useI18n } from '../core/i18n';
import { collectManagerSignals, MANAGER_SIGNAL_EVENTS } from '../core/manager-signals';
import { tinyStorage } from '../core/storage';

const emptySignals: WeeklySignals = {
  completedDelegations: 0,
  openDelegations: 0,
  overdueDeadlines: 0,
  highRisks: 0,
  staleWaiting: 0,
  decisionsMade: 0,
};

export function WeeklyReviewModulePage() {
  const { locale, direction } = useI18n();
  const [signals, setSignals] = useState<WeeklySignals>(emptySignals);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const managerSignals = await collectManagerSignals(tinyStorage);
      if (!active) return;
      setSignals({
        completedDelegations: managerSignals.completedDelegations,
        openDelegations: managerSignals.openDelegations,
        overdueDeadlines: managerSignals.overdueDeadlines,
        highRisks: managerSignals.highRisks,
        staleWaiting: managerSignals.staleWaiting,
        decisionsMade: 0,
      });
    };

    void refresh();
    MANAGER_SIGNAL_EVENTS.forEach((eventName) => window.addEventListener(eventName, refresh));
    return () => {
      active = false;
      MANAGER_SIGNAL_EVENTS.forEach((eventName) => window.removeEventListener(eventName, refresh));
    };
  }, []);

  return (
    <div className="tm-module-host">
      <WeeklyReviewWorkspace locale={locale} direction={direction} signals={signals} />
    </div>
  );
}

export default WeeklyReviewModulePage;
