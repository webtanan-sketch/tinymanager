import { useMemo } from 'react';
import { DelegationWorkspace, type TinyDelegationStorage } from 'tiny-delegation';
import 'tiny-delegation/style.css';
import { useI18n } from '../core/i18n';
import { tinyStorage } from '../core/storage';

export function DelegationModulePage() {
  const { locale, direction } = useI18n();
  const storage = useMemo<TinyDelegationStorage>(() => ({
    get: <T,>(key: string) => tinyStorage.get<T>(key),
    set: async <T,>(key: string, value: T) => {
      await tinyStorage.set(key, value);
      window.dispatchEvent(new CustomEvent('tinymanager:delegation-changed'));
    },
  }), []);

  return (
    <div className="tm-module-host">
      <DelegationWorkspace locale={locale} direction={direction} storage={storage} />
    </div>
  );
}

export default DelegationModulePage;
