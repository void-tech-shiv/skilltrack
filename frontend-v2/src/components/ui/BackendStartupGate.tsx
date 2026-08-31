import React, { useState, useEffect } from 'react';
import { apiEvents, waitForBackend } from '../../lib/api';
import { Loader2, ServerOff, RefreshCw } from 'lucide-react';

export const BackendStartupGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<'checking' | 'waking' | 'ready' | 'unreachable'>('checking');

  useEffect(() => {
    const handleWaking = () => setState('waking');
    const handleReady = () => setState('ready');
    const handleUnreachable = () => setState('unreachable');

    apiEvents.on('backend:waking', handleWaking);
    apiEvents.on('backend:ready', handleReady);
    apiEvents.on('backend:unreachable', handleUnreachable);

    // Trigger the initial health check
    waitForBackend().then(() => setState('ready')).catch(() => setState('unreachable'));

    return () => {
      apiEvents.off('backend:waking', handleWaking);
      apiEvents.off('backend:ready', handleReady);
      apiEvents.off('backend:unreachable', handleUnreachable);
    };
  }, []);

  if (state === 'ready') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      {state === 'unreachable' ? (
        <div className="bg-white p-8 rounded-3xl shadow-subtle border border-slate-200/80 max-w-md w-full">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-6">
            <ServerOff className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Unable to Connect</h2>
          <p className="text-slate-500 mb-8">
            We couldn't reach the platform services. Please check your internet connection or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full inline-flex justify-center items-center space-x-2 px-5 py-3 bg-brand-900 hover:bg-brand-800 text-white font-bold rounded-xl transition"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-brand-100 text-brand-600 flex items-center justify-center mb-6">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
            {state === 'waking' ? 'Starting up services...' : 'Connecting...'}
          </h2>
          <p className="text-slate-500 max-w-sm">
            {state === 'waking'
              ? 'Our secure backend is waking up from idle. This usually takes about 10-15 seconds.'
              : 'Connecting to platform services...'}
          </p>
        </div>
      )}
    </div>
  );
};
