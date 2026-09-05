import { useEffect, useMemo, useState } from 'react';
import {
  TinyWaitingRepository,
  WaitingWorkspace,
  type CreateTinyWaitingInput,
  type TinyWaitingItem,
} from 'tiny-waiting';
import 'tiny-waiting/style.css';
import { useI18n } from '../core/i18n';
import { tinyStorage } from '../core/storage';

export function WaitingModulePage() {
  const { locale } = useI18n();
  const repository = useMemo(() => new TinyWaitingRepository(tinyStorage), []);
  const [items, setItems] = useState<TinyWaitingItem[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = async () => {
    setItems(await repository.list());
    setReady(true);
  };

  useEffect(() => {
    void refresh();
    const onChanged = () => void refresh();
    window.addEventListener('tinymanager:waiting-changed', onChanged);
    return () => window.removeEventListener('tinymanager:waiting-changed', onChanged);
  }, [repository]);

  const create = async (input: CreateTinyWaitingInput) => {
    await repository.create(input);
    await refresh();
  };
  const complete = async (id: string) => {
    await repository.complete(id);
    await refresh();
  };
  const remove = async (id: string) => {
    await repository.remove(id);
    await refresh();
  };

  if (!ready) {
    return (
      <div className="tm-module-loading" role="status">
        {locale === 'fa' ? 'در حال آماده‌سازی ماژول…' : 'Preparing module…'}
      </div>
    );
  }

  return (
    <div className="tm-module-host">
      <WaitingWorkspace locale={locale} items={items} onCreate={create} onComplete={complete} onRemove={remove} />
    </div>
  );
}

export default WaitingModulePage;
