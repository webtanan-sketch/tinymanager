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
import { DeadlineModulePage } from './modules/DeadlineModulePage';
import { DecisionMatrixModulePage } from './modules/DecisionMatrixModulePage';
import { DelegationModulePage } from './modules/DelegationModulePage';
import { MeetingCostModulePage } from './modules/MeetingCostModulePage';
import { ProjectHealthModulePage } from './modules/ProjectHealthModulePage';
import { RaciModulePage } from './modules/RaciModulePage';
import { RiskModulePage } from './modules/RiskModulePage';
import { WaitingModulePage } from './modules/WaitingModulePage';
import { WeeklyReviewModulePage } from './modules/WeeklyReviewModulePage';
import { moduleCatalog } from './modules/catalog';
import { LanguageCenterPage } from './pages/LanguageCenterPage';

const registry = new TinyManagerModuleRegistry(moduleCatalog, tinyStorage);
const integratedModuleIds = new Set(moduleCatalog.map((module) => module.id));

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

function GuardedModule({ id, ready, enabledIds, children }: { id: string; ready: boolean; enabledIds: Set<string>; children: ReactNode }) {
  if (!ready) return <div className="tm-module-loading">Preparing module…</div>;
  if (!enabledIds.has(id)) return <Navigate replace to="/modules" />;
  return <>{children}</>;
}

