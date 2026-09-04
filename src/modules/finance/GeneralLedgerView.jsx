import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Filter, BookOpen, AlertCircle, AlertTriangle, 
  CheckCircle2, ChevronDown, ChevronRight, X, DollarSign, ArrowRightLeft
} from 'lucide-react';

export default function GeneralLedgerView({ token, userRole }) {
  const [activeSubTab, setActiveSubTab] = useState('coa'); // 'coa' | 'journal-entries'
  
  // Data state
  const [accounts, setAccounts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  // Expandable journal entries state
  const [expandedEntries, setExpandedEntries] = useState({});

  // New Account form state
  const [newAccount, setNewAccount] = useState({
    code: '',
    name: '',
    type: 'Asset',
    description: '',
    balance: 0,
  });

  // New Journal Entry form state
  const [newJournal, setNewJournal] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    lines: [
      { accountId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', debit: 0, credit: 0, description: '' },
    ],
  });

  useEffect(() => {
    fetchAccounts();
    fetchJournalEntries();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/erp/finance/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to load Chart of Accounts');
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Network error loading Chart of Accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchJournalEntries = async () => {
    try {
      const res = await fetch('/api/erp/finance/journal-entries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJournalEntries(data);
      }
    } catch (err) {
      console.error('Error fetching journal entries:', err);
    }
  };

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch =
        acc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (acc.description && acc.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = typeFilter === 'ALL' || acc.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [accounts, searchQuery, typeFilter]);

  // Filtered Journal Entries
  const filteredEntries = useMemo(() => {
    return journalEntries.filter((je) => {
      const matchesSearch =
        je.entryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        je.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (je.reference && je.reference.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [journalEntries, searchQuery]);

  // Toggle Entry Expansion
  const toggleExpand = (id) => {
    setExpandedEntries((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // --- Add Account Handler ---
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/erp/finance/accounts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAccount),
      });

      if (res.ok) {
        setIsAccountModalOpen(false);
        setNewAccount({ code: '', name: '', type: 'Asset', description: '', balance: 0 });
        fetchAccounts();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to create account');
      }
    } catch (err) {
      alert('Error creating account: ' + err.message);
    }
  };

  // --- Journal Entry Real-Time Validations ---
  const totalDebits = useMemo(() => {
    return newJournal.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
  }, [newJournal.lines]);

  const totalCredits = useMemo(() => {
    return newJournal.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
  }, [newJournal.lines]);

  const imbalanceDifference = Math.abs(totalDebits - totalCredits);
  const isBalanced = totalDebits > 0 && imbalanceDifference < 0.001;

  const handleAddLine = () => {
    setNewJournal((prev) => ({
      ...prev,
      lines: [...prev.lines, { accountId: '', debit: 0, credit: 0, description: '' }],
    }));
  };

  const handleRemoveLine = (index) => {
    if (newJournal.lines.length <= 2) return;
    setNewJournal((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const handleLineChange = (index, field, value) => {
    setNewJournal((prev) => {
      const updated = [...prev.lines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, lines: updated };
    });
  };

  const handleCreateJournal = async (e) => {
    e.preventDefault();
    if (!isBalanced || newJournal.lines.length < 2) {
      return;
    }

    try {
      const payload = {
        date: newJournal.date,
        description: newJournal.description,
        reference: newJournal.reference,
        lines: newJournal.lines.map((l) => ({
          accountId: l.accountId,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          description: l.description,
        })),
      };

      const res = await fetch('/api/erp/finance/journal-entries', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsJournalModalOpen(false);
        setNewJournal({
          date: new Date().toISOString().split('T')[0],
          description: '',
          reference: '',
          lines: [
            { accountId: '', debit: 0, credit: 0, description: '' },
            { accountId: '', debit: 0, credit: 0, description: '' },
          ],
        });
        fetchAccounts();
        fetchJournalEntries();
      } else {
        alert(data.error || 'Failed to post journal entry');
      }
    } catch (err) {
      alert('Error creating journal entry: ' + err.message);
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'Asset':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Liability':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Equity':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Revenue':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Expense':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">General Ledger & Chart of Accounts</h1>
          <p className="text-sm text-slate-500">Manage financial accounts, view real-time balances, and post double-entry transactions.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>New Account</span>
          </button>
          <button
            onClick={() => setIsJournalModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 text-white" />
            <span>New Journal Entry</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Header */}
      <div className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveSubTab('coa')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeSubTab === 'coa'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Chart of Accounts ({accounts.length})
          </button>
          <button
            onClick={() => setActiveSubTab('journal-entries')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeSubTab === 'journal-entries'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Journal Entries ({journalEntries.length})
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeSubTab === 'coa' ? 'Search accounts by code or name...' : 'Search journal entries...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {activeSubTab === 'coa' && (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium uppercase">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Equity">Equity</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: CHART OF ACCOUNTS TABLE */}
      {activeSubTab === 'coa' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Account Name</th>
                  <th className="px-6 py-3">Category Type</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Current Balance (KES)</th>
                  <th className="px-6 py-3 text-center">System Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((acc, idx) => (
                    <tr key={acc._id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 font-mono">{acc.code}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{acc.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getTypeBadgeClass(acc.type)}`}>
                          {acc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{acc.description || '—'}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        KES {(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {acc.isSystem ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-600 border border-slate-200">
                            System Default
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Custom</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No accounts found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: JOURNAL ENTRIES TABLE */}
      {activeSubTab === 'journal-entries' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3">Entry #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3 text-center">Lines</th>
                  <th className="px-6 py-3 text-right">Total Debit / Credit</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((je, idx) => {
                    const isExpanded = !!expandedEntries[je._id];
                    const entryDebitTotal = (je.lines || []).reduce((sum, l) => sum + (l.debit || 0), 0);
                    return (
                      <React.Fragment key={je._id || idx}>
                        <tr
                          onClick={() => toggleExpand(je._id)}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-4 text-slate-400">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </td>
                          <td className="px-4 py-4 font-bold text-slate-900 font-mono">{je.entryNumber}</td>
                          <td className="px-4 py-4 text-slate-600">
                            {new Date(je.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900">{je.description}</td>
                          <td className="px-4 py-4 text-slate-500">{je.reference || '—'}</td>
                          <td className="px-4 py-4 text-center font-semibold text-slate-700">{je.lines?.length || 0}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900">
                            KES {entryDebitTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {je.status || 'posted'}
                            </span>
                          </td>
                        </tr>

                        {/* EXPANDABLE DRAWER FOR ENTRY LINES */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={8} className="p-4 border-b border-slate-200">
                              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-inner">
                                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                                  Journal Lines Detail
                                </h4>
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase">
                                    <tr>
                                      <th className="p-2">Account Code</th>
                                      <th className="p-2">Account Name</th>
                                      <th className="p-2">Line Description</th>
                                      <th className="p-2 text-right">Debit (KES)</th>
                                      <th className="p-2 text-right">Credit (KES)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {je.lines?.map((line, lIdx) => (
                                      <tr key={lIdx} className="hover:bg-slate-50">
                                        <td className="p-2 font-mono font-bold text-slate-800">
                                          {line.accountCode || line.accountId?.code || '—'}
                                        </td>
                                        <td className="p-2 font-medium text-slate-900">
                                          {line.accountName || line.accountId?.name || '—'}
                                        </td>
                                        <td className="p-2 text-slate-500">{line.description || '—'}</td>
                                        <td className="p-2 text-right font-semibold text-emerald-700">
                                          {line.debit > 0 ? `KES ${line.debit.toLocaleString()}` : '—'}
                                        </td>
                                        <td className="p-2 text-right font-semibold text-blue-700">
                                          {line.credit > 0 ? `KES ${line.credit.toLocaleString()}` : '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      No journal entries posted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE NEW ACCOUNT */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg">Add New Chart Account</h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Account Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1300"
                  value={newAccount.code}
                  onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Petty Cash / Office Equipment"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Category Type</label>
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Account purpose or notes..."
                  value={newAccount.description}
                  onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE JOURNAL ENTRY (WITH REAL-TIME DOUBLE ENTRY VALIDATION) */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">New Journal Entry</h3>
                <p className="text-xs text-slate-500">Post balanced double-entry debits and credits.</p>
              </div>
              <button onClick={() => setIsJournalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJournal} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Posting Date</label>
                  <input
                    type="date"
                    required
                    value={newJournal.date}
                    onChange={(e) => setNewJournal({ ...newJournal, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Description / Memo</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monthly rent expense & cash payment"
                    value={newJournal.description}
                    onChange={(e) => setNewJournal({ ...newJournal, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Reference # (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. REF-2026-001"
                  value={newJournal.reference}
                  onChange={(e) => setNewJournal({ ...newJournal, reference: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* DYNAMIC LINE ITEMS TABLE */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-600 tracking-wider">Transaction Lines</h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newJournal.lines.map((line, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 p-2.5 rounded-md border border-slate-200">
                      <div className="w-full sm:w-1/3">
                        <select
                          required
                          value={line.accountId}
                          onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Account...</option>
                          {accounts.map((acc) => (
                            <option key={acc._id} value={acc._id}>
                              {acc.code} - {acc.name} ({acc.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-1/4">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Debit (KES)"
                          value={line.debit || ''}
                          onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="w-full sm:w-1/4">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Credit (KES)"
                          value={line.credit || ''}
                          onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center space-x-1 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          disabled={newJournal.lines.length <= 2}
                          className={`p-1.5 rounded-md ${
                            newJournal.lines.length <= 2
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* REAL-TIME DYNAMIC IMBALANCE ALERT BANNER */}
              <div className="pt-2">
                {newJournal.lines.length < 2 && (
                  <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                    <span>A journal entry requires at least 2 transaction line items.</span>
                  </div>
                )}

                {newJournal.lines.length >= 2 && !isBalanced && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                      <span>
                        <strong>Unbalanced Journal Entry:</strong> Total Debits (KES {totalDebits.toLocaleString()}) ≠ Total Credits (KES {totalCredits.toLocaleString()})
                      </span>
                    </div>
                    <span className="font-bold font-mono">Difference: KES {imbalanceDifference.toLocaleString()}</span>
                  </div>
                )}

                {newJournal.lines.length >= 2 && isBalanced && (
                  <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                    <span>
                      <strong>Balanced Transaction:</strong> Total Debits KES {totalDebits.toLocaleString()} === Total Credits KES {totalCredits.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500 font-medium">
                  Debits: <span className="font-bold text-slate-900">KES {totalDebits.toLocaleString()}</span> | Credits: <span className="font-bold text-slate-900">KES {totalCredits.toLocaleString()}</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsJournalModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isBalanced || newJournal.lines.length < 2 || !newJournal.description}
                    className={`px-4 py-2 rounded-md font-medium text-sm text-white transition-colors ${
                      isBalanced && newJournal.lines.length >= 2 && newJournal.description
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    Post Journal Entry
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
