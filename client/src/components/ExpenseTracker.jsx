import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Tag, 
  CheckCircle,
  Building2,
  AlertCircle
} from 'lucide-react';

export default function ExpenseTracker({
  expenses,
  shops,
  currentShopId,
  currentShop,
  currentUser,
  settings,
  onCreateExpense,
  onDeleteExpense
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState(currentShopId !== 'all' ? currentShopId : shops[0]?.id);
  const [category, setCategory] = useState('Casual Labor & Offloading');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidTo, setPaidTo] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Casual Labor & Offloading',
    'Transport & Vehicle Fuel',
    'Electricity & Water (Utilities)',
    'Staff Lunch & Tea',
    'Shop Rent & Rates',
    'Store Maintenance & Repairs',
    'Licenses, Permits & Cess',
    'Packaging & Ties',
    'Other Miscellaneous'
  ];

  const filteredExpenses = expenses.filter(e => {
    if (currentShopId === 'all') return true;
    return e.shopId === currentShopId;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return alert('Enter valid expense amount');

    const shop = shops.find(s => s.id === selectedShopId);

    setIsSubmitting(true);
    try {
      await onCreateExpense({
        shopId: selectedShopId,
        shopName: shop?.name || 'Main Hub',
        category,
        amount: Number(amount),
        paymentMethod,
        paidTo,
        description,
        date,
        approvedBy: currentUser.name
      });
      setIsModalOpen(false);
      setAmount('');
      setPaidTo('');
      setDescription('');
    } catch (err) {
      alert(err.message || 'Error recording expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="h-11 px-2.5 rounded-xl bg-[#082825] border border-slate-700/80 flex items-center justify-center shadow-xs shrink-0">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-7 w-auto max-w-[100px] object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-amber-500" />
              <span>Daily Store Expenses & Petty Cash</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Log offloading labor, delivery vehicle fuel, utilities, tea & canteen, and operating overheads.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedShopId(currentShopId !== 'all' ? currentShopId : shops[0]?.id);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-md shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* KPI Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
            Total Logged Expenses ({currentShopId === 'all' ? 'All Branches' : currentShop.name})
          </span>
          <div className="text-2xl font-black text-white mt-1">
            {settings.currencySymbol} {totalExpenseAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{filteredExpenses.length} expense transactions</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold">
          <DollarSign className="w-6 h-6" />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <th className="py-3 px-4">Date & Branch</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Description & Beneficiary</th>
              <th className="py-3 px-3">Payment Mode</th>
              <th className="py-3 px-3">Authorized By</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                  No expense records found.
                </td>
              </tr>
            ) : (
              filteredExpenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{exp.date}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{exp.shopName}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px]">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800 leading-snug">{exp.description}</div>
                    {exp.paidTo && <div className="text-[10px] text-slate-400">Paid to: {exp.paidTo}</div>}
                  </td>
                  <td className="py-3 px-3 uppercase font-bold text-[10px] text-slate-600">
                    {exp.paymentMethod}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-medium">
                    {exp.approvedBy}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                    {settings.currencySymbol} {Number(exp.amount).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
                      title="Delete Expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base tracking-wide flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <span>Record Store Expense</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Branch:
                  </label>
                  <select
                    value={selectedShopId}
                    onChange={(e) => setSelectedShopId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Date:
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Category:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Amount ({settings.currencySymbol}): <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-lg font-black text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Payment Method:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="cash">Cash (Petty Cash Till)</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank">Bank / Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Paid To (Recipient):
                  </label>
                  <input
                    type="text"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    placeholder="e.g. Offloading squad / Fuel station"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Description / Purpose:
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Paid 6 casual laborers to offload 600 bags of Simba cement from Bamburi trailer"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md"
                >
                  {isSubmitting ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
