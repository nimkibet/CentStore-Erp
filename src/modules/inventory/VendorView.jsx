import React, { useState, useEffect } from 'react';
import { Factory, Plus, Search, Mail, Phone, MapPin, Star, ShoppingBag } from 'lucide-react';
import AddVendorModal from './AddVendorModal';

export default function VendorView({ token, userRole, onOpenPOModalWithVendor }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canEditSCM = ['CEO', 'WebAdmin', 'Admin', 'Manager'].includes(userRole);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/erp/scm/vendors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(v =>
    (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.vendorCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.contactName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Registered Suppliers</p>
            <p className="text-xl font-bold text-slate-900">{vendors.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Active Rating Avg</p>
            <p className="text-xl font-bold text-slate-900">4.9 / 5.0</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Standard Payment Terms</p>
            <p className="text-xl font-bold text-slate-900">Net 30 Days</p>
          </div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search vendors by name, code, or contact person..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          />
        </div>

        {canEditSCM && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-md bg-blue-600 text-white font-medium text-sm shadow-sm hover:bg-blue-700 transition flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
        )}
      </div>

      {/* Vendors Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden flex flex-col h-[500px]">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left text-sm text-slate-600 relative">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">Vendor Code & Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Categories</th>
                <th className="px-6 py-4">Payment Terms</th>
                <th className="px-6 py-4">Status</th>
                {canEditSCM && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredVendors.map((v, idx) => (
                <tr key={v._id} className={`hover:bg-slate-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{v.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{v.vendorCode}</div>
                  </td>
                  <td className="px-6 py-4 space-y-0.5">
                    <div className="font-medium text-slate-800">{v.contactName || 'Primary Representative'}</div>
                    {v.email && (
                      <div className="text-xs text-slate-500 flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-slate-400 inline" />
                        <span>{v.email}</span>
                      </div>
                    )}
                    {v.phone && (
                      <div className="text-xs text-slate-500 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400 inline" />
                        <span>{v.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(v.categories || ['General']).map((cat, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 uppercase text-xs">
                    {v.paymentTerms ? v.paymentTerms.replace('_', ' ') : 'NET 30'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 capitalize">
                      {v.status || 'active'}
                    </span>
                  </td>
                  {canEditSCM && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onOpenPOModalWithVendor && onOpenPOModalWithVendor(v._id)}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Create PO</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredVendors.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 text-sm bg-white">
                    No supplier vendors registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddVendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onVendorAdded={fetchVendors}
        token={token}
      />
    </div>
  );
}
