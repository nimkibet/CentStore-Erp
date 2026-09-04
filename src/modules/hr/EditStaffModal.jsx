import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertCircle, Save, Building, DollarSign, CreditCard } from 'lucide-react';

export default function EditStaffModal({ isOpen, onClose, staff, onStaffUpdated, token }) {
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('full_time');
  const [basicSalary, setBasicSalary] = useState(0);
  const [allowances, setAllowances] = useState(0);
  const [statutoryDeductions, setStatutoryDeductions] = useState(0);
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [nhifNumber, setNhifNumber] = useState('');
  const [nssfNumber, setNssfNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [status, setStatus] = useState('active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (staff) {
      setDepartment(staff.department || 'General');
      setPosition(staff.position || staff.role || '');
      setEmploymentStatus(staff.employmentStatus || 'full_time');
      setBasicSalary(staff.basicSalary || 0);
      setAllowances(staff.allowances || 0);
      setStatutoryDeductions(staff.statutoryDeductions || 0);
      setPhone(staff.phone || '');
      setTaxId(staff.taxId || '');
      setNhifNumber(staff.nhifNumber || '');
      setNssfNumber(staff.nssfNumber || '');
      setBankName(staff.bankDetails?.bankName || '');
      setAccountNumber(staff.bankDetails?.accountNumber || '');
      setBankCode(staff.bankDetails?.bankCode || '');
      setStatus(staff.status || 'active');
    }
  }, [staff]);

  if (!isOpen || !staff) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        department,
        position,
        employmentStatus,
        basicSalary: Number(basicSalary),
        allowances: Number(allowances),
        statutoryDeductions: Number(statutoryDeductions),
        phone,
        taxId,
        nhifNumber,
        nssfNumber,
        bankDetails: {
          bankName,
          accountNumber,
          bankCode
        },
        status
      };

      const response = await fetch(`/api/erp/hcm/employees/${staff._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update employee profile');
      }

      onStaffUpdated(data.staff);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-md bg-blue-50 text-blue-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Edit Staff HR & Compensation Profile</h2>
              <p className="text-xs text-slate-500">{staff.name} ({staff.email})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Employment & Position */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2 border-b pb-1">
              <Building className="w-4 h-4 text-slate-500" />
              <span>Employment & Position</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Finance, Operations"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Position / Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Accountant"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Employment Type</label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Account Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Compensation Breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2 border-b pb-1">
              <DollarSign className="w-4 h-4 text-slate-500" />
              <span>Compensation Structure (KES)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Basic Salary (Monthly)</label>
                <input
                  type="number"
                  min="0"
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Fixed Allowances</label>
                <input
                  type="number"
                  min="0"
                  value={allowances}
                  onChange={(e) => setAllowances(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Other / Loan Deductions</label>
                <input
                  type="number"
                  min="0"
                  value={statutoryDeductions}
                  onChange={(e) => setStatutoryDeductions(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Statutory IDs & Banking */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2 border-b pb-1">
              <CreditCard className="w-4 h-4 text-slate-500" />
              <span>Statutory IDs & Banking Details</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">KRA PIN (Tax ID)</label>
                <input
                  type="text"
                  placeholder="e.g. A001234567Z"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">SHIF / NHIF Number</label>
                <input
                  type="text"
                  placeholder="e.g. SHIF-987654"
                  value={nhifNumber}
                  onChange={(e) => setNhifNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">NSSF Number</label>
                <input
                  type="text"
                  placeholder="e.g. NSSF-123456"
                  value={nssfNumber}
                  onChange={(e) => setNssfNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. KCB, Equity Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Account Number</label>
                <input
                  type="text"
                  placeholder="e.g. 1100223344"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Contact</label>
                <input
                  type="text"
                  placeholder="+254700000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
