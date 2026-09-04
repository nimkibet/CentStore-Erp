import React from 'react';
import { 
  LayoutDashboard, Package, ShoppingCart, ShoppingBag, 
  Users, LogOut, ShieldCheck, Building2, BookOpen, Receipt, BarChart3,
  Truck, Store, ClipboardList
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, isOpen }) {
  const role = user?.role || 'Admin';
  const permissions = user?.permissions || [];
  const isAdmin = permissions.includes('admin') || permissions.length === 0;

  const allTabs = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, permission: 'tab:dashboard' },
    { id: 'finance-gl', label: 'General Ledger & COA', icon: BookOpen, permission: 'finance:read' },
    { id: 'finance-apar', label: 'AP & AR Management', icon: Receipt, permission: 'finance:read' },
    { id: 'finance-reports', label: 'Financial Reports', icon: BarChart3, permission: 'finance:read' },
    { id: 'inventory', label: 'Inventory', icon: Package, permission: 'inventory:read' },
    { id: 'scm-vendors', label: 'Vendors', icon: Store, permission: 'scm:read' },
    { id: 'scm-warehouses', label: 'Warehouses', icon: Building2, permission: 'scm:read' },
    { id: 'scm-po', label: 'Purchase Orders', icon: ClipboardList, permission: 'scm:read' },
    { id: 'pos', label: 'POS / Sales', icon: ShoppingCart, permission: 'tab:pos' },
    { id: 'orders', label: 'Online Orders', icon: ShoppingBag, permission: 'tab:orders' },
    { id: 'customers', label: 'CRM / Customers', icon: Users, permission: 'tab:customers' },
    { id: 'staff', label: 'Staff & HR (HCM)', icon: ShieldCheck, permission: 'tab:staff' },
    { id: 'settings', label: 'System Settings', icon: Truck, permission: 'tab:settings' },
  ];

  const visibleTabs = allTabs.filter(
    (tab) =>
      isAdmin ||
      permissions.includes(tab.permission) ||
      role === 'CEO' ||
      role === 'Finance' ||
      tab.permission === 'tab:dashboard'
  );

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setActiveTab(activeTab)}></div>
      )}
      
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 flex-shrink-0 transition-transform md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          <div className="flex items-center justify-between px-2 py-4 mb-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center shadow-sm">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900 tracking-tight">Cent Store</h1>
                <p className="text-xs text-slate-500 font-medium">Enterprise ERP Portal</p>
              </div>
            </div>
          </div>

          <div className="mb-6 px-2">
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 font-medium">Logged in as</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 uppercase border-slate-200">
                  {role}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Staff User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'staff@centstore.com'}</p>
            </div>
          </div>

          <nav className="space-y-1">
            <div className="px-2 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Main Navigation
            </div>
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-200 mt-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
