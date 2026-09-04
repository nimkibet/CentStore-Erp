import React, { useState, useEffect, useRef } from 'react';
import {
  X, Package, DollarSign, Warehouse, Globe, Image as ImageIcon,
  ChevronRight, ChevronLeft, AlertCircle, CheckCircle2, Upload,
  Barcode, Hash, Calculator, TrendingUp, TrendingDown, Store, ShoppingBag,
  Tag, Layers
} from 'lucide-react';

const CARDS = [
  { id: 'identity', label: 'Core ID', icon: Package, shortLabel: '1. Identity' },
  { id: 'pricing', label: 'Pricing & Margin', icon: DollarSign, shortLabel: '2. Pricing' },
  { id: 'scm', label: 'Warehouse & SCM', icon: Warehouse, shortLabel: '3. SCM' },
  { id: 'channels', label: 'Channels', icon: Globe, shortLabel: '4. Channels' },
  { id: 'media', label: 'Media', icon: ImageIcon, shortLabel: '5. Media' },
];

const CATEGORIES = [
  'Laptops & Computers', 'Smartphones', 'Tablets', 'Accessories', 'Audio',
  'Cameras', 'Gaming', 'Networking', 'Printers', 'Smart Home', 'Televisions', 'Other'
];

const BRANDS = ['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'Asus', 'Microsoft', 'Other'];

const INPUT_CLS = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm';
const SELECT_CLS = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm appearance-none cursor-pointer';
const LABEL_CLS = 'block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider';

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{msg}</p>;
}

