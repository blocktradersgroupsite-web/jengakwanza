import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Building2, 
  Receipt, 
  Download, 
  Upload, 
  RefreshCcw, 
  Plus, 
  Store, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

export default function SettingsManager({
  settings,
  shops,
  onSaveSettings,
  onCreateShop,
  onResetDemo,
  onImportBackup,
  exportUrl
}) {
  const [formData, setFormData] = useState({ ...settings });
  const [isNewShopOpen, setIsNewShopOpen] = useState(false);
  const [newShop, setNewShop] = useState({
    name: '',
    type: 'hardware',
    location: '',
    phone: '',
    email: '',
    isMain: false
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitSettings = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaveSettings(formData);
      setMessage('Store settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!newShop.name.trim()) return;
    await onCreateShop(newShop);
    setIsNewShopOpen(false);
    setNewShop({ name: '', type: 'hardware', location: '', phone: '', email: '', isMain: false });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result);
        if (confirm('Restoring this backup will replace current database. Proceed?')) {
          await onImportBackup(json);
          alert('Database restored successfully! Reloading...');
          window.location.reload();
        }
      } catch (err) {
        alert('Invalid JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Settings className="w-6 h-6 text-amber-500" />
            <span>Store Configuration, Multi-Shop & Backups</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure business identity, branches, thermal receipt formats, taxes, and system backups.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmitSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        
        {/* Business Profile */}
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span>Business Profile & Tax Information</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business Trading Name:
              </label>
              <input
                type="text"
                value={formData.businessName || ''}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tagline / Motto:
              </label>
              <input
                type="text"
                value={formData.tagline || ''}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                TRA TIN / VRN (Tax Identification Number):
              </label>
              <input
                type="text"
                placeholder="e.g. 123-456-789"
                value={formData.traTin ?? formData.kraPin ?? ''}
                onChange={(e) => setFormData({ ...formData, traTin: e.target.value, kraPin: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Head Office Phone:
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Physical Address:
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Currency & Taxes */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">
            Currency & VAT Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Currency Symbol:
              </label>
              <input
                type="text"
                value={formData.currencySymbol || 'Tsh'}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value, currency: e.target.value.toLowerCase().includes('tsh') ? 'TZS' : e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Standard VAT Tax Rate (%):
              </label>
              <input
                type="number"
                value={formData.taxRate || 18}
                onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white"
              />
            </div>
            <div className="flex items-center space-x-2 pt-5">
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.taxEnabled || false}
                  onChange={(e) => setFormData({ ...formData, taxEnabled: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <span>Enable VAT by default on checkout</span>
              </label>
            </div>
          </div>
        </div>

        {/* Thermal Receipt Settings */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-amber-500" />
            <span>Thermal Receipt Customization (80mm)</span>
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Receipt Top Header Title:
              </label>
              <input
                type="text"
                value={formData.receiptHeader || ''}
                onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Receipt Footer / Exchange Policy:
              </label>
              <textarea
                rows={2}
                value={formData.receiptFooter || ''}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-md shadow-amber-500/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Multi-Branch Management Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Store className="w-4 h-4 text-amber-500" />
              <span>Registered Shops & Branch Locations ({shops.length})</span>
            </h3>
            <p className="text-xs text-slate-400">Configure separate retail stores, depots, and warehouses</p>
          </div>
          <button
            onClick={() => setIsNewShopOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Branch</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {shops.map(shop => (
            <div key={shop.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900">{shop.name}</span>
                  {shop.isMain && (
                    <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black uppercase">
                      Main Hub
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{shop.location || 'Location not set'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{shop.phone || 'No phone'}</div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 capitalize">Type: {shop.type}</span>
                <span className="text-emerald-600 font-bold">● Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Database Backup & Disaster Recovery */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div>
          <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Database Backup, Import & Demo Reset</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Safeguard your business data with instant local exports, or restore from a previous backup file.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Export */}
          <a
            href={exportUrl}
            download
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Database (JSON Backup)</span>
          </a>

          {/* Import */}
          <label className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-2 cursor-pointer border border-slate-700 transition">
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Restore from File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Clear Transactions */}
          <button
            type="button"
            onClick={async () => {
              if (confirm('Clear all recorded sales, expenses, and reset customer/supplier debts to 0? Your product catalog will be kept.')) {
                await onClearTransactions();
                alert('All transactions cleared! Debts zeroed out.');
                window.location.reload();
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-xs flex items-center space-x-2 transition"
          >
            <RefreshCcw className="w-4 h-4 text-amber-400" />
            <span>Clear Sales Transactions</span>
          </button>

          {/* Reset to Clean Production */}
          <button
            type="button"
            onClick={async () => {
              if (confirm('WIPE ALL DATA to a fresh, clean production state (0 sales, 0 fake debts, clean catalog)? This cannot be undone.')) {
                await onResetClean();
                alert('System wiped to clean production! Reloading...');
                window.location.reload();
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-200 font-bold text-xs flex items-center space-x-2 transition"
          >
            <RefreshCcw className="w-4 h-4 text-red-400" />
            <span>Wipe to Clean Production</span>
          </button>
        </div>
      </div>

      {/* Add New Branch Modal */}
      {isNewShopOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base tracking-wide">Register New Shop / Branch</h3>
              <button onClick={() => setIsNewShopOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateBranch} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Branch Name: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newShop.name}
                  onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                  placeholder="e.g. Jenga Kwanza Hardware - Eldoret Branch"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Store Specialty / Type:
                </label>
                <select
                  value={newShop.type}
                  onChange={(e) => setNewShop({ ...newShop, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="hardware">General Hardware & Construction</option>
                  <option value="electrical">Electricals & Lighting</option>
                  <option value="paint_plumbing">Paints, Plumbing & Sanitaryware</option>
                  <option value="general">Retail Super-Store</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Physical Location:
                </label>
                <input
                  type="text"
                  value={newShop.location}
                  onChange={(e) => setNewShop({ ...newShop, location: e.target.value })}
                  placeholder="e.g. Uganda Road, Plot 5"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Branch Phone:
                </label>
                <input
                  type="text"
                  value={newShop.phone}
                  onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
                  placeholder="+255 7..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewShopOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs"
                >
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
