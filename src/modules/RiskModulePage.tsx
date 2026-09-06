import { useMemo } from 'react';
import { RiskWorkspace, type RiskStorage } from 'tiny-risk';
import 'tiny-risk/style.css';
import { useI18n } from '../core/i18n';
import { tinyStorage } from '../core/storage';

export function RiskModulePage() {
  const { locale, direction } = useI18n();
  const storage = useMemo<RiskStorage>(() => ({
    get: <T,>(key: string) => tinyStorage.get<T>(key),
    set: async <T,>(key: string, value: T) => {
      await tinyStorage.set(key, value);
      window.dispatchEvent(new CustomEvent('tinymanager:risk-changed'));
    },
  }), []);

  return (
    <div className="tm-module-host">
      <RiskWorkspace locale={locale} direction={direction} storage={storage} />
    </div>
  );
}

export default RiskModulePage;
