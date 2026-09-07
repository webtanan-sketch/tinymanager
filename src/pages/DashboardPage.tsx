import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Hourglass,
  Network,
  Puzzle,
  Scale,
  Send,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { tinyDateService } from '../core/date-service';
import { useI18n } from '../core/i18n';
import {
  collectManagerSignals,
  MANAGER_SIGNAL_EVENTS,
  type ManagerSignals,
} from '../core/manager-signals';
import { tinyStorage } from '../core/storage';
import { moduleCatalog } from '../modules/catalog';
import './dashboard.css';

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

const emptySignals: ManagerSignals = {
  openWaiting: 0,
  staleWaiting: 0,
  followUpsDue: 0,
  openDelegations: 0,
  completedDelegations: 0,
  staleDelegations: 0,
  overdueDelegations: 0,
  openDeadlines: 0,
  overdueDeadlines: 0,
  dueSoonDeadlines: 0,
  openRisks: 0,
  highRisks: 0,
  criticalRisks: 0,
  attentionTotal: 0,
  healthInput: {
    overdueDeadlines: 0,
    highRisks: 0,
    staleWaiting: 0,
    staleDelegations: 0,
    daysSinceUpdate: 0,
  },
  health: { score: 100, status: 'healthy', reasons: [] },
};

interface AttentionCardData {
  id: string;
  moduleId: string;
  route: string;
  icon: LucideIcon;
  value: number;
  titleFa: string;
  titleEn: string;
  detailFa: string;
  detailEn: string;
  tone: 'danger' | 'warning' | 'info';
}

