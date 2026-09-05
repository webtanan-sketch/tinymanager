import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { TinyDirection, TinyLocale } from './types';

const LOCALE_STORAGE_KEY = 'tinymanager.core.locale';

const translations = {
  fa: {
    appName: 'TinyManager',
    appTagline: 'ابزارهای کوچک، مدیریت بهتر',
    dashboard: 'داشبورد',
    modules: 'ماژول‌ها',
    settings: 'تنظیمات',
    overview: 'نمای کلی',
    today: 'امروز',
    attention: 'نیازمند توجه',
    enabledModules: 'ماژول‌های فعال',
    allModules: 'همه ماژول‌ها',
    noActivity: 'هنوز فعالیتی ثبت نشده است.',
    language: 'زبان',
    persian: 'فارسی',
    english: 'English',
    theme: 'پوسته',
    light: 'روشن',
    dark: 'تیره',
    system: 'سیستم',
    localFirst: 'ذخیره محلی',
    localFirstDescription: 'داده‌های نسخه پایه روی همین دستگاه نگهداری می‌شوند.',
    moduleManager: 'مدیریت ماژول‌ها',
    moduleManagerDescription: 'فقط ابزارهایی را فعال کن که واقعاً به آن‌ها نیاز داری.',
    enable: 'فعال‌سازی',
    disable: 'غیرفعال‌سازی',
    enabled: 'فعال',
    foundation: 'پایه',
    alpha: 'آلفا',
    beta: 'بتا',
    stable: 'پایدار',
    openRepository: 'مشاهده Repository',
    coreStatus: 'وضعیت هسته',
    ready: 'آماده توسعه',
    privacy: 'Local-first',
    direction: 'جهت رابط',
    rtl: 'راست‌به‌چپ',
    ltr: 'چپ‌به‌راست',
    dateEngine: 'موتور تاریخ',
    jalaliEngine: 'Webtanan Jalali Date Engine',
    quickStart: 'شروع سریع',
    quickStartDescription: 'ماژول موردنیاز را از منوی ماژول‌ها فعال کن.',
    comingNext: 'در حال ساخت',
    decisionMatrix: 'ماتریس تصمیم',
    commandSearch: 'جستجو یا اجرای فرمان…',
  },
  en: {
    appName: 'TinyManager',
    appTagline: 'Small tools. Better management.',
    dashboard: 'Dashboard',
    modules: 'Modules',
    settings: 'Settings',
    overview: 'Overview',
    today: 'Today',
    attention: 'Needs attention',
    enabledModules: 'Enabled modules',
    allModules: 'All modules',
    noActivity: 'No activity has been recorded yet.',
    language: 'Language',
    persian: 'فارسی',
    english: 'English',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    localFirst: 'Local storage',
    localFirstDescription: 'Base-edition data stays on this device.',
    moduleManager: 'Module manager',
    moduleManagerDescription: 'Enable only the tools you actually need.',
    enable: 'Enable',
    disable: 'Disable',
    enabled: 'Enabled',
    foundation: 'Foundation',
    alpha: 'Alpha',
    beta: 'Beta',
    stable: 'Stable',
    openRepository: 'Open repository',
    coreStatus: 'Core status',
    ready: 'Ready for development',
    privacy: 'Local-first',
    direction: 'Interface direction',
    rtl: 'Right to left',
    ltr: 'Left to right',
    dateEngine: 'Date engine',
    jalaliEngine: 'Webtanan Jalali Date Engine',
    quickStart: 'Quick start',
    quickStartDescription: 'Enable the module you need from the Modules screen.',
    comingNext: 'In development',
    decisionMatrix: 'Decision Matrix',
    commandSearch: 'Search or run a command…',
  },
} as const;

type TranslationKey = keyof typeof translations.fa;

interface I18nContextValue {
  locale: TinyLocale;
  direction: TinyDirection;
  setLocale(locale: TinyLocale): void;
  t(key: TranslationKey): string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const getInitialLocale = (): TinyLocale => {
  if (typeof window === 'undefined') return 'fa';
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === 'en' ? 'en' : 'fa';
};

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<TinyLocale>(getInitialLocale);
  const direction: TinyDirection = locale === 'fa' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [direction, locale]);

  const setLocale = useCallback((nextLocale: TinyLocale) => {
    setLocaleState(nextLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[locale][key],
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, direction, setLocale, t }),
    [direction, locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider.');
  }
  return context;
}
