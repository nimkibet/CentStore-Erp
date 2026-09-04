import React, { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, CheckCircle2, AlertCircle, Calendar, 
  TrendingUp, TrendingDown, DollarSign, Download, RefreshCw
} from 'lucide-react';

export default function FinancialReportsView({ token, userRole }) {
  const [activeReportTab, setActiveReportTab] = useState('pnl'); // 'pnl' | 'balance-sheet' | 'cash-flow'
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFinancialReports();
  }, []);

  const fetchFinancialReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/erp/finance/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to fetch financial reports');
      }
    } catch (err) {
      console.error('Error fetching financial reports:', err);
      setError('Network error fetching financial reports');
    } finally {
      setLoading(false);
    }
  };

  const pnl = reportData?.profitAndLoss || {
    totalRevenue: 0,
    cogs: 0,
    grossProfit: 0,
    operatingExpenses: 0,
    totalExpenses: 0,
    netProfit: 0,
    revenueAccounts: [],
    expenseAccounts: [],
  };

  const bs = reportData?.balanceSheet || {
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    netIncome: 0,
    totalLiabilitiesAndEquity: 0,
    isBalanced: true,
    assetAccounts: [],
    liabilityAccounts: [],
    equityAccounts: [],
  };

  const cf = reportData?.cashFlow || {
    operatingCashFlow: 0,
    investingCashFlow: 0,
    financingCashFlow: 0,
    netCashFlow: 0,
    beginningCash: 0,
    endingCash: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Statements & Executive Reports</h1>
          <p className="text-sm text-slate-500">Real-time Profit & Loss, Balance Sheet verification, and Cash Flow analytics.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchFinancialReports}
            className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Reports</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveReportTab('pnl')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeReportTab === 'pnl'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Profit & Loss (Income Statement)
          </button>
          <button
            onClick={() => setActiveReportTab('balance-sheet')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeReportTab === 'balance-sheet'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Balance Sheet
          </button>
          <button
            onClick={() => setActiveReportTab('cash-flow')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeReportTab === 'cash-flow'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Cash Flow Statement
          </button>
        </div>
      </div>

      {/* REPORT 1: PROFIT & LOSS STATEMENT */}
      {activeReportTab === 'pnl' && (
        <div className="space-y-6">
          {/* Summary KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Gross Sales Revenue</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                KES {pnl.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Cost of Goods Sold (COGS)</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                KES {pnl.cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Gross Operating Profit</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-1">
                KES {pnl.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Net Income / (Loss)</p>
              <h3 className={`text-xl font-bold mt-1 ${pnl.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                KES {pnl.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          {/* Structured P&L Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Statement of Profit & Loss</h3>
              <p className="text-xs text-slate-500">For the period ending today</p>
            </div>

            {/* Operating Revenue Section */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                1. Operating Revenue
              </h4>
              <div className="space-y-2">
                {pnl.revenueAccounts.length > 0 ? (
                  pnl.revenueAccounts.map((acc, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1.5 px-3 bg-slate-50 rounded">
                      <span className="text-slate-700 font-medium">{acc.code} - {acc.name}</span>
                      <span className="font-mono font-semibold text-slate-900">
                        KES {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No revenue accounts recorded.</p>
                )}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 px-3">
                  <span>Total Operating Revenue</span>
                  <span className="font-mono text-emerald-700">
                    KES {pnl.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost of Sales Section */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                2. Cost of Goods Sold (COGS)
              </h4>
              <div className="flex justify-between text-sm py-1.5 px-3 bg-slate-50 rounded">
                <span className="text-slate-700 font-medium">Direct Cost of Goods Sold</span>
                <span className="font-mono font-semibold text-slate-900">
                  KES {pnl.cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 px-3">
                <span>Gross Profit</span>
                <span className="font-mono text-emerald-700">
                  KES {pnl.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Operating Expenses Section */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                3. Operating & Administrative Expenses
              </h4>
              <div className="space-y-2">
                {pnl.expenseAccounts.length > 0 ? (
                  pnl.expenseAccounts.map((acc, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1.5 px-3 bg-slate-50 rounded">
                      <span className="text-slate-700 font-medium">{acc.code} - {acc.name}</span>
                      <span className="font-mono font-semibold text-slate-900">
                        KES {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No operating expense accounts recorded.</p>
                )}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 px-3">
                  <span>Total Operating Expenses</span>
                  <span className="font-mono text-rose-600">
                    KES {pnl.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Profit Summary Bar */}
            <div className="p-4 rounded-lg bg-slate-900 text-white flex items-center justify-between">
              <span className="text-base font-bold uppercase tracking-wider">Net Profit / (Loss)</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                KES {pnl.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: BALANCE SHEET */}
      {activeReportTab === 'balance-sheet' && (
        <div className="space-y-6">
          {/* BALANCE EQUATION INDICATOR BANNER */}
          <div
            className={`p-4 rounded-lg border flex items-center justify-between ${
              bs.isBalanced
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              {bs.isBalanced ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-sm">
                  {bs.isBalanced
                    ? 'Balance Sheet Equation Verified (Assets = Liabilities + Equity)'
                    : 'Accounting Imbalance Alert'}
                </h4>
                <p className="text-xs opacity-90">
                  Total Assets: KES {bs.totalAssets.toLocaleString()} | Total Liabilities & Equity: KES {bs.totalLiabilitiesAndEquity.toLocaleString()}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded bg-white/80 border">
              {bs.isBalanced ? 'Balanced' : 'Imbalance'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: ASSETS */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">ASSETS</h3>
                <span className="text-xs font-semibold text-slate-500 uppercase">Current & Non-Current</span>
              </div>

              <div className="space-y-2">
                {bs.assetAccounts.length > 0 ? (
                  bs.assetAccounts.map((acc, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-2 px-3 bg-slate-50 rounded">
                      <span className="text-slate-700 font-medium">{acc.code} - {acc.name}</span>
                      <span className="font-mono font-semibold text-slate-900">
                        KES {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No asset accounts found.</p>
                )}
              </div>

              <div className="pt-4 border-t-2 border-slate-900 flex justify-between text-base font-bold text-slate-900">
                <span>TOTAL ASSETS</span>
                <span className="font-mono text-blue-600">
                  KES {bs.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN: LIABILITIES & EQUITY */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
              {/* LIABILITIES SECTION */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">LIABILITIES</h3>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Obligations</span>
                </div>

                <div className="space-y-2">
                  {bs.liabilityAccounts.length > 0 ? (
                    bs.liabilityAccounts.map((acc, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-2 px-3 bg-slate-50 rounded">
                        <span className="text-slate-700 font-medium">{acc.code} - {acc.name}</span>
                        <span className="font-mono font-semibold text-slate-900">
                          KES {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No liability accounts found.</p>
                  )}
                </div>

                <div className="flex justify-between text-sm font-bold text-slate-800 pt-2 border-t border-slate-200">
                  <span>Total Liabilities</span>
                  <span className="font-mono">
                    KES {bs.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* EQUITY SECTION */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">EQUITY</h3>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Capital & Earnings</span>
                </div>

                <div className="space-y-2">
                  {bs.equityAccounts.map((acc, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-2 px-3 bg-slate-50 rounded">
                      <span className="text-slate-700 font-medium">{acc.code} - {acc.name}</span>
                      <span className="font-mono font-semibold text-slate-900">
                        KES {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm py-2 px-3 bg-emerald-50 text-emerald-800 rounded font-medium">
                    <span>Current Year Net Income</span>
                    <span className="font-mono font-bold">
                      KES {bs.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-sm font-bold text-slate-800 pt-2 border-t border-slate-200">
                  <span>Total Equity</span>
                  <span className="font-mono">
                    KES {(bs.totalEquity + bs.netIncome).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* TOTAL LIABILITIES & EQUITY */}
              <div className="pt-4 border-t-2 border-slate-900 flex justify-between text-base font-bold text-slate-900">
                <span>TOTAL LIABILITIES & EQUITY</span>
                <span className="font-mono text-purple-600">
                  KES {bs.totalLiabilitiesAndEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: CASH FLOW STATEMENT */}
      {activeReportTab === 'cash-flow' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Statement of Cash Flows</h3>
            <p className="text-xs text-slate-500">Summary of cash receipts and disbursements</p>
          </div>

          <div className="space-y-6">
            {/* Operating Activities */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                1. Cash Flow from Operating Activities
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm py-2 px-3 bg-slate-50 rounded">
                  <span className="text-slate-700">Net Operating Income</span>
                  <span className="font-mono font-semibold text-slate-900">
                    KES {pnl.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-2 px-3 bg-slate-50 rounded">
                  <span className="text-slate-700">Adjustments for Working Capital (AP/AR Changes)</span>
                  <span className="font-mono font-semibold text-slate-900">
                    KES {(cf.operatingCashFlow - pnl.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 px-3">
                <span>Net Cash provided by Operating Activities</span>
                <span className="font-mono text-emerald-700">
                  KES {cf.operatingCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Investing Activities */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                2. Cash Flow from Investing Activities
              </h4>
              <div className="flex justify-between text-sm py-2 px-3 bg-slate-50 rounded">
                <span className="text-slate-700">Capital Expenditures & Asset Acquisition</span>
                <span className="font-mono font-semibold text-slate-900">
                  KES {cf.investingCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 px-3">
                <span>Net Cash used in Investing Activities</span>
                <span className="font-mono">
                  KES {cf.investingCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Financing Activities */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                3. Cash Flow from Financing Activities
              </h4>
              <div className="flex justify-between text-sm py-2 px-3 bg-slate-50 rounded">
                <span className="text-slate-700">Owner Capital / Debt Financing</span>
                <span className="font-mono font-semibold text-slate-900">
                  KES {cf.financingCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 px-3">
                <span>Net Cash provided by Financing Activities</span>
                <span className="font-mono">
                  KES {cf.financingCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Cash Summary Banner */}
            <div className="p-5 rounded-lg bg-slate-900 text-white space-y-3">
              <div className="flex justify-between text-sm border-b border-slate-800 pb-2">
                <span className="text-slate-400">Net Increase / (Decrease) in Cash</span>
                <span className="font-mono font-bold text-emerald-400">
                  KES {cf.netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Ending Cash & Bank Position</span>
                <span className="font-mono text-emerald-400">
                  KES {cf.endingCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
