import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './core/i18n';
import { ThemeProvider } from './core/theme';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('TinyManager root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <I18nProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </I18nProvider>
  </StrictMode>,
);
