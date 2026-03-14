import React, { useState, useEffect } from 'react';

type ConnectionStatus = 'online' | 'offline' | 'server-down';

export const OfflineBanner: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>('online');
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkServerReachability = async (): Promise<boolean> => {
    try {
      // Use a simple HEAD request to the app's own origin with a cache-busting param
      const res = await fetch(`/?_hc=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      return res.ok || res.status === 404; // 404 still means server is alive
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let serverCheckInterval: ReturnType<typeof setInterval> | null = null;

    const handleOffline = () => {
      setStatus('offline');
      setWasOffline(true);
    };

    const handleOnline = async () => {
      // Browser says online — verify server is actually reachable
      const reachable = await checkServerReachability();
      if (reachable) {
        setStatus('online');
        if (wasOffline) {
          setShowRestored(true);
          setTimeout(() => setShowRestored(false), 4000);
        }
        setWasOffline(false);
      } else {
        setStatus('server-down');
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Initial check on mount
    if (!navigator.onLine) {
      setStatus('offline');
      setWasOffline(true);
    } else {
      // Silently verify server once on mount
      checkServerReachability().then((ok) => {
        if (!ok) setStatus('server-down');
      });
    }

    // While offline/server-down, poll every 8s to detect recovery
    serverCheckInterval = setInterval(async () => {
      if (status === 'offline' || status === 'server-down') {
        if (navigator.onLine) {
          await handleOnline();
        }
      }
    }, 8000);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (serverCheckInterval) clearInterval(serverCheckInterval);
    };
  }, [status, wasOffline]);

  const handleRetry = async () => {
    setChecking(true);
    const reachable = await checkServerReachability();
    setChecking(false);
    if (reachable) {
      setStatus('online');
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 4000);
    }
  };

  // Back online — brief green toast
  if (showRestored) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none">
        <div className="mt-4 flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-xl animate-slide-down">
          <i className="fas fa-wifi"></i>
          You're back online
        </div>
      </div>
    );
  }

  // Offline — small persistent top strip
  if (status === 'offline') {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999]">
        <div className="bg-slate-900 text-white text-sm px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0"></div>
            <span className="font-medium">No internet connection</span>
            <span className="text-slate-400 text-xs hidden sm:inline">Your changes may not be saved until you're back online.</span>
          </div>
          <button
            onClick={handleRetry}
            disabled={checking}
            className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-60 shrink-0"
          >
            <i className={`fas ${checking ? 'fa-spinner fa-spin' : 'fa-rotate-right'}`}></i>
            {checking ? 'Checking…' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  // Server down — full overlay (rare but important)
  if (status === 'server-down') {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-5">
            <i className="fas fa-cloud-slash text-orange-500 text-2xl"></i>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Service Temporarily Unavailable</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            We can't reach our servers right now. This could be brief maintenance or a temporary outage. Your data is safe.
          </p>
          <button
            onClick={handleRetry}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 disabled:opacity-60 transition-colors mb-3"
          >
            <i className={`fas ${checking ? 'fa-spinner fa-spin' : 'fa-rotate-right'}`}></i>
            {checking ? 'Checking connection…' : 'Try Again'}
          </button>
          <p className="text-xs text-slate-400">
            Need help?{' '}
            <a href="mailto:support@themindnetwork.in" className="text-teal-600 hover:underline">
              support@themindnetwork.in
            </a>
          </p>
        </div>
      </div>
    );
  }

  return null;
};
