import React, { useEffect, useState, useCallback } from "react";
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone,
  CheckCircle, Search, AlertCircle, Printer, Download, X, RefreshCw, Package,
  Maximize, Minimize
} from "lucide-react";

/* ── Thermal-receipt print styles injected once ── */
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #pos-receipt, #pos-receipt * { visibility: visible !important; }
  #pos-receipt {
    position: fixed !important;
    top: 0; left: 0;
    width: 80mm !important;
    font-family: "Courier New", monospace;
    font-size: 11px;
    color: #000;
    background: #fff;
    padding: 8px;
  }
  .no-print { display: none !important; }
}
`;

function injectPrintCSS() {
  if (document.getElementById("pos-thermal-css")) return;
  const style = document.createElement("style");
  style.id = "pos-thermal-css";
  style.textContent = PRINT_CSS;
  document.head.appendChild(style);
}

function ReceiptPrintView({ receipt }) {
  const date = new Date(receipt.createdAt || Date.now()).toLocaleString("en-KE", {
    dateStyle: "short", timeStyle: "short"
  });
  return (
    <div id="pos-receipt" className="hidden" aria-hidden="true">
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: "bold", fontSize: 14 }}>CENT STORE</div>
        <div>Nairobi, Kenya</div>
        <div>Tel: +254 700 000 000</div>
        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
        <div>RECEIPT: {receipt.id}</div>
        <div>{date}</div>
        <div>Cashier: {receipt.cashier}</div>
        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
      </div>
      {(receipt.items || []).map((item, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ maxWidth: "55%", wordBreak: "break-word" }}>{item.title} x{item.quantity}</span>
          <span>KES {((item.price || 0) * item.quantity).toLocaleString()}</span>
        </div>
      ))}
      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 13 }}>
        <span>TOTAL</span>
        <span>KES {(receipt.totalAmount || 0).toLocaleString()}</span>
      </div>
      <div style={{ marginTop: 4 }}>Payment: {(receipt.paymentMethod || "cash").toUpperCase()}</div>
      <div style={{ textAlign: "center", marginTop: 10, borderTop: "1px dashed #000", paddingTop: 6, fontSize: 10 }}>
        Thank you for shopping at Cent Store!<br />Exchange within 7 days with receipt.
      </div>
    </div>
  );
}

function InlineToast({ msg, type, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  const cls = type === "error"
    ? "bg-red-50 border-red-200 text-red-700"
    : "bg-emerald-50 border-emerald-200 text-emerald-700";
  const Icon = type === "error" ? AlertCircle : CheckCircle;
  return (
    <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm mb-3 ${cls}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{msg}</span>
      <button onClick={onClose}><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

export default function POSView({ token, staffUser }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [completedReceipt, setCompletedReceipt] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(typeof document !== 'undefined' && document.fullscreenElement));

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error("Error attempting to enable full-screen mode:", err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error("Error attempting to exit full-screen mode:", err);
        });
      }
    }
  }, []);

  useEffect(() => { injectPrintCSS(); }, []);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const response = await fetch("/api/erp/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || data);
      }
    } catch (err) {
      console.error("POS failed to load inventory:", err);
    } finally {
      setProductsLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const showToast = (msg, type = "success") => setToast({ msg, type });
  const clearToast = () => setToast(null);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      showToast(`"${product.title}" is out of stock.`, "error");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id || item.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Stock limit reached (${product.stock} units).`, "error");
          return prev;
        }
        return prev.map(item =>
          (item.productId === product.id || item.productId === product._id)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product.id || product._id,
        title: product.title,
        price: product.price,
        quantity: 1,
        maxStock: product.stock
      }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.maxStock) {
            showToast(`Stock limit reached (${item.maxStock} units).`, "error");
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) { showToast("Cart is empty. Select products first.", "error"); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/erp/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: cart, paymentMethod, customerName, customerPhone })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to complete POS transaction");
      setCompletedReceipt(data.order);
      setCart([]);
      fetchProducts();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleDownloadReceipt = async () => {
    if (!completedReceipt?.receiptId) {
      showToast("No receipt ID available for download.", "error");
      return;
    }
    try {
      const res = await fetch(`/api/erp/pos/receipt/${completedReceipt.receiptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Receipt PDF not available");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${completedReceipt.id || "pos"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast("PDF download unavailable. Use Print instead.", "error");
    }
  };

  const filtered = products.filter(p =>
    (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.brand || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Hidden thermal receipt element for printing */}
      {completedReceipt && <ReceiptPrintView receipt={completedReceipt} />}

      <div className="mb-4 flex-shrink-0 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Point-of-Sale (POS)</h1>
          <p className="text-sm text-slate-500">Process counter sales and print receipts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </>
            )}
          </button>
          <button onClick={fetchProducts} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      <InlineToast msg={toast?.msg} type={toast?.type} onClose={clearToast} />

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Product Grid */}
        <div className="lg:w-2/3 flex flex-col space-y-4 h-full">
          <div className="relative flex-shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name, category, brand..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 animate-pulse">
                    <div className="aspect-square bg-slate-100 rounded-t-xl" />
                    <div className="p-2.5 space-y-2">
                      <div className="h-3 bg-slate-100 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
                {filtered.map(p => {
                  const imgSrc = p.imageUrl || (p.images && p.images[0]) || null;
                  return (
                    <button
                      key={p._id || p.id}
                      onClick={() => addToCart(p)}
                      disabled={p.stock <= 0}
                      className="text-left bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md rounded-xl transition-all flex flex-col overflow-hidden shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="relative w-full aspect-square bg-slate-100 overflow-hidden">
                        {imgSrc ? (
                          <img src={imgSrc} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={e => { e.target.style.display = "none"; e.target.nextSibling && (e.target.nextSibling.style.display = "flex"); }} />
                        ) : null}
                        <div className={`absolute inset-0 bg-gradient-to-br from-blue-100 to-slate-200 flex items-center justify-center text-3xl font-bold text-slate-300 ${imgSrc ? "hidden" : "flex"}`}>
                          {(p.title || "P")[0]}
                        </div>
                        {p.stock <= 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-xs font-bold bg-red-600 px-2 py-1 rounded">OUT OF STOCK</span>
                          </div>
                        )}
                        {p.stock > 0 && p.stock <= 3 && (
                          <div className="absolute top-1 right-1">
                            <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded">Low: {p.stock}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight">{p.title}</h4>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-blue-700">KES {(p.price || 0).toLocaleString()}</span>
                          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                            <Plus className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && !productsLoading && (
                  <div className="col-span-4 flex flex-col items-center justify-center py-16 text-slate-400">
                    <Package className="w-10 h-10 opacity-20 mb-2" />
                    <p className="text-sm">No products match your search.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="lg:w-1/3 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col flex-shrink-0 h-[600px] lg:h-full lg:sticky lg:top-0">
          <div className="p-4 border-b border-slate-200 flex-shrink-0">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <span>Current Transaction</span>
              {cart.length > 0 && (
                <span className="ml-auto text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
              )}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50">
            {cart.map(item => (
              <div key={item.productId} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-sm text-sm">
                <div className="flex-1 mr-2 truncate">
                  <div className="font-semibold text-slate-900 truncate text-xs">{item.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">KES {(item.price * item.quantity).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-slate-900 w-5 text-center text-xs">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeFromCart(item.productId)} className="p-1 text-slate-300 hover:text-red-500 ml-1 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-2 py-8">
                <ShoppingCart className="w-8 h-8 opacity-20" />
                <span className="text-sm">Cart is empty</span>
                <span className="text-xs text-slate-300">Click a product to add it</span>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-white flex-shrink-0 space-y-3 rounded-b-xl">
            <input
              type="text"
              placeholder="Customer Name (Default: Walk-in)"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
            />
            <input
              type="tel"
              placeholder="Customer Phone (optional)"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
            />

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cash", label: "Cash", icon: Banknote },
                  { id: "pos_card", label: "Card", icon: CreditCard },
                  { id: "mpesa", label: "M-Pesa", icon: Smartphone }
                ].map(m => {
                  const Icon = m.icon;
                  return (
                    <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition ${paymentMethod === m.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                      <Icon className="w-4 h-4 mb-0.5" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <span className="font-semibold text-slate-600 text-sm">Total:</span>
              <span className="font-bold text-slate-900 text-xl">KES {totalAmount.toLocaleString()}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</span>
              ) : "Complete Checkout"}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Transaction Complete</h3>
              <p className="text-sm text-slate-500">Receipt: <span className="font-mono font-bold text-slate-700">{completedReceipt.id}</span></p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm space-y-2.5">
              <div className="flex justify-between text-slate-600">
                <span>Channel:</span>
                <span className="font-semibold text-slate-900 capitalize">{completedReceipt.origin}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cashier:</span>
                <span className="font-medium text-slate-900">{completedReceipt.cashier}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment:</span>
                <span className="font-medium text-slate-900 uppercase">{completedReceipt.paymentMethod}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-base">
                <span>Total Paid:</span>
                <span>KES {(completedReceipt.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handlePrintReceipt}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs shadow-sm hover:bg-slate-800 transition">
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
              <button onClick={handleDownloadReceipt}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs shadow-sm hover:bg-slate-50 transition">
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
            </div>

            <button onClick={() => setCompletedReceipt(null)}
              className="w-full py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm transition">
              Close & New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
