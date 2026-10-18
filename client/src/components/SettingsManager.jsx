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
  AlertTriangle,
  Printer,
  FileText,
  Image as ImageIcon,
  Cloud,
  Database,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection 
} from '../supabase';

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

  // Supabase Configuration State
  const [sbConfig, setSbConfig] = useState(getSupabaseConfig());
  const [sbUrl, setSbUrl] = useState(sbConfig.url || '');
  const [sbKey, setSbKey] = useState(sbConfig.anonKey || '');
  const [sbTestResult, setSbTestResult] = useState(null);
  const [sbTesting, setSbTesting] = useState(false);

  const handleSaveSbConfig = async (e) => {
    e.preventDefault();
    setSbTesting(true);
    setSbTestResult(null);

    saveSupabaseConfig(sbUrl.trim(), sbKey.trim());
    const res = await testSupabaseConnection();
    setSbTesting(false);
    setSbTestResult(res);
    setSbConfig(getSupabaseConfig());
  };

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
        <div className="flex items-center space-x-3.5">
          <div className="h-12 px-2.5 rounded-xl bg-[#082825] border border-slate-700/80 flex items-center justify-center shadow-xs">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-8 w-auto max-w-[110px] object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Store Configuration, Multi-Shop & Backups</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure business identity, branches, thermal receipt formats, taxes, and system backups.
            </p>
          </div>
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
                Owner & Head Office Phone(s):
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                placeholder="0788989889 / 0713550104"
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Business Email:
              </label>
              <input
                type="email"
                value={formData.email || ''}
                placeholder="jengakwanzaltd@gmail.com"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Postal & Physical Address:
              </label>
              <input
                type="text"
                value={formData.address || ''}
                placeholder="P.O.BOX 14991 ARUSHA"
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white"
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

        {/* Brand Logo, Copyright Notice & Printer Defaults */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
            <Printer className="w-4 h-4 text-amber-500" />
            <span>Document Branding, Logo, Copyright & Printer Options</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Logo Upload & Preview */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Company Logo (Appears on Receipts, Proformas & Delivery Notes):
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-24 h-20 bg-white border border-slate-300 rounded-xl flex items-center justify-center p-2 overflow-hidden shadow-xs">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Store Logo Preview" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="text-center text-slate-400">
                      <ImageIcon className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                      <span className="text-[9px]">No Logo</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition">
                    <Upload className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                    <span>Upload Logo Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setFormData({ ...formData, logo: ev.target?.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: '' })}
                      className="block text-[11px] text-red-600 hover:underline font-semibold"
                    >
                      Remove Logo
                    </button>
                  )}
                  <p className="text-[10px] text-slate-500">Supports PNG, JPG, WebP or SVG format.</p>
                </div>
              </div>
            </div>

            {/* Default Printer Preference */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Printer Type for Orders & Quotations:
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-amber-400">
                  <input
                    type="radio"
                    name="defaultPrinterType"
                    value="a4"
                    checked={(formData.defaultPrinterType || 'a4') === 'a4'}
                    onChange={(e) => setFormData({ ...formData, defaultPrinterType: e.target.value })}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">📄 A4 Full Page Document</span>
                    <span className="text-[10px] text-slate-500">Standard office laser / inkjet printer for formal invoices & delivery manifests</span>
                  </div>
                </label>
                <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-amber-400">
                  <input
                    type="radio"
                    name="defaultPrinterType"
                    value="thermal80"
                    checked={formData.defaultPrinterType === 'thermal80'}
                    onChange={(e) => setFormData({ ...formData, defaultPrinterType: e.target.value })}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">🧾 80mm POS Thermal Printer</span>
                    <span className="text-[10px] text-slate-500">Standard roll receipt printer used at POS counter</span>
                  </div>
                </label>
                <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-amber-400">
                  <input
                    type="radio"
                    name="defaultPrinterType"
                    value="thermal58"
                    checked={formData.defaultPrinterType === 'thermal58'}
                    onChange={(e) => setFormData({ ...formData, defaultPrinterType: e.target.value })}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">📱 58mm Mobile / Portable Thermal Printer</span>
                    <span className="text-[10px] text-slate-500">Handheld Bluetooth roll printer for mobile deliveries & yard staff</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Copyright Notice */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Copyright Notice & Legal Disclaimer (Printed on all documents):
              </label>
              <input
                type="text"
                value={formData.copyrightNotice || ''}
                onChange={(e) => setFormData({ ...formData, copyrightNotice: e.target.value })}
                placeholder="e.g. © 2026 JENGA KWANZA HARDWARE & STORES. Haki Zote Zimehifadhiwa / All Rights Reserved."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white"
              />
              <p className="text-[10px] text-slate-500 mt-1">This copyright notice is printed at the footer of all receipts, proformas, and delivery notes.</p>
            </div>
          </div>
        </div>

        {/* Banking, Lipa Namba & Quotation Terms */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Bank Accounts, Lipa Namba & Quotation Terms (For Proformas & Deliveries)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bank Name:
              </label>
              <input
                type="text"
                placeholder="e.g. CRDB Bank / NMB Bank"
                value={formData.bankName || ''}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bank Account Number:
              </label>
              <input
                type="text"
                placeholder="e.g. 0150293810293"
                value={formData.bankAccount || ''}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Holder Name:
              </label>
              <input
                type="text"
                placeholder="e.g. JENGA KWANZA HARDWARE & STORES LTD"
                value={formData.bankAccountName || ''}
                onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lipa Namba (M-Pesa / Tigo / Airtel):
              </label>
              <input
                type="text"
                placeholder="e.g. 5566778"
                value={formData.lipaNamba || ''}
                onChange={(e) => setFormData({ ...formData, lipaNamba: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-700 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Proforma Invoice Terms & Conditions:
              </label>
              <textarea
                rows={3}
                value={formData.proformaTerms || ''}
                onChange={(e) => setFormData({ ...formData, proformaTerms: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:bg-white leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Delivery Note Sign-off Terms:
              </label>
              <textarea
                rows={3}
                value={formData.deliveryTerms || ''}
                onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:bg-white leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-md shadow-amber-500/20 transition cursor-pointer"
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

      {/* Supabase Cloud Authentication & Database Connection */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span>Supabase Cloud Authentication & Database</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Unganisha mfumo wako na Supabase kwa ajili ya usajili na kuingia kwa usalama mtandaoni (Cloud Authentication).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center space-x-1.5 border ${
              sbConfig.isConfigured
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${sbConfig.isConfigured ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
              <span>{sbConfig.isConfigured ? 'Supabase Connected' : 'Not Connected'}</span>
            </span>
          </div>
        </div>

        {sbTestResult && (
          <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
            sbTestResult.ok
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/60 border-red-500/40 text-red-200'
          }`}>
            {sbTestResult.ok ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Muunganisho umethibitishwa kikamilifu na Supabase!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{sbTestResult.error}</span>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSaveSbConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              required
              value={sbUrl}
              onChange={(e) => setSbUrl(e.target.value)}
              placeholder="https://xyzabcdefghijk.supabase.co"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Supabase Anon Public API Key
            </label>
            <input
              type="text"
              required
              value={sbKey}
              onChange={(e) => setSbKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1">
              <span>Funguo hizi zinapatikana:</span>
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noreferrer" 
                className="text-emerald-400 underline inline-flex items-center gap-0.5 font-bold"
              >
                Supabase Dashboard &rarr; Settings &rarr; API <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <button
              type="submit"
              disabled={sbTesting}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {sbTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Inajaribu Muunganisho...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Hifadhi & Jaribu Muunganisho</span>
                </>
              )}
            </button>
          </div>
        </form>
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
