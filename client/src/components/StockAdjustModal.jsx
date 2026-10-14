import React, { useState } from 'react';
import { X, RefreshCw, AlertTriangle, Check } from 'lucide-react';

export default function StockAdjustModal({
  isOpen,
  onClose,
  product,
  currentShopId,
  shops,
  currentUser,
  onAdjust
}) {
  if (!isOpen || !product) return null;

  const initialShopId = currentShopId !== 'all' ? currentShopId : shops[0]?.id;
  const [selectedShopId, setSelectedShopId] = useState(initialShopId);
  const currentQty = Number(product.stock?.[selectedShopId] || 0);
  const [newQty, setNewQty] = useState(currentQty);
  const [reason, setReason] = useState('inventory_audit');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const diff = Number(newQty) - currentQty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAdjust(product.id, {
        shopId: selectedShopId,
        newQty: Number(newQty),
        reason,
        notes,
        performedBy: currentUser.name
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Error adjusting stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base tracking-wide">Stock Count Adjustment</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-black text-sm text-slate-900">{product.name}</div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">{product.sku} • Unit: {product.unit}</div>
          </div>

          {/* Branch Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Branch / Shop Location:
            </label>
            <select
              value={selectedShopId}
              onChange={(e) => {
                const sid = e.target.value;
                setSelectedShopId(sid);
                setNewQty(Number(product.stock?.[sid] || 0));
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
            >
              {shops.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Current vs New Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-100 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase font-bold">System Recorded:</span>
              <div className="text-xl font-black text-slate-800">
                {currentQty} <span className="text-xs font-normal text-slate-500">{product.unit}s</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Actual Physical Qty:
              </label>
              <input
                type="number"
                min="0"
                required
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xl font-black text-slate-900 focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
            </div>
          </div>

          {/* Difference Tag */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-600 font-medium">Variance (Adjustment):</span>
            <span className={`font-black ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-slate-600'}`}>
              {diff > 0 ? `+${diff}` : diff} {product.unit}s
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Adjustment Reason:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
            >
              <option value="inventory_audit">Periodic Inventory Audit / Physical Count</option>
              <option value="damaged">Damaged / Broken / Burst Goods</option>
              <option value="lost">Lost / Misplaced / Discrepancy</option>
              <option value="expired">Expired / Hardened Cement / Old Stock</option>
              <option value="return">Customer Return Restock</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Audit Notes:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Found 2 bags burst during shelf re-stacking"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white"
            />
          </div>

          {/* Action buttons */}
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
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/20"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Confirm Adjustment'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