function Card({ title, icon: Icon, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
        <div className="p-1.5 bg-blue-50 rounded-lg"><Icon className="w-4 h-4 text-blue-600" /></div>
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function MarginBadge({ costPrice, sellingPrice }) {
  if (!costPrice || !sellingPrice || sellingPrice <= 0) return null;
  const margin = ((sellingPrice - costPrice) / sellingPrice * 100);
  const color = margin >= 25 ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
              : margin >= 10 ? 'bg-amber-100 text-amber-700 border-amber-200'
              : margin < 0 ? 'bg-red-100 text-red-700 border-red-200'
              : 'bg-slate-100 text-slate-600 border-slate-200';
  const Icon = margin >= 0 ? TrendingUp : TrendingDown;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      Margin: {margin.toFixed(1)}%
      {margin < 0 && <span className="font-normal ml-1">(Selling below cost!)</span>}
    </div>
  );
}

export default function AddProductModal({ isOpen, onClose, onProductAdded, token }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    title: '', sku: '', barcodeType: 'barcode', barcode: '', imei: '',
    brand: 'Apple', category: 'Laptops & Computers', description: '',
    costPrice: '', price: '', originalPrice: '',
    stock: '10', reorderPoint: '5', reorderQuantity: '20', preferredVendor: '', warehouse: '',
    channels: { website: true, pos: true, jumia: false, jiji: false },
    imageFile: null, previewUrl: '',
    storage: '',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const setChannel = (key, val) => setForm(prev => ({ ...prev, channels: { ...prev.channels, [key]: val } }));

  useEffect(() => {
    if (!isOpen) { setStep(0); setErrorMessage(''); setFieldErrors({}); return; }
    // Fetch vendors and warehouses
    const fetchData = async () => {
      try {
        const [vRes, wRes] = await Promise.all([
          fetch('/api/erp/scm/vendors', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/erp/scm/warehouses', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (vRes.ok) { const d = await vRes.json(); setVendors(d.data || d || []); }
        if (wRes.ok) { const d = await wRes.json(); setWarehouses(d.data || d || []); }
      } catch (_) {}
    };
    fetchData();
  }, [isOpen, token]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Product title is required';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) errs.price = 'Valid selling price is required';
    if (form.costPrice && Number(form.costPrice) > Number(form.price)) errs.priceWarn = 'Selling price is below cost price!';
    if (!form.stock || isNaN(Number(form.stock))) errs.stock = 'Valid initial stock quantity is required';
    setFieldErrors(errs);
    return !errs.title && !errs.price && !errs.stock;
  };

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    set('imageFile', file);
    set('previewUrl', URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageFile(file);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('price', form.price);
      formData.append('originalPrice', form.originalPrice || form.price);
      formData.append('costPrice', form.costPrice || 0);
      formData.append('brand', form.brand);
      formData.append('category', form.category);
      formData.append('storage', form.storage);
      formData.append('stock', form.stock);
      formData.append('description', form.description);
      formData.append('sku', form.sku);
      formData.append('barcode', form.barcodeType === 'barcode' ? form.barcode : form.imei);
      formData.append('reorderPoint', form.reorderPoint || 5);
      formData.append('reorderQuantity', form.reorderQuantity || 20);
      if (form.preferredVendor) formData.append('preferredVendor', form.preferredVendor);
      if (form.warehouse) formData.append('warehouse', form.warehouse);
      formData.append('channels', JSON.stringify(form.channels));
      if (form.imageFile) formData.append('image', form.imageFile);

      const res = await fetch('/api/erp/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');
      onProductAdded(data);
      onClose();
      // Reset form
      setForm({ title: '', sku: '', barcodeType: 'barcode', barcode: '', imei: '', brand: 'Apple', category: 'Laptops & Computers', description: '', costPrice: '', price: '', originalPrice: '', stock: '10', reorderPoint: '5', reorderQuantity: '20', preferredVendor: '', warehouse: '', channels: { website: true, pos: true, jumia: false, jiji: false }, imageFile: null, previewUrl: '', storage: '' });
      setStep(0);
    } catch (err) { setErrorMessage(err.message); } finally { setSubmitting(false); }
  };

  const costNum = parseFloat(form.costPrice) || 0;
  const priceNum = parseFloat(form.price) || 0;
  const origNum = parseFloat(form.originalPrice) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-6 px-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Add New Product</h2>
              <p className="text-[11px] text-slate-500">Complete all cards to save the product master record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigator */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {CARDS.map((c, i) => {
              const Icon = c.icon;
              const isDone = i < step;
              const isCurrent = i === step;
              return (
                <button key={c.id} onClick={() => setStep(i)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                    isCurrent ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : isDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {c.shortLabel}
                  {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Error */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Card content */}
        <div className="p-6 space-y-4">
          {/* CARD 1: Identity */}
          {step === 0 && (
            <Card title="Core Identity & Categorization" icon={Package}>
              <div>
                <label className={LABEL_CLS}>Product Title *</label>
                <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="e.g. MacBook Pro 16-inch M3 Max – Space Black"
                  className={INPUT_CLS} />
                <FieldError msg={fieldErrors.title} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>SKU / Product Code</label>
                  <input type="text" value={form.sku} onChange={e => set('sku', e.target.value)}
                    placeholder="e.g. CS-MBP16-M3-SB" className={INPUT_CLS} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Specification / Variant</label>
                  <input type="text" value={form.storage} onChange={e => set('storage', e.target.value)}
                    placeholder="e.g. 512GB SSD · 36GB RAM" className={INPUT_CLS} />
                </div>
              </div>
              <div>
                <label className={LABEL_CLS}>Barcode Type</label>
                <div className="flex gap-2 mb-2">
                  {['barcode', 'imei'].map(t => (
                    <button key={t} onClick={() => set('barcodeType', t)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                        form.barcodeType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}>
                      {t === 'barcode' ? <Barcode className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
                      {t === 'barcode' ? 'Barcode/EAN' : 'IMEI (Electronics)'}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={form.barcodeType === 'barcode' ? form.barcode : form.imei}
                  onChange={e => set(form.barcodeType === 'barcode' ? 'barcode' : 'imei', e.target.value)}
                  placeholder={form.barcodeType === 'barcode' ? 'e.g. 4006381333931' : 'e.g. 356789012345678'}
                  className={INPUT_CLS}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Brand</label>
                  <select value={form.brand} onChange={e => set('brand', e.target.value)} className={SELECT_CLS}>
                    {BRANDS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Category</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)} className={SELECT_CLS}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL_CLS}>Description</label>
                <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Product overview, key features, warranty details..."
                  className={INPUT_CLS} />
              </div>
            </Card>
          )}

          {/* CARD 2: Pricing */}
          {step === 1 && (
            <Card title="Pricing & Live Margin Engine" icon={DollarSign}>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={LABEL_CLS}>Cost / Buying Price (KES)</label>
                  <input type="number" value={form.costPrice} onChange={e => set('costPrice', e.target.value)}
                    placeholder="0" className={INPUT_CLS} min="0" />
                </div>
                <div>
                  <label className={LABEL_CLS}>Selling Price (KES) *</label>
                  <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                    placeholder="0" className={INPUT_CLS} min="0" />
                  <FieldError msg={fieldErrors.price} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Original / MRP (KES)</label>
                  <input type="number" value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)}
                    placeholder="0" className={INPUT_CLS} min="0" />
                  <p className="text-[11px] text-slate-400 mt-1">Used for strikethrough price display</p>
                </div>
              </div>

              {/* Live Margin Engine */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Margin Calculator</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="bg-white rounded-lg p-3 border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Cost Price</p>
                    <p className="font-bold text-slate-900 text-sm">KES {costNum.toLocaleString() || '—'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Selling Price</p>
                    <p className="font-bold text-slate-900 text-sm">KES {priceNum.toLocaleString() || '—'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Gross Profit</p>
                    <p className={`font-bold text-sm ${priceNum - costNum >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      KES {(priceNum - costNum).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Margin %</p>
                    <p className={`font-bold text-sm ${
                      !priceNum ? 'text-slate-400' :
                      ((priceNum - costNum) / priceNum * 100) >= 25 ? 'text-emerald-700' :
                      ((priceNum - costNum) / priceNum * 100) >= 10 ? 'text-amber-700' : 'text-red-600'
                    }`}>
                      {priceNum > 0 ? `${((priceNum - costNum) / priceNum * 100).toFixed(1)}%` : '—'}
                    </p>
                  </div>
                </div>
                {priceNum > 0 && costNum > 0 && (
                  <div className="mt-3 flex justify-center">
                    <MarginBadge costPrice={costNum} sellingPrice={priceNum} />
                  </div>
                )}
                {fieldErrors.priceWarn && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {fieldErrors.priceWarn}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* CARD 3: SCM */}
          {step === 2 && (
            <Card title="Multi-Warehouse & Supply Chain" icon={Warehouse}>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={LABEL_CLS}>Initial Stock Qty *</label>
                  <input type="number" value={form.stock} onChange={e => set('stock', e.target.value)}
                    placeholder="10" className={INPUT_CLS} min="0" />
                  <FieldError msg={fieldErrors.stock} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Reorder Point</label>
                  <input type="number" value={form.reorderPoint} onChange={e => set('reorderPoint', e.target.value)}
                    placeholder="5" className={INPUT_CLS} min="0" />
                  <p className="text-[11px] text-slate-400 mt-1">Alert threshold for low stock</p>
                </div>
                <div>
                  <label className={LABEL_CLS}>Reorder Quantity</label>
                  <input type="number" value={form.reorderQuantity} onChange={e => set('reorderQuantity', e.target.value)}
                    placeholder="20" className={INPUT_CLS} min="0" />
                  <p className="text-[11px] text-slate-400 mt-1">Default PO quantity to order</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Preferred Vendor / Supplier</label>
                  <select value={form.preferredVendor} onChange={e => set('preferredVendor', e.target.value)} className={SELECT_CLS}>
                    <option value="">— Select Vendor —</option>
                    {vendors.map(v => <option key={v._id || v.id} value={v._id || v.id}>{v.name}</option>)}
                  </select>
                  {vendors.length === 0 && <p className="text-[11px] text-slate-400 mt-1">No vendors yet. Add vendors in the Vendor Directory tab.</p>}
                </div>
                <div>
                  <label className={LABEL_CLS}>Primary Warehouse</label>
                  <select value={form.warehouse} onChange={e => set('warehouse', e.target.value)} className={SELECT_CLS}>
                    <option value="">— Select Warehouse —</option>
                    {warehouses.map(w => <option key={w._id || w.id} value={w._id || w.id}>{w.name}</option>)}
                  </select>
                  {warehouses.length === 0 && <p className="text-[11px] text-slate-400 mt-1">No warehouses yet. Create one in Multi-Warehouse tab.</p>}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                <span className="font-semibold">SCM Tip:</span> Set a reorder point below your safety stock level. When stock drops to or below this threshold, a critical alert will appear on the Executive Dashboard.
              </div>
            </Card>
          )}

          {/* CARD 4: Channels */}
          {step === 3 && (
            <Card title="Omnichannel & Marketplace Listings" icon={Globe}>
              <p className="text-xs text-slate-500">Select which sales channels this product will be listed and sold on.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'website', label: 'Website Storefront', desc: 'Listed on the public e-commerce site', icon: Globe, color: 'blue' },
                  { key: 'pos', label: 'In-Store POS Counter', desc: 'Visible in the cashier Point-of-Sale screen', icon: Store, color: 'violet' },
                  { key: 'jumia', label: 'Jumia Kenya', desc: 'Sync listing to Jumia marketplace', icon: ShoppingBag, color: 'orange' },
                  { key: 'jiji', label: 'Jiji.co.ke', desc: 'Sync listing to Jiji classifieds', icon: Tag, color: 'teal' },
                ].map(ch => {
                  const Icon = ch.icon;
                  const isOn = form.channels[ch.key];
                  const colors = {
                    blue: { on: 'border-blue-400 bg-blue-50', badge: 'bg-blue-600 text-white', icon: 'text-blue-600' },
                    violet: { on: 'border-violet-400 bg-violet-50', badge: 'bg-violet-600 text-white', icon: 'text-violet-600' },
                    orange: { on: 'border-orange-400 bg-orange-50', badge: 'bg-orange-500 text-white', icon: 'text-orange-600' },
                    teal: { on: 'border-teal-400 bg-teal-50', badge: 'bg-teal-600 text-white', icon: 'text-teal-600' },
                  }[ch.color];
                  return (
                    <button key={ch.key} type="button" onClick={() => setChannel(ch.key, !isOn)}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 transition text-left ${
                        isOn ? colors.on : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                      <div className={`p-2 rounded-lg ${isOn ? colors.badge : 'bg-slate-100 text-slate-500'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isOn ? 'text-slate-900' : 'text-slate-700'}`}>{ch.label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isOn ? `${colors.badge}` : 'bg-slate-100 text-slate-400'}`}>
                            {isOn ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{ch.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* CARD 5: Media */}
          {step === 4 && (
            <Card title="Product Media" icon={ImageIcon}>
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  dragOver ? 'border-blue-400 bg-blue-50' : form.previewUrl ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                {form.previewUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={form.previewUrl} alt="Preview" className="w-40 h-40 object-contain rounded-xl border border-slate-200 shadow-sm" />
                    <p className="text-xs text-emerald-700 font-semibold">✓ Image ready · Click to replace</p>
                    <p className="text-[11px] text-slate-400">{form.imageFile?.name}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-slate-200">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Drag & drop product image here</p>
                      <p className="text-xs text-slate-400 mt-1">or click to browse · PNG, JPG, WebP · Max 10MB</p>
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleImageFile(e.target.files[0])} />
              </div>
              {form.previewUrl && (
                <button onClick={() => { set('imageFile', null); set('previewUrl', ''); }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                  <X className="w-3 h-3" /> Remove image
                </button>
              )}
            </Card>
          )}
        </div>

        {/* Footer navigation */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 rounded-b-2xl flex items-center justify-between">
          <button
            type="button"
            onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-1">
            {CARDS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition ${
                  i === step ? 'bg-blue-600 w-6' : i < step ? 'bg-emerald-400' : 'bg-slate-200'
                }`} />
            ))}
          </div>

          {step < CARDS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save Product'}
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
