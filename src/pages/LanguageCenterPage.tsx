import { BookOpenCheck, Lightbulb, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  TinyLanguageRepository,
  tinyLanguageConcepts,
  type TinyLanguageAlias,
  type TinyLanguageConceptId,
  type TinyLanguageTrainingEvent,
} from '../ai/language-engine';
import { useI18n } from '../core/i18n';
import { tinyStorage } from '../core/storage';

export function LanguageCenterPage() {
  const { locale } = useI18n();
  const repository = useMemo(() => new TinyLanguageRepository(tinyStorage), []);
  const [aliases, setAliases] = useState<TinyLanguageAlias[]>([]);
  const [training, setTraining] = useState<TinyLanguageTrainingEvent[]>([]);
  const [phrase, setPhrase] = useState('');
  const [conceptId, setConceptId] = useState<TinyLanguageConceptId>('action.create');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const [lexicon, history] = await Promise.all([repository.load(), repository.listTraining()]);
    setAliases(lexicon.aliases);
    setTraining(history);
  };

  useEffect(() => {
    void refresh();
    const onChanged = () => void refresh();
    window.addEventListener('tinymanager:language-changed', onChanged);
    return () => window.removeEventListener('tinymanager:language-changed', onChanged);
  }, [repository]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!phrase.trim() || busy) return;
    setBusy(true);
    try {
      await repository.addAlias({ phrase, conceptId, locale });
      setPhrase('');
      await refresh();
      window.dispatchEvent(new CustomEvent('tinymanager:language-changed'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await repository.removeAlias(id);
      await refresh();
      window.dispatchEvent(new CustomEvent('tinymanager:language-changed'));
    } finally {
      setBusy(false);
    }
  };

  const suggestions = useMemo(() => {
    const counts = new Map<TinyLanguageConceptId, number>();
    for (const event of training) counts.set(event.conceptId, (counts.get(event.conceptId) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, count]) => ({ id, count, concept: tinyLanguageConcepts.find((item) => item.id === id) }));
  }, [training]);

  return (
    <div className="tm-page">
      <section className="tm-page-heading">
        <div>
          <span className="tm-eyebrow">Tiny Language Engine</span>
          <h1>{locale === 'fa' ? 'مرکز زبان و یادگیری' : 'Language & Learning Center'}</h1>
          <p>{locale === 'fa' ? 'واژه‌های اختصاصی را مدیریت کن و سابقه یادگیری تأییدشده را ببین.' : 'Manage custom vocabulary and review confirmed learning history.'}</p>
        </div>
      </section>

      <div className="tm-settings-grid">
        <section className="tm-settings-card is-wide">
          <div className="tm-settings-card-title">
            <div className="tm-stat-icon"><BookOpenCheck size={19} /></div>
            <h2>{locale === 'fa' ? 'مدیریت واژگان' : 'Vocabulary Manager'}</h2>
          </div>
          <form className="tm-backup-actions" onSubmit={submit}>
            <input
              value={phrase}
              onChange={(event) => setPhrase(event.currentTarget.value)}
              placeholder={locale === 'fa' ? 'واژه یا عبارت جدید' : 'New word or phrase'}
              aria-label={locale === 'fa' ? 'واژه جدید' : 'New phrase'}
            />
            <select value={conceptId} onChange={(event) => setConceptId(event.currentTarget.value as TinyLanguageConceptId)}>
              {tinyLanguageConcepts.filter((concept) => concept.id !== 'system.teach').map((concept) => (
                <option key={concept.id} value={concept.id}>{concept.label[locale]} — {concept.id}</option>
              ))}
            </select>
            <button className="tm-secondary-button" type="submit" disabled={busy || !phrase.trim()}>
              <Plus size={17} />
              {locale === 'fa' ? 'افزودن' : 'Add'}
            </button>
          </form>

          <div className="tm-module-list">
            {aliases.length === 0 ? (
              <p>{locale === 'fa' ? 'هنوز واژه اختصاصی ثبت نشده است.' : 'No custom aliases yet.'}</p>
            ) : aliases.map((alias) => {
              const concept = tinyLanguageConcepts.find((item) => item.id === alias.conceptId);
              return (
                <article className="tm-module-row" key={alias.id}>
                  <div className="tm-module-row-main">
                    <div>
                      <div className="tm-module-title-line"><h2>{alias.phrase}</h2><span className="tm-badge tm-badge-alpha">{alias.locale.toUpperCase()}</span></div>
                      <p>{concept?.label[locale] ?? alias.conceptId} · {alias.conceptId}</p>
                    </div>
                  </div>
                  <button className="tm-toggle-button" type="button" disabled={busy} onClick={() => void remove(alias.id)}>
                    <Trash2 size={16} />{locale === 'fa' ? 'حذف' : 'Remove'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="tm-settings-card is-wide">
          <div className="tm-settings-card-title">
            <div className="tm-stat-icon"><Lightbulb size={19} /></div>
            <h2>{locale === 'fa' ? 'مرکز پیشنهادها' : 'Suggestion Center'}</h2>
          </div>
          <p>{locale === 'fa' ? 'این بخش فقط از تأییدهای واقعی شما برای رتبه‌بندی پیشنهادها استفاده می‌کند؛ هیچ فرمانی خودکار اجرا نمی‌شود.' : 'Suggestions are ranked only from your confirmed learning events; nothing is executed automatically.'}</p>
          <div className="tm-stats-grid">
            {suggestions.length === 0 ? (
              <div className="tm-setting-meta"><span>{locale === 'fa' ? 'سابقه یادگیری' : 'Learning history'}</span><strong>0</strong></div>
            ) : suggestions.map(({ id, count, concept }) => (
              <div className="tm-setting-meta" key={id}>
                <span>{concept?.label[locale] ?? id}</span><strong>{count}</strong>
              </div>
            ))}
          </div>
          <div className="tm-setting-meta"><span>{locale === 'fa' ? 'کل تأییدهای یادگیری' : 'Confirmed learning events'}</span><strong>{training.length}</strong></div>
        </section>
      </div>
    </div>
  );
}

export default LanguageCenterPage;