export function DashboardPage({ enabledIds }: { enabledIds: Set<string> }) {
  const { locale, t } = useI18n();
  const [signals, setSignals] = useState<ManagerSignals>(emptySignals);
  const [ready, setReady] = useState(false);
  const enabledModules = useMemo(
    () => moduleCatalog.filter((module) => enabledIds.has(module.id)),
    [enabledIds],
  );
  const today = tinyDateService.format(new Date(), locale, 'long');

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const next = await collectManagerSignals(tinyStorage);
      if (active) {
        setSignals(next);
        setReady(true);
      }
    };

    void refresh();
    MANAGER_SIGNAL_EVENTS.forEach((eventName) => window.addEventListener(eventName, refresh));
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      MANAGER_SIGNAL_EVENTS.forEach((eventName) => window.removeEventListener(eventName, refresh));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const attentionCards: AttentionCardData[] = [
    {
      id: 'deadlines',
      moduleId: 'tiny-deadline',
      route: '/modules/deadline',
      icon: CalendarClock,
      value: signals.overdueDeadlines,
      titleFa: 'موعدهای عقب‌افتاده',
      titleEn: 'Overdue deadlines',
      detailFa: `${signals.dueSoonDeadlines} موعد در ۷ روز آینده`,
      detailEn: `${signals.dueSoonDeadlines} due in the next 7 days`,
      tone: 'danger',
    },
    {
      id: 'risks',
      moduleId: 'tiny-risk',
      route: '/modules/risk',
      icon: TriangleAlert,
      value: signals.highRisks,
      titleFa: 'ریسک‌های مهم',
      titleEn: 'High risks',
      detailFa: `${signals.criticalRisks} ریسک بحرانی`,
      detailEn: `${signals.criticalRisks} critical`,
      tone: 'warning',
    },
    {
      id: 'waiting',
      moduleId: 'tiny-waiting',
      route: '/modules/waiting',
      icon: Hourglass,
      value: signals.followUpsDue,
      titleFa: 'پیگیری‌های موعدرسیده',
      titleEn: 'Follow-ups due',
      detailFa: `${signals.staleWaiting} مورد بیش از ۵ روز منتظر`,
      detailEn: `${signals.staleWaiting} stale for 5+ days`,
      tone: 'info',
    },
    {
      id: 'delegation',
      moduleId: 'tiny-delegation',
      route: '/modules/delegation',
      icon: Send,
      value: signals.overdueDelegations,
      titleFa: 'تفویض‌های عقب‌افتاده',
      titleEn: 'Overdue delegations',
      detailFa: `${signals.staleDelegations} مورد بدون پیگیری تازه`,
      detailEn: `${signals.staleDelegations} stale delegation(s)`,
      tone: 'warning',
    },
  ];

  const healthLabel = locale === 'fa'
    ? signals.health.status === 'healthy' ? 'سالم' : signals.health.status === 'attention' ? 'نیازمند توجه' : 'بحرانی'
    : signals.health.status === 'healthy' ? 'Healthy' : signals.health.status === 'attention' ? 'Needs attention' : 'Critical';

  const attentionLabel = locale === 'fa'
    ? signals.attentionTotal === 0 ? 'مورد فوری ندارید' : `${signals.attentionTotal} مورد نیازمند توجه`
    : signals.attentionTotal === 0 ? 'No urgent items' : `${signals.attentionTotal} item(s) need attention`;

  return (
    <div className="tm-page tm-dashboard-page">
      <section className="tm-page-heading">
        <div>
          <span className="tm-eyebrow">{t('overview')}</span>
          <h1>{t('dashboard')}</h1>
          <p>{today}</p>
        </div>
        <div className={`tm-status-pill tm-attention-pill${signals.attentionTotal > 0 ? ' has-attention' : ''}`}>
          <span className="tm-live-dot" />
          {ready ? attentionLabel : (locale === 'fa' ? 'در حال بررسی…' : 'Checking…')}
        </div>
      </section>

      <section className={`tm-health-hero is-${signals.health.status}`}>
        <div className="tm-health-copy">
          <span className="tm-eyebrow">{locale === 'fa' ? 'نمای مدیریتی امروز' : 'Manager view today'}</span>
          <h2>{locale === 'fa' ? 'اول کارهای مهم را ببین' : 'See what needs attention first'}</h2>
          <p>
            {signals.attentionTotal === 0
              ? (locale === 'fa' ? 'در داده‌های فعال، مورد فوری پیدا نشد. می‌توانی روی کارهای برنامه‌ریزی‌شده تمرکز کنی.' : 'No urgent items were found in active data. You can focus on planned work.')
              : (locale === 'fa' ? 'این خلاصه از ماژول‌های موعد، ریسک، منتظر پاسخ و تفویض به‌صورت زنده ساخته شده است.' : 'This live summary combines Deadline, Risk, Waiting For and Delegation data.')}
          </p>
        </div>
        <div className="tm-health-score" aria-label={`${healthLabel}: ${signals.health.score}`}>
          <div className="tm-health-score-ring">
            <strong>{signals.health.score}</strong>
            <span>/ 100</span>
          </div>
          <div><span>{locale === 'fa' ? 'سلامت کارها' : 'Work health'}</span><strong>{healthLabel}</strong></div>
        </div>
      </section>

      <section className="tm-attention-grid" aria-label={locale === 'fa' ? 'موارد نیازمند توجه' : 'Attention items'}>
        {attentionCards.map((card) => {
          const Icon = card.icon;
          const destination = enabledIds.has(card.moduleId) ? card.route : '/modules';
          return (
            <NavLink className={`tm-attention-card tone-${card.tone}${card.value > 0 ? ' is-active' : ''}`} to={destination} key={card.id}>
              <div className="tm-attention-card-top"><div className="tm-attention-icon"><Icon size={20} /></div><ArrowUpRight size={17} /></div>
              <strong className="tm-attention-value">{card.value}</strong>
              <h3>{locale === 'fa' ? card.titleFa : card.titleEn}</h3>
              <p>{locale === 'fa' ? card.detailFa : card.detailEn}</p>
            </NavLink>
          );
        })}
      </section>

      <section className="tm-dashboard-kpi-grid">
        <DashboardKpi icon={Hourglass} value={signals.openWaiting} label={locale === 'fa' ? 'منتظر پاسخ باز' : 'Open waiting'} />
        <DashboardKpi icon={Send} value={signals.openDelegations} label={locale === 'fa' ? 'تفویض باز' : 'Open delegations'} />
        <DashboardKpi icon={CalendarClock} value={signals.dueSoonDeadlines} label={locale === 'fa' ? 'موعد ۷ روز آینده' : 'Due next 7 days'} />
        <DashboardKpi icon={CheckCircle2} value={signals.completedDelegations} label={locale === 'fa' ? 'تفویض تکمیل‌شده' : 'Completed delegations'} />
      </section>

      <section className="tm-section">
        <div className="tm-section-heading">
          <div><span className="tm-eyebrow">{locale === 'fa' ? 'ابزارهای فعال' : 'Active tools'}</span><h2>{locale === 'fa' ? 'ورود سریع به ماژول‌ها' : 'Quick module access'}</h2></div>
          <NavLink to="/modules" className="tm-text-link">{t('allModules')} <ArrowUpRight size={17} /></NavLink>
        </div>
        {enabledModules.length > 0 ? (
          <div className="tm-dashboard-module-grid">
            {enabledModules.map((module) => {
              const Icon = moduleIcons[module.icon] ?? Puzzle;
              return (
                <NavLink className="tm-dashboard-module-card" to={module.route} key={module.id}>
                  <div className="tm-module-icon"><Icon size={20} /></div>
                  <div><strong>{module.name[locale]}</strong><span>{module.description[locale]}</span></div>
                  <ArrowUpRight size={17} />
                </NavLink>
              );
            })}
          </div>
        ) : (
          <div className="tm-dashboard-empty">
            <Puzzle size={22} />
            <div><strong>{locale === 'fa' ? 'هنوز ماژولی فعال نیست' : 'No modules enabled yet'}</strong><span>{locale === 'fa' ? 'از مدیر ماژول‌ها ابزارهای موردنیاز را فعال کن.' : 'Enable the tools you need from Module Manager.'}</span></div>
            <NavLink className="tm-primary-button" to="/modules">{locale === 'fa' ? 'مدیر ماژول‌ها' : 'Module Manager'}</NavLink>
          </div>
        )}
      </section>
    </div>
  );
}

function DashboardKpi({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
  return (
    <article className="tm-dashboard-kpi">
      <div className="tm-stat-icon"><Icon size={19} /></div>
      <div><strong>{value}</strong><span>{label}</span></div>
    </article>
  );
}

export default DashboardPage;
