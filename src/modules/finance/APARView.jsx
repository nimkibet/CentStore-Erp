import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Filter, DollarSign, ArrowUpRight, ArrowDownLeft, 
  Calendar, CheckCircle2, AlertTriangle, Clock, X, CreditCard
} from 'lucide-react';

export default function APARView({ token, userRole }) {
  const [activeTab, setActiveTab] = useState('ap'); // 'ap' | 'ar'

  // Data states
  const [apBills, setApBills] = useState([]);
  const [arInvoices, setArInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isAPModalOpen, setIsAPModalOpen] = useState(false);
  const [isARModalOpen, setIsARModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form states
  const [newAP, setNewAP] = useState({
    vendorName: '',
    billNumber: '',
    amount: '',
    dueDate: '',
    issueDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  const [newAR, setNewAR] = useState({
    customerName: '',
    invoiceNumber: '',
    amount: '',
    dueDate: '',
    issueDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Bank Transfer',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    fetchAP();
    fetchAR();
  }, []);

  const fetchAP = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/erp/finance/ap', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApBills(data);
      }
    } catch (err) {
      console.error('Error fetching AP bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAR = async () => {
    try {
      const res = await fetch('/api/erp/finance/ar', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setArInvoices(data);
      }
    } catch (err) {
      console.error('Error fetching AR invoices:', err);
    }
  };

  // KPI Calculations
  const apMetrics = useMemo(() => {
    const total = apBills.reduce((acc, b) => acc + (b.amount || 0), 0);
    const paid = apBills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
    const balance = total - paid;
    const unpaidCount = apBills.filter((b) => b.status !== 'paid').length;
    return { total, paid, balance, unpaidCount };
  }, [apBills]);

  const arMetrics = useMemo(() => {
    const total = arInvoices.reduce((acc, i) => acc + (i.amount || 0), 0);
    const collected = arInvoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
    const balance = total - collected;
    const pendingCount = arInvoices.filter((i) => i.status !== 'paid').length;
    return { total, collected, balance, pendingCount };
  }, [arInvoices]);

  // Filtered lists
  const filteredAP = useMemo(() => {
    return apBills.filter((b) => {
      const matchesSearch =
        b.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.billNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [apBills, searchQuery, statusFilter]);

  const filteredAR = useMemo(() => {
    return arInvoices.filter((i) => {
      const matchesSearch =
        i.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [arInvoices, searchQuery, statusFilter]);

  // Handlers for AP/AR creation
  const handleCreateAP = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/erp/finance/ap', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAP),
      });

      if (res.ok) {
        setIsAPModalOpen(false);
        setNewAP({
          vendorName: '',
          billNumber: '',
          amount: '',
          dueDate: '',
          issueDate: new Date().toISOString().split('T')[0],
          description: '',
        });
        fetchAP();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create AP bill');
      }
    } catch (err) {
      alert('Error creating AP bill: ' + err.message);
    }
  };

  const handleCreateAR = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/erp/finance/ar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAR),
      });

      if (res.ok) {
        setIsARModalOpen(false);
        setNewAR({
          customerName: '',
          invoiceNumber: '',
          amount: '',
          dueDate: '',
          issueDate: new Date().toISOString().split('T')[0],
          description: '',
        });
        fetchAR();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create AR invoice');
      }
    } catch (err) {
      alert('Error creating AR invoice: ' + err.message);
    }
  };

  // Payment Recording Handler
  const openPaymentModal = (record, type) => {
    setSelectedRecord({ ...record, recordType: type });
    const remaining = (record.amount || 0) - (record.paidAmount || 0);
    setPaymentData({
      amount: remaining > 0 ? remaining : '',
      paymentMethod: 'Bank Transfer',
      reference: '',
      notes: '',
    });
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const isAP = selectedRecord.recordType === 'ap';
    const endpoint = isAP
      ? `/api/erp/finance/ap/${selectedRecord._id}/payment`
      : `/api/erp/finance/ar/${selectedRecord._id}/payment`;

    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentAmount: parseFloat(paymentData.amount) || 0,
          notes: paymentData.notes,
        }),
      });

      if (res.ok) {
        setIsPaymentModalOpen(false);
        setSelectedRecord(null);
        if (isAP) fetchAP();
        else fetchAR();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to record payment');
      }
    } catch (err) {
      alert('Error processing payment: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Paid</span>;
      case 'partially_paid':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Partially Paid</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200">Unpaid</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Accounts Payable & Receivable (AP/AR)</h1>
          <p className="text-sm text-slate-500">Track vendor obligations, customer invoices, and record ledger settlements.</p>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'ap' ? (
            <button
              onClick={() => setIsAPModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Record Vendor Bill</span>
            </button>
          ) : (
            <button
              onClick={() => setIsARModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Create Customer Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('ap')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'ap'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
            <span>Accounts Payable ({apBills.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ar')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'ar'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            <span>Accounts Receivable ({arInvoices.length})</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS CARDS */}
      {activeTab === 'ap' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Outstanding AP Balance</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">
              KES {apMetrics.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-rose-600 font-medium mt-1">{apMetrics.unpaidCount} pending vendor bills</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Total Settled Payments</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">
              KES {apMetrics.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Disbursed to vendors</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Gross AP Invoiced</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">
              KES {apMetrics.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Lifetime total billed</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Outstanding AR Balance</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">
              KES {arMetrics.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-1">{arMetrics.pendingCount} unpaid customer invoices</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Total Collected Receipts</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">
              KES {arMetrics.collected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Received in cash/bank</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Gross AR Billed</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">
              KES {arMetrics.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Lifetime total invoices</p>
          </div>
        </div>
      )}

      {/* FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'ap' ? 'Search vendor or bill #' : 'Search customer or invoice #'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* AP TABLE */}
      {activeTab === 'ap' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Vendor Name</th>
                  <th className="px-6 py-3">Bill Ref #</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3 text-right">Total Amount</th>
                  <th className="px-6 py-3 text-right">Paid Amount</th>
                  <th className="px-6 py-3 text-right">Balance Due</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAP.length > 0 ? (
                  filteredAP.map((bill, idx) => {
                    const balanceDue = bill.amount - bill.paidAmount;
                    return (
                      <tr key={bill._id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{bill.vendorName}</td>
                        <td className="px-6 py-4 font-mono text-slate-700">{bill.billNumber}</td>
                        <td className="px-6 py-4 text-slate-600">{new Date(bill.dueDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          KES {bill.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-700 font-semibold">
                          KES {bill.paidAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-rose-600">
                          KES {balanceDue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">{getStatusBadge(bill.status)}</td>
                        <td className="px-6 py-4 text-center">
                          {bill.status !== 'paid' ? (
                            <button
                              onClick={() => openPaymentModal(bill, 'ap')}
                              className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800"
                            >
                              Record Payment
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Complete</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      No Accounts Payable bills found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AR TABLE */}
      {activeTab === 'ar' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Customer Name</th>
                  <th className="px-6 py-3">Invoice Ref #</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3 text-right">Invoice Amount</th>
                  <th className="px-6 py-3 text-right">Received Amount</th>
                  <th className="px-6 py-3 text-right">Balance Due</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAR.length > 0 ? (
                  filteredAR.map((inv, idx) => {
                    const balanceDue = inv.amount - inv.paidAmount;
                    return (
                      <tr key={inv._id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{inv.customerName}</td>
                        <td className="px-6 py-4 font-mono text-slate-700">{inv.invoiceNumber}</td>
                        <td className="px-6 py-4 text-slate-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          KES {inv.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-700 font-semibold">
                          KES {inv.paidAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-amber-600">
                          KES {balanceDue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">{getStatusBadge(inv.status)}</td>
                        <td className="px-6 py-4 text-center">
                          {inv.status !== 'paid' ? (
                            <button
                              onClick={() => openPaymentModal(inv, 'ar')}
                              className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
                            >
                              Record Receipt
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Cleared</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      No Accounts Receivable invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE AP BILL MODAL */}
      {isAPModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg">Create Vendor Bill (AP)</h3>
              <button onClick={() => setIsAPModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAP} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Vendor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Tech Kenya"
                  value={newAP.vendorName}
                  onChange={(e) => setNewAP({ ...newAP, vendorName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Bill Number</label>
                <input
                  type="text"
                  placeholder="e.g. BILL-2026-99"
                  value={newAP.billNumber}
                  onChange={(e) => setNewAP({ ...newAP, billNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Bill Amount (KES)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newAP.amount}
                    onChange={(e) => setNewAP({ ...newAP, amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newAP.dueDate}
                    onChange={(e) => setNewAP({ ...newAP, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Inventory restock bill description..."
                  value={newAP.description}
                  onChange={(e) => setNewAP({ ...newAP, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAPModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Save AP Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE AR INVOICE MODAL */}
      {isARModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg">Create Customer Invoice (AR)</h3>
              <button onClick={() => setIsARModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAR} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Safari Logistics Ltd"
                  value={newAR.customerName}
                  onChange={(e) => setNewAR({ ...newAR, customerName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Invoice Number</label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-104"
                  value={newAR.invoiceNumber}
                  onChange={(e) => setNewAR({ ...newAR, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newAR.amount}
                    onChange={(e) => setNewAR({ ...newAR, amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newAR.dueDate}
                    onChange={(e) => setNewAR({ ...newAR, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Corporate order invoice description..."
                  value={newAR.description}
                  onChange={(e) => setNewAR({ ...newAR, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsARModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Save AR Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT / RECEIPT MODAL */}
      {isPaymentModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg">
                {selectedRecord.recordType === 'ap' ? 'Record Vendor Disbursement' : 'Record Customer Collection'}
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <p className="text-xs text-slate-500 font-medium">
                  {selectedRecord.recordType === 'ap' ? 'Vendor:' : 'Customer:'}{' '}
                  <span className="font-bold text-slate-900">
                    {selectedRecord.vendorName || selectedRecord.customerName}
                  </span>
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  Ref Number:{' '}
                  <span className="font-mono text-slate-800">
                    {selectedRecord.billNumber || selectedRecord.invoiceNumber}
                  </span>
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  Balance Remaining:{' '}
                  <span className="font-bold text-rose-600">
                    KES {(selectedRecord.amount - selectedRecord.paidAmount).toLocaleString()}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Payment Amount (KES)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="M-Pesa">M-Pesa Express</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Transaction Ref / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. MPESA-REF-104928"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
