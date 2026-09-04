import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Plus, Edit, DollarSign, Building, CheckCircle2, XCircle } from 'lucide-react';
import AddStaffModal from './AddStaffModal';
import EditStaffModal from './EditStaffModal';

export default function StaffHRView({ token, currentUser }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStaffToEdit, setSelectedStaffToEdit] = useState(null);

  const fetchStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/erp/hcm/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch staff profiles');
      }
      const data = await response.json();
      setStaffList(data.data || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [token]);

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.department && s.department.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = departmentFilter === 'All' || s.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const departmentsList = Array.from(new Set(staffList.map((s) => s.department || 'General')));

  const totalPayrollBase = staffList.reduce((sum, s) => sum + ((s.basicSalary || 0) + (s.allowances || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Top Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Staff Headcount</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{staffList.length}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Departments</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{departmentsList.length}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Gross Payroll Base</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">KES {totalPayrollBase.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Departments</option>
              {departmentsList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading staff profiles...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">Error: {error}</div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No staff members found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Dept & Position</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Basic Salary</th>
                  <th className="px-4 py-3 text-right">Allowances</th>
                  <th className="px-4 py-3 text-right">Gross Est.</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStaff.map((staff) => {
                  const basic = staff.basicSalary || 0;
                  const allow = staff.allowances || 0;
                  const gross = basic + allow;
                  return (
                    <tr key={staff._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{staff.name}</div>
                        <div className="text-xs text-slate-400">{staff.email}</div>
                        {staff.taxId && <div className="text-[11px] text-slate-400">PIN: {staff.taxId}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{staff.department || 'General'}</div>
                        <div className="text-xs text-slate-500">{staff.position || staff.role}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        KES {basic.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        KES {allow.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        KES {gross.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {staff.status === 'active' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="w-3 h-3" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedStaffToEdit(staff)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 text-xs font-medium transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Profile</span>
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

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onStaffAdded={() => fetchStaff()}
        token={token}
      />

      {/* Edit Staff Modal */}
      <EditStaffModal
        isOpen={!!selectedStaffToEdit}
        onClose={() => setSelectedStaffToEdit(null)}
        staff={selectedStaffToEdit}
        onStaffUpdated={() => fetchStaff()}
        token={token}
      />
    </div>
  );
}
