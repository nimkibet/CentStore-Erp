import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '../core/AppShell';
import OrdersView from '../sales/OrdersView';
import CustomersView from '../sales/CustomersView';
import WebsiteAdminPanel from './WebsiteAdminPanel';
import { Globe, ShoppingBag, Users, Settings } from 'lucide-react';

const WEBADMIN_TABS = [
  { id: 'website',   path: '/website',   label: 'Website Admin Panel', icon: Globe },
  { id: 'orders',    path: '/orders',    label: 'Online Orders',        icon: ShoppingBag },
  { id: 'customers', path: '/customers', label: 'Customers / CRM',      icon: Users },
];

export default function WebAdminModule({ token, user, onLogout }) {
  const renderContent = () => (
    <Routes>
      <Route path="/website"   element={<WebsiteAdminPanel token={token} />} />
      <Route path="/orders"    element={<OrdersView token={token} userRole={user?.role} />} />
      <Route path="/customers" element={<CustomersView token={token} />} />
      <Route path="*"          element={<Navigate to="/website" replace />} />
    </Routes>
  );

  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      moduleColor="violet"
      moduleName="Web Admin Portal"
      moduleIcon={Globe}
      tabs={WEBADMIN_TABS}
    >
      {renderContent()}
    </AppShell>
  );
}
