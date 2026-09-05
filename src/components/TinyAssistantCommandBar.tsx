import { Check, CornerDownLeft, Lightbulb, Sparkles, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { tinyLanguageConcepts, type TinyLanguageConceptId } from '../ai/language-engine';
import { TinyAssistantOrchestrator } from '../ai/orchestrator';
import type { TinyAssistantDraft, TinyLanguageLearningPrompt } from '../ai/types';
import { useI18n } from '../core/i18n';
import { tinyStorage } from '../core/storage';

interface CurrentReply {
  text: string;
  kind: 'message' | 'question' | 'learning' | 'confirmation' | 'success' | 'error';
}

const learnableConcepts = tinyLanguageConcepts.filter((concept) => concept.id !== 'system.teach');

export function TinyAssistantCommandBar() {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const orchestrator = useMemo(() => new TinyAssistantOrchestrator(tinyStorage), []);
  const [input, setInput] = useState('');
  const [draft, setDraft] = useState<TinyAssistantDraft | null>(null);
  const [lastRequest, setLastRequest] = useState('');
  const [reply, setReply] = useState<CurrentReply | null>(null);
  const [learning, setLearning] = useState<TinyLanguageLearningPrompt | null>(null);
  const [learningPhrase, setLearningPhrase] = useState('');
  const [learningConcept, setLearningConcept] = useState<TinyLanguageConceptId | ''>('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async (text: string) => {
    const cleaned = text.trim();
    if (!cleaned || busy) return;
    setBusy(true);
    setOpen(true);
    setLastRequest(cleaned);
    setInput('');
    try {
      const result = await orchestrator.submit(cleaned, locale, draft);
      setDraft(result.draft);
      setReply({ text: result.text, kind: result.kind });
      setLearning(result.learning ?? null);
      if (result.learning) {
        setLearningPhrase(result.learning.phrase);
        setLearningConcept('');
      }
      if (result.route) navigate(result.route);
    } catch {
      setLearning(null);
      setReply({
        text: locale === 'fa' ? 'اجرای این درخواست با خطا روبه‌رو شد.' : 'This request could not be completed.',
        kind: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const prepareLearning = async () => {
    if (!learning || !learningConcept || !learningPhrase.trim() || busy) return;
    setBusy(true);
    try {
      const result = await orchestrator.prepareLanguageAlias(learningPhrase, learningConcept, learning.locale);
      setDraft(result.draft);
      setReply({ text: result.text, kind: result.kind });
      setLearning(null);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send(input);
  };

  const confirm = () => void send(locale === 'fa' ? 'تأیید' : 'confirm');
  const cancel = () => {
    setLearning(null);
    if (draft) void send(locale === 'fa' ? 'لغو' : 'cancel');
    else {
      setReply({ text: locale === 'fa' ? 'لغو شد؛ چیزی ذخیره نشد.' : 'Cancelled. Nothing was saved.', kind: 'message' });
    }
  };

  const sortedConcepts = useMemo(() => {
    const suggested = new Set(learning?.suggestedConceptIds ?? []);
    return [...learnableConcepts].sort((a, b) => Number(suggested.has(b.id)) - Number(suggested.has(a.id)));
  }, [learning]);

  return (
    <div className="tm-ai-command">
      <form className={`tm-ai-input${open ? ' is-open' : ''}`} onSubmit={onSubmit}>
        <Sparkles size={18} />
        <input
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          onFocus={() => setOpen(true)}
          aria-label={t('commandSearch')}
          placeholder={locale === 'fa' ? 'به Tiny AI بگو چه کاری انجام دهد…' : 'Tell Tiny AI what to do…'}
          autoComplete="off"
        />
        <button type="submit" className="tm-ai-send" disabled={busy || !input.trim()} aria-label={locale === 'fa' ? 'ارسال' : 'Send'}>
          <CornerDownLeft size={16} />
        </button>
      </form>

      {open && (
        <div className="tm-ai-panel">
          <div className="tm-ai-panel-head">
            <div>
              <span className="tm-ai-mark"><Sparkles size={15} /></span>
              <div>
                <strong>Tiny AI</strong>
                <small>{locale === 'fa' ? 'موتور زبان محدود و قابل تعریف' : 'Controlled, configurable language engine'}</small>
              </div>
            </div>
            <button type="button" className="tm-ai-close" onClick={() => setOpen(false)} aria-label={locale === 'fa' ? 'بستن' : 'Close'}>
              <X size={16} />
            </button>
          </div>

          {!reply ? (
            <div className="tm-ai-empty">
              <p>{locale === 'fa' ? 'فقط واژه‌ها و الگوهای تعریف‌شده فهمیده می‌شوند. اگر واژه‌ای جدید باشد، همین‌جا می‌توانی معنایش را به سیستم یاد بدهی.' : 'Only defined words and patterns are recognized. When a new phrase appears, you can teach its meaning right here.'}</p>
              <button type="button" onClick={() => setInput(locale === 'fa' ? 'پروژه نمایشگاه با بودجه ۳۰۰ میلیون ایجاد کن' : 'Create project Expo with a 300000 budget')}>
                {locale === 'fa' ? 'نمونه: ایجاد پروژه' : 'Example: create a project'}
              </button>
              <button type="button" onClick={() => setInput(locale === 'fa' ? 'برای «ایجاد» واژه «راه بینداز» را اضافه کن' : 'add word "launch" for "create"')}>
                {locale === 'fa' ? 'نمونه: تعریف مترادف' : 'Example: teach an alias'}
              </button>
            </div>
          ) : (
            <div className="tm-ai-current-step">
              {lastRequest && <div className="tm-ai-user-line">{lastRequest}</div>}
              <div className={`tm-ai-reply is-${reply.kind}`}>
                <Sparkles size={16} />
                <p>{reply.text}</p>
              </div>

              {reply.kind === 'learning' && learning && (
                <div className="tm-ai-learning-card">
                  <label>
                    <span>{locale === 'fa' ? 'عبارت جدید' : 'New phrase'}</span>
                    <input
                      value={learningPhrase}
                      onChange={(event) => setLearningPhrase(event.currentTarget.value)}
                      autoComplete="off"
                    />
                  </label>

                  <label>
                    <span>{locale === 'fa' ? 'این عبارت مربوط به کدام بخش است؟' : 'Which system concept does this phrase mean?'}</span>
                    <select
                      value={learningConcept}
                      onChange={(event) => setLearningConcept(event.currentTarget.value as TinyLanguageConceptId | '')}
                    >
                      <option value="">{locale === 'fa' ? 'انتخاب کن…' : 'Choose…'}</option>
                      {sortedConcepts.map((concept) => {
                        const suggested = learning.suggestedConceptIds.includes(concept.id);
                        return (
                          <option key={concept.id} value={concept.id}>
                            {suggested ? '★ ' : ''}{concept.label[locale]} — {concept.id}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  {learning.suggestedConceptIds.length > 0 && (
                    <div className="tm-ai-learning-hint">
                      <Lightbulb size={15} />
                      <span>
                        {locale === 'fa' ? 'پیشنهاد TLE بر اساس بقیه جمله: ' : 'TLE suggestion from the known context: '}
                        {learning.suggestedConceptIds
                          .map((id) => tinyLanguageConcepts.find((concept) => concept.id === id)?.label[locale] ?? id)
                          .join('، ')}
                      </span>
                    </div>
                  )}

                  <div className="tm-ai-confirm-actions">
                    <button
                      type="button"
                      className="tm-ai-confirm"
                      disabled={busy || !learningPhrase.trim() || !learningConcept}
                      onClick={() => void prepareLearning()}
                    >
                      <Check size={16} />
                      {locale === 'fa' ? 'ادامه و بررسی' : 'Continue'}
                    </button>
                    <button type="button" className="tm-ai-cancel" onClick={cancel} disabled={busy}>
                      <X size={16} />
                      {locale === 'fa' ? 'لغو' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}

              {reply.kind === 'confirmation' && draft?.phase === 'confirming' && (
                <div className="tm-ai-confirm-actions">
                  <button type="button" className="tm-ai-confirm" onClick={confirm} disabled={busy}>
                    <Check size={16} />
                    {locale === 'fa' ? 'تأیید و ثبت' : 'Confirm & save'}
                  </button>
                  <button type="button" className="tm-ai-cancel" onClick={cancel} disabled={busy}>
                    <X size={16} />
                    {locale === 'fa' ? 'لغو' : 'Cancel'}
                  </button>
                </div>
              )}
            </div>
          )}

          {busy && <div className="tm-ai-working">{locale === 'fa' ? 'در حال بررسی…' : 'Working…'}</div>}
        </div>
      )}
    </div>
  );
}
