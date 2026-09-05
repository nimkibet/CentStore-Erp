import React, { useState } from 'react';
import { Users, Clock, Calculator, FileText } from 'lucide-react';
import StaffHRView from './StaffHRView';
import AttendanceView from './AttendanceView';
import PayrollWizard from './PayrollWizard';
import PayslipsView from './PayslipsView';

export default function HRModule({ token, currentUser }) {
  const [activeSubTab, setActiveSubTab] = useState('profiles');

  const subTabs = [
    { id: 'profiles', label: 'Staff Profiles & HR', icon: Users },
    { id: 'attendance', label: 'Time & Attendance', icon: Clock },
    // { id: 'payroll_wizard', label: 'Payroll Wizard', icon: Calculator },
    // { id: 'payslips', label: 'Payroll & Payslips', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Human Capital Management (HCM)</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage staff profiles, time & attendance clocking, statutory payroll generation, and employee payslips.
            </p>
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto pb-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-md text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-view Content Area */}
      <div>
        {activeSubTab === 'profiles' && <StaffHRView token={token} currentUser={currentUser} />}
        {activeSubTab === 'attendance' && <AttendanceView token={token} currentUser={currentUser} />}
        {activeSubTab === 'payroll_wizard' && <PayrollWizard token={token} currentUser={currentUser} />}
        {activeSubTab === 'payslips' && <PayslipsView token={token} currentUser={currentUser} />}
      </div>
    </div>
  );
}
