import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './modules/auth/Login';
import CEOModule from './modules/ceo/CEOModule';
import FinanceModule from './modules/finance/FinanceModule';
import CashierModule from './modules/sales/CashierModule';
import WebAdminModule from './modules/webadmin/WebAdminModule';
import HRModule from './modules/hr/HRModule';
import AppShell from './modules/core/AppShell';
import { Users, Clock, ShieldCheck } from 'lucide-react';
import { ToastProvider } from './modules/core/ToastContext';

const HR_TABS = [
  { id: 'dashboard', path: '/dashboard', label: 'HCM Portal', icon: ShieldCheck },
  { id: 'staff', path: '/staff', label: 'Staff Directory', icon: Users },
  { id: 'attendance', path: '/attendance', label: 'Time & Attendance', icon: Clock },
];

function HRAppModule({ token, user, onLogout }) {
  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      moduleColor="violet"
      moduleName="Human Capital Management"
      moduleIcon={ShieldCheck}
      tabs={HR_TABS}
    >
      <Routes>
        <Route path="/dashboard" element={<HRModule token={token} currentUser={user} />} />
        <Route path="/staff" element={<HRModule token={token} currentUser={user} />} />
        <Route path="/attendance" element={<HRModule token={token} currentUser={user} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

const MODULE_MAP = {
  CEO:      CEOModule,
  Finance:  FinanceModule,
  Cashier:  CashierModule,
  WebAdmin: WebAdminModule,
  HR:       HRAppModule,
};

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  );
}

function AppRoutes() {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem('erp_token');
    const savedUser  = localStorage.getItem('erp_user');
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {
        localStorage.clear();
      }
    }
    setIsInitializing(false);
  }, []);

  const handleLoginSuccess = (staffObj, jwtToken) => {
    setUser(staffObj);
    setToken(jwtToken);
    localStorage.setItem('erp_token', jwtToken);
    localStorage.setItem('erp_user', JSON.stringify(staffObj));
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    navigate('/login');
  };

  if (isInitializing) return null;

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!token ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate replace to="/dashboard" />} 
      />
      <Route 
        path="/*" 
        element={
          token ? (
            <ProtectedRoute user={user} token={token} onLogout={handleLogout} />
          ) : (
            <Navigate replace to="/login" />
          )
        } 
      />
    </Routes>
  );
}

function ProtectedRoute({ user, token, onLogout }) {
  const role = user?.role || '';
  const ModuleComponent = MODULE_MAP[role] || MODULE_MAP[role?.toUpperCase?.()] || (role?.toLowerCase?.().includes('hr') ? MODULE_MAP.HR : null);

  if (!ModuleComponent) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            The role <span className="text-yellow-400 font-mono">{role}</span> does not have a configured module.
          </p>
          <button
            onClick={onLogout}
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <ModuleComponent token={token} user={user} onLogout={onLogout} />;
}
