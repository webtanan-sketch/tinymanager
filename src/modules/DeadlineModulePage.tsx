import { useMemo } from 'react';
import { DeadlineWorkspace, type TinyDeadlineStorage } from 'tiny-deadline';
import 'tiny-deadline/style.css';
import { useI18n } from '../core/i18n';
import { tinyStorage } from '../core/storage';

export function DeadlineModulePage() {
  const { locale, direction } = useI18n();
  const storage = useMemo<TinyDeadlineStorage>(() => ({
    get: <T,>(key: string) => tinyStorage.get<T>(key),
    set: async <T,>(key: string, value: T) => {
      await tinyStorage.set(key, value);
      window.dispatchEvent(new CustomEvent('tinymanager:deadline-changed'));
    },
  }), []);

  return (
    <div className="tm-module-host">
      <DeadlineWorkspace locale={locale} direction={direction} storage={storage} />
    </div>
  );
}

export default DeadlineModulePage;
