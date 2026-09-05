import React, { useState } from 'react';
import AppShell from '../core/AppShell';
import CEODashboard from './CEODashboard';
import GeneralLedgerView from '../finance/GeneralLedgerView';
import APARView from '../finance/APARView';
import FinancialReportsView from '../finance/FinancialReportsView';
import InventoryView from '../inventory/InventoryView';
import VendorView from '../inventory/VendorView';
import WarehouseView from '../inventory/WarehouseView';
import POView from '../inventory/POView';
import POSView from '../sales/POSView';
import OrdersView from '../sales/OrdersView';
import CustomersView from '../sales/CustomersView';
import HRModule from '../hr/HRModule';
import SettingsView from '../core/SettingsView';
import {
  LayoutDashboard, BookOpen, Receipt, BarChart3, Package,
  Store, Building2, ClipboardList, ShoppingCart, ShoppingBag,
  Users, ShieldCheck, Settings, TrendingUp
} from 'lucide-react';

import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

const CEO_TABS = [
  { id: 'dashboard',       path: '/dashboard',       label: 'Executive Dashboard', icon: LayoutDashboard },
  { id: 'analytics',       path: '/analytics',       label: 'Sales & Analytics',   icon: TrendingUp },
  // { id: 'finance-gl',      path: '/finance-gl',      label: 'General Ledger',       icon: BookOpen },
  // { id: 'finance-apar',    path: '/finance-apar',    label: 'AP & AR',              icon: Receipt },
  // { id: 'finance-reports', path: '/finance-reports', label: 'Financial Reports',    icon: BarChart3 },
  { id: 'inventory',       path: '/inventory',       label: 'Inventory',            icon: Package },
  { id: 'scm-vendors',     path: '/scm-vendors',     label: 'Vendors',              icon: Store },
  { id: 'scm-warehouses',  path: '/scm-warehouses',  label: 'Warehouses',           icon: Building2 },
  { id: 'scm-po',          path: '/scm-po',          label: 'Purchase Orders',      icon: ClipboardList },
  { id: 'pos',             path: '/pos',             label: 'POS Terminal',          icon: ShoppingCart },
  { id: 'orders',          path: '/orders',          label: 'Online Orders',         icon: ShoppingBag },
  { id: 'customers',       path: '/customers',       label: 'Customers',             icon: Users },
  { id: 'staff',           path: '/staff',           label: 'HR & Payroll',          icon: ShieldCheck },
  { id: 'settings',        path: '/settings',        label: 'System Settings',       icon: Settings },
];

export default function CEOModule({ token, user, onLogout }) {
  const navigate = useNavigate();
  
  const handleNavigateTab = (tabId) => {
    navigate(`/${tabId}`);
  };

  const renderContent = () => (
    <Routes>
      <Route path="/dashboard"       element={<CEODashboard token={token} onNavigateTab={handleNavigateTab} />} />
      <Route path="/analytics"       element={<CEODashboard token={token} onNavigateTab={handleNavigateTab} analyticsMode />} />
      <Route path="/finance-gl"      element={<GeneralLedgerView token={token} userRole={user?.role} />} />
      <Route path="/finance-apar"    element={<APARView token={token} userRole={user?.role} />} />
      <Route path="/finance-reports" element={<FinancialReportsView token={token} userRole={user?.role} />} />
      <Route path="/inventory"       element={<InventoryView token={token} userRole={user?.role} />} />
      <Route path="/scm-vendors"     element={<VendorView token={token} userRole={user?.role} />} />
      <Route path="/scm-warehouses"  element={<WarehouseView token={token} userRole={user?.role} />} />
      <Route path="/scm-po"          element={<POView token={token} userRole={user?.role} />} />
      <Route path="/pos"             element={<POSView token={token} staffUser={user} />} />
      <Route path="/orders"          element={<OrdersView token={token} userRole={user?.role} />} />
      <Route path="/customers"       element={<CustomersView token={token} />} />
      <Route path="/staff"           element={<HRModule token={token} currentUser={user} />} />
      <Route path="/settings"        element={<SettingsView token={token} />} />
      <Route path="*"                element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );

  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      moduleColor="blue"
      moduleName="CEO Portal"
      moduleIcon={LayoutDashboard}
      tabs={CEO_TABS}
    >
      {renderContent()}
    </AppShell>
  );
}
