import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '../core/AppShell';
import POSView from './POSView';
import OrdersView from './OrdersView';
import { ShoppingCart, ShoppingBag } from 'lucide-react';

const CASHIER_TABS = [
  { id: 'pos',    path: '/pos',    label: 'POS Terminal',   icon: ShoppingCart },
  { id: 'orders', path: '/orders', label: 'Today\'s Orders', icon: ShoppingBag },
];

export default function CashierModule({ token, user, onLogout }) {
  const renderContent = () => (
    <Routes>
      <Route path="/pos"    element={<POSView token={token} staffUser={user} />} />
      <Route path="/orders" element={<OrdersView token={token} userRole={user?.role} posOnly />} />
      <Route path="*"       element={<Navigate to="/pos" replace />} />
    </Routes>
  );

  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      moduleColor="amber"
      moduleName="POS Terminal"
      moduleIcon={ShoppingCart}
      tabs={CASHIER_TABS}
    >
      {renderContent()}
    </AppShell>
  );
}
