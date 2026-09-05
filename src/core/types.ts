export type TinyLocale = 'fa' | 'en';
export type TinyDirection = 'rtl' | 'ltr';
export type TinyTheme = 'light' | 'dark' | 'system';

export interface BilingualText {
  fa: string;
  en: string;
}

export type ModuleCategory =
  | 'planning'
  | 'execution'
  | 'decisions'
  | 'people'
  | 'insight';

export type ModuleMaturity = 'foundation' | 'alpha' | 'beta' | 'stable';

export interface ModuleCapabilitySet {
  dashboardWidget: boolean;
  globalSearch: boolean;
  exportData: boolean;
  sharedPeople: boolean;
  sharedProjects: boolean;
  notifications: boolean;
}

export interface TinyManagerModuleManifest {
  id: string;
  version: string;
  name: BilingualText;
  description: BilingualText;
  icon: string;
  route: string;
  repository: string;
  category: ModuleCategory;
  maturity: ModuleMaturity;
  capabilities: ModuleCapabilitySet;
}

export interface TinyManagerModuleContext {
  locale: TinyLocale;
  direction: TinyDirection;
  storage: TinyManagerStorage;
  date: TinyDateService;
}

export interface TinyManagerModuleDefinition {
  manifest: TinyManagerModuleManifest;
  initialize(context: TinyManagerModuleContext): void | Promise<void>;
  dispose?(): void | Promise<void>;
}

export interface TinyManagerStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  keys(prefix?: string): Promise<string[]>;
  exportAll(): Promise<Record<string, unknown>>;
  importAll(data: Record<string, unknown>): Promise<void>;
}

export interface TinyDateService {
  todayIso(): string;
  format(value: string | Date, locale: TinyLocale, style?: 'short' | 'long'): string;
  formatDateTime(value: string | Date, locale: TinyLocale): string;
}
