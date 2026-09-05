import { useEffect, useMemo, useState } from 'react';
import {
  DecisionMatrixWorkspace,
  createDefaultDecisionMatrix,
  createTinyManagerModule,
  type DecisionMatrixState,
} from 'tiny-decision-matrix';
import 'tiny-decision-matrix/style.css';
import { tinyDateService } from '../core/date-service';
import { useI18n } from '../core/i18n';
import { tinyStorage } from '../core/storage';
import './module-host.css';

const STORAGE_KEY = 'module.tiny-decision-matrix.state';

const moduleInstance = createTinyManagerModule();

export function DecisionMatrixModulePage() {
  const { locale, direction } = useI18n();
  const [state, setState] = useState<DecisionMatrixState>(createDefaultDecisionMatrix);
  const [hydrated, setHydrated] = useState(false);

  const moduleContext = useMemo(
    () => ({
      locale,
      direction,
      storage: tinyStorage,
      date: tinyDateService,
    }),
    [direction, locale],
  );

  useEffect(() => {
    moduleInstance.initialize(moduleContext);
    return () => {
      moduleInstance.dispose();
    };
  }, [moduleContext]);

  useEffect(() => {
    let active = true;
    void tinyStorage.get<DecisionMatrixState>(STORAGE_KEY).then((stored) => {
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

  const exportModuleData = () => {
    const envelope = {
      schema: 'tiny-decision-matrix',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      state,
    };
    const blob = new Blob([JSON.stringify(envelope, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'tiny-decision-matrix.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!hydrated) {
    return (
      <div className="tm-module-loading" role="status">
        {locale === 'fa' ? 'در حال آماده‌سازی ماژول…' : 'Preparing module…'}
      </div>
    );
  }

  return (
    <div className="tm-module-host">
      <DecisionMatrixWorkspace
        locale={locale}
        value={state}
        onChange={setState}
        onExport={exportModuleData}
      />
    </div>
  );
}

export default DecisionMatrixModulePage;
