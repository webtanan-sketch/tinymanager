import {
  Activity,
  ArrowUpRight,
  Boxes,
  CalendarClock,
  CalendarDays,
  Check,
  ClipboardCheck,
  Clock3,
  Database,
  Download,
  Hourglass,
  Languages,
  LayoutDashboard,
  Monitor,
  Moon,
  Network,
  Puzzle,
  Scale,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  TriangleAlert,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { HashRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { TinyAssistantCommandBar } from './components/TinyAssistantCommandBar';
import { createBackup, downloadBackupFile, restoreBackup } from './core/backup';
import { tinyDateService } from './core/date-service';
import { useI18n } from './core/i18n';
import { TinyManagerModuleRegistry } from './core/module-registry';
import { tinyStorage } from './core/storage';
import { useTheme } from './core/theme';
import type { TinyManagerModuleManifest, TinyTheme } from './core/types';
import { moduleCatalog } from './modules/catalog';
import { DecisionMatrixModulePage } from './modules/DecisionMatrixModulePage';
import { MeetingCostModulePage } from './modules/MeetingCostModulePage';

const registry = new TinyManagerModuleRegistry(moduleCatalog, tinyStorage);
const integratedModuleIds = new Set(['tiny-decision-matrix', 'tiny-meeting-cost']);

const moduleIcons: Record<string, LucideIcon> = {
  Scale,
  Clock3,
  Network,
  TriangleAlert,
  Hourglass,
  Send,
  CalendarClock,
  ClipboardCheck,
  Activity,
};

function useModuleRegistry() {
  const [enabledIds, setEnabledIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      await registry.hydrate();
      if (!active) return;
      setEnabledIds(new Set(registry.listEnabled().map((module) => module.id)));
      setReady(true);
    };

    void refresh();
    const onModulesChanged = () => void refresh();
    window.addEventListener('tinymanager:modules-changed', onModulesChanged);

    return () => {
      active = false;
      window.removeEventListener('tinymanager:modules-changed', onModulesChanged);
    };
  }, []);

  const setEnabled = async (id: string, enabled: boolean) => {
    await registry.setEnabled(id, enabled);
    setEnabledIds(new Set(registry.listEnabled().map((module) => module.id)));
  };

  return { enabledIds, setEnabled, ready };
}

