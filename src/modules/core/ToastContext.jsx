import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Trash2 } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error:   AlertCircle,
  info:    Info,
  warning: AlertTriangle,
};

const STYLES = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error:   "bg-red-50 border-red-200 text-red-700",
  info:    "bg-blue-50 border-blue-200 text-blue-700",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

const ICON_STYLES = {
  success: "text-emerald-500",
  error:   "text-red-500",
  info:    "text-blue-500",
  warning: "text-amber-500",
};

function ToastItem({ toast, onDismiss }) {
  const Icon = ICONS[toast.type] || Info;
  const timerRef = useRef(null);
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, toast.duration || 4000);
    return () => clearTimeout(timerRef.current);
  }, [dismiss, toast.duration]);

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm max-w-sm w-full transition-all duration-200 ${STYLES[toast.type] || STYLES.info} ${exiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${ICON_STYLES[toast.type] || ICON_STYLES.info}`} />
      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-semibold text-[13px] leading-tight">{toast.title}</p>}
        <p className={`leading-tight ${toast.title ? "text-[12px] mt-0.5 opacity-80" : "font-medium"}`}>{toast.message}</p>
      </div>
      <button onClick={dismiss} className="flex-shrink-0 p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ConfirmModalRenderer({ modal, onResolve }) {
  if (!modal) return null;
  const Icon = modal.icon || Trash2;
  const isDanger = modal.variant === "danger";
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${isDanger ? "bg-red-100" : "bg-blue-100"}`}>
            <Icon className={`w-5 h-5 ${isDanger ? "text-red-600" : "text-blue-600"}`} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{modal.title || "Confirm Action"}</h3>
            <p className="text-slate-500 text-sm mt-1 leading-relaxed">{modal.message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => onResolve(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
            {modal.cancelLabel || "Cancel"}
          </button>
          <button onClick={() => onResolve(true)} className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition ${isDanger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}>
            {modal.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null);
  const confirmResolveRef = useRef(null);
  const idCounter = useRef(0);

  const addToast = useCallback((type, message, options = {}) => {
    const id = ++idCounter.current;
    setToasts(prev => [...prev, { id, type, message, ...options }]);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, opts) => addToast("success", msg, opts),
    error:   (msg, opts) => addToast("error", msg, opts),
    info:    (msg, opts) => addToast("info", msg, opts),
    warning: (msg, opts) => addToast("warning", msg, opts),
  };

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmModal(typeof options === "string" ? { message: options } : options);
    });
  }, []);

  const handleConfirmResolve = useCallback((result) => {
    setConfirmModal(null);
    if (confirmResolveRef.current) {
      confirmResolveRef.current(result);
      confirmResolveRef.current = null;
    }
  }, []);

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
      <ConfirmModalRenderer modal={confirmModal} onResolve={handleConfirmResolve} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export default ToastContext;
