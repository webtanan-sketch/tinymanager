import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { TinyTheme } from './types';

const THEME_STORAGE_KEY = 'tinymanager.core.theme';

interface ThemeContextValue {
  theme: TinyTheme;
  effectiveTheme: 'light' | 'dark';
  setTheme(theme: TinyTheme): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const getStoredTheme = (): TinyTheme => {
  if (typeof window === 'undefined') return 'system';
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : 'system';
};

const systemTheme = (): 'light' | 'dark' =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<TinyTheme>(getStoredTheme);
  const [system, setSystem] = useState<'light' | 'dark'>(systemTheme);
  const effectiveTheme = theme === 'system' ? system : theme;

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => setSystem(event.matches ? 'dark' : 'light');
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.style.colorScheme = effectiveTheme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [effectiveTheme, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, effectiveTheme, setTheme }),
    [effectiveTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider.');
  return context;
}
