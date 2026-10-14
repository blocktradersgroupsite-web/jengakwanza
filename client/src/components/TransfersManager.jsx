import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Plus, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Truck, 
  Trash2, 
  Store,
  AlertTriangle
} from 'lucide-react';

export default function TransfersManager({
  transfers,
  shops,
  products,
  currentShopId,
  currentUser,
  settings,
  onCreateTransfer,
  onUpdateStatus
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fromShopId, setFromShopId] = useState(shops[0]?.id || '');
  const [toShopId, setToShopId] = useState(shops[1]?.id || '');
  const [transferItems, setTransferItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter transfers for active shop or all
  const filteredTransfers = transfers.filter(t => {
    if (currentShopId === 'all') return true;
    return t.fromShopId === currentShopId || t.toShopId === currentShopId;
  });

  const addItemToTransfer = (productId) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    if (transferItems.some(i => i.productId === productId)) return;

    const available = Number(prod.stock?.[fromShopId] || 0);

    setTransferItems(prev => [
      ...prev,
      {
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        unit: prod.unit,
        quantity: 1,
        available
      }
    ]);
  };

  const updateItemQty = (productId, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    setTransferItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: q };
      }
      return item;
    }));
  };

  const removeItem = (productId) => {
    setTransferItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleOpenModal = () => {
    setFromShopId(currentShopId !== 'all' ? currentShopId : shops[0]?.id);
    const dest = shops.find(s => s.id !== (currentShopId !== 'all' ? currentShopId : shops[0]?.id));
    setToShopId(dest ? dest.id : '');
    setTransferItems([]);
    setNotes('');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (fromShopId === toShopId) {
      setError('Origin branch and destination branch cannot be the same');
      return;
    }

    if (transferItems.length === 0) {
      setError('Please add at least one product to transfer');
      return;
    }

    // Verify stock availability
    for (const item of transferItems) {
      const prod = products.find(p => p.id === item.productId);
      const stock = Number(prod?.stock?.[fromShopId] || 0);
      if (item.quantity > stock) {
        setError(`Insufficient stock for "${item.name}". Available in source branch: ${stock} ${item.unit}s.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const fromShop = shops.find(s => s.id === fromShopId);
      const toShop = shops.find(s => s.id === toShopId);

      await onCreateTransfer({
        fromShopId,
        fromShopName: fromShop?.name || 'Origin Branch',
        toShopId,
        toShopName: toShop?.name || 'Destination Branch',
        items: transferItems.map(i => ({
          productId: i.productId,
          sku: i.sku,
          name: i.name,
          unit: i.unit,
          quantity: i.quantity
        })),
        notes,
        dispatchedBy: currentUser.name
      });
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Transfer creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <ArrowLeftRight className="w-6 h-6 text-amber-500" />
            <span>Inter-Shop Stock Transfers</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transfer hardware materials, rebar, paints, and tools between branches with automated inventory deduction and receipt verification.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-md shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Transfer</span>
        </button>
      </div>

      {/* Transfers List */}
      <div className="space-y-3">
        {filteredTransfers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Truck className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="font-bold text-sm">No transfer requests logged</p>
          </div>
        ) : (
          filteredTransfers.map(trf => {
            const isDestination = currentShopId === trf.toShopId || currentShopId === 'all';

            return (
              <div 
                key={trf.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition space-y-3"
              >
                {/* Header: ID, Date, Route & Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                      {trf.id}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(trf.date).toLocaleDateString()} at {new Date(trf.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      trf.status === 'received'
                        ? 'bg-emerald-100 text-emerald-800'
                        : trf.status === 'in_transit'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {trf.status === 'received' && <CheckCircle className="w-3.5 h-3.5" />}
                      {trf.status === 'in_transit' && <Truck className="w-3.5 h-3.5" />}
                      {trf.status === 'cancelled' && <XCircle className="w-3.5 h-3.5" />}
                      <span>{trf.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>

                {/* Route: From -> To */}
                <div className="flex items-center space-x-3 text-xs">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">From (Origin):</span>
                    <div className="font-black text-slate-900 mt-0.5">{trf.fromShopName}</div>
                    <div className="text-[10px] text-slate-500">Dispatched by: {trf.dispatchedBy}</div>
                  </div>

                  <ArrowLeftRight className="w-5 h-5 text-amber-500 flex-shrink-0" />

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">To (Destination):</span>
                    <div className="font-black text-slate-900 mt-0.5">{trf.toShopName}</div>
                    <div className="text-[10px] text-slate-500">
                      {trf.receivedBy ? `Received by: ${trf.receivedBy}` : 'Pending Reception'}
                    </div>
                  </div>
                </div>

                {/* Items in transfer */}
                <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Items Manifest ({trf.items.length} items):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {trf.items.map((item, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900 truncate max-w-[170px]">{item.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                        </div>
                        <span className="font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                          {item.quantity} {item.unit}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {trf.notes && (
                  <p className="text-[11px] text-slate-500 italic">
                    Note: "{trf.notes}"
                  </p>
                )}

                {/* Actions: If In Transit, allow destination manager to click "Confirm Receipt & Add to Stock" */}
                {trf.status === 'in_transit' && (
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onUpdateStatus(trf.id, 'cancelled')}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                    >
                      Cancel Transfer
                    </button>
                    {isDestination && (
                      <button
                        onClick={() => onUpdateStatus(trf.id, 'received', currentUser.name)}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Confirm Received & Add to Stock</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base tracking-wide flex items-center space-x-2">
                <ArrowLeftRight className="w-5 h-5 text-amber-400" />
                <span>Create Inter-Branch Stock Transfer</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Source & Destination */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Source Branch (Transfer Out):
                  </label>
                  <select
                    value={fromShopId}
                    onChange={(e) => {
                      setFromShopId(e.target.value);
                      setTransferItems([]); // Reset items when source changes
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Destination Branch (Transfer In):
                  </label>
                  <select
                    value={toShopId}
                    onChange={(e) => setToShopId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Product Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Select Product to Add:
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addItemToTransfer(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="">➕ Choose product from source inventory...</option>
                  {products.map(p => {
                    const stock = Number(p.stock?.[fromShopId] || 0);
                    return (
                      <option key={p.id} value={p.id} disabled={stock <= 0}>
                        {p.name} ({p.sku}) — Available: {stock} {p.unit}s
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Manifest Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Transfer Manifest ({transferItems.length} items):
                </span>
                {transferItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No products added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {transferItems.map(item => (
                      <div key={item.productId} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-bold text-xs text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Available in origin: {item.available} {item.unit}s
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max={item.available}
                            value={item.quantity}
                            onChange={(e) => updateItemQty(item.productId, e.target.value)}
                            className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-center"
                          />
                          <span className="text-xs font-medium text-slate-600">{item.unit}s</span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Vehicle / Driver / Dispatch Notes:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Dispatched via Pickup KDA 421Z, driver John"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white"
                />
              </div>

              {/* Submit Buttons */}
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
                  disabled={isSubmitting || transferItems.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Dispatching...' : 'Dispatch Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
