import { Check, CornerDownLeft, Sparkles, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createConfiguredAssistantProvider } from '../ai/http-provider';
import { TinyAssistantOrchestrator } from '../ai/orchestrator';
import type { TinyAssistantDraft } from '../ai/types';
import { useI18n } from '../core/i18n';
import { tinyStorage } from '../core/storage';

interface CurrentReply {
  text: string;
  kind: 'message' | 'question' | 'confirmation' | 'success' | 'error';
}

export function TinyAssistantCommandBar() {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const orchestrator = useMemo(
    () => new TinyAssistantOrchestrator(tinyStorage, createConfiguredAssistantProvider()),
    [],
  );
  const [input, setInput] = useState('');
  const [draft, setDraft] = useState<TinyAssistantDraft | null>(null);
  const [lastRequest, setLastRequest] = useState('');
  const [reply, setReply] = useState<CurrentReply | null>(null);
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
      if (result.route) navigate(result.route);
    } catch {
      setReply({
        text: locale === 'fa' ? 'اجرای این درخواست با خطا روبه‌رو شد.' : 'This request could not be completed.',
        kind: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send(input);
  };

  const confirm = () => void send(locale === 'fa' ? 'تأیید' : 'confirm');
  const cancel = () => void send(locale === 'fa' ? 'لغو' : 'cancel');

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
                <small>{locale === 'fa' ? 'فرمان مدیریتی هوشمند' : 'Smart management command'}</small>
              </div>
            </div>
            <button type="button" className="tm-ai-close" onClick={() => setOpen(false)} aria-label={locale === 'fa' ? 'بستن' : 'Close'}>
              <X size={16} />
            </button>
          </div>

          {!reply ? (
            <div className="tm-ai-empty">
              <p>{locale === 'fa' ? 'نیازی به پیدا کردن فرم و منو نیست. درخواستت را ساده بنویس.' : 'Skip forms and menus. Write the request in plain language.'}</p>
              <button type="button" onClick={() => setInput(locale === 'fa' ? 'پروژه نمایشگاه با بودجه ۳۰۰ میلیون ایجاد کن' : 'Create project Expo with a 300000 budget')}>
                {locale === 'fa' ? 'نمونه: ایجاد پروژه' : 'Example: create a project'}
              </button>
              <button type="button" onClick={() => setInput(locale === 'fa' ? 'ماژول ریسک را فعال کن' : 'Enable the Risk module')}>
                {locale === 'fa' ? 'نمونه: فعال‌سازی ماژول' : 'Example: enable a module'}
              </button>
            </div>
          ) : (
            <div className="tm-ai-current-step">
              {lastRequest && <div className="tm-ai-user-line">{lastRequest}</div>}
              <div className={`tm-ai-reply is-${reply.kind}`}>
                <Sparkles size={16} />
                <p>{reply.text}</p>
              </div>

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
