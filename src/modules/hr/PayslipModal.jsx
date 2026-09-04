import React, { useState } from 'react';
import { X, Printer, Building2, CheckCircle2, ShieldCheck, Download, AlertCircle } from 'lucide-react';

export default function PayslipModal({ isOpen, onClose, payslipData, token }) {
  if (!isOpen || !payslipData) return null;

  const emp = payslipData.employee || {};
  const earnings = payslipData.earnings || {};
  const deductions = payslipData.deductions || {};
  const [dlError, setDlError] = useState('');
  const [dlLoading, setDlLoading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!payslipData._id && !payslipData.id) {
      setDlError('No payslip ID available for download.');
      return;
    }
    setDlLoading(true);
    setDlError('');
    try {
      const id = payslipData._id || payslipData.id;
      const res = await fetch(`/api/erp/hcm/payroll/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('PDF generation failed on server.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslipData.payslipRef || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDlError('PDF download failed. Use Print as fallback.');
    } finally {
      setDlLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:p-0 print:bg-white print:static">
      <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Screen Controls Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Official Staff Payslip Preview</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              disabled={dlLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{dlLoading ? 'Generating...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Payslip</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {dlError && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 print:hidden">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {dlError}
          </div>
        )}

        {/* Printable Payslip Card */}
        <div className="space-y-6 p-4 border border-slate-200 rounded-md bg-white">
          {/* Header Branding */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900 tracking-tight">Cent Store ERP</h1>
                <p className="text-xs text-slate-500">Enterprise HR & Human Capital Management</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">PAYSLIP ADVICE</span>
              <p className="text-sm font-extrabold text-blue-600">{payslipData.payslipRef || 'PAY-ADVICE'}</p>
              <p className="text-xs text-slate-500">Period: {payslipData.payPeriod}</p>
            </div>
          </div>

          {/* Employee Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded border border-slate-200">
            <div>
              <p className="text-slate-500">Employee Name:</p>
              <p className="font-bold text-slate-900 text-sm">{emp.name || 'N/A'}</p>
              <p className="text-slate-500 mt-1">Position / Department:</p>
              <p className="font-semibold text-slate-800">{emp.position || 'Staff'} ({emp.department || 'General'})</p>
              <p className="text-slate-500 mt-1">Email:</p>
              <p className="text-slate-700">{emp.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500">Tax ID (KRA PIN):</p>
              <p className="font-semibold text-slate-900">{emp.taxId || 'N/A'}</p>
              <p className="text-slate-500 mt-1">NSSF / SHIF PIN:</p>
              <p className="font-semibold text-slate-800">{emp.nssfNumber || 'N/A'} / {emp.nhifNumber || 'N/A'}</p>
              <p className="text-slate-500 mt-1">Bank Account:</p>
              <p className="font-semibold text-slate-800">{emp.bankDetails?.bankName ? `${emp.bankDetails.bankName} - ${emp.bankDetails.accountNumber}` : 'N/A'}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {/* Earnings */}
            <div className="border border-slate-200 rounded overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 font-bold text-xs uppercase text-slate-700 border-b border-slate-200">
                Gross Earnings (KES)
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Basic Salary:</span>
                  <span className="font-medium text-slate-900">KES {(earnings.basicSalary || payslipData.basicSalary || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Allowances & Bonuses:</span>
                  <span className="font-medium text-slate-900">KES {(earnings.allowances || payslipData.allowances || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold text-sm text-slate-900">
                  <span>Gross Earnings:</span>
                  <span>KES {(earnings.grossSalary || payslipData.grossSalary || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="border border-slate-200 rounded overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 font-bold text-xs uppercase text-slate-700 border-b border-slate-200">
                Statutory Deductions (KES)
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">PAYE Tax:</span>
                  <span className="text-red-600 font-medium">KES {(deductions.paye || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">NSSF Contribution:</span>
                  <span className="text-red-600 font-medium">KES {(deductions.nssf || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">SHIF / NHIF:</span>
                  <span className="text-red-600 font-medium">KES {(deductions.shif || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Housing Levy:</span>
                  <span className="text-red-600 font-medium">KES {(deductions.housingLevy || 0).toLocaleString()}</span>
                </div>
                {deductions.loans > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Loans / Other:</span>
                    <span className="text-red-600 font-medium">KES {(deductions.loans || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-bold text-sm text-red-700">
                  <span>Total Deductions:</span>
                  <span>KES {(payslipData.totalDeductions || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Highlighted Net Pay Box */}
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">NET PAYABLE AMOUNT</p>
              <p className="text-xs text-emerald-600">Transferred via Direct Bank Credit</p>
            </div>
            <div className="text-2xl font-extrabold text-emerald-700">
              KES {(payslipData.netSalary || 0).toLocaleString()}
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-slate-400 pt-4 border-t">
            This is a computer-generated payslip advice issued by CentStore ERP System. No physical signature required.
          </div>
        </div>
      </div>
    </div>
  );
}
