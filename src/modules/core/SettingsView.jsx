import React, { useEffect, useState } from 'react';
import { Globe, DollarSign, Save } from 'lucide-react';

export default function SettingsView({ token }) {
  const [settings, setSettings] = useState({
    usdToKesRate: '',
    overlayOpacity: '',
    sectionHeight: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings'); // Public endpoint for settings
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        setMessage('Settings saved successfully!');
      } else {
        const data = await response.json();
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500">Manage global system parameters.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-md bg-blue-600 text-white font-medium text-sm shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-md text-sm font-medium ${message.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-md shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-6 border-b border-slate-100 pb-4">
            <Globe className="w-5 h-5 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">Storefront Display</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hero Overlay Opacity (0-100)</label>
              <input
                type="number"
                name="overlayOpacity"
                value={settings.overlayOpacity || ''}
                onChange={handleChange}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hero Section Height (px)</label>
              <input
                type="number"
                name="sectionHeight"
                value={settings.sectionHeight || ''}
                onChange={handleChange}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-6 border-b border-slate-100 pb-4">
            <DollarSign className="w-5 h-5 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">Financial Settings</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">USD to KES Exchange Rate</label>
              <input
                type="number"
                name="usdToKesRate"
                value={settings.usdToKesRate || ''}
                onChange={handleChange}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
