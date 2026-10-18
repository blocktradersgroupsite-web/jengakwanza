import React, { useState } from 'react';
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
  ChevronDown,
  FileText,
  Boxes,
  LogOut,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Clock,
  X,
  HardDrive
} from 'lucide-react';

export default function Navbar({
  shops,
  currentShopId,
  onSelectShop,
  activeTab,
  onSelectTab,
  currentUser,
  onOpenUserModal,
  onLogout,
  cartCount,
  lowStockCount,
  proformasCount,
  deliveriesCount,
  isOnline = true,
  pendingCount = 0,
  isSyncing = false,
  queueItems = [],
  onTriggerSync
}) {
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const currentShop = shops.find(s => s.id === currentShopId);
  const isOwner = currentUser?.role === 'admin';

  // All available system modules
  const allNavItems = [
    { id: 'pos', label: 'Point of Sale (POS)', icon: ShoppingCart, badge: cartCount > 0 ? cartCount : null, color: 'bg-emerald-500', ownerOnly: false },
    { id: 'proformas', label: 'Proforma Invoices', icon: FileText, badge: proformasCount > 0 ? proformasCount : null, color: 'bg-amber-500', ownerOnly: false },
    { id: 'deliveries', label: 'Delivery Notes', icon: Truck, badge: deliveriesCount > 0 ? deliveriesCount : null, color: 'bg-blue-500', ownerOnly: false },
    { id: 'debtors', label: 'Customer Debtors & Credit', icon: Users, ownerOnly: false },
    { id: 'inventory', label: 'Inventory & Stock', icon: Package, badge: lowStockCount > 0 ? `${lowStockCount} Low` : null, color: 'bg-amber-500', ownerOnly: true },
    { id: 'procurement', label: 'Suppliers & POs', icon: Boxes, ownerOnly: true },
    { id: 'expenses', label: 'Daily Expenses', icon: Receipt, ownerOnly: true },
    { id: 'analytics', label: 'Reports & P&L', icon: BarChart3, ownerOnly: true },
    { id: 'settings', label: 'Settings & Backup', icon: Settings, ownerOnly: true },
  ];

  // Restrict items if logged in as employee / cashier
  const navItems = isOwner ? allNavItems : allNavItems.filter(item => !item.ownerOnly);

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md select-none">
      {/* Top Banner: Brand + Network Status + Shop Switcher + User Info */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="h-8 sm:h-10 px-1.5 sm:px-2 rounded-xl bg-[#082825] border border-slate-700/70 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
            <img 
              src="/logo.png" 
              alt="Jenga Kwanza Logo" 
              className="h-6 sm:h-8 w-auto max-w-[100px] sm:max-w-[130px] object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-extrabold text-sm sm:text-lg tracking-wide text-white uppercase">
                Jenga Kwanza
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 sm:px-2 py-0.2 rounded-full uppercase tracking-wider">
                {isOwner ? '👑 Owner' : '👷 Staff'}
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400 font-medium">Hardware & Multi-Shop Business Management</p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 ml-auto">
          
          {/* Offline / Online Network Status Badge */}
          {!isOnline ? (
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition cursor-pointer shadow-xs"
              title="Working in Offline Mode. Click to view pending sync details."
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[11px] sm:text-xs">Offline</span>
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                  {pendingCount}
                </span>
              )}
            </button>
          ) : isSyncing ? (
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              <span className="text-[11px] sm:text-xs">Syncing ({pendingCount})...</span>
            </button>
          ) : pendingCount > 0 ? (
            <button
              onClick={() => {
                if (onTriggerSync) onTriggerSync();
                else setIsSyncModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1 sm:py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
              title="Click to sync offline transactions now"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] sm:text-xs">Sync ({pendingCount})</span>
            </button>
          ) : (
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="hidden sm:flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 transition cursor-pointer"
              title="Connected to server. All transactions synced."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              <span className="text-[11px] sm:text-xs font-semibold">Online</span>
            </button>
          )}

          {/* Shop / Branch Switcher */}
          <div className="flex items-center space-x-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl p-1 px-2 sm:px-3 shadow-inner max-w-[180px] sm:max-w-none">
            <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden md:inline text-xs text-slate-400 font-medium">Branch:</span>
            {isOwner ? (
              <select 
                value={currentShopId}
                onChange={(e) => onSelectShop(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1 truncate max-w-[110px] sm:max-w-none"
              >
                <option value="all" className="bg-slate-900 text-white">🏢 All Branches</option>
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id} className="bg-slate-900 text-white">
                    {shop.isMain ? '⭐ ' : '🏬 '} {shop.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold text-amber-300 truncate max-w-[120px] sm:max-w-none">
                {currentShop?.name || 'Main Hardware'}
              </span>
            )}
          </div>

          {/* User Profile Info Pill */}
          <div
            className={`flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-left ${
              isOwner 
                ? 'bg-amber-500/10 border-amber-500/40' 
                : 'bg-emerald-500/10 border-emerald-500/40'
            }`}
          >
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              isOwner ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-emerald-500 text-slate-950 shadow-xs'
            }`}>
              {isOwner ? <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </div>
            <div className="hidden min-[420px]:block">
              <div className="text-[11px] sm:text-xs font-bold text-white leading-tight truncate max-w-[80px] sm:max-w-[120px]">
                {currentUser.name}
              </div>
              <div className="text-[9px] sm:text-[10px] capitalize flex items-center space-x-1">
                <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full inline-block animate-pulse ${isOwner ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span className={isOwner ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                  {isOwner ? 'Store Owner' : `${currentUser.role}`}
                </span>
              </div>
            </div>
          </div>

          {/* Log Out Button */}
          <button
            onClick={onLogout}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-red-950/80 hover:border-red-600/50 hover:text-red-300 text-slate-400 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-700 text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Log Out</span>
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

      {/* Offline Status & Sync Management Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl text-white relative">
            <button
              onClick={() => setIsSyncModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                !isOnline 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}>
                {!isOnline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-extrabold text-base">Network & Offline Sync</h3>
                <p className="text-xs text-slate-400">Local data cache & synchronization status</p>
              </div>
            </div>

            {/* Connection Status Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Connection State:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center space-x-1.5 ${
                  isOnline 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  <span>{isOnline ? 'Online (Connected)' : 'Offline (Working Locally)'}</span>
                </span>
              </div>
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-800/80">
                <span className="text-xs text-slate-400">Pending Local Transactions:</span>
                <span className="text-xs font-black font-mono text-amber-400">{pendingCount} actions</span>
              </div>
            </div>

            {/* Queue Items Preview */}
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Pending Queue ({queueItems.length})</span>
                {pendingCount > 0 && isOnline && (
                  <button
                    onClick={() => {
                      if (onTriggerSync) onTriggerSync();
                    }}
                    disabled={isSyncing}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync All Now</span>
                  </button>
                )}
              </div>

              {queueItems.length === 0 ? (
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-emerald-300">All data is fully synchronized</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">No offline sales or adjustments waiting in queue</p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {queueItems.map((item, idx) => (
                    <div key={item.id || idx} className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{item.description || item.type}</div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md">
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Offline Engine Explanation */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 mb-4 flex items-start space-x-2.5">
              <HardDrive className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-white">Zero Downtime Guarantee:</strong> You can create sales, print receipts, register customers, and issue quotes without any internet connection. All actions will automatically synchronize as soon as connection is restored.
              </p>
            </div>

            {/* Owner & Management Contact Info */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1 mb-4">
              <div className="font-extrabold text-[11px] uppercase tracking-wider text-amber-400">
                Owner & Management Contacts
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <span>📍 Address: <strong>P.O.BOX 14991 ARUSHA</strong></span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <span>📞 Tel: <strong className="text-amber-400">0788989889 / 0713550104</strong></span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-400">
                <span>✉️ Email: <a href="mailto:jengakwanzaltd@gmail.com" className="text-white hover:text-amber-400 underline font-medium">jengakwanzaltd@gmail.com</a></span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isOnline && pendingCount > 0 && (
                <button
                  onClick={() => {
                    if (onTriggerSync) onTriggerSync();
                  }}
                  disabled={isSyncing}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Transactions Now'}</span>
                </button>
              )}
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
