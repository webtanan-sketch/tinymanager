import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../core/i18n';
import './network-status.css';

export function NetworkStatus() {
  const { locale } = useI18n();
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (online) return null;

  const label = locale === 'fa' ? 'آفلاین — داده‌ها محلی هستند' : 'Offline — local data active';
  return (
    <div className="tm-network-status" role="status" aria-live="polite" title={label}>
      <WifiOff size={15} />
      <span>{locale === 'fa' ? 'آفلاین' : 'Offline'}</span>
    </div>
  );
}