function App() {
  const modules = useModuleRegistry();

  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard enabledIds={modules.enabledIds} />} />
          <Route
            path="/modules"
            element={
              <ModulesPage
                enabledIds={modules.enabledIds}
                ready={modules.ready}
                onSetEnabled={modules.setEnabled}
              />
            }
          />
          <Route
            path="/modules/decision-matrix"
            element={
              modules.ready && modules.enabledIds.has('tiny-decision-matrix') ? (
                <DecisionMatrixModulePage />
              ) : (
                <Navigate replace to="/modules" />
              )
            }
          />
          <Route
            path="/modules/meeting-cost"
            element={
              modules.ready && modules.enabledIds.has('tiny-meeting-cost') ? (
                <MeetingCostModulePage />
              ) : (
                <Navigate replace to="/modules" />
              )
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Dashboard enabledIds={modules.enabledIds} />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const { locale, setLocale, t } = useI18n();
  const { effectiveTheme, setTheme } = useTheme();

  const navItems = [
    { to: '/', label: t('dashboard'), icon: LayoutDashboard, end: true },
    { to: '/modules', label: t('modules'), icon: Boxes, end: false },
    { to: '/settings', label: t('settings'), icon: Settings, end: false },
  ];

  return (
    <div className="tm-shell">
      <aside className="tm-sidebar">
        <div className="tm-brand">
          <div className="tm-brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>TinyManager</strong>
            <small>{t('appTagline')}</small>
          </div>
        </div>

        <nav className="tm-nav" aria-label="Primary navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `tm-nav-item${isActive ? ' is-active' : ''}`}
            >
              <Icon size={19} strokeWidth={1.9} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="tm-sidebar-spacer" />

        <div className="tm-sidebar-card">
          <ShieldCheck size={19} />
          <div>
            <strong>{t('privacy')}</strong>
            <span>{t('localFirstDescription')}</span>
          </div>
        </div>

        <div className="tm-sidebar-version">v0.1.0-alpha.1</div>
      </aside>

      <main className="tm-main">
        <header className="tm-header">
          <TinyAssistantCommandBar />

          <div className="tm-header-actions">
            <button
              className="tm-icon-button"
              type="button"
              onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
              aria-label={t('theme')}
              title={t('theme')}
            >
              {effectiveTheme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="tm-language-button"
              type="button"
              onClick={() => setLocale(locale === 'fa' ? 'en' : 'fa')}
              aria-label={t('language')}
            >
              <Languages size={18} />
              <span>{locale === 'fa' ? 'EN' : 'فا'}</span>
            </button>
          </div>
        </header>

        <div className="tm-content">{children}</div>
      </main>
    </div>
  );
}

function Dashboard({ enabledIds }: { enabledIds: Set<string> }) {
  const { locale, t } = useI18n();
  const enabledModules = useMemo(
    () => moduleCatalog.filter((module) => enabledIds.has(module.id)),
    [enabledIds],
  );
  const today = tinyDateService.format(new Date(), locale, 'long');

  return (
    <div className="tm-page">
      <section className="tm-page-heading">
        <div>
          <span className="tm-eyebrow">{t('overview')}</span>
          <h1>{t('dashboard')}</h1>
          <p>{today}</p>
        </div>
        <div className="tm-status-pill">
          <span className="tm-live-dot" />
          {t('ready')}
        </div>
      </section>

      <section className="tm-hero-card">
        <div className="tm-hero-copy">
          <span className="tm-eyebrow tm-eyebrow-light">{t('quickStart')}</span>
          <h2>{t('appTagline')}</h2>
          <p>{t('quickStartDescription')}</p>
          <NavLink className="tm-primary-button" to="/modules">
            <Puzzle size={18} />
            {t('moduleManager')}
          </NavLink>
        </div>
        <div className="tm-hero-visual" aria-hidden="true">
          <div className="tm-orbit tm-orbit-one" />
          <div className="tm-orbit tm-orbit-two" />
          <div className="tm-hero-icon"><Sparkles size={34} /></div>
        </div>
      </section>

      <section className="tm-stats-grid">
        <StatCard icon={Puzzle} label={t('enabledModules')} value={String(enabledModules.length)} />
        <StatCard icon={Boxes} label={t('allModules')} value={String(moduleCatalog.length)} />
        <StatCard icon={Database} label={t('localFirst')} value="IndexedDB" compact />
        <StatCard icon={CalendarDays} label={t('dateEngine')} value={locale === 'fa' ? 'جلالی' : 'Gregorian'} compact />
      </section>

      <section className="tm-section">
        <div className="tm-section-heading">
          <div>
            <span className="tm-eyebrow">{t('enabledModules')}</span>
            <h2>{enabledModules.length > 0 ? t('today') : t('comingNext')}</h2>
          </div>
          <NavLink to="/modules" className="tm-text-link">
            {t('allModules')} <ArrowUpRight size={17} />
          </NavLink>
        </div>

        <div className="tm-module-grid">
          {(enabledModules.length > 0 ? enabledModules : moduleCatalog.slice(0, 3)).map((module) => (
            <ModulePreviewCard key={module.id} module={module} preview={!enabledIds.has(module.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  compact = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <article className="tm-stat-card">
      <div className="tm-stat-icon"><Icon size={20} /></div>
      <div>
        <span>{label}</span>
        <strong className={compact ? 'is-compact' : ''}>{value}</strong>
      </div>
    </article>
  );
}

function ModulePreviewCard({
  module,
  preview,
}: {
  module: TinyManagerModuleManifest;
  preview: boolean;
}) {
  const { locale, t } = useI18n();
  const Icon = moduleIcons[module.icon] ?? Puzzle;
  const canOpen = !preview && integratedModuleIds.has(module.id);

  return (
    <article className="tm-module-card">
      <div className="tm-module-card-top">
        <div className="tm-module-icon"><Icon size={21} /></div>
        <span className={`tm-badge tm-badge-${module.maturity}`}>
          {preview ? t('comingNext') : t('enabled')}
        </span>
      </div>
      <h3>{module.name[locale]}</h3>
      <p>{module.description[locale]}</p>
      <div className="tm-module-card-footer">
        <span>{module.id}</span>
        {canOpen ? (
          <NavLink to={module.route} aria-label={locale === 'fa' ? 'باز کردن ماژول' : 'Open module'}>
            <ArrowUpRight size={17} />
          </NavLink>
        ) : (
          <a href={module.repository} target="_blank" rel="noreferrer" aria-label={t('openRepository')}>
            <ArrowUpRight size={17} />
          </a>
        )}
      </div>
    </article>
  );
}

function ModulesPage({
  enabledIds,
  ready,
  onSetEnabled,
}: {
  enabledIds: Set<string>;
  ready: boolean;
  onSetEnabled(id: string, enabled: boolean): Promise<void>;
}) {
  const { locale, t } = useI18n();
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggle = async (module: TinyManagerModuleManifest) => {
    setBusyId(module.id);
    try {
      await onSetEnabled(module.id, !enabledIds.has(module.id));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="tm-page">
      <section className="tm-page-heading">
        <div>
          <span className="tm-eyebrow">TinyManager Modules</span>
          <h1>{t('moduleManager')}</h1>
          <p>{t('moduleManagerDescription')}</p>
        </div>
      </section>

      <div className="tm-module-list">
        {moduleCatalog.map((module) => {
          const Icon = moduleIcons[module.icon] ?? Puzzle;
          const enabled = enabledIds.has(module.id);
          const canOpen = enabled && integratedModuleIds.has(module.id);
          return (
            <article className="tm-module-row" key={module.id}>
              <div className="tm-module-row-main">
                <div className="tm-module-icon"><Icon size={21} /></div>
                <div>
                  <div className="tm-module-title-line">
                    <h2>{module.name[locale]}</h2>
                    <span className={`tm-badge tm-badge-${module.maturity}`}>
                      {t(module.maturity)}
                    </span>
                  </div>
                  <p>{module.description[locale]}</p>
                  <a href={module.repository} target="_blank" rel="noreferrer" className="tm-repo-link">
                    {module.id} <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
              <div className="tm-module-row-actions">
                {canOpen && (
                  <NavLink className="tm-open-module-button" to={module.route}>
                    <ArrowUpRight size={16} />
                    {locale === 'fa' ? 'ورود' : 'Open'}
                  </NavLink>
                )}
                <button
                  type="button"
                  className={`tm-toggle-button${enabled ? ' is-enabled' : ''}`}
                  disabled={!ready || busyId === module.id}
                  onClick={() => void toggle(module)}
                >
                  {enabled && <Check size={17} />}
                  {enabled ? t('disable') : t('enable')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function SettingsPage() {
  const { locale, direction, setLocale, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string>('');

  const themeOptions: Array<{ value: TinyTheme; icon: LucideIcon; label: string }> = [
    { value: 'light', icon: Sun, label: t('light') },
    { value: 'dark', icon: Moon, label: t('dark') },
    { value: 'system', icon: Monitor, label: t('system') },
  ];

  const exportBackup = async () => {
    const envelope = await createBackup(tinyStorage);
    downloadBackupFile(envelope);
    setMessage(locale === 'fa' ? 'فایل پشتیبان ساخته شد.' : 'Backup file created.');
  };

  const importBackup = async (file: File) => {
    const text = await file.text();
    await restoreBackup(tinyStorage, JSON.parse(text) as unknown);
    setMessage(locale === 'fa' ? 'پشتیبان با موفقیت بازیابی شد.' : 'Backup restored successfully.');
  };

  return (
    <div className="tm-page">
      <section className="tm-page-heading">
        <div>
          <span className="tm-eyebrow">TinyManager Core</span>
          <h1>{t('settings')}</h1>
          <p>{locale === 'fa' ? 'تنظیمات مشترک تمام ماژول‌ها' : 'Shared settings for every module'}</p>
        </div>
      </section>

      <div className="tm-settings-grid">
        <SettingsCard icon={Languages} title={t('language')}>
          <div className="tm-segmented">
            <button className={locale === 'fa' ? 'is-active' : ''} onClick={() => setLocale('fa')} type="button">فارسی</button>
            <button className={locale === 'en' ? 'is-active' : ''} onClick={() => setLocale('en')} type="button">English</button>
          </div>
          <div className="tm-setting-meta">
            <span>{t('direction')}</span>
            <strong>{direction === 'rtl' ? t('rtl') : t('ltr')}</strong>
          </div>
        </SettingsCard>

        <SettingsCard icon={Sun} title={t('theme')}>
          <div className="tm-theme-options">
            {themeOptions.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                className={theme === value ? 'is-active' : ''}
                onClick={() => setTheme(value)}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard icon={Database} title={t('localFirst')}>
          <p>{t('localFirstDescription')}</p>
          <div className="tm-setting-meta">
            <span>Storage</span>
            <strong>IndexedDB</strong>
          </div>
        </SettingsCard>

        <SettingsCard icon={CalendarDays} title={t('dateEngine')}>
          <p>{t('jalaliEngine')}</p>
          <div className="tm-setting-meta">
            <span>{locale === 'fa' ? 'امروز' : 'Today'}</span>
            <strong>{tinyDateService.format(new Date(), locale, 'short')}</strong>
          </div>
        </SettingsCard>

        <SettingsCard icon={Download} title={locale === 'fa' ? 'پشتیبان‌گیری' : 'Backup & restore'} wide>
          <p>
            {locale === 'fa'
              ? 'تمام داده‌های ثبت‌شده توسط Core و ماژول‌ها را در یک فایل JSON قابل حمل نگه دار.'
              : 'Keep all Core and module data in one portable JSON backup file.'}
          </p>
          <div className="tm-backup-actions">
            <button className="tm-secondary-button" type="button" onClick={() => void exportBackup()}>
              <Download size={17} />
              {locale === 'fa' ? 'دریافت پشتیبان' : 'Export backup'}
            </button>
            <button className="tm-secondary-button" type="button" onClick={() => fileInput.current?.click()}>
              <Upload size={17} />
              {locale === 'fa' ? 'بازیابی پشتیبان' : 'Restore backup'}
            </button>
            <input
              ref={fileInput}
              hidden
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) return;
                void importBackup(file).catch(() => {
                  setMessage(locale === 'fa' ? 'فایل پشتیبان معتبر نیست.' : 'The backup file is invalid.');
                });
              }}
            />
          </div>
          {message && <div className="tm-inline-message">{message}</div>}
        </SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  children,
  wide = false,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={`tm-settings-card${wide ? ' is-wide' : ''}`}>
      <div className="tm-settings-card-title">
        <div className="tm-stat-icon"><Icon size={19} /></div>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default App;