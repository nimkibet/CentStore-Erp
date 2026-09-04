import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, CheckCircle2, AlertCircle, Clock, Truck, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import CreatePOModal from './CreatePOModal';

export default function POView({ token, userRole, initialVendorId, onStockUpdated }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [expandedPoId, setExpandedPoId] = useState(null);

  const canEditSCM = ['CEO', 'WebAdmin', 'Admin', 'Manager'].includes(userRole);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [statusFilter]);

  const fetchPurchaseOrders = async () => {
    try {
      let url = '/api/erp/scm/purchase-orders';
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch purchase orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (poId, newStatus) => {
    setActionMessage('');
    setActionError('');
    try {
      const response = await fetch(`/api/erp/scm/purchase-orders/${poId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update PO status');
      }

      setActionMessage(data.message || `Purchase Order status updated to ${newStatus}.`);
      fetchPurchaseOrders();
      if (newStatus === 'received' && onStockUpdated) {
        onStockUpdated();
      }
    } catch (err) {
      setActionError(err.message);
    }
  };

  const filteredPOs = purchaseOrders.filter(po =>
    (po.poNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (po.vendor?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (po.warehouse?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">Draft</span>;
      case 'ordered':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">Ordered</span>;
      case 'received':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Received</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Tabs & Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          {['all', 'draft', 'ordered', 'received', 'cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-md capitalize transition ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {canEditSCM && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-md bg-blue-600 text-white font-medium text-sm shadow-sm hover:bg-blue-700 transition flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        )}
      </div>

      {actionMessage && (
        <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search POs by PO number, vendor, or warehouse..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
        />
      </div>

      {/* PO Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden flex flex-col h-[500px]">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left text-sm text-slate-600 relative">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">PO Number & Date</th>
                <th className="px-6 py-4">Vendor Supplier</th>
                <th className="px-6 py-4">Warehouse</th>
                <th className="px-6 py-4">Total Items</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                {canEditSCM && <th className="px-6 py-4 text-right">Lifecycle Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPOs.map((po, idx) => {
                const isExpanded = expandedPoId === po._id;
                const itemCount = (po.items || []).reduce((sum, item) => sum + (item.quantityOrdered || 0), 0);

                return (
                  <React.Fragment key={po._id}>
                    <tr className={`hover:bg-slate-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setExpandedPoId(isExpanded ? null : po._id)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <div>
                            <div className="font-bold text-slate-900 font-mono">{po.poNumber}</div>
                            <div className="text-xs text-slate-500">
                              {new Date(po.createdAt).toLocaleDateString()}
                              {po.isAutoGenerated && (
                                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold">AUTO</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{po.vendor?.name || 'Supplier'}</div>
                        <div className="text-xs text-slate-500 font-mono">{po.vendor?.vendorCode}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{po.warehouse?.name || 'Central Hub'}</div>
                        <div className="text-xs text-slate-500 font-mono">{po.warehouse?.code}</div>
                      </td>

                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {(po.items || []).length} line(s) ({itemCount} units)
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-900">
                        KES {(po.totalAmount || 0).toLocaleString()}
                      </td>

                      <td className="px-6 py-4">
                        {getStatusBadge(po.status)}
                      </td>

                      {canEditSCM && (
                        <td className="px-6 py-4 text-right space-x-2">
                          {po.status === 'draft' && (
                            <button
                              onClick={() => handleUpdateStatus(po._id, 'ordered')}
                              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition inline-flex items-center space-x-1 shadow-sm"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Mark Ordered</span>
                            </button>
                          )}

                          {po.status === 'ordered' && (
                            <button
                              onClick={() => handleUpdateStatus(po._id, 'received')}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition inline-flex items-center space-x-1 shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Receive Shipment</span>
                            </button>
                          )}

                          {(po.status === 'draft' || po.status === 'ordered') && (
                            <button
                              onClick={() => handleUpdateStatus(po._id, 'cancelled')}
                              className="px-2 py-1 rounded border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium transition inline-flex items-center space-x-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>

                    {/* Expanded Line Items Detail */}
                    {isExpanded && (
                      <tr className="bg-slate-100/70 border-t border-b border-slate-200">
                        <td colSpan={7} className="px-8 py-3">
                          <div className="text-xs font-bold text-slate-700 uppercase mb-2">Order Line Details:</div>
                          <div className="bg-white rounded border border-slate-200 p-3 space-y-1.5">
                            {(po.items || []).map((item, i) => (
                              <div key={i} className="flex justify-between items-center text-xs text-slate-800">
                                <div>
                                  <span className="font-semibold text-slate-900">{item.productTitle || item.product?.title || 'Item'}</span>
                                  <span className="text-slate-500 ml-2">x {item.quantityOrdered} units</span>
                                </div>
                                <div className="font-mono">
                                  KES {(item.unitCost || 0).toLocaleString()} / unit = <span className="font-bold text-slate-900">KES {(item.subtotal || 0).toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                            {po.notes && (
                              <div className="pt-2 text-xs text-slate-600 border-t border-slate-100 italic">
                                Notes: {po.notes}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredPOs.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-sm bg-white">
                    No purchase orders found for this status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreatePOModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPOCreated={fetchPurchaseOrders}
        token={token}
        initialVendorId={initialVendorId}
      />
    </div>
  );
}
