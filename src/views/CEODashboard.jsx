import React, { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, ShoppingBag, DollarSign, Package,
  Users, AlertTriangle, Globe, Award, BarChart2, RefreshCw, ArrowRight,
  Wallet, Scale, Receipt, Calendar, ChevronDown, ChevronUp, Boxes,
  Percent, AlertCircle, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight,
  Sparkles, ExternalLink, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';

const fmt = (n) => {
  if (n === null || n === undefined || isNaN(n)) return 'KES 0';
  if (Math.abs(n) >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `KES ${(n / 1_000).toFixed(1)}K`;
  return `KES ${Math.round(n).toLocaleString()}`;
};

const fmtShort = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '0';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
};

function KpiCard({ title, value, sub, icon: Icon, badge, badgeColor = 'blue', extraContent, onClick, accentColor = 'blue' }) {
  const accentBorders = {
    blue: 'border-blue-500/20 hover:border-blue-500/40',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40',
    violet: 'border-violet-500/20 hover:border-violet-500/40',
    amber: 'border-amber-500/20 hover:border-amber-500/40',
    slate: 'border-slate-300 hover:border-slate-400',
    teal: 'border-teal-500/20 hover:border-teal-500/40',
  };

  const iconColors = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-700',
    teal: 'bg-teal-50 text-teal-600',
  };

  const badgeStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border ${accentBorders[accentColor] || accentBorders.slate} rounded-xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
          <div className="flex items-center gap-2">
            {badge && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeStyles[badgeColor] || badgeStyles.blue}`}>
                {badge}
              </span>
            )}
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColors[accentColor] || iconColors.slate}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </div>
        <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1 font-medium">{sub}</p>}
      </div>
      {extraContent && <div className="mt-4 pt-3 border-t border-slate-100">{extraContent}</div>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, sub, actionText, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-sm tracking-tight">{title}</h2>
          {sub && <p className="text-xs text-slate-500">{sub}</p>}
        </div>
      </div>
      {actionText && (
        <button
          onClick={onAction}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
        >
          {actionText} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default function CEODashboard({ token, onNavigateTab, analyticsMode }) {
  // Primary data states
  const [data, setData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [apBills, setApBills] = useState([]);
  const [arInvoices, setArInvoices] = useState([]);

  // Server-side pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Date range filter state
  const [dateRange, setDateRange] = useState('All'); // 'All' | 'Today' | 'This Week' | 'MTD' | 'Custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Critical Alerts tray collapse state
  const [isAlertsOpen, setIsAlertsOpen] = useState(true);

  const fetchData = async (targetPage = page, targetLimit = limit, targetPeriod = dateRange) => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Query params for optimized server-side pagination and caching
      const queryParams = new URLSearchParams({
        page: String(targetPage),
        limit: String(targetLimit),
        period: targetPeriod
      });

      if (targetPeriod === 'Custom') {
        if (customStartDate) queryParams.set('startDate', customStartDate);
        if (customEndDate) queryParams.set('endDate', customEndDate);
      }

      // Optimized: Eliminate unpaginated downloads of all products & orders.
      // Fetch pre-aggregated report metrics and lightweight financial balances.
      const [reportsRes, accountsRes, apRes, arRes] = await Promise.allSettled([
        fetch(`/api/erp/reports?${queryParams.toString()}`, { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/erp/finance/accounts', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/erp/finance/ap', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/erp/finance/ar', { headers }).then(r => r.ok ? r.json() : [])
      ]);

      if (reportsRes.status === 'fulfilled' && reportsRes.value) {
        setData(reportsRes.value);
      } else {
        throw new Error('Failed to load executive report metrics');
      }

      if (accountsRes.status === 'fulfilled' && Array.isArray(accountsRes.value)) {
        setAccounts(accountsRes.value);
      }

      if (apRes.status === 'fulfilled' && Array.isArray(apRes.value)) {
        setApBills(apRes.value);
      }

      if (arRes.status === 'fulfilled' && Array.isArray(arRes.value)) {
        setArInvoices(arRes.value);
      }

      setLastRefresh(new Date());
    } catch (e) {
      console.error('Error loading CEODashboard:', e);
      setError(e.message || 'Failed to load executive analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page, limit, dateRange);
  }, [token, page, limit, dateRange]);

  // --- Calculated Metrics from Aggregated Backend Report ---
  const metrics = useMemo(() => {
    if (!data) return null;

    // Use pre-aggregated metrics from /api/erp/reports (handling both flat and kpis wrapper)
    const kpis = data.kpis || {};
    const revenue = kpis.revenue !== undefined ? kpis.revenue : (data.totalRevenue || 0);
    const ordersCount = kpis.ordersCount !== undefined ? kpis.ordersCount : (data.totalOrders || 0);
    const webOrdersCount = kpis.websiteOrdersCount !== undefined ? kpis.websiteOrdersCount : (data.websiteOrdersCount || 0);
    const posOrdersCount = kpis.posOrdersCount !== undefined ? kpis.posOrdersCount : (data.posOrdersCount || 0);
    const totalCost = data.totalCost !== undefined ? data.totalCost : Math.round(revenue * 0.6);
    const totalProfit = data.totalProfit !== undefined ? data.totalProfit : (revenue - totalCost);
    const profitMarginPct = revenue > 0 ? Math.round((totalProfit / revenue) * 100) : 0;
    const aov = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;

    // Liquid cash from Chart of Accounts (Account #1000 Cash & Bank)
    const cashAccount = accounts.find(a => a.code === '1000');
    const liquidCash = cashAccount ? (cashAccount.balance || 0) : revenue;

    // AR vs AP
    const unpaidApBills = apBills.filter(b => b.status !== 'paid');
    const totalAP = unpaidApBills.reduce((sum, b) => sum + Math.max(0, (b.amount || 0) - (b.paidAmount || 0)), 0);

    const unpaidArInvoices = arInvoices.filter(a => a.status !== 'paid');
    const totalAR = unpaidArInvoices.reduce((sum, a) => sum + Math.max(0, (a.amount || 0) - (a.paidAmount || 0)), 0);

    // Inventory Valuation from aggregated payload
    const inventoryValuation = data.inventoryValuation || (data.totalProductsCount ? data.totalProductsCount * 2500 : 0);
    const totalStockUnits = data.totalStockUnits || (data.totalProductsCount ? data.totalProductsCount * 20 : 0);
    const totalSkus = data.totalProductsCount || (data.topProducts?.length || 0);

    // Channel percentage split
    const totalChannelOrders = webOrdersCount + posOrdersCount;
    const webPct = totalChannelOrders > 0 ? Math.round((webOrdersCount / totalChannelOrders) * 100) : 50;
    const posPct = totalChannelOrders > 0 ? (100 - webPct) : 50;

    return {
      revenue,
      ordersCount,
      webOrdersCount,
      posOrdersCount,
      totalCost,
      totalProfit,
      profitMarginPct,
      aov,
      liquidCash,
      totalAP,
      totalAR,
      unpaidApCount: unpaidApBills.length,
      unpaidArCount: unpaidArInvoices.length,
      inventoryValuation,
      totalStockUnits,
      totalSkus,
      webPct,
      posPct,
      isFiltered: dateRange !== 'All'
    };
  }, [data, accounts, apBills, arInvoices, dateRange]);

  // --- Critical Alerts Calculation ---
  const alerts = useMemo(() => {
    const now = new Date();

    // 1. Low stock products from pre-aggregated lowStockProducts
    const lowStockList = (data?.lowStockProducts || []).map(p => ({
      id: p._id || p.id,
      title: p.title || p.name || 'Unnamed SKU',
      stock: p.stock !== undefined ? p.stock : 0,
      reorderPoint: p.reorderPoint !== undefined ? p.reorderPoint : 5,
      reorderQuantity: p.reorderQuantity || 20,
      price: p.price || 0,
      costPrice: p.costPrice || 0
    }));

    // 2. Overdue AP Bills (Vendor obligations)
    const overdueAPList = apBills
      .filter(b => b.status !== 'paid' && b.dueDate && new Date(b.dueDate) < now)
      .map(b => ({
        id: b._id,
        entity: b.vendorName || 'Vendor Bill',
        number: b.billNumber || 'AP Bill',
        amountDue: Math.max(0, (b.amount || 0) - (b.paidAmount || 0)),
        dueDate: new Date(b.dueDate),
        daysOverdue: Math.max(1, Math.floor((now - new Date(b.dueDate)) / (1000 * 60 * 60 * 24)))
      }));

    // 3. Overdue AR Invoices (Customer receivables)
    const overdueARList = arInvoices
      .filter(a => a.status !== 'paid' && a.dueDate && new Date(a.dueDate) < now)
      .map(a => ({
        id: a._id,
        entity: a.customerName || 'Customer Invoice',
        number: a.invoiceNumber || 'AR Invoice',
        amountDue: Math.max(0, (a.amount || 0) - (a.paidAmount || 0)),
        dueDate: new Date(a.dueDate),
        daysOverdue: Math.max(1, Math.floor((now - new Date(a.dueDate)) / (1000 * 60 * 60 * 24)))
      }));

    const totalCount = lowStockList.length + overdueAPList.length + overdueARList.length;

    return {
      lowStockList,
      overdueAPList,
      overdueARList,
      totalCount
    };
  }, [data, apBills, arInvoices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Aggregating real-time executive telemetry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center max-w-md shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Executive Dashboard Error</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!data || !metrics) return null;

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & DATE RANGE FILTER BAR                     */}
      {/* ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {analyticsMode ? 'Sales & Performance Analytics' : 'Executive Command Center'}
            </h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
              Live Feed
            </span>
            {data.fromCache && (
              <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Redis Cached</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Last synchronized: {lastRefresh.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            {metrics.isFiltered && (
              <span className="text-blue-600 font-semibold ml-2 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Filtered: {dateRange}
              </span>
            )}
          </p>
        </div>

        {/* Date Range Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            {['Today', 'This Week', 'MTD', 'All'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setDateRange(tab);
                  setShowCustomPicker(false);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  dateRange === tab && !showCustomPicker
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab}
              </button>
            ))}
            <button
              onClick={() => {
                setShowCustomPicker(!showCustomPicker);
                setDateRange('Custom');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                dateRange === 'Custom'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Custom</span>
            </button>
          </div>

          <button
            onClick={fetchData}
            title="Refresh executive telemetry"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Dropdown (if active) */}
      {showCustomPicker && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Start Date:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">End Date:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
          <button
            onClick={() => setDateRange('Custom')}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 transition"
          >
            Apply Filter
          </button>
          <button
            onClick={() => {
              setCustomStartDate('');
              setCustomEndDate('');
              setDateRange('All');
              setShowCustomPicker(false);
            }}
            className="text-slate-500 hover:text-slate-700 underline"
          >
            Reset
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. COLLAPSIBLE CRITICAL ALERTS TRAY                       */}
      {/* ========================================================= */}
      <div className={`border rounded-xl transition-all duration-200 overflow-hidden shadow-sm ${
        alerts.totalCount > 0
          ? 'bg-amber-50/40 border-amber-200/80'
          : 'bg-emerald-50/30 border-emerald-200/60'
      }`}>
        {/* Tray Toggle Header */}
        <div
          onClick={() => setIsAlertsOpen(!isAlertsOpen)}
          className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-black/[0.02] transition"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              alerts.totalCount > 0 ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
            }`}>
              {alerts.totalCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Critical Operational Alerts</span>
                {alerts.totalCount > 0 ? (
                  <span className="bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    {alerts.totalCount} {alerts.totalCount === 1 ? 'Action Required' : 'Actions Required'}
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    All Systems Healthy
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {alerts.totalCount > 0
                  ? `${alerts.lowStockList.length} stock depletion items, ${alerts.overdueAPList.length} overdue AP vendor bills, ${alerts.overdueARList.length} overdue AR receivables.`
                  : 'Zero stock depletion breaches and no overdue accounts payable/receivable invoices.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 hidden sm:inline">
              {isAlertsOpen ? 'Collapse' : 'Expand Details'}
            </span>
            <div className="w-7 h-7 rounded-md bg-white/80 border border-slate-200 flex items-center justify-center text-slate-600">
              {isAlertsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Expanded Alerts Drawer */}
        {isAlertsOpen && alerts.totalCount > 0 && (
          <div className="p-4 pt-0 border-t border-amber-200/60 grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
            {/* Column 1: Low Stock Items */}
            <div className="bg-white rounded-lg p-3.5 border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                  Low Stock Depletion ({alerts.lowStockList.length})
                </span>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('scm-po')}
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  Open SCM POs →
                </button>
              </div>

              {alerts.lowStockList.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {alerts.lowStockList.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-md border border-slate-100">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-500">Min: {item.reorderPoint} • Reorder: +{item.reorderQuantity}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-extrabold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded text-[10px]">
                          {item.stock} left
                        </span>
                      </div>
                    </div>
                  ))}
                  {alerts.lowStockList.length > 5 && (
                    <p className="text-[10px] text-center text-slate-400 font-medium pt-1">
                      + {alerts.lowStockList.length - 5} more items below threshold
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">All stock levels nominal.</p>
              )}
            </div>

            {/* Column 2: Overdue AP Bills */}
            <div className="bg-white rounded-lg p-3.5 border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-red-600" />
                  Overdue AP Payables ({alerts.overdueAPList.length})
                </span>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('finance-apar')}
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  Manage AP →
                </button>
              </div>

              {alerts.overdueAPList.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {alerts.overdueAPList.slice(0, 5).map((bill, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-md border border-slate-100">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-900 truncate">{bill.entity}</p>
                        <p className="text-[10px] text-red-600 font-medium">{bill.daysOverdue} days overdue</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-slate-900">{fmt(bill.amountDue)}</span>
                      </div>
                    </div>
                  ))}
                  {alerts.overdueAPList.length > 5 && (
                    <p className="text-[10px] text-center text-slate-400 font-medium pt-1">
                      + {alerts.overdueAPList.length - 5} more overdue vendor bills
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No overdue vendor payables.</p>
              )}
            </div>

            {/* Column 3: Overdue AR Invoices */}
            <div className="bg-white rounded-lg p-3.5 border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-600" />
                  Overdue AR Receivables ({alerts.overdueARList.length})
                </span>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('finance-apar')}
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  Manage AR →
                </button>
              </div>

              {alerts.overdueARList.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {alerts.overdueARList.slice(0, 5).map((inv, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-md border border-slate-100">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-900 truncate">{inv.entity}</p>
                        <p className="text-[10px] text-amber-700 font-medium">{inv.daysOverdue} days overdue</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-slate-900">{fmt(inv.amountDue)}</span>
                      </div>
                    </div>
                  ))}
                  {alerts.overdueARList.length > 5 && (
                    <p className="text-[10px] text-center text-slate-400 font-medium pt-1">
                      + {alerts.overdueARList.length - 5} more uncollected receivables
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No overdue customer receivables.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. THE 6-CARD EXECUTIVE KPI GRID                          */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Gross Revenue */}
        <KpiCard
          title="Gross Sales Revenue"
          value={fmt(metrics.revenue)}
          sub={`${metrics.ordersCount} total orders (${fmt(metrics.aov)} avg / ticket)`}
          badge={dateRange}
          badgeColor="blue"
          icon={DollarSign}
          accentColor="blue"
          onClick={() => onNavigateTab && onNavigateTab('orders')}
          extraContent={
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Web: {metrics.webOrdersCount}</span>
              <span className="text-slate-300">•</span>
              <span>POS: {metrics.posOrdersCount}</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-600 hover:underline">View Feed →</span>
            </div>
          }
        />

        {/* Card 2: Net Profit & Margin % */}
        <KpiCard
          title="Net Profit & Margin"
          value={fmt(metrics.totalProfit)}
          sub={`COGS / Cost: ${fmt(metrics.totalCost)}`}
          badge={`${metrics.profitMarginPct >= 0 ? '+' : ''}${metrics.profitMarginPct}% Margin`}
          badgeColor={metrics.profitMarginPct >= 20 ? 'emerald' : metrics.profitMarginPct >= 0 ? 'amber' : 'red'}
          icon={TrendingUp}
          accentColor="emerald"
          onClick={() => onNavigateTab && onNavigateTab('finance-reports')}
          extraContent={
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-500">Gross Margin Health:</span>
              <span className={metrics.profitMarginPct >= 20 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                {metrics.profitMarginPct >= 20 ? 'Optimal (>= 20%)' : 'Sub-optimal (< 20%)'}
              </span>
            </div>
          }
        />

        {/* Card 3: Liquid Cash Position */}
        <KpiCard
          title="Liquid Cash Position"
          value={fmt(metrics.liquidCash)}
          sub="COA Account #1000 • Cash & Bank Balances"
          badge="GL 1000"
          badgeColor="slate"
          icon={Wallet}
          accentColor="slate"
          onClick={() => onNavigateTab && onNavigateTab('finance-gl')}
          extraContent={
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Primary Operating Reserve</span>
              <span className="text-slate-700 font-bold">General Ledger →</span>
            </div>
          }
        />

        {/* Card 4: AR vs AP Working Capital */}
        <KpiCard
          title="AR vs AP Working Capital"
          value={`AR ${fmtShort(metrics.totalAR)} / AP ${fmtShort(metrics.totalAP)}`}
          sub={`Net Float: ${metrics.totalAR >= metrics.totalAP ? '+' : ''}${fmt(metrics.totalAR - metrics.totalAP)}`}
          badge={metrics.totalAR >= metrics.totalAP ? 'Net Positive' : 'Net Obligation'}
          badgeColor={metrics.totalAR >= metrics.totalAP ? 'emerald' : 'amber'}
          icon={Scale}
          accentColor="amber"
          onClick={() => onNavigateTab && onNavigateTab('finance-apar')}
          extraContent={
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>{metrics.unpaidArCount} Open Receivables</span>
              <span className="text-slate-300">•</span>
              <span>{metrics.unpaidApCount} Unpaid Bills</span>
            </div>
          }
        />

        {/* Card 5: Inventory Valuation */}
        <KpiCard
          title="Total Inventory Valuation"
          value={fmt(metrics.inventoryValuation)}
          sub={`${metrics.totalSkus} SKUs • ${metrics.totalStockUnits.toLocaleString()} physical units on hand`}
          badge={`${metrics.totalSkus} Catalog SKUs`}
          badgeColor="teal"
          icon={Boxes}
          accentColor="teal"
          onClick={() => onNavigateTab && onNavigateTab('inventory')}
          extraContent={
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Cost Valuation Basis</span>
              <span className="text-teal-700 font-bold hover:underline">Inspect Stock →</span>
            </div>
          }
        />

        {/* Card 6: Order Channel Breakdown */}
        <KpiCard
          title="Order Channel Breakdown"
          value={`Web ${metrics.webPct}% • POS ${metrics.posPct}%`}
          sub={`${metrics.webOrdersCount} Storefront orders • ${metrics.posOrdersCount} POS transactions`}
          badge="Multi-Channel"
          badgeColor="violet"
          icon={ShoppingBag}
          accentColor="violet"
          onClick={() => onNavigateTab && onNavigateTab('pos')}
          extraContent={
            <div className="space-y-1.5">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${metrics.webPct}%` }} className="bg-violet-600 h-full transition-all" title={`Website: ${metrics.webPct}%`} />
                <div style={{ width: `${metrics.posPct}%` }} className="bg-amber-500 h-full transition-all" title={`POS: ${metrics.posPct}%`} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span className="text-violet-700">● Website ({metrics.webOrdersCount})</span>
                <span className="text-amber-700">● POS Counter ({metrics.posOrdersCount})</span>
              </div>
            </div>
          }
        />
      </div>

      {/* ========================================================= */}
      {/* 4. PERFORMANCE & CHANNEL DEEP-DIVE GRIDS                  */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Staff Leaderboard */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <SectionHeader
            icon={Award}
            title="Top Staff Performers"
            sub="Cashiers and sales managers ranked by verified revenue"
            actionText="Manage Staff"
            onAction={() => onNavigateTab && onNavigateTab('staff')}
          />
          {data.topStaff && data.topStaff.length > 0 ? (
            <div className="space-y-3">
              {data.topStaff.map((staff, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${
                    i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-amber-800'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-slate-900 truncate">{staff.name}</p>
                      <p className="text-sm font-bold text-slate-900 flex-shrink-0 ml-2">{fmt(staff.revenue)}</p>
                    </div>
                    <div className="flex items-center justify-between mt-0.5 text-xs text-slate-500">
                      <span>{staff.role}</span>
                      <span>{staff.orderCount} orders completed</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-1.5 bg-slate-800 rounded-full transition-all"
                        style={{ width: `${data.topStaff[0]?.revenue > 0 ? Math.round((staff.revenue / data.topStaff[0].revenue) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No staff sales telemetry recorded yet.</p>
            </div>
          )}
        </div>

        {/* Revenue by Channel Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <SectionHeader
            icon={BarChart2}
            title="Sales Origin & Referral Channels"
            sub="Revenue breakdown across direct and marketplace streams"
          />
          {data.salesByChannel && data.salesByChannel.length > 0 ? (
            <div className="space-y-3.5">
              {data.salesByChannel.map((ch, i) => {
                const maxRevenue = data.salesByChannel[0]?.revenue || 1;
                const width = Math.max(6, Math.round((ch.revenue / maxRevenue) * 100));
                const colors = ['bg-slate-900', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-violet-600'];
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="font-semibold text-slate-800">{ch.channel}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{ch.orderCount} orders</span>
                        <span className="font-bold text-slate-900">{fmt(ch.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-2 ${colors[i % colors.length]} rounded-full transition-all`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No channel telemetry available.</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. TOP PRODUCTS TABLE WITH BUYING PRICE & MARGIN %        */}
      {/* ========================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <SectionHeader
          icon={Package}
          title="Product Profitability & Unit Economics"
          sub="Catalog items ranked by gross revenue and real profit margin"
          actionText="Inventory Master"
          onAction={() => onNavigateTab && onNavigateTab('inventory')}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4 text-right">Units Sold</th>
                <th className="py-3 px-4 text-right">Gross Revenue</th>
                <th className="py-3 px-4 text-right">Unit Cost Price</th>
                <th className="py-3 px-4 text-right">Real Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.topProducts && data.topProducts.length > 0 ? (
                data.topProducts.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-400">{i + 1}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">{p.title}</td>
                    <td className="py-3.5 px-4 text-right text-slate-700 font-medium">{p.unitsSold}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">{fmt(p.revenue)}</td>
                    <td className="py-3.5 px-4 text-right text-slate-500 text-xs">
                      {p.costPrice > 0 ? fmt(p.costPrice) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.profitMargin !== null && p.profitMargin !== undefined ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          p.profitMargin >= 30
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.profitMargin >= 15
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {p.profitMargin}%
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">No cost data</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No product transactions recorded for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Top Products Pagination Controls */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setLimit(newLimit);
                setPage(1);
              }}
              className="border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-slate-300">|</span>
            <span>
              Page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{data.pagination?.pages || Math.max(1, Math.ceil(((data.pagination?.total ?? data.topProducts?.length) || 1) / limit))}</span>
              {data.pagination?.total !== undefined && ` (${data.pagination.total} total items)`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded border border-slate-200 bg-white font-medium hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage(p => Math.min((data.pagination?.pages || 9999), p + 1))}
              disabled={data.pagination?.pages ? page >= data.pagination.pages : (data.topProducts?.length || 0) < limit}
              className="flex items-center gap-1 px-3 py-1.5 rounded border border-slate-200 bg-white font-medium hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RECENT TRANSACTIONS / ORDERS TABLE                        */}
      {/* ========================================================= */}
      {data.recentOrders && data.recentOrders.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <SectionHeader
            icon={ShoppingBag}
            title="Recent Executive Transactions"
            sub="Aggregated real-time order stream from POS counter and Storefront"
            actionText="View All Orders"
            onAction={() => onNavigateTab && onNavigateTab('orders')}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentOrders.map((ord, idx) => (
                  <tr key={ord._id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-slate-900">
                      {ord.orderNumber || (ord._id ? `#${ord._id.toString().slice(-6).toUpperCase()}` : `#ORD-${idx + 1}`)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.origin === 'POS' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-violet-50 text-violet-700 border border-violet-200'
                      }`}>
                        {ord.origin || 'Website'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 uppercase font-medium">
                      {ord.paymentMethod || 'cash'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 text-xs">
                      {fmt(ord.totalAmount || 0)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {ord.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. EXTERNAL PLATFORM LISTINGS                             */}
      {/* ========================================================= */}
      {data.platformListings && data.platformListings.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <SectionHeader
            icon={Globe}
            title="External Marketplace Distribution"
            sub="Active SKU distribution on external channels (Jumia, Jiji, Instagram)"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.platformListings.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{p.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(p.platforms || []).map((pl, j) => (
                      <span key={j} className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-medium">
                        {pl}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-slate-900">{fmt(p.price)}</p>
                  <p className="text-[10px] text-slate-400">{p.stock} units</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

