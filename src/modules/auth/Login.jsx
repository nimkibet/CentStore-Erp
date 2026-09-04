import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, Database, LayoutDashboard } from 'lucide-react';


export default function Login({ onLoginSuccess }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async (e, loginEmail = email, loginPass = password) => {
    if (e) e.preventDefault();
    if (!loginEmail || !loginPass) { setError('Please enter your credentials'); return; }
    
    setEmail(loginEmail);
    setPassword(loginPass);
    setLoading(true);
    setError('');
    
    try {
      const res  = await fetch('/api/erp/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: loginEmail, password: loginPass })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      onLoginSuccess(data.staff, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans relative overflow-hidden">
      {/* Global Watermark Branding Layer */}
      <div className="fixed inset-0 pointer-events-none select-none flex items-center justify-center z-0 overflow-hidden" aria-hidden="true">
        <img
          src="/logo.png"
          alt=""
          className="w-[480px] max-w-[50vw] opacity-[0.035] dark:opacity-[0.025] grayscale contrast-50 object-contain select-none pointer-events-none"
        />
      </div>

      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative z-10 flex-col justify-between overflow-hidden">
        {/* Abstract Background Glows */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-blue-600 blur-3xl mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] rounded-full bg-emerald-600 blur-3xl mix-blend-screen" />
        </div>

        {/* Logo Watermark — massive Seekon-style background blend */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none bg-[url('/logo.png')] bg-no-repeat bg-center opacity-10 mix-blend-overlay grayscale"
          style={{ backgroundSize: '120%' }}
          aria-hidden="true"
        />

        {/* Panel Content */}
        <div className="relative z-10 p-12 lg:p-20 h-full flex flex-col justify-between">
          <div>
            {/* Brand Header — use actual logo */}
            <div className="flex items-center space-x-3 mb-16">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img src="/logo.png" alt="CentStore" className="w-10 h-10 object-contain" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">Cent Store</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight md:leading-snug tracking-tighter mb-6">
              Enterprise Resource <br /> Planning System
            </h1>
            <p className="text-lg text-slate-300 max-w-lg leading-relaxed">
              The central hub for managing inventory, human capital, financials, and supply chain logistics. Authorized personnel only.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 max-w-lg">
            <div className="flex items-center space-x-3 text-slate-300">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium">Enterprise Security</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-300">
              <Database className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium">Real-time Data Sync</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-300">
              <LayoutDashboard className="w-5 h-5 text-violet-400" />
              <span className="text-sm font-medium">Unified Dashboard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-0 relative z-10 overflow-hidden">
        {/* Subtle Watermark Overlay for Login Column */}
        <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center z-0 overflow-hidden" aria-hidden="true">
          <img
            src="/logo.png"
            alt=""
            className="w-[480px] max-w-[50vw] opacity-[0.035] dark:opacity-[0.025] grayscale contrast-50 object-contain select-none pointer-events-none"
          />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center space-x-3 mb-10 justify-center">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/logo.png" alt="CentStore" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">Cent Store ERP</span>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Welcome back</h2>
            <p className="text-slate-500">Please sign in to your staff account.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-200 flex items-start space-x-3 animate-in fade-in zoom-in duration-300">
              <ShieldCheck className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Work Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  placeholder="name@centstore.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 px-4 bg-slate-900 text-white rounded-xl text-sm font-semibold shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed group mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in securely
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

