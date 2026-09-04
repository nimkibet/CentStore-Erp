import React, { useEffect, useState } from 'react';
import { Globe, Store, RefreshCw } from 'lucide-react';

export default function OrdersView({ token, userRole }) {
  const [orders, setOrders] = useState([]);
  const [filterOrigin, setFilterOrigin] = useState('All');
  const [loading, setLoading] = useState(true);

  const canUpdateStatus = ['CEO', 'WebAdmin', 'Admin', 'Manager'].includes(userRole);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/erp/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/erp/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchOrders();
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filterOrigin === 'Website') return o.origin === 'Website' || !o.origin;
    if (filterOrigin === 'POS') return o.origin === 'POS';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders</h1>
          <p className="text-sm text-slate-500">Transactions feed distinguishing Website storefront vs POS counter sales.</p>
        </div>

        <div className="flex items-center space-x-2 bg-white border border-slate-200 p-1 rounded-md shadow-sm">
          {['All', 'Website', 'POS'].map(type => (
            <button
              key={type}
              onClick={() => setFilterOrigin(type)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filterOrigin === type
                  ? 'bg-slate-100 text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
          <div className="w-px h-5 bg-slate-200 mx-1"></div>
          <button
            onClick={fetchOrders}
            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            title="Refresh Feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden flex flex-col h-[600px]">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left text-sm text-slate-600 relative">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">Order Ref</th>
                <th className="px-6 py-4">Origin Channel</th>
                <th className="px-6 py-4">Customer & Items</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                {canUpdateStatus && <th className="px-6 py-4 text-right">Update Status</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.map((o, idx) => (
                <tr key={o._id} className={`hover:bg-slate-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="px-6 py-4 font-mono font-medium text-slate-900">
                    {o.orderNumber}
                  </td>
                  <td className="px-6 py-4">
                    {o.origin === 'POS' ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        <Store className="w-3.5 h-3.5" />
                        <span>POS Sale</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Website</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{o.customerName}</div>
                    <div className="text-sm text-slate-500 truncate max-w-[200px]" title={o.itemsList?.join(', ') || `${o.itemsCount} items`}>
                      {o.itemsList?.join(', ') || `${o.itemsCount} items`}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    KES {(o.totalAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 uppercase">
                    {o.paymentMethod || 'mpesa'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${
                      o.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {o.status || 'pending'}
                    </span>
                  </td>
                  {canUpdateStatus && (
                    <td className="px-6 py-4 text-right">
                      <select
                        value={o.status || 'pending'}
                        onChange={(e) => handleStatusChange(o._id, e.target.value)}
                        className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 text-sm bg-white">
                    No transactions recorded for selected filter.
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
