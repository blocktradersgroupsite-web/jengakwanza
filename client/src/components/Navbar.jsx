import React from 'react';
import { 
  Building2, 
  ShoppingCart, 
  Package, 
  Users, 
  Truck, 
  Receipt, 
  BarChart3, 
  Settings, 
  Store, 
  Lock, 
  ShieldCheck, 
  Bell,
  ChevronDown
} from 'lucide-react';

export default function Navbar({
  shops,
  currentShopId,
  onSelectShop,
  activeTab,
  onSelectTab,
  currentUser,
  onOpenUserModal,
  cartCount,
  lowStockCount
}) {
  const currentShop = shops.find(s => s.id === currentShopId);

  const navItems = [
    { id: 'pos', label: 'Point of Sale (POS)', icon: ShoppingCart, badge: cartCount > 0 ? cartCount : null, color: 'bg-emerald-500' },
    { id: 'inventory', label: 'Inventory & Stock', icon: Package, badge: lowStockCount > 0 ? `${lowStockCount} Low` : null, color: 'bg-amber-500' },
    { id: 'debtors', label: 'Customer Debtors & Credit', icon: Users },
    { id: 'procurement', label: 'Suppliers & POs', icon: Truck },
    { id: 'expenses', label: 'Daily Expenses', icon: Receipt },
    { id: 'analytics', label: 'Reports & P&L', icon: BarChart3 },
    { id: 'settings', label: 'Settings & Backup', icon: Settings },
  ];

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
      {/* Top Banner: Brand + Shop Switcher + User Info */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter shadow-md shadow-amber-500/20">
            JK
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wide text-white uppercase">
                Jenga Kwanza
              </span>
              <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Enterprise ERP
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Hardware & Multi-Shop Business Management</p>
          </div>
        </div>

        {/* Shop / Branch Switcher */}
        <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 rounded-xl p-1 px-3 shadow-inner">
          <Store className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-xs text-slate-400 font-medium">Active Branch:</span>
          <select 
            value={currentShopId}
            onChange={(e) => onSelectShop(e.target.value)}
            className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-2"
          >
            <option value="all" className="bg-slate-900 text-white">🏢 All Branches (Consolidated View)</option>
            {shops.map(shop => (
              <option key={shop.id} value={shop.id} className="bg-slate-900 text-white">
                {shop.isMain ? '⭐ ' : '🏬 '} {shop.name} ({shop.type})
              </option>
            ))}
          </select>
        </div>

        {/* User Role & Profile Switcher */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenUserModal}
            className="flex items-center space-x-2.5 bg-slate-800 hover:bg-slate-700 transition px-3 py-1.5 rounded-xl border border-slate-700 text-left group"
            title="Switch User / Lock POS"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              {currentUser.role === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-400 flex items-center space-x-1">
                <span>{currentUser.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="text-[10px] text-slate-400 capitalize flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                <span>Role: {currentUser.role}</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="px-4 flex overflow-x-auto no-scrollbar border-t border-slate-800/60 bg-slate-900/95">
        <nav className="flex space-x-1 py-1.5 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
