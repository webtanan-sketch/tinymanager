import { useEffect, useState } from 'react';
import { ProjectHealthWorkspace, type ProjectHealthInput } from 'tiny-project-health';
import 'tiny-project-health/style.css';
import { useI18n } from '../core/i18n';
import { collectManagerSignals, MANAGER_SIGNAL_EVENTS } from '../core/manager-signals';
import { tinyStorage } from '../core/storage';

const emptyInput: ProjectHealthInput = {
  overdueDeadlines: 0,
  highRisks: 0,
  staleWaiting: 0,
  staleDelegations: 0,
  daysSinceUpdate: 0,
};

export function ProjectHealthModulePage() {
  const { locale, direction } = useI18n();
  const [input, setInput] = useState<ProjectHealthInput>(emptyInput);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const managerSignals = await collectManagerSignals(tinyStorage);
      if (active) setInput(managerSignals.healthInput);
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
      <ProjectHealthWorkspace locale={locale} direction={direction} input={input} />
    </div>
  );
}

export default ProjectHealthModulePage;
