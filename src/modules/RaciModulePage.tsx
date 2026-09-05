import { useMemo } from 'react';
import { RaciWorkspace, type RaciStorage } from 'tiny-raci';
import 'tiny-raci/style.css';
import { useI18n } from '../core/i18n';
import { tinyStorage } from '../core/storage';

export function RaciModulePage() {
  const { locale, direction } = useI18n();
  const storage = useMemo<RaciStorage>(() => ({
    get: <T,>(key: string) => tinyStorage.get<T>(key),
    set: async <T,>(key: string, value: T) => {
      await tinyStorage.set(key, value);
      window.dispatchEvent(new CustomEvent('tinymanager:raci-changed'));
    },
  }), []);

  return (
    <div className="tm-module-host">
      <RaciWorkspace locale={locale} direction={direction} storage={storage} />
    </div>
  );
}

export default RaciModulePage;
