import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Users, 
  Split, 
  CheckCircle, 
  AlertTriangle,
  Building,
  UserCheck
} from 'lucide-react';

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  subtotal,
  discountTotal,
  taxRate,
  taxAmount,
  grandTotal,
  customers,
  currentShop,
  currentUser,
  settings,
  onCompleteSale
}) {
  if (!isOpen) return null;

  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash | mpesa | credit | card | split
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cashTendered, setCashTendered] = useState(grandTotal);
  const [mpesaRef, setMpesaRef] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [splitCash, setSplitCash] = useState(Math.round(grandTotal / 2));
  const [splitMpesa, setSplitMpesa] = useState(grandTotal - Math.round(grandTotal / 2));
  const [splitMpesaRef, setSplitMpesaRef] = useState('');
  const [creditNotes, setCreditNotes] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Quick cash buttons
  const changeDue = Math.max(0, Number(cashTendered) - grandTotal);

  const handleQuickCash = (amount) => {
    setCashTendered(amount);
  };

  const handleSplitCashChange = (val) => {
    const cash = Number(val) || 0;
    setSplitCash(cash);
    setSplitMpesa(Math.max(0, grandTotal - cash));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (paymentMethod === 'cash') {
      if (Number(cashTendered) < grandTotal) {
        setError(`Tendered cash is less than the total amount of ${settings.currencySymbol} ${grandTotal.toLocaleString()}`);
        return;
      }
    } else if (paymentMethod === 'mpesa') {
      if (!mpesaRef.trim()) {
        setError('Please enter the M-Pesa transaction reference code (e.g., RK98271LK)');
        return;
      }
    } else if (paymentMethod === 'credit') {
      if (!selectedCustomerId) {
        setError('A registered customer/debtor must be selected for Credit sales.');
        return;
      }
      if (selectedCustomer && (selectedCustomer.currentDebt + grandTotal > selectedCustomer.creditLimit)) {
        if (!confirm(`Warning: This sale will exceed ${selectedCustomer.name}'s credit limit of ${settings.currencySymbol} ${selectedCustomer.creditLimit.toLocaleString()}. Current debt is ${settings.currencySymbol} ${selectedCustomer.currentDebt.toLocaleString()}. Do you wish to override and approve as Manager?`)) {
          return;
        }
      }
    } else if (paymentMethod === 'split') {
      if (Number(splitCash) + Number(splitMpesa) < grandTotal) {
        setError('Split payment total does not cover the grand total');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let paymentDetails = {};
      if (paymentMethod === 'cash') {
        paymentDetails = {
          cashTendered: Number(cashTendered),
          change: changeDue
        };
      } else if (paymentMethod === 'mpesa') {
        paymentDetails = {
          mpesaRef: mpesaRef.toUpperCase().trim(),
          mpesaPhone: mpesaPhone || selectedCustomer?.phone || ''
        };
      } else if (paymentMethod === 'credit') {
        paymentDetails = {
          notes: creditNotes || 'Credit purchase authorized',
          approvedBy: currentUser.name
        };
      } else if (paymentMethod === 'card') {
        paymentDetails = {
          bankRef: bankRef.trim()
        };
      } else if (paymentMethod === 'split') {
        paymentDetails = {
          splitCash: Number(splitCash),
          splitMpesa: Number(splitMpesa),
          splitMpesaRef: splitMpesaRef.toUpperCase().trim()
        };
      }

      const salePayload = {
        shopId: currentShop.id,
        shopName: currentShop.name,
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        customerId: selectedCustomerId || null,
        customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Retail Customer',
        customerPhone: selectedCustomer ? selectedCustomer.phone : (mpesaPhone || ''),
        items: cart.map(item => ({
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice || 0,
          discount: item.discount || 0,
          priceType: item.priceType,
          total: item.total
        })),
        subtotal,
        discountTotal,
        taxRate,
        taxAmount,
        grandTotal,
        paymentMethod,
        paymentDetails
      };

      await onCompleteSale(salePayload);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to complete sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base tracking-wide flex items-center space-x-2">
              <span>Checkout & Payment</span>
              <span className="text-xs bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">{currentShop.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Amount Due:</span>
            <div className="text-2xl font-black text-slate-900">
              {settings.currencySymbol} {grandTotal.toLocaleString()}
            </div>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-0.5">
            <div>Subtotal: {settings.currencySymbol} {subtotal.toLocaleString()}</div>
            {discountTotal > 0 && <div className="text-emerald-600 font-semibold">Discount: -{settings.currencySymbol} {discountTotal.toLocaleString()}</div>}
            {taxAmount > 0 && <div>VAT ({taxRate}%): {settings.currencySymbol} {taxAmount.toLocaleString()}</div>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
              <span>Customer / Account:</span>
              <span className="text-[11px] text-slate-400 font-normal">Optional for Cash/M-Pesa, Required for Credit</span>
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                const cust = customers.find(c => c.id === e.target.value);
                if (cust && cust.phone) setMpesaPhone(cust.phone);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            >
              <option value="">👤 Walk-in Retail Customer (Cash / Counter)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type}) • Debt: {settings.currencySymbol} {c.currentDebt.toLocaleString()}
                </option>
              ))}
            </select>

            {/* If Customer is Selected, display debt info */}
            {selectedCustomer && (
              <div className="mt-2 p-2.5 bg-slate-100 rounded-xl text-xs flex items-center justify-between text-slate-700">
                <div>
                  <span className="font-semibold text-slate-900">{selectedCustomer.name}</span>
                  <div className="text-[11px] text-slate-500">Phone: {selectedCustomer.phone || 'N/A'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500">Current Debt:</div>
                  <div className={`font-bold ${selectedCustomer.currentDebt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {settings.currencySymbol} {selectedCustomer.currentDebt.toLocaleString()} / Limit: {settings.currencySymbol} {selectedCustomer.creditLimit.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Payment Method:
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote, color: 'text-emerald-600' },
                { id: 'mpesa', label: 'M-Pesa', icon: Smartphone, color: 'text-green-600' },
                { id: 'credit', label: 'Customer Credit', icon: Users, color: 'text-amber-600' },
                { id: 'card', label: 'Bank / Card', icon: CreditCard, color: 'text-blue-600' },
                { id: 'split', label: 'Split Pay', icon: Split, color: 'text-purple-600' }
              ].map(mode => {
                const Icon = mode.icon;
                const isSelected = paymentMethod === mode.id;
                return (
                  <button
                    type="button"
                    key={mode.id}
                    onClick={() => setPaymentMethod(mode.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      isSelected 
                        ? 'border-amber-500 bg-amber-500/10 text-slate-950 font-bold ring-2 ring-amber-500/30' 
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${mode.color}`} />
                    <span className="text-[11px] leading-tight">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specific Payment Input Details */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            {/* CASH MODE */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Cash Tendered from Customer ({settings.currencySymbol}):
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-base font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>

                {/* Quick denomination pills */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 self-center font-medium">Quick Notes:</span>
                  {[
                    grandTotal, 
                    Math.ceil(grandTotal / 5000) * 5000 || 5000, 
                    Math.ceil(grandTotal / 10000) * 10000 || 10000, 
                    10000, 
                    20000, 
                    50000,
                    100000
                  ]
                    .filter((amt, idx, arr) => amt >= grandTotal && arr.indexOf(amt) === idx)
                    .slice(0, 5)
                    .map((amt, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleQuickCash(amt)}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition"
                    >
                      {amt === grandTotal ? 'Exact' : `${settings.currencySymbol} ${amt.toLocaleString()}`}
                    </button>
                  ))}
                </div>

                {/* Change calculation */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800">Change Due to Customer:</span>
                  <span className="text-lg font-black text-emerald-700">
                    {settings.currencySymbol} {changeDue.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* M-PESA MODE */}
            {paymentMethod === 'mpesa' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs text-green-700 font-semibold mb-1">
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile Money (Vodacom M-Pesa / Tigo Pesa / Airtel Money / HaloPesa)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Customer Phone Number:
                    </label>
                    <input
                      type="text"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      placeholder="+255 7..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Mobile Money Ref Code (Receipt #): <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={mpesaRef}
                      onChange={(e) => setMpesaRef(e.target.value)}
                      placeholder="e.g. RKL8921JHK"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:ring-2 focus:ring-green-500 text-slate-900"
                      required
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Verify the transaction code matches the SMS received on your store till / Lipa namba before completing the sale.
                </p>
              </div>
            )}

            {/* CUSTOMER CREDIT MODE */}
            {paymentMethod === 'credit' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs text-amber-700 font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Sale will be added to Customer's Outstanding Debt Ledger</span>
                </div>
                {!selectedCustomerId && (
                  <p className="text-xs text-red-600 font-semibold">
                    ⚠️ You must select a customer above to bill this order on credit!
                  </p>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Approval / Project Notes (e.g. Mbezi Beach Site Slab Delivery):
                  </label>
                  <input
                    type="text"
                    value={creditNotes}
                    onChange={(e) => setCreditNotes(e.target.value)}
                    placeholder="Site name, LPO #, or fundi authorization"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            {/* BANK / CARD MODE */}
            {paymentMethod === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Bank / Card / Cheque Ref Number:
                  </label>
                  <input
                    type="text"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    placeholder="e.g. POS Approval Code or Cheque #10294"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* SPLIT MODE */}
            {paymentMethod === 'split' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Cash Amount ({settings.currencySymbol}):
                    </label>
                    <input
                      type="number"
                      value={splitCash}
                      onChange={(e) => handleSplitCashChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      M-Pesa Amount ({settings.currencySymbol}):
                    </label>
                    <input
                      type="number"
                      value={splitMpesa}
                      onChange={(e) => setSplitMpesa(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    M-Pesa Ref for the digital portion:
                  </label>
                  <input
                    type="text"
                    value={splitMpesaRef}
                    onChange={(e) => setSplitMpesaRef(e.target.value)}
                    placeholder="e.g. RKL7721MP"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs uppercase"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/25 transition disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing Sale...' : `Complete Sale (${settings.currencySymbol} ${grandTotal.toLocaleString()})`}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
