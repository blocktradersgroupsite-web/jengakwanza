import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Edit3, 
  Phone, 
  ArrowUpRight,
  TrendingUp,
  Percent
} from 'lucide-react';
import DebtPaymentModal from './DebtPaymentModal';

export default function CustomerLedger({
  customers,
  currentShop,
  currentUser,
  settings,
  onSaveCustomer,
  onPayDebt
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedCustomerForPay, setSelectedCustomerForPay] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Form state for Add/Edit customer
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    idNumber: '',
    type: 'contractor',
    creditLimit: '100000',
    notes: ''
  });

  const filteredCustomers = customers.filter(c => {
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    const s = search.toLowerCase().trim();
    const matchesSearch = !s ||
      c.name.toLowerCase().includes(s) ||
      (c.phone && c.phone.includes(s)) ||
      (c.idNumber && c.idNumber.toLowerCase().includes(s));
    return matchesType && matchesSearch;
  });

  // Analytics
  const totalReceivables = customers.reduce((sum, c) => sum + (Number(c.currentDebt) || 0), 0);
  const activeDebtors = customers.filter(c => c.currentDebt > 0).length;
  const totalCreditLimit = customers.reduce((sum, c) => sum + (Number(c.creditLimit) || 0), 0);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      idNumber: '',
      type: 'contractor',
      creditLimit: '100000',
      notes: ''
    });
    setIsCustomerModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      idNumber: c.idNumber || '',
      type: c.type || 'contractor',
      creditLimit: String(c.creditLimit || 0),
      notes: c.notes || ''
    });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    await onSaveCustomer({
      ...(editingCustomer || {}),
      ...formData,
      creditLimit: Number(formData.creditLimit) || 0
    });
    setIsCustomerModalOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-amber-500" />
            <span>Customer & Debtors Credit Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage contractors, builders, credit limits, outstanding balances, and debt collections.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-md shadow-amber-500/20 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Contractor / Customer</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Receivables */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-red-800 tracking-wider">
              Total Outstanding Debts (Receivables)
            </span>
            <div className="text-2xl font-black text-red-700 mt-1">
              {settings.currencySymbol} {totalReceivables.toLocaleString()}
            </div>
            <p className="text-[11px] text-red-600/80 mt-0.5 font-medium">Owed by {activeDebtors} contractors / buyers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-700 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Active Debtors */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
              Active Credit Accounts
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {activeDebtors} <span className="text-sm font-semibold text-slate-500">/ {customers.length} total</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Clients with unpaid goods</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Credit Limit Allocated */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
              Total Credit Limit Authorized
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {settings.currencySymbol} {totalCreditLimit.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              Utilization: {totalCreditLimit ? Math.round((totalReceivables / totalCreditLimit) * 100) : 0}%
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone number, ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          {['all', 'contractor', 'wholesale', 'fundi', 'retail'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                typeFilter === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'all' ? 'All Customers' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">Client & Contact</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Outstanding Debt</th>
                <th className="py-3 px-3">Credit Limit</th>
                <th className="py-3 px-3">Limit Usage</th>
                <th className="py-3 px-3">Project / Site Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm">No customers found</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => {
                  const usagePercent = customer.creditLimit > 0
                    ? Math.min(100, Math.round((customer.currentDebt / customer.creditLimit) * 100))
                    : 0;

                  return (
                    <tr key={customer.id} className="hover:bg-slate-50 transition">
                      {/* Name & Phone */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 leading-snug">{customer.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-2 mt-0.5">
                          {customer.phone && <span className="flex items-center"><Phone className="w-2.5 h-2.5 mr-0.5 text-slate-400" />{customer.phone}</span>}
                          {customer.idNumber && <span>• ID: {customer.idNumber}</span>}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          customer.type === 'contractor'
                            ? 'bg-amber-100 text-amber-800'
                            : customer.type === 'wholesale'
                            ? 'bg-purple-100 text-purple-800'
                            : customer.type === 'fundi'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {customer.type}
                        </span>
                      </td>

                      {/* Debt */}
                      <td className="py-3 px-3">
                        <div className={`text-sm font-black ${customer.currentDebt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {settings.currencySymbol} {Number(customer.currentDebt || 0).toLocaleString()}
                        </div>
                      </td>

                      {/* Limit */}
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {settings.currencySymbol} {Number(customer.creditLimit || 0).toLocaleString()}
                      </td>

                      {/* Usage Bar */}
                      <td className="py-3 px-3 w-36">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className={usagePercent > 80 ? 'text-red-600' : 'text-slate-600'}>
                              {usagePercent}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                usagePercent > 90 ? 'bg-red-500' : usagePercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-3 text-slate-500 text-[11px] max-w-[200px] truncate">
                        {customer.notes || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {customer.currentDebt > 0 && (
                            <button
                              onClick={() => setSelectedCustomerForPay(customer)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center space-x-1 shadow-xs transition"
                              title="Receive Payment & Issue Receipt"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Pay Debt</span>
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(customer)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Customer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debt Payment Modal */}
      <DebtPaymentModal
        isOpen={Boolean(selectedCustomerForPay)}
        onClose={() => setSelectedCustomerForPay(null)}
        customer={selectedCustomerForPay}
        currentShop={currentShop}
        currentUser={currentUser}
        settings={settings}
        onRecordPayment={onPayDebt}
      />

      {/* Add / Edit Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base tracking-wide flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>{editingCustomer ? 'Edit Customer / Contractor' : 'Register New Customer / Contractor'}</span>
              </h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Customer / Contractor Name: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Eng. Peter Kariuki or Apex Construction"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Phone Number:
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+255 7..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    National ID / PIN / Reg:
                  </label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    placeholder="24982103"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Customer Type:
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="contractor">Site Contractor</option>
                    <option value="fundi">Local Fundi / Plumber / Mason</option>
                    <option value="wholesale">Wholesale / Corporate</option>
                    <option value="retail">Retail Counter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Credit Limit ({settings.currencySymbol}):
                  </label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Site / Project Reference Notes:
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Ruiru 4-Storey Site, authorized site supervisor contact"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
