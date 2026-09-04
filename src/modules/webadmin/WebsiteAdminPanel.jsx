import React, { useState, useRef } from 'react';
import { Globe, RefreshCw, ExternalLink, AlertCircle, Monitor } from 'lucide-react';

const WEBSITE_ADMIN_URL = 'http://localhost:5173';

export default function WebsiteAdminPanel({ token }) {
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const iframeRef                 = useRef(null);

  const handleRefresh = () => {
    setLoading(true);
    setError(false);
    setIframeKey(k => k + 1);
  };

  const handleOpenExternal = () => {
    window.open(WEBSITE_ADMIN_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Globe className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900">Website Admin Panel</h1>
            <p className="text-xs text-slate-500 font-mono">{WEBSITE_ADMIN_URL}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reload
          </button>
          <button
            onClick={handleOpenExternal}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open Tab
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium ${loading ? 'bg-amber-50 text-amber-700 border border-amber-200' : error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : error ? 'bg-red-500' : 'bg-emerald-500'}`} />
        {loading ? 'Connecting to website admin...' : error ? 'Cannot connect — make sure the website frontend is running on port 5173' : 'Website admin panel connected'}
      </div>

      {/* iframe container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="font-bold text-slate-700 mb-2">Website admin unavailable</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              The website frontend needs to be running on <span className="font-mono bg-slate-100 px-1 rounded">http://localhost:5173</span> to display here.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-sm font-mono text-slate-600 max-w-sm w-full">
              <p className="text-xs text-slate-400 mb-2"># Start the website frontend:</p>
              <p>cd frontend</p>
              <p>npm run dev</p>
            </div>
            <button
              onClick={handleRefresh}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        ) : (
          <>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <div className="flex flex-col items-center gap-3">
                  <Monitor className="w-10 h-10 text-slate-300 animate-pulse" />
                  <p className="text-sm text-slate-500">Loading website admin...</p>
                </div>
              </div>
            )}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={WEBSITE_ADMIN_URL}
              title="Website Admin Panel"
              className="w-full h-full border-0"
              style={{ minHeight: '500px' }}
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation"
            />
          </>
        )}
      </div>

      {/* Quick link info */}
      <p className="text-xs text-slate-400 text-center">
        The website admin panel is embedded above. All changes sync directly to the shared database.
        If embedding fails due to X-Frame-Options, use the <strong>"Open Tab"</strong> button above.
      </p>
    </div>
  );
}