function App() {
  const modules = useModuleRegistry();
  const guard = (id: string, page: ReactNode) => (
    <GuardedModule id={id} ready={modules.ready} enabledIds={modules.enabledIds}>{page}</GuardedModule>
  );

  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard enabledIds={modules.enabledIds} />} />
          <Route path="/modules" element={<ModulesPage enabledIds={modules.enabledIds} ready={modules.ready} onSetEnabled={modules.setEnabled} />} />
          <Route path="/modules/decision-matrix" element={guard('tiny-decision-matrix', <DecisionMatrixModulePage />)} />
          <Route path="/modules/meeting-cost" element={guard('tiny-meeting-cost', <MeetingCostModulePage />)} />
          <Route path="/modules/waiting" element={guard('tiny-waiting', <WaitingModulePage />)} />
          <Route path="/modules/delegation" element={guard('tiny-delegation', <DelegationModulePage />)} />
          <Route path="/modules/deadline" element={guard('tiny-deadline', <DeadlineModulePage />)} />
          <Route path="/modules/risk" element={guard('tiny-risk', <RiskModulePage />)} />
          <Route path="/modules/raci" element={guard('tiny-raci', <RaciModulePage />)} />
          <Route path="/modules/weekly-review" element={guard('tiny-weekly-review', <WeeklyReviewModulePage />)} />
          <Route path="/modules/project-health" element={guard('tiny-project-health', <ProjectHealthModulePage />)} />
          <Route path="/language" element={<LanguageCenterPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate replace to="/" />} />
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
    { to: '/language', label: locale === 'fa' ? 'زبان و یادگیری' : 'Language', icon: Languages, end: false },
    { to: '/settings', label: t('settings'), icon: Settings, end: false },
  ];

  return (
    <div className="tm-shell">
      <aside className="tm-sidebar">
        <div className="tm-brand">
          <div className="tm-brand-mark" aria-hidden="true"><span /><span /><span /><span /></div>
          <div><strong>TinyManager</strong><small>{t('appTagline')}</small></div>
        </div>
        <nav className="tm-nav" aria-label="Primary navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `tm-nav-item${isActive ? ' is-active' : ''}`}>
              <Icon size={19} strokeWidth={1.9} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="tm-sidebar-spacer" />
        <div className="tm-sidebar-card"><ShieldCheck size={19} /><div><strong>{t('privacy')}</strong><span>{t('localFirstDescription')}</span></div></div>
        <div className="tm-sidebar-version">v0.1.0-alpha.2</div>
      </aside>

      <main className="tm-main">
        <header className="tm-header">
          <TinyAssistantCommandBar />
          <div className="tm-header-actions">
            <button className="tm-icon-button" type="button" onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')} aria-label={t('theme')} title={t('theme')}>
              {effectiveTheme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button className="tm-language-button" type="button" onClick={() => setLocale(locale === 'fa' ? 'en' : 'fa')} aria-label={t('language')}>
              <Languages size={18} /><span>{locale === 'fa' ? 'EN' : 'فا'}</span>
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
  const enabledModules = useMemo(() => moduleCatalog.filter((module) => enabledIds.has(module.id)), [enabledIds]);
  const today = tinyDateService.format(new Date(), locale, 'long');

  return (
    <div className="tm-page">
      <section className="tm-page-heading"><div><span className="tm-eyebrow">{t('overview')}</span><h1>{t('dashboard')}</h1><p>{today}</p></div><div className="tm-status-pill"><span className="tm-live-dot" />{t('ready')}</div></section>
      <section className="tm-hero-card">
        <div className="tm-hero-copy"><span className="tm-eyebrow tm-eyebrow-light">Tiny AI</span><h2>{t('appTagline')}</h2><p>{locale === 'fa' ? 'فرمان کوتاه بنویس؛ TinyManager ماژول درست را پیدا می‌کند، داده لازم را می‌پرسد و قبل از تغییرات تأیید می‌گیرد.' : 'Write a short command. TinyManager finds the right module, asks only for missing data, and confirms before mutations.'}</p><NavLink className="tm-primary-button" to="/modules"><Puzzle size={18} />{t('moduleManager')}</NavLink></div>
        <div className="tm-hero-visual" aria-hidden="true"><div className="tm-orbit tm-orbit-one" /><div className="tm-orbit tm-orbit-two" /><div className="tm-hero-icon"><Sparkles size={34} /></div></div>
      </section>
      <section className="tm-stats-grid">
        <StatCard icon={Puzzle} label={t('enabledModules')} value={String(enabledModules.length)} />
        <StatCard icon={Boxes} label={t('allModules')} value={String(moduleCatalog.length)} />
        <StatCard icon={Database} label={t('localFirst')} value="IndexedDB" compact />
        <StatCard icon={CalendarDays} label={t('dateEngine')} value={locale === 'fa' ? 'جلالی' : 'Gregorian'} compact />
      </section>
      <section className="tm-section"><div className="tm-section-heading"><div><span className="tm-eyebrow">{t('enabledModules')}</span><h2>{t('today')}</h2></div><NavLink to="/modules" className="tm-text-link">{t('allModules')} <ArrowUpRight size={17} /></NavLink></div><div className="tm-module-grid">{(enabledModules.length ? enabledModules : moduleCatalog.slice(0, 3)).map((module) => <ModulePreviewCard key={module.id} module={module} preview={!enabledIds.has(module.id)} />)}</div></section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, compact = false }: { icon: LucideIcon; label: string; value: string; compact?: boolean }) {
  return <article className="tm-stat-card"><div className="tm-stat-icon"><Icon size={20} /></div><div><span>{label}</span><strong className={compact ? 'is-compact' : ''}>{value}</strong></div></article>;
}

function ModulePreviewCard({ module, preview }: { module: TinyManagerModuleManifest; preview: boolean }) {
  const { locale, t } = useI18n();
  const Icon = moduleIcons[module.icon] ?? Puzzle;
  const canOpen = !preview && integratedModuleIds.has(module.id);
  return (
    <article className="tm-module-card">
      <div className="tm-module-card-top"><div className="tm-module-icon"><Icon size={21} /></div><span className={`tm-badge tm-badge-${module.maturity}`}>{preview ? t('comingNext') : t('enabled')}</span></div>
      <h3>{module.name[locale]}</h3><p>{module.description[locale]}</p>
      <div className="tm-module-card-footer"><span>{module.id}</span>{canOpen ? <NavLink to={module.route}><ArrowUpRight size={17} /></NavLink> : <a href={module.repository} target="_blank" rel="noreferrer"><ArrowUpRight size={17} /></a>}</div>
    </article>
  );
}

function ModulesPage({ enabledIds, ready, onSetEnabled }: { enabledIds: Set<string>; ready: boolean; onSetEnabled(id: string, enabled: boolean): Promise<void> }) {
  const { locale, t } = useI18n();
  const [busyId, setBusyId] = useState<string | null>(null);
  const toggle = async (module: TinyManagerModuleManifest) => {
    setBusyId(module.id);
    try { await onSetEnabled(module.id, !enabledIds.has(module.id)); } finally { setBusyId(null); }
  };

  return (
    <div className="tm-page">
      <section className="tm-page-heading"><div><span className="tm-eyebrow">TinyManager Modules</span><h1>{t('moduleManager')}</h1><p>{t('moduleManagerDescription')}</p></div></section>
      <div className="tm-module-list">
        {moduleCatalog.map((module) => {
          const Icon = moduleIcons[module.icon] ?? Puzzle;
          const enabled = enabledIds.has(module.id);
          return (
            <article className="tm-module-row" key={module.id}>
              <div className="tm-module-row-main"><div className="tm-module-icon"><Icon size={21} /></div><div><div className="tm-module-title-line"><h2>{module.name[locale]}</h2><span className={`tm-badge tm-badge-${module.maturity}`}>{t(module.maturity)}</span></div><p>{module.description[locale]}</p><a href={module.repository} target="_blank" rel="noreferrer" className="tm-repo-link">{module.id} <ArrowUpRight size={14} /></a></div></div>
              <div className="tm-module-row-actions">{enabled && <NavLink className="tm-open-module-button" to={module.route}><ArrowUpRight size={16} />{locale === 'fa' ? 'ورود' : 'Open'}</NavLink>}<button type="button" className={`tm-toggle-button${enabled ? ' is-enabled' : ''}`} disabled={!ready || busyId === module.id} onClick={() => void toggle(module)}>{enabled && <Check size={17} />}{enabled ? t('disable') : t('enable')}</button></div>
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
  const [message, setMessage] = useState('');
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
    await restoreBackup(tinyStorage, JSON.parse(await file.text()) as unknown);
    setMessage(locale === 'fa' ? 'پشتیبان با موفقیت بازیابی شد.' : 'Backup restored successfully.');
  };

  return (
    <div className="tm-page">
      <section className="tm-page-heading"><div><span className="tm-eyebrow">TinyManager Core</span><h1>{t('settings')}</h1><p>{locale === 'fa' ? 'تنظیمات مشترک تمام ماژول‌ها' : 'Shared settings for every module'}</p></div></section>
      <div className="tm-settings-grid">
        <SettingsCard icon={Languages} title={t('language')}><div className="tm-segmented"><button className={locale === 'fa' ? 'is-active' : ''} onClick={() => setLocale('fa')} type="button">فارسی</button><button className={locale === 'en' ? 'is-active' : ''} onClick={() => setLocale('en')} type="button">English</button></div><div className="tm-setting-meta"><span>{t('direction')}</span><strong>{direction === 'rtl' ? t('rtl') : t('ltr')}</strong></div></SettingsCard>
        <SettingsCard icon={Sun} title={t('theme')}><div className="tm-theme-options">{themeOptions.map(({ value, icon: Icon, label }) => <button key={value} type="button" className={theme === value ? 'is-active' : ''} onClick={() => setTheme(value)}><Icon size={18} />{label}</button>)}</div></SettingsCard>
        <SettingsCard icon={Database} title={t('localFirst')}><p>{t('localFirstDescription')}</p><div className="tm-setting-meta"><span>Storage</span><strong>IndexedDB</strong></div></SettingsCard>
        <SettingsCard icon={CalendarDays} title={t('dateEngine')}><p>{t('jalaliEngine')}</p><div className="tm-setting-meta"><span>{locale === 'fa' ? 'امروز' : 'Today'}</span><strong>{tinyDateService.format(new Date(), locale, 'short')}</strong></div></SettingsCard>
        <SettingsCard icon={Download} title={locale === 'fa' ? 'پشتیبان‌گیری' : 'Backup & restore'} wide><p>{locale === 'fa' ? 'Core، همه ماژول‌ها، واژه‌های یادگرفته‌شده و داده‌های مشترک در یک فایل قابل حمل ذخیره می‌شوند.' : 'Core data, every module, learned vocabulary and shared entities are kept in one portable backup.'}</p><div className="tm-backup-actions"><button className="tm-secondary-button" type="button" onClick={() => void exportBackup()}><Download size={17} />{locale === 'fa' ? 'دریافت پشتیبان' : 'Export backup'}</button><button className="tm-secondary-button" type="button" onClick={() => fileInput.current?.click()}><Upload size={17} />{locale === 'fa' ? 'بازیابی پشتیبان' : 'Restore backup'}</button><input ref={fileInput} hidden type="file" accept="application/json,.json" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void importBackup(file).catch(() => setMessage(locale === 'fa' ? 'فایل پشتیبان معتبر نیست.' : 'The backup file is invalid.')); }} /></div>{message && <div className="tm-inline-message">{message}</div>}</SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({ icon: Icon, title, children, wide = false }: { icon: LucideIcon; title: string; children: ReactNode; wide?: boolean }) {
  return <section className={`tm-settings-card${wide ? ' is-wide' : ''}`}><div className="tm-settings-card-title"><div className="tm-stat-icon"><Icon size={19} /></div><h2>{title}</h2></div>{children}</section>;
}

export default App;
