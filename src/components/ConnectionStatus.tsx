import { useEffect, useState } from 'react';

export default function ConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine);

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

  return (
    <div className="bg-red-900/80 text-red-200 text-xs text-center py-1.5 px-4">
      ⚠ You're offline — data may be stale
    </div>
  );
}
