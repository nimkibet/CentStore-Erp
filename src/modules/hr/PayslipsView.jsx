import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, PieChart, Search, Eye, ShieldCheck, Filter } from 'lucide-react';
import PayslipModal from './PayslipModal';

export default function PayslipsView({ token, currentUser }) {
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [payPeriod, setPayPeriod] = useState('2026-08');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const fetchPayrollData = async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, recordsRes] = await Promise.all([
        fetch(`/api/erp/hcm/payroll/summary?payPeriod=${payPeriod}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/erp/hcm/payroll?payPeriod=${payPeriod}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!summaryRes.ok || !recordsRes.ok) {
        throw new Error('Failed to fetch payroll summary or records');
      }

      const summaryData = await summaryRes.json();
      const recordsData = await recordsRes.json();

      setPayrollSummary(summaryData);
      setPayrollRecords(recordsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [token, payPeriod]);

  const filteredRecords = payrollRecords.filter((rec) => {
    const staffName = rec.staffId?.name || rec.staffName || '';
    const dept = rec.staffId?.department || rec.department || '';
    return staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           dept.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Controls Bar: Pay Period Selector */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900 text-base">Executive Payroll Metrics & Payslip Directory</h2>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Pay Period:</label>
          <input
            type="month"
            value={payPeriod}
            onChange={(e) => setPayPeriod(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* KPI Metrics Dashboard */}
      {payrollSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Payroll Spend</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">KES {(payrollSummary.totalGrossSalary || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">{payrollSummary.staffCount} Staff Members</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PAYE Tax Remittance</p>
            <p className="text-2xl font-bold text-red-600 mt-1">KES {(payrollSummary.breakdown?.totalPaye || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Monthly PAYE Liability</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Statutory Deductions</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">KES {(payrollSummary.totalDeductions || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">NSSF, SHIF, Housing Levy</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Net Disbursement</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">KES {(payrollSummary.totalNetSalary || 0).toLocaleString()}</p>
            <p className="text-xs text-emerald-600 mt-1">Direct Bank Payouts</p>
          </div>
        </div>
      )}

      {/* Departmental Distribution Chart / Breakdown */}
      {payrollSummary?.departmentBreakdown && payrollSummary.departmentBreakdown.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-purple-600" />
            <span>Departmental Payroll Distribution</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payrollSummary.departmentBreakdown.map((dept) => {
              const pct = payrollSummary.totalGrossSalary > 0
                ? Math.round((dept.grossSalary / payrollSummary.totalGrossSalary) * 100)
                : 0;
              return (
                <div key={dept.department} className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{dept.department} ({dept.staffCount} Staff)</span>
                    <span>KES {dept.grossSalary.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payroll Records Directory Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff payslips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading payroll summary records...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">Error: {error}</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No payroll records found for period {payPeriod}. Generate payroll via Payroll Wizard.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Payslip Ref</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3 text-right">Basic Salary</th>
                  <th className="px-4 py-3 text-right">Gross Pay</th>
                  <th className="px-4 py-3 text-right">Deductions</th>
                  <th className="px-4 py-3 text-right">Net Pay</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.map((rec) => {
                  const staffObj = rec.staffId || {};
                  return (
                    <tr key={rec._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600">
                        {rec.payslipRef}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{staffObj.name || rec.staffName || 'Staff'}</div>
                        <div className="text-xs text-slate-400">{staffObj.department || rec.department || 'General'}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        KES {(rec.basicSalary || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        KES {(rec.grossSalary || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600 font-medium">
                        KES {(rec.totalDeductions || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        KES {(rec.netSalary || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedPayslip(rec)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Payslip</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payslip Modal */}
      <PayslipModal
        isOpen={!!selectedPayslip}
        onClose={() => setSelectedPayslip(null)}
        payslipData={selectedPayslip}
        token={token}
      />
    </div>
  );
}
