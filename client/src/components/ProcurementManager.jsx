import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Building2, 
  Phone, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  Trash2, 
  Search,
  PackageCheck
} from 'lucide-react';

export default function ProcurementManager({
  suppliers,
  purchases,
  products,
  shops,
  currentShopId,
  currentUser,
  settings,
  onCreateSupplier,
  onCreatePurchase,
  onReceivePurchase
}) {
  const [activeSubTab, setActiveSubTab] = useState('orders'); // orders | suppliers
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // New PO form state
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [destShopId, setDestShopId] = useState(shops[0]?.id || '');
  const [poItems, setPoItems] = useState([]);
  const [amountPaid, setAmountPaid] = useState('0');
  const [poNotes, setPoNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Supplier form state
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    category: 'Cement'
  });

  const grandTotal = poItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + (Number(s.outstandingBalance) || 0), 0);

  const addItemToPO = (productId) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    if (poItems.some(i => i.productId === productId)) return;

    setPoItems(prev => [
      ...prev,
      {
        productId: prod.id,
        name: prod.name,
        unit: prod.unit,
        qtyOrdered: 10,
        costPrice: prod.costPrice,
        total: 10 * prod.costPrice
      }
    ]);
  };

  const updateItemQty = (productId, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    setPoItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, qtyOrdered: q, total: q * item.costPrice };
      }
      return item;
    }));
  };

  const updateItemCost = (productId, cost) => {
    const c = Math.max(0, Number(cost) || 0);
    setPoItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, costPrice: c, total: item.qtyOrdered * c };
      }
      return item;
    }));
  };

  const removeItem = (productId) => {
    setPoItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    if (poItems.length === 0) return alert('Add at least one item');

    const sup = suppliers.find(s => s.id === selectedSupplierId);
    const shop = shops.find(s => s.id === destShopId);

    setIsSubmitting(true);
    try {
      await onCreatePurchase({
        supplierId: selectedSupplierId,
        supplierName: sup?.name || 'Supplier',
        shopId: destShopId,
        shopName: shop?.name || 'Main Hub',
        items: poItems,
        grandTotal,
        amountPaid: Number(amountPaid) || 0,
        status: 'received', // Automatically add stock on GRN
        notes: poNotes
      });
      setIsPOModalOpen(false);
      setPoItems([]);
    } catch (err) {
      alert(err.message || 'Failed to create PO');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplier.name.trim()) return;
    await onCreateSupplier(newSupplier);
    setIsSupplierModalOpen(false);
    setNewSupplier({ name: '', contactPerson: '', phone: '', email: '', address: '', category: 'Cement' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Truck className="w-6 h-6 text-amber-500" />
            <span>Procurement & Supplier Orders (Goods Received)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage cement mills, steel distributors, paint manufacturers, purchase orders, and stock receiving.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
          >
            Add Supplier
          </button>
          <button
            onClick={() => {
              setPoItems([]);
              setIsPOModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-md shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order (GRN)</span>
          </button>
        </div>
      </div>

      {/* KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
              Total Supplier Payables (What You Owe Suppliers)
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {settings.currencySymbol} {totalPayables.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Across {suppliers.length} active registered suppliers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
              Purchase Consignments Logged
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {purchases.length} Orders
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Hardware stock received into branches</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`pb-2.5 transition border-b-2 ${
            activeSubTab === 'orders' ? 'border-amber-500 text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Purchase Orders & Consignments ({purchases.length})
        </button>
        <button
          onClick={() => setActiveSubTab('suppliers')}
          className={`pb-2.5 transition border-b-2 ${
            activeSubTab === 'suppliers' ? 'border-amber-500 text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Suppliers Directory ({suppliers.length})
        </button>
      </div>

      {/* Purchase Orders View */}
      {activeSubTab === 'orders' && (
        <div className="space-y-3">
          {purchases.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <Truck className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-bold text-sm">No purchase orders recorded</p>
            </div>
          ) : (
            purchases.map(po => (
              <div key={po.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                      {po.id}
                    </span>
                    <span className="font-extrabold text-sm text-slate-900">{po.supplierName}</span>
                    <span className="text-xs text-slate-400">• Delivered to: {po.shopName}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                      po.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : po.paymentStatus === 'partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <span>Payment: {po.paymentStatus}</span>
                    </span>

                    <span className="inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-blue-100 text-blue-800">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{po.status}</span>
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {po.items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900 leading-snug">{item.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.qtyReceived || item.qtyOrdered} {item.unit}s @ {settings.currencySymbol} {Number(item.costPrice).toLocaleString()}
                        </div>
                      </div>
                      <div className="font-black text-slate-900">
                        {settings.currencySymbol} {Number(item.total).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals & Notes */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="text-slate-500 italic">
                    {po.notes ? `Note: "${po.notes}"` : `Ordered: ${po.orderDate}`}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-slate-600">
                      Paid: <span className="font-bold text-slate-900">{settings.currencySymbol} {Number(po.amountPaid || 0).toLocaleString()}</span>
                    </div>
                    <div className="text-sm font-black text-slate-900">
                      Total: {settings.currencySymbol} {Number(po.grandTotal).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Suppliers Directory View */}
      {activeSubTab === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">Supplier Company</th>
                <th className="py-3 px-3">Contact Person</th>
                <th className="py-3 px-3">Phone & Email</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Depot / Address</th>
                <th className="py-3 px-4 text-right">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-black text-slate-900">{s.name}</td>
                  <td className="py-3 px-3 font-semibold text-slate-700">{s.contactPerson || '—'}</td>
                  <td className="py-3 px-3 text-slate-600">
                    <div>{s.phone}</div>
                    <div className="text-[10px] text-slate-400">{s.email}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                      {s.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{s.address || '—'}</td>
                  <td className="py-3 px-4 text-right font-black text-red-600">
                    {settings.currencySymbol} {Number(s.outstandingBalance || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create PO Modal */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base tracking-wide flex items-center space-x-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <span>Create Purchase Order (Stock Receiving)</span>
              </h3>
              <button onClick={() => setIsPOModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePO} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Supplier:
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Receiving Branch:
                  </label>
                  <select
                    value={destShopId}
                    onChange={(e) => setDestShopId(e.target.value)}
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
                  Add Item to Purchase Order:
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addItemToPO(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="">➕ Choose product to order...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Cost: {settings.currencySymbol} {p.costPrice}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Items to Order ({poItems.length}):
                </span>
                {poItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No items added to this PO.</p>
                ) : (
                  <div className="space-y-2">
                    {poItems.map(item => (
                      <div key={item.productId} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-bold text-xs text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-500">Unit: {item.unit}</div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div>
                            <span className="text-[9px] text-slate-400 block">Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={item.qtyOrdered}
                              onChange={(e) => updateItemQty(item.productId, e.target.value)}
                              className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-center"
                            />
                          </div>

                          <div>
                            <span className="text-[9px] text-slate-400 block">Cost ({settings.currencySymbol}):</span>
                            <input
                              type="number"
                              min="0"
                              value={item.costPrice}
                              onChange={(e) => updateItemCost(item.productId, e.target.value)}
                              className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-center"
                            />
                          </div>

                          <div className="text-right min-w-[70px]">
                            <span className="text-[9px] text-slate-400 block">Total:</span>
                            <span className="font-black text-xs text-slate-900">{Number(item.total).toLocaleString()}</span>
                          </div>

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

              {/* Total & Paid */}
              <div className="p-3.5 bg-slate-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Grand Total:</span>
                  <span>{settings.currencySymbol} {grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Amount Paid to Supplier Now:</span>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-32 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-right"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Consignment Notes (Trailer #, Delivery Note #):
                </label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Delivery via Bamburi 30T Trailer KBZ 119A"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPOModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || poItems.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Goods Received (GRN)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base tracking-wide">Register New Supplier</h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveSupplier} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Company / Supplier Name: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="e.g. Bamburi Cement or Apex Steel"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Contact Person:
                  </label>
                  <input
                    type="text"
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Category:
                  </label>
                  <select
                    value={newSupplier.category}
                    onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="Cement">Cement</option>
                    <option value="Steel">Steel & Rebar</option>
                    <option value="Paints">Paints</option>
                    <option value="Plumbing">Plumbing & Pipes</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Timber">Timber & Roofing</option>
                    <option value="Tools">Tools</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Phone:
                  </label>
                  <input
                    type="text"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    placeholder="+255 7..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Email:
                  </label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Depot / Physical Address:
                </label>
                <input
                  type="text"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  placeholder="e.g. Athi River Plant"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
