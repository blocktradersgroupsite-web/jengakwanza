import React, { useState } from 'react';
import { X, CheckCircle, Smartphone, Banknote, CreditCard, AlertCircle } from 'lucide-react';

export default function DebtPaymentModal({
  isOpen,
  onClose,
  customer,
  currentShop,
  currentUser,
  settings,
  onRecordPayment
}) {
  if (!isOpen || !customer) return null;

  const [amount, setAmount] = useState(customer.currentDebt || '');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash | mpesa | bank
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const payAmt = Number(amount) || 0;
  const remaining = Math.max(0, customer.currentDebt - payAmt);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (payAmt <= 0) {
      setError('Please enter a valid payment amount greater than zero');
      return;
    }
    if (paymentMethod === 'mpesa' && !reference.trim()) {
      setError('Please enter the M-Pesa transaction reference code');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRecordPayment(customer.id, {
        amount: payAmt,
        paymentMethod,
        reference: reference.trim().toUpperCase(),
        shopId: currentShop.id,
        shopName: currentShop.name,
        cashierId: currentUser.id,
        receivedBy: currentUser.name
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Payment recording failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 px-2 rounded-lg bg-[#082825] border border-slate-700/80 flex items-center justify-center shadow-xs shrink-0">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-5 w-auto max-w-[80px] object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <h3 className="font-extrabold text-base tracking-wide">Receive Debt Payment</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Customer Summary Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-black text-sm text-slate-900">{customer.name}</div>
              <div className="text-xs text-slate-500">{customer.phone || 'No phone'} • {customer.type}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Outstanding Debt:</span>
              <div className="text-lg font-black text-red-600">
                {settings.currencySymbol} {customer.currentDebt.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Amount Being Paid ({settings.currencySymbol}): <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={customer.currentDebt}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xl font-black text-slate-900 focus:ring-2 focus:ring-emerald-500"
              placeholder="0.00"
              autoFocus
            />
            {/* Quick buttons */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount(customer.currentDebt)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-lg"
              >
                Clear Full Balance ({settings.currencySymbol} {customer.currentDebt.toLocaleString()})
              </button>
              {customer.currentDebt > 10000 && (
                <button
                  type="button"
                  onClick={() => setAmount(Math.round(customer.currentDebt / 2))}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-lg"
                >
                  Pay 50%
                </button>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Payment Method:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'mpesa', label: 'M-Pesa', icon: Smartphone },
                { id: 'bank', label: 'Bank', icon: CreditCard }
              ].map(m => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition ${
                      isSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference Input */}
          {(paymentMethod === 'mpesa' || paymentMethod === 'bank') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                {paymentMethod === 'mpesa' ? 'M-Pesa Transaction Ref:' : 'Bank Ref / Cheque No:'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. QKZ8921PLM"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Remaining Debt Forecast */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-semibold">Remaining Balance After Payment:</span>
            <span className="font-black text-slate-900">
              {settings.currencySymbol} {remaining.toLocaleString()}
            </span>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/25 transition disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : `Record Payment & Issue Receipt`}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
