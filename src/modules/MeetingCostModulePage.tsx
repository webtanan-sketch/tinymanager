import { useEffect, useState } from 'react';
import {
  MeetingCostWorkspace,
  createDefaultMeetingCostInput,
  type MeetingCostInput,
} from 'tiny-meeting-cost';
import 'tiny-meeting-cost/style.css';
import { useI18n } from '../core/i18n';
import { tinyStorage } from '../core/storage';

const STORAGE_KEY = 'module.tiny-meeting-cost.state';

export function MeetingCostModulePage() {
  const { locale } = useI18n();
  const [state, setState] = useState<MeetingCostInput>(createDefaultMeetingCostInput);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void tinyStorage.get<MeetingCostInput>(STORAGE_KEY).then((stored) => {
      if (!active) return;
      if (stored) setState(stored);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void tinyStorage.set(STORAGE_KEY, state);
  }, [hydrated, state]);

  if (!hydrated) {
    return (
      <div className="tm-module-loading" role="status">
        {locale === 'fa' ? 'در حال آماده‌سازی ماژول…' : 'Preparing module…'}
      </div>
    );
  }

  return (
    <div className="tm-module-host">
      <MeetingCostWorkspace locale={locale} value={state} onChange={setState} />
    </div>
  );
}

export default MeetingCostModulePage;
