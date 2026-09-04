import React, { useState, useEffect } from 'react';
import { X, FileText, Plus, Trash2, AlertCircle } from 'lucide-react';

export default function CreatePOModal({ isOpen, onClose, onPOCreated, token, initialVendorId }) {
  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(true);
  const [error, setError] = useState('');

  const [selectedVendor, setSelectedVendor] = useState(initialVendorId || '');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [status, setStatus] = useState('draft');
  const [notes, setNotes] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [items, setItems] = useState([
    { product: '', quantity: 10, unitCost: 0 }
  ]);

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialVendorId) {
      setSelectedVendor(initialVendorId);
    }
  }, [initialVendorId]);

  const fetchOptions = async () => {
    setFetchingOptions(true);
    try {
      const [vRes, wRes, pRes] = await Promise.all([
        fetch('/api/erp/scm/vendors', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/erp/scm/warehouses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/erp/products', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (vRes.ok) {
        const vData = await vRes.json();
        setVendors(vData);
        if (!selectedVendor && vData.length > 0) setSelectedVendor(vData[0]._id);
      }
      if (wRes.ok) {
        const wData = await wRes.json();
        setWarehouses(wData);
        const defWh = wData.find(w => w.isDefault) || wData[0];
        if (defWh) setSelectedWarehouse(defWh._id);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(pData);
        if (items.length === 1 && !items[0].product && pData.length > 0) {
          setItems([{
            product: pData[0]._id || pData[0].id,
            quantity: 10,
            unitCost: Math.round((pData[0].price || 100) * 0.6)
          }]);
        }
      }
    } catch (err) {
      console.error('Failed to load PO creation options:', err);
    } finally {
      setFetchingOptions(false);
    }
  };

  if (!isOpen) return null;

  const handleProductChange = (index, productId) => {
    const prod = products.find(p => String(p._id || p.id) === String(productId));
    const newItems = [...items];
    newItems[index].product = productId;
    if (prod) {
      newItems[index].unitCost = Math.round((prod.price || 100) * 0.6);
    }
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItemRow = () => {
    const defaultProduct = products[0];
    setItems([
      ...items,
      {
        product: defaultProduct ? (defaultProduct._id || defaultProduct.id) : '',
        quantity: 10,
        unitCost: defaultProduct ? Math.round((defaultProduct.price || 100) * 0.6) : 100
      }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const q = Number(item.quantity) || 0;
      const c = Number(item.unitCost) || 0;
      return sum + (q * c);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedVendor) return setError('Please select a supplier vendor.');
    if (!selectedWarehouse) return setError('Please select a destination warehouse.');
    if (items.some(i => !i.product)) return setError('Please select a product for all line items.');

    setLoading(true);
    try {
      const response = await fetch('/api/erp/scm/purchase-orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendor: selectedVendor,
          warehouse: selectedWarehouse,
          status,
          notes,
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : undefined,
          items: items.map(i => ({
            product: i.product,
            quantity: Number(i.quantity) || 1,
            unitCost: Number(i.unitCost) || 0
          }))
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Purchase Order');
      }

      if (onPOCreated) onPOCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Create Purchase Order (PO)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Supplier Vendor *</label>
              <select
                required
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">Select Vendor...</option>
                {vendors.map(v => (
                  <option key={v._id} value={v._id}>
                    {v.name} ({v.vendorCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Destination Warehouse *</label>
              <select
                required
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">Select Warehouse...</option>
                {warehouses.map(w => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.code}){w.isDefault ? ' [Primary]' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="draft">Draft PO</option>
                <option value="ordered">Ordered (Submitted to Supplier)</option>
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase">Purchase Line Items</label>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center space-x-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50 p-2 space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-white p-2 rounded border border-slate-200 shadow-sm">
                  <div className="flex-1">
                    <select
                      value={item.product}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">Select Product...</option>
                      {products.map(p => (
                        <option key={p._id || p.id} value={p._id || p.id}>
                          {p.title || p.name} (Stock: {p.stock ?? 10})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      min="0"
                      placeholder="Unit Cost"
                      value={item.unitCost}
                      onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900"
                    />
                  </div>

                  <div className="w-28 text-right font-medium text-xs text-slate-800 pr-1">
                    KES {((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)).toLocaleString()}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="text-slate-400 hover:text-red-600 transition p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-3 p-3 bg-slate-100 rounded-md border border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase">Estimated Total Order Amount:</span>
              <span className="text-base font-extrabold text-slate-900">KES {calculateTotal().toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Order Notes / Instructions</label>
            <textarea
              rows={2}
              placeholder="e.g. Special shipment instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || fetchingOptions}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
