import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Search, Trash2, Image as ImageIcon, AlertCircle, CheckCircle2,
  Edit2, Package, Filter, RefreshCw, ChevronDown, ChevronLeft, ChevronRight,
  X, Download, FileText, TrendingDown, Boxes, Globe, ShoppingCart
} from 'lucide-react';

const STOCK_STATUSES = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];
const PAGE_SIZES = [25, 50, 100];

function StockBadge({ stock, reorderPoint }) {
  if (stock <= 0) return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700 border border-red-200">Out of Stock</span>;
  if (stock <= reorderPoint) return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">{stock} · Low</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">{stock} units</span>;
}

function ChannelBadge({ label, color }) {
  const colors = {
    web: 'bg-blue-50 text-blue-700 border-blue-200',
    pos: 'bg-violet-50 text-violet-700 border-violet-200',
    jumia: 'bg-orange-50 text-orange-700 border-orange-200',
    jiji: 'bg-teal-50 text-teal-700 border-teal-200',
  };
  return <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${colors[color] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>{label}</span>;
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Confirm Deletion</h3>
            <p className="text-slate-500 text-sm mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition">Delete</button>
        </div>
      </div>
    </div>
  );
}

function StockAdjustModal({ product, token, onDone, onClose }) {
  const [delta, setDelta] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!delta || isNaN(Number(delta))) { setErr('Enter a valid quantity (positive to add, negative to remove).'); return; }
    setLoading(true); setErr('');
    try {
      const res = await fetch(`/api/erp/products/${product._id || product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stock: Math.max(0, (product.stock || 0) + Number(delta)), note })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      onDone();
      onClose();
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Quick Stock Adjust</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">Product: <span className="font-semibold text-slate-800">{product.title}</span> · Current stock: <span className="font-bold">{product.stock || 0}</span></p>
        {err && <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded border border-red-200">{err}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Stock Adjustment (+/-)</label>
            <input type="number" value={delta} onChange={e => setDelta(e.target.value)} placeholder="e.g. +10 or -5" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Note (optional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for adjustment" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Apply Adjustment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CatalogView({ token, userRole, products: propProducts, loading: propLoading, fetchProducts, onOpenAddProductModal, onOpenEditModal }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [stockAdjust, setStockAdjust] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const debounceRef = useRef(null);

  const canEdit = ['CEO', 'WebAdmin', 'Admin', 'Manager'].includes(userRole);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const products = propProducts || [];

  // Unique categories
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'General').filter(Boolean))).sort()];

  // Filter chain
  const filtered = products.filter(p => {
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q ||
      (p.title || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.barcode || p.imei || '').toLowerCase().includes(q);
    const matchCategory = categoryFilter === 'All' || (p.category || 'General') === categoryFilter;
    const stock = p.stock !== undefined ? p.stock : 10;
    const rp = p.reorderPoint || 5;
    const matchStock =
      stockFilter === 'All' ? true :
      stockFilter === 'Out of Stock' ? stock <= 0 :
      stockFilter === 'Low Stock' ? (stock > 0 && stock <= rp) :
      stock > rp;
    return matchSearch && matchCategory && matchStock;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const allPageSelected = paginated.length > 0 && paginated.every(p => selectedRows.has(p._id || p.id));

  const toggleRow = (id) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allPageSelected) {
      setSelectedRows(prev => { const n = new Set(prev); paginated.forEach(p => n.delete(p._id || p.id)); return n; });
    } else {
      setSelectedRows(prev => { const n = new Set(prev); paginated.forEach(p => n.add(p._id || p.id)); return n; });
    }
  };

  const clearSelection = () => setSelectedRows(new Set());

  const handleDeleteConfirm = async () => {
    const { id, title } = confirmDelete;
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/erp/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Delete failed'); }
      setToast({ type: 'success', msg: `"${title}" removed from catalog.` });
      if (fetchProducts) fetchProducts();
    } catch (e) { setToast({ type: 'error', msg: e.message }); }
  };

  const exportCSV = () => {
    const rows = selectedRows.size > 0 ? filtered.filter(p => selectedRows.has(p._id || p.id)) : filtered;
    const header = ['Title', 'SKU', 'Brand', 'Category', 'Cost Price', 'Selling Price', 'Margin %', 'Stock', 'Reorder Point', 'Status'];
    const body = rows.map(p => {
      const margin = p.costPrice ? (((p.price - p.costPrice) / p.price) * 100).toFixed(1) : 'N/A';
      return [p.title, p.sku || '', p.brand || '', p.category || '', p.costPrice || '', p.price || '', margin, p.stock || 0, p.reorderPoint || 5, p.status || 'active'].join(',');
    });
    const blob = new Blob([[header.join(','), ...body].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'inventory_export.csv'; a.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', msg: `Exported ${rows.length} products to CSV.` });
  };

  return (
    <div className="space-y-3 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border transition-all ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message={`Delete "${confirmDelete.title}" from the catalog? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {stockAdjust && (
        <StockAdjustModal
          product={stockAdjust}
          token={token}
          onDone={() => { if (fetchProducts) fetchProducts(); }}
          onClose={() => setStockAdjust(null)}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, SKU, brand, barcode..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition ${filterOpen || categoryFilter !== 'All' || stockFilter !== 'All' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {(categoryFilter !== 'All' || stockFilter !== 'All') && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              )}
            </button>
            {filterOpen && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-4 min-w-[240px] space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Category</label>
                  <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Stock Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STOCK_STATUSES.map(s => (
                      <button key={s} onClick={() => { setStockFilter(s); setPage(1); }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                          stockFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>
                <button onClick={() => { setCategoryFilter('All'); setStockFilter('All'); setPage(1); setFilterOpen(false); }}
                  className="w-full text-xs text-slate-500 hover:text-red-600 text-center pt-1 font-medium">Clear Filters</button>
              </div>
            )}
          </div>

          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          <button onClick={() => { if (fetchProducts) fetchProducts(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {canEdit && (
            <button onClick={onOpenAddProductModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 transition">
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span><span className="font-semibold text-slate-700">{filtered.length}</span> products found</span>
        {selectedRows.size > 0 && <span className="text-blue-600 font-semibold">{selectedRows.size} selected</span>}
        {categoryFilter !== 'All' && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full">{categoryFilter} <button onClick={() => setCategoryFilter('All')} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button></span>}
        {stockFilter !== 'All' && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full">{stockFilter} <button onClick={() => setStockFilter('All')} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button></span>}
      </div>

      {/* Dense Table with Sticky Columns */}
      <div className="relative border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: '540px', overflowY: 'auto' }}>
          <table className="w-full text-sm border-collapse" style={{ minWidth: '1100px' }}>
            <thead className="bg-slate-50 border-b border-slate-200" style={{ position: 'sticky', top: 0, zIndex: 20 }}>
              <tr>
                {/* Sticky left: checkbox */}
                <th className="bg-slate-50 border-r border-slate-100 px-3 py-3 text-left" style={{ position: 'sticky', left: 0, zIndex: 21, minWidth: '36px' }}>
                  <input type="checkbox" checked={allPageSelected} onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                </th>
                {/* Sticky left: product */}
                <th className="bg-slate-50 border-r border-slate-200 px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider" style={{ position: 'sticky', left: '36px', zIndex: 21, minWidth: '260px' }}>Product</th>
                {/* Scrollable columns */}
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Category</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Cost (KES)</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Price (KES)</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Margin</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Stock</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Reorder</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Channels</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                {/* Sticky right: actions */}
                {canEdit && <th className="bg-slate-50 border-l border-slate-200 px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider" style={{ position: 'sticky', right: 0, zIndex: 21, minWidth: '130px' }}>Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {propLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: canEdit ? 11 : 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-slate-100 rounded w-full"></div></td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 11 : 10} className="text-center py-16 text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No products match your filters.</p>
                    <button onClick={() => { setSearchQuery(''); setCategoryFilter('All'); setStockFilter('All'); }} className="mt-2 text-xs text-blue-600 hover:underline">Clear all filters</button>
                  </td>
                </tr>
              ) : paginated.map((p) => {
                const id = p._id || p.id;
                const stock = p.stock !== undefined ? p.stock : 10;
                const rp = p.reorderPoint || 5;
                const margin = p.costPrice && p.price ? (((p.price - p.costPrice) / p.price) * 100).toFixed(1) : null;
                const marginColor = margin === null ? 'text-slate-400' : Number(margin) >= 25 ? 'text-emerald-700' : Number(margin) >= 10 ? 'text-amber-700' : 'text-red-600';
                const isSelected = selectedRows.has(id);

                return (
                  <tr key={id} className={`hover:bg-blue-50/30 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>
                    {/* Sticky: checkbox */}
                    <td className="border-r border-slate-100 px-3 py-2.5 bg-white" style={{ position: 'sticky', left: 0, zIndex: 10 }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleRow(id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    </td>
                    {/* Sticky: product identity */}
                    <td className="border-r border-slate-200 px-4 py-2.5 bg-white" style={{ position: 'sticky', left: '36px', zIndex: 10, minWidth: '260px' }}>
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.title} className="w-9 h-9 rounded-lg object-cover border border-slate-100 bg-slate-50 flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-xs leading-tight truncate max-w-[180px]">{p.title || p.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">{p.brand || 'Generic'}{p.sku ? ` · ${p.sku}` : ''}{p.storage ? ` · ${p.storage}` : ''}</div>
                        </div>
                      </div>
                    </td>
                    {/* Scrollable columns */}
                    <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{p.category || 'General'}</td>
                    <td className="px-4 py-2.5 text-xs text-right font-medium text-slate-600 whitespace-nowrap">
                      {p.costPrice ? `KES ${(p.costPrice).toLocaleString()}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-right font-bold text-slate-900 whitespace-nowrap">KES {(p.price || 0).toLocaleString()}</td>
                    <td className={`px-4 py-2.5 text-xs text-right font-bold whitespace-nowrap ${marginColor}`}>
                      {margin !== null ? `${margin}%` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      <StockBadge stock={stock} reorderPoint={rp} />
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs text-slate-500 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{rp}</span> / {p.reorderQuantity || 20}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(p.channels?.website !== false) && <ChannelBadge label="Web" color="web" />}
                        {(p.channels?.pos !== false) && <ChannelBadge label="POS" color="pos" />}
                        {p.channels?.jumia && <ChannelBadge label="Jumia" color="jumia" />}
                        {p.channels?.jiji && <ChannelBadge label="Jiji" color="jiji" />}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${
                        (p.status || 'active') === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>{p.status || 'active'}</span>
                    </td>
                    {/* Sticky right: actions */}
                    {canEdit && (
                      <td className="border-l border-slate-200 px-3 py-2.5 bg-white" style={{ position: 'sticky', right: 0, zIndex: 10 }}>
                        <div className="flex items-center justify-center gap-1">
                          {onOpenEditModal && (
                            <button onClick={() => onOpenEditModal(p)} title="Edit product"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => setStockAdjust(p)} title="Quick stock adjust"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition">
                            <Package className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete({ id, title: p.title })} title="Delete product"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Rows per page:</span>
          {PAGE_SIZES.map(s => (
            <button key={s} onClick={() => { setPageSize(s); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                pageSize === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500 mr-2">Page {page} of {totalPages} · {filtered.length} items</span>
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40 transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pg = page <= 3 ? i + 1 : page + i - 2;
            if (pg < 1 || pg > totalPages) return null;
            return (
              <button key={pg} onClick={() => setPage(pg)}
                className={`w-8 h-8 rounded-lg text-xs font-medium border transition ${
                  pg === page ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}>{pg}</button>
            );
          })}
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40 transition">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Batch Action Toolbar */}
      {selectedRows.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-slate-900 rounded-2xl shadow-2xl text-white text-sm">
          <span className="font-semibold">{selectedRows.size} selected</span>
          <div className="w-px h-5 bg-slate-600"></div>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-xs font-medium">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={clearSelection} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-xs font-medium">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      )}
    </div>
  );
}
