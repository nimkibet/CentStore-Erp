import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import AddStaffModal from './AddStaffModal';

export default function StaffView({ token }) {
  const [staffList, setStaffList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/erp/staff', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStaffList(data.data || data);
      }
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Deactivate and delete this staff member account?')) return;
    try {
      const response = await fetch(`/api/erp/staff/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        fetchStaff();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete staff member');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const roleColors = {
    Admin: 'bg-purple-50 text-purple-700 border-purple-200',
    Manager: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Cashier: 'bg-amber-50 text-amber-700 border-amber-200',
    WebAdmin: 'bg-blue-50 text-blue-700 border-blue-200',
    CEO: 'bg-purple-50 text-purple-700 border-purple-200',
    Finance: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
          <p className="text-sm text-slate-500">Manage team access and roles.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-md bg-blue-600 text-white font-medium text-sm shadow-sm hover:bg-blue-700 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden flex flex-col h-[600px]">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left text-sm text-slate-600 relative">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">Staff Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {staffList.map((staff, idx) => (
                <tr key={staff._id} className={`hover:bg-slate-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {staff.name}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {staff.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase border ${roleColors[staff.role] || roleColors.Admin}`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {staff.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {staff.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteStaff(staff._id)}
                      className="text-slate-400 hover:text-red-600 transition"
                      title="Deactivate account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {staffList.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-sm bg-white">
                    No staff members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStaffAdded={() => fetchStaff()}
        token={token}
      />
    </div>
  );
}
