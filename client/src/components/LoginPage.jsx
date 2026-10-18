import React, { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Users, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  LogIn,
  RefreshCw,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import api from '../api';

export default function LoginPage({ users = [], settings, onLogin }) {
  // Selected Role: 'admin' (Store Owner) or 'cashier' (Employee / Staff)
  const [selectedRole, setSelectedRole] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Default fallback user profiles
  const adminUser = users.find(u => u.role === 'admin' || u.role === 'owner') || {
    id: 'usr-admin',
    username: 'admin',
    name: 'Store Owner / Director',
    role: 'admin',
    assignedShopId: 'all'
  };

  const cashierUser = users.find(u => u.role === 'cashier') || {
    id: 'usr-cashier',
    username: 'cashier',
    name: 'Cashier 1',
    role: 'cashier',
    assignedShopId: 'shop-main'
  };

  const managerUser = users.find(u => u.role === 'manager') || {
    id: 'usr-manager',
    username: 'manager',
    name: 'Store Manager',
    role: 'manager',
    assignedShopId: 'shop-main'
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Please type your password');
      return;
    }

    setLoading(true);

    try {
      if (selectedRole === 'admin') {
        // 1. Verify via API
        try {
          const res = await api.loginUser({ username: 'admin', password });
          if (res && res.id && (res.role === 'admin' || res.role === 'owner')) {
            onLogin(res);
            return;
          }
        } catch (apiErr) {
          // Fall back to local check
        }

        // 2. Check against admin password
        const cleanPassword = password.trim();
        if (
          cleanPassword === 'RUMULI2026' || 
          cleanPassword.toUpperCase() === 'RUMULI2026' ||
          cleanPassword === adminUser.password
        ) {
          onLogin(adminUser);
          return;
        }

        setError('Incorrect password for Store Owner. Please try again.');
        setLoading(false);
      } else {
        // Employee Sign In
        try {
          const res = await api.loginUser({ username: 'cashier', password });
          if (res && res.id) {
            onLogin({ ...res, role: 'cashier' });
            return;
          }
        } catch (apiErr) {
          // Fall back to local check
        }

        const cleanPassword = password.trim();

        // Check matched employee in stored list
        const matchedStaff = users.find(u => 
          u.role !== 'admin' && (u.password === cleanPassword || u.password === 'KAZINI2026')
        );

        if (
          cleanPassword === 'KAZINI2026' || 
          cleanPassword.toUpperCase() === 'KAZINI2026' ||
          cleanPassword === cashierUser.password ||
          cleanPassword === managerUser.password
        ) {
          onLogin(matchedStaff || cashierUser);
          return;
        }

        setError('Incorrect password for Employee. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Authentication failed. Please verify your password.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative select-none font-sans">
      
      {/* Background Brand Ambience */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#082825]/60 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* LOGO SECTION */}
        <div className="p-6 pb-4 text-center border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="max-w-[210px] mx-auto p-2.5 mb-3 bg-[#082825] border border-slate-700/70 rounded-2xl shadow-xl shadow-black/40 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt={settings?.businessName || 'Jenga Kwanza'} 
              className="max-h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-base font-extrabold uppercase tracking-wide text-white">
            {settings?.businessName || 'JENGA KWANZA HARDWARE & STORES'}
          </h1>
          <p className="text-xs text-amber-400 font-semibold mt-0.5">
            {settings?.tagline || 'OUR DUTY IS TO DELIGHT YOU.'}
          </p>
        </div>

        {/* ROLE SELECTION */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
            Select Role
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setPassword('');
                setError('');
              }}
              className={`py-3 px-3 rounded-2xl text-xs font-black transition flex flex-col items-center justify-center space-y-1.5 cursor-pointer border ${
                selectedRole === 'admin'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Store Owner</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('cashier');
                setPassword('');
                setError('');
              }}
              className={`py-3 px-3 rounded-2xl text-xs font-black transition flex flex-col items-center justify-center space-y-1.5 cursor-pointer border ${
                selectedRole === 'cashier'
                  ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Employee</span>
            </button>
          </div>
        </div>

        {/* PASSWORD FORM */}
        <form onSubmit={handleSignIn} className="p-5 sm:p-6 space-y-4">
          
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Type your password..."
                className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg transition disabled:opacity-40 cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                : 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/25'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In as {selectedRole === 'admin' ? 'Store Owner' : 'Employee'}</span>
              </>
            )}
          </button>
        </form>

      </div>

      {/* Official Business Contact & Support Card */}
      <div className="mt-5 w-full max-w-sm bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center z-10 text-xs shadow-xl backdrop-blur-xs space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-amber-400 font-extrabold">
          Owner & Head Office Contacts
        </div>
        <div className="flex items-center justify-center space-x-1.5 text-slate-300 font-bold">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>P.O.BOX 14991 ARUSHA</span>
        </div>
        <div className="flex items-center justify-center space-x-1.5 text-slate-300 font-bold">
          <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>0788989889 / 0713550104</span>
        </div>
        <div className="flex items-center justify-center space-x-1.5 text-slate-400">
          <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <a href="mailto:jengakwanzaltd@gmail.com" className="text-slate-300 hover:text-amber-400 font-medium transition">
            jengakwanzaltd@gmail.com
          </a>
        </div>
        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
          {settings?.copyrightNotice || '© 2026 JENGA KWANZA HARDWARE & STORES. All Rights Reserved.'}
        </div>
      </div>

    </div>
  );
}
