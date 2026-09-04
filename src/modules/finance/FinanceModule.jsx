import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AppShell from '../core/AppShell';
import DashboardView from './DashboardView';
import GeneralLedgerView from './GeneralLedgerView';
import APARView from './APARView';
import FinancialReportsView from './FinancialReportsView';
import { BookOpen, Receipt, BarChart3, LayoutDashboard } from 'lucide-react';

const FINANCE_TABS = [
  { id: 'dashboard',       path: '/dashboard',       label: 'Finance Overview',    icon: LayoutDashboard },
  { id: 'finance-gl',      path: '/finance-gl',      label: 'General Ledger & COA', icon: BookOpen },
  { id: 'finance-apar',    path: '/finance-apar',    label: 'AP & AR Management',  icon: Receipt },
  { id: 'finance-reports', path: '/finance-reports', label: 'Financial Reports',   icon: BarChart3 },
];

export default function FinanceModule({ token, user, onLogout }) {
  const navigate = useNavigate();

  const handleNavigateTab = (tabId) => {
    navigate(`/${tabId}`);
  };

  const renderContent = () => (
    <Routes>
      <Route path="/dashboard"       element={<DashboardView token={token} onNavigateTab={handleNavigateTab} />} />
      <Route path="/finance-gl"      element={<GeneralLedgerView token={token} userRole={user?.role} />} />
      <Route path="/finance-apar"    element={<APARView token={token} userRole={user?.role} />} />
      <Route path="/finance-reports" element={<FinancialReportsView token={token} userRole={user?.role} />} />
      <Route path="*"                element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );

  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      moduleColor="emerald"
      moduleName="Finance Management"
      moduleIcon={BarChart3}
      tabs={FINANCE_TABS}
    >
      {renderContent()}
    </AppShell>
  );
}
