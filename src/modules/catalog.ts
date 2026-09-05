import type { TinyManagerModuleManifest } from '../core/types';

const commonCapabilities = {
  globalSearch: true,
  sharedPeople: false,
  sharedProjects: true,
  notifications: false,
  assistantActions: true,
} as const;

export const moduleCatalog: TinyManagerModuleManifest[] = [
  {
    id: 'tiny-decision-matrix', version: '0.1.0-alpha.1', name: { fa: 'ماتریس تصمیم', en: 'Decision Matrix' },
    description: { fa: 'مقایسه گزینه‌ها با معیارهای وزن‌دار و امتیازدهی شفاف.', en: 'Compare options with weighted criteria and transparent scoring.' },
    icon: 'Scale', route: '/modules/decision-matrix', repository: 'https://github.com/webtanan-sketch/tiny-decision-matrix', category: 'decisions', maturity: 'alpha',
    capabilities: { ...commonCapabilities, dashboardWidget: true, exportData: true },
  },
  {
    id: 'tiny-meeting-cost', version: '0.1.0-alpha.1', name: { fa: 'هزینه جلسه', en: 'Meeting Cost' },
    description: { fa: 'محاسبه سریع هزینه زمانی و مالی جلسه با حداقل ورودی.', en: 'Calculate meeting time and financial cost with minimal input.' },
    icon: 'Clock3', route: '/modules/meeting-cost', repository: 'https://github.com/webtanan-sketch/tiny-meeting-cost', category: 'insight', maturity: 'alpha',
    capabilities: { ...commonCapabilities, dashboardWidget: false, exportData: false, sharedProjects: false },
  },
  {
    id: 'tiny-raci', version: '0.1.0-alpha.1', name: { fa: 'ماتریس RACI', en: 'RACI' },
    description: { fa: 'ثبت فعالیت با مسئول اجرا و پاسخگو؛ نقش‌های مشاور و مطلع اختیاری‌اند.', en: 'Capture an activity with Responsible and Accountable while C/I stay optional.' },
    icon: 'Network', route: '/modules/raci', repository: 'https://github.com/webtanan-sketch/tiny-raci', category: 'people', maturity: 'alpha',
    capabilities: { ...commonCapabilities, dashboardWidget: false, exportData: true, sharedPeople: true },
  },
  {
    id: 'tiny-risk', version: '0.1.0-alpha.1', name: { fa: 'مدیریت ریسک', en: 'Risk' },
    description: { fa: 'ثبت سریع ریسک و امتیاز احتمال × اثر با حداقل ورودی.', en: 'Capture risks quickly with probability × impact scoring.' },
    icon: 'TriangleAlert', route: '/modules/risk', repository: 'https://github.com/webtanan-sketch/tiny-risk', category: 'insight', maturity: 'alpha',
    capabilities: { ...commonCapabilities, dashboardWidget: true, exportData: true, sharedPeople: true, notifications: true },
  },
  {
    id: 'tiny-waiting', version: '0.1.0-alpha.1', name: { fa: 'منتظر پاسخ', en: 'Waiting For' },
    description: { fa: 'پیگیری مواردی که ادامه کار آن‌ها به پاسخ شخص دیگری وابسته است.', en: 'Track work that is waiting on somebody else.' },
    icon: 'Hourglass', route: '/modules/waiting', repository: 'https://github.com/webtanan-sketch/tiny-waiting', category: 'execution', maturity: 'alpha',
    capabilities: { ...commonCapabilities, dashboardWidget: true, exportData: true, sharedPeople: true, notifications: true },
  },
  {
    id: 'tiny-delegation', version: '0.1.0-alpha.1', name: { fa: 'تفویض کار', en: 'Delegation' },
    description: { fa: 'ثبت و پیگیری کار سپرده‌شده فقط با کار + شخص.', en: 'Track delegated work with task + person as the minimum input.' },
    icon: 'Send', route: '/modules/delegation', repository: 'https://github.com/webtanan-sketch/tiny-delegation', category: 'execution', maturity: 'alpha',
    capabilities: { ...commonCapabilities, dashboardWidget: true, exportData: true, sharedPeople: true, notifications: true },
  },
  {
    id: 'tiny-deadline', version: '0.1.0-alpha.1', name: { fa: 'رادار موعدها', en: 'Deadline Radar' },
    description: { fa: 'نمایش موعدهای امروز، نزدیک و عقب‌افتاده بدون تقویم شلوغ.', en: 'See today, upcoming and overdue deadlines without a noisy calendar.' },
    icon: 'CalendarClock', route: '/modules/deadline', repository: 'https://github.com/webtanan-sketch/tiny-deadline', category: 'planning', maturity: 'alpha',
    capabilities: { ...commonCapabilities, dashboardWidget: true, exportData: true, sharedPeople: true, notifications: true },
  },
  {
    id: 'tiny-weekly-review', version: '0.1.0-alpha.1', name: { fa: 'مرور هفتگی', en: 'Weekly Review' },
    description: { fa: 'مرور هفتگی تولیدشده از داده ماژول‌ها، بدون گزارش‌نویسی طولانی.', en: 'Generate a weekly review from module data without a long manual report.' },
    icon: 'ClipboardCheck', route: '/modules/weekly-review', repository: 'https://github.com/webtanan-sketch/tiny-weekly-review', category: 'planning', maturity: 'alpha',
    capabilities: { ...commonCapabilities, dashboardWidget: true, exportData: true },
  },
  {
    id: 'tiny-project-health', version: '0.1.0-alpha.1', name: { fa: 'سلامت پروژه', en: 'Project Health' },
    description: { fa: 'محاسبه سلامت از سیگنال‌های واقعی Deadline، Risk، Waiting و Delegation.', en: 'Derive health from real Deadline, Risk, Waiting and Delegation signals.' },
    icon: 'Activity', route: '/modules/project-health', repository: 'https://github.com/webtanan-sketch/tiny-project-health', category: 'insight', maturity: 'alpha',
    capabilities: { ...commonCapabilities, dashboardWidget: true, exportData: true, notifications: true },
  },
];
