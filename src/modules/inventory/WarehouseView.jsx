import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, MapPin, User, Package, Star } from 'lucide-react';
import AddWarehouseModal from './AddWarehouseModal';

export default function WarehouseView({ token, userRole }) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canEditSCM = ['CEO', 'WebAdmin', 'Admin', 'Manager'].includes(userRole);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/erp/scm/warehouses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data);
      }
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredWarehouses = warehouses.filter(w =>
    (w.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.manager || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCapacity = warehouses.reduce((sum, w) => sum + (w.capacity || 0), 0);
  const totalStockCount = warehouses.reduce((sum, w) => {
    const whStock = (w.products || []).reduce((pSum, p) => pSum + (p.quantity || 0), 0);
    return sum + whStock;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Active Warehouses</p>
            <p className="text-xl font-bold text-slate-900">{warehouses.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Stock Stored</p>
            <p className="text-xl font-bold text-slate-900">{totalStockCount.toLocaleString()} units</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total System Capacity</p>
            <p className="text-xl font-bold text-slate-900">{totalCapacity.toLocaleString()} units</p>
          </div>
        </div>
      </div>

      {/* Header Actions & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search warehouses by name, code, or manager..."
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
            <span>Add Warehouse</span>
          </button>
        )}
      </div>

      {/* Warehouses Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden flex flex-col h-[500px]">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left text-sm text-slate-600 relative">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">Code & Name</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Manager / Contact</th>
                <th className="px-6 py-4">Capacity Utilization</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredWarehouses.map((w, idx) => {
                const currentStock = (w.products || []).reduce((sum, p) => sum + (p.quantity || 0), 0);
                const capacity = w.capacity || 10000;
                const utilization = Math.min(Math.round((currentStock / capacity) * 100), 100);

                return (
                  <tr key={w._id} className={`hover:bg-slate-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900">{w.name}</span>
                        {w.isDefault && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200">
                            Primary Hub
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{w.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{w.location?.city || 'Nairobi'}, {w.location?.country || 'Kenya'}</span>
                      </div>
                      <div className="text-xs text-slate-500 pl-5">{w.location?.address || 'Central'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5 text-slate-800 font-medium">
                        <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{w.manager || w.contactPerson?.name || 'Unassigned'}</span>
                      </div>
                      {w.contactPerson?.phone && (
                        <div className="text-xs text-slate-500 pl-5">{w.contactPerson.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-48">
                        <div className="flex justify-between text-xs mb-1 font-medium text-slate-700">
                          <span>{currentStock} / {capacity} units</span>
                          <span>{utilization}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full transition-all duration-300 ${
                              utilization > 90 ? 'bg-red-500' : utilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 capitalize">
                        {w.status || 'active'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredWarehouses.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 text-sm bg-white">
                    No warehouses registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddWarehouseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onWarehouseAdded={fetchWarehouses}
        token={token}
      />
    </div>
  );
}
