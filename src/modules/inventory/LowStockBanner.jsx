import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function LowStockBanner({ token, lowStockCount, onAutoTriggerSuccess, onOpenPOModal }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!lowStockCount || lowStockCount === 0) return null;

  const handleAutoTrigger = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/erp/scm/purchase-orders/auto-trigger', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'Auto draft Purchase Orders generated successfully.');
        if (onAutoTriggerSuccess) onAutoTriggerSuccess();
      } else {
        setMessage(data.error || 'Failed to auto-generate draft POs.');
      }
    } catch (err) {
      setMessage('Network error generating draft POs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start sm:items-center space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <p className="font-semibold text-sm">
            Low Stock Warning: <span className="font-bold underline">{lowStockCount}</span> item(s) are below reorder thresholds.
          </p>
          {message ? (
            <p className="text-xs text-amber-800 mt-1 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />
              {message}
            </p>
          ) : (
            <p className="text-xs text-amber-700">
              Automated reorder triggers are active. Generate draft POs now or create custom orders.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 flex-shrink-0">
        <button
          onClick={handleAutoTrigger}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Auto Draft PO</span>
        </button>

        {onOpenPOModal && (
          <button
            onClick={onOpenPOModal}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-medium text-xs transition shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>New PO Wizard</span>
          </button>
        )}
      </div>
    </div>
  );
}
