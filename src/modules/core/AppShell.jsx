import React, { useState } from 'react';
import { Menu, X, LogOut, Building2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
export default function AppShell({ user, onLogout, moduleColor = 'blue', moduleName, moduleIcon: ModuleIcon, tabs, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const colorMap = {
    blue:   { bg: 'bg-blue-600',   hover: 'hover:bg-blue-700',   light: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   accent: 'bg-blue-600' },
    emerald:{ bg: 'bg-emerald-600',hover: 'hover:bg-emerald-700',light: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200',accent: 'bg-emerald-600'},
    violet: { bg: 'bg-violet-600', hover: 'hover:bg-violet-700', light: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  accent: 'bg-violet-600'  },
    amber:  { bg: 'bg-amber-600',  hover: 'hover:bg-amber-700',  light: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   accent: 'bg-amber-600'   },
    slate:  { bg: 'bg-slate-800',  hover: 'hover:bg-slate-900',  light: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200',   accent: 'bg-slate-800'   },
  };
  const colors = colorMap[moduleColor] || colorMap.blue;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900 relative">
      {/* Global Watermark Branding Layer */}
      <div className="fixed inset-0 pointer-events-none select-none flex items-center justify-center z-0 overflow-hidden" aria-hidden="true">
        <img
          src="/logo.png"
          alt=""
          className="w-[480px] max-w-[50vw] opacity-[0.035] dark:opacity-[0.025] grayscale contrast-50 object-contain select-none pointer-events-none"
        />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 h-full flex flex-col border-r bg-white overflow-y-auto shrink-0
        fixed inset-y-0 left-0 z-50 transition-transform duration-200
        md:relative md:translate-x-0 md:z-10
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo / Module Header */}
        <div className={`p-4 border-b border-slate-100`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center shadow-sm`}>
              {ModuleIcon ? <ModuleIcon className="w-5 h-5 text-white" /> : <Building2 className="w-5 h-5 text-white" />}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cent Store ERP</p>
              <h1 className="font-bold text-sm text-slate-900">{moduleName}</h1>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-100">
          <div className={`rounded-lg p-3 ${colors.light} border ${colors.border}`}>
            <p className="text-xs text-slate-500 mb-0.5">Signed in as</p>
            <p className="font-semibold text-sm text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.light} ${colors.text} border ${colors.border} uppercase`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <p className="px-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navigation</p>
          <div className="space-y-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.id}
                  to={tab.path || `/${tab.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? `${colors.bg} text-white shadow-sm`
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {({ isActive }) => (
                    <>
                      {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />}
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className="ml-auto text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">
                          {tab.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Sign out (Pinned Bottom) */}
        <div className="p-3 border-t border-slate-100 mt-auto mb-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
              {ModuleIcon && <ModuleIcon className="w-4 h-4 text-white" />}
            </div>
            <span className="font-bold text-slate-900 text-sm">{moduleName}</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-slate-100 text-slate-600"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 h-full overflow-y-auto relative p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
