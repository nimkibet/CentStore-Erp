import React, { useEffect, useState } from 'react';
import { Users, Mail, Phone, ShoppingBag } from 'lucide-react';

export default function CustomersView({ token }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/erp/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Handle pagination object { data: [...] } or array [...]
        setCustomers(data.data || data);
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to fetch customers');
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CRM / Customers</h1>
          <p className="text-sm text-slate-500">Manage customer relationships and purchase history.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden flex flex-col h-[600px]">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left text-sm text-slate-600 relative">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Total Orders</th>
                <th className="px-6 py-4">Lifetime Value</th>
                <th className="px-6 py-4">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {customers.map((c, i) => (
                <tr key={i} className={`hover:bg-slate-50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="px-6 py-4 font-medium text-slate-900 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0 uppercase">
                      {c.name ? c.name.charAt(0) : '?'}
                    </div>
                    <span className="truncate">{c.name || 'Walk-in Customer'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1.5 text-slate-600 mb-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{c.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.phone || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.visitCount || 0}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    KES {(c.totalSpent || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && !loading && !error && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500 text-sm bg-white">
                    No customers found.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500 text-sm bg-white">
                    Loading CRM data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
