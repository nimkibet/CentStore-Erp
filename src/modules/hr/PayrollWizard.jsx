import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, RefreshCw, DollarSign, ShieldAlert } from 'lucide-react';

export default function PayrollWizard({ token, currentUser }) {
  const [step, setStep] = useState(1);
  const [payPeriod, setPayPeriod] = useState('2026-08');
  const [department, setDepartment] = useState('All');
  
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch active staff for preview
  const fetchStaffForPreview = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/erp/hcm/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch staff for payroll preview');
      const data = await response.json();
      setStaffList(data.filter((s) => s.status === 'active'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffForPreview();
  }, [token]);

  // Client-side statutory calculation preview formula (matches backend engine)
  const computeStatutoryPreview = (basicSalary = 0, allowances = 0, customDeductions = 0) => {
    const grossSalary = basicSalary + allowances;

    let nssf = 0;
    if (grossSalary > 0) {
      const tier1 = Math.min(grossSalary, 7000) * 0.06;
      const tier2 = Math.max(0, Math.min(grossSalary, 36000) - 7000) * 0.06;
      nssf = Math.round(tier1 + tier2);
    }

    let shif = 0;
    if (grossSalary > 0) {
      shif = Math.max(300, Math.round(grossSalary * 0.0275));
    }

    let housingLevy = 0;
    if (grossSalary > 0) {
      housingLevy = Math.round(grossSalary * 0.015);
    }

    const taxableIncome = Math.max(0, grossSalary - nssf);
    let grossTax = 0;
    if (taxableIncome <= 24000) {
      grossTax = taxableIncome * 0.10;
    } else if (taxableIncome <= 32333) {
      grossTax = (24000 * 0.10) + ((taxableIncome - 24000) * 0.25);
    } else if (taxableIncome <= 500000) {
      grossTax = (24000 * 0.10) + (8333 * 0.25) + ((taxableIncome - 32333) * 0.30);
    } else {
      grossTax = (24000 * 0.10) + (8333 * 0.25) + (467667 * 0.30) + ((taxableIncome - 500000) * 0.325);
    }

    const personalRelief = 2400;
    const paye = Math.max(0, Math.round(grossTax - personalRelief));

    const totalDeductions = paye + nssf + shif + housingLevy + customDeductions;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    return { grossSalary, paye, nssf, shif, housingLevy, customDeductions, totalDeductions, netSalary };
  };

  const filteredStaff = department === 'All'
    ? staffList
    : staffList.filter((s) => s.department === department);

  const previewRecords = filteredStaff.map((staff) => {
    const basic = staff.basicSalary || 0;
    const allow = staff.allowances || 0;
    const loans = staff.statutoryDeductions || 0;
    const calc = computeStatutoryPreview(basic, allow, loans);
    return { staff, ...calc };
  });

  const totalGrossBatch = previewRecords.reduce((acc, r) => acc + r.grossSalary, 0);
  const totalDeductionsBatch = previewRecords.reduce((acc, r) => acc + r.totalDeductions, 0);
  const totalNetBatch = previewRecords.reduce((acc, r) => acc + r.netSalary, 0);

  const handleGeneratePayrollRun = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch('/api/erp/hcm/payroll/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ payPeriod, department })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate payroll batch');
      }

      setSuccessMsg(data.message || `Payroll run for period ${payPeriod} successfully generated!`);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wizard Progress Bar */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              1
            </div>
            <span className="hidden sm:inline">Period & Parameters</span>
          </div>

          <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />

          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              2
            </div>
            <span className="hidden sm:inline">Statutory Calculation Preview</span>
          </div>

          <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />

          <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              3
            </div>
            <span className="hidden sm:inline">Process & Finalize</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Select Period & Parameters */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 1: Select Pay Period & Target Scope</h2>
              <p className="text-xs text-slate-500">Configure period and target department for automated statutory payroll run.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Pay Period (YYYY-MM)</label>
              <input
                type="month"
                value={payPeriod}
                onChange={(e) => setPayPeriod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Target Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
              >
                <option value="All">All Departments ({staffList.length} Active Staff)</option>
                {Array.from(new Set(staffList.map((s) => s.department || 'General'))).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Statutory Rates Card */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs text-slate-600">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <span>Standard Statutory Rules Applied</span>
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>PAYE (Tax)</strong>: Progressive Kenya tax brackets (10%, 25%, 30%) with KES 2,400 monthly relief.</li>
              <li><strong>NSSF</strong>: Tier I & II retirement contribution capped at KES 2,160.</li>
              <li><strong>SHIF / NHIF</strong>: Universal Health Insurance at 2.75% of gross pay (min KES 300).</li>
              <li><strong>Housing Levy</strong>: Affordable Housing Levy at 1.5% of gross salary.</li>
            </ul>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              disabled={previewRecords.length === 0}
              className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              <span>Calculate & Preview Batch ({previewRecords.length} Staff)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Batch Calculation & Preview Table */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-semibold">Total Gross Payroll</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">KES {totalGrossBatch.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-semibold">Total Statutory Deductions</p>
              <p className="text-2xl font-bold text-red-600 mt-1">KES {totalDeductionsBatch.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-semibold">Total Net Disbursement</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">KES {totalNetBatch.toLocaleString()}</p>
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Payroll Calculation Preview ({payPeriod})</h3>
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                {previewRecords.length} Employees Target
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3 text-right">Basic</th>
                    <th className="px-4 py-3 text-right">Allowances</th>
                    <th className="px-4 py-3 text-right">Gross Pay</th>
                    <th className="px-4 py-3 text-right">PAYE Tax</th>
                    <th className="px-4 py-3 text-right">NSSF</th>
                    <th className="px-4 py-3 text-right">SHIF</th>
                    <th className="px-4 py-3 text-right">Housing Levy</th>
                    <th className="px-4 py-3 text-right">Tot. Deductions</th>
                    <th className="px-4 py-3 text-right">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewRecords.map((r) => (
                    <tr key={r.staff._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{r.staff.name}</div>
                        <div className="text-xs text-slate-400">{r.staff.department || 'General'}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        KES {(r.staff.basicSalary || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        KES {(r.staff.allowances || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        KES {r.grossSalary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        KES {r.paye.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        KES {r.nssf.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        KES {r.shif.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        KES {r.housingLevy.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-red-700">
                        KES {r.totalDeductions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        KES {r.netSalary.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <button
              onClick={() => setStep(1)}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-md font-medium text-sm hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Scope</span>
            </button>

            <button
              onClick={handleGeneratePayrollRun}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 text-white rounded-md font-bold text-sm hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Payroll Batch...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Execute Payroll Run ({payPeriod})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Confirmation & Finalize */}
      {step === 3 && (
        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Payroll Run Finalized!</h2>
            <p className="text-sm text-slate-600">{successMsg}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Pay Period:</span>
              <span className="font-bold text-slate-900">{payPeriod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Staff Processed:</span>
              <span className="font-bold text-slate-900">{previewRecords.length} Employees</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Net Payout:</span>
              <span className="font-bold text-emerald-600">KES {totalNetBatch.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-center space-x-4 pt-2">
            <button
              onClick={() => { setStep(1); setSuccessMsg(''); }}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 transition"
            >
              Start Another Payroll Run
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
