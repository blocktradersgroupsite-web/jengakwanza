import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  User, 
  MapPin, 
  Phone, 
  FileText, 
  AlertCircle,
  CheckSquare,
  Package
} from 'lucide-react';

export default function DeliveryManager({
  deliveryNotes = [],
  sales = [],
  products = [],
  customers = [],
  shops = [],
  currentShopId,
  currentShop,
  currentUser,
  settings,
  onCreateDeliveryNote,
  onUpdateDeliveryNote,
  onDeleteDeliveryNote,
  onOpenPrintModal,
  prefilledData = null
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Delivery Note Form State
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryItems, setDeliveryItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [customItemQty, setCustomItemQty] = useState(1);
  const [customItemUnit, setCustomItemUnit] = useState('Pcs');

  // Handle prefilled data if triggered from a sale or proforma
  React.useEffect(() => {
    if (prefilledData) {
      setOrderRef(prefilledData.id || prefilledData.proformaNumber || '');
      setCustomerName(prefilledData.customerName || '');
      setCustomerPhone(prefilledData.customerPhone || '');
      setDeliveryAddress(prefilledData.customerAddress || '');
      if (Array.isArray(prefilledData.items)) {
        setDeliveryItems(
          prefilledData.items.map(it => ({
            productId: it.productId || '',
            sku: it.sku || '',
            name: it.name,
            unit: it.unit || 'Pcs',
            quantity: it.quantity || 1,
            notes: ''
          }))
        );
      }
      setIsCreateModalOpen(true);
    }
  }, [prefilledData]);

  // Filter delivery notes
  const filteredNotes = deliveryNotes.filter(d => {
    const matchesShop = currentShopId === 'all' || d.shopId === currentShopId;
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const s = searchQuery.toLowerCase().trim();
    const matchesSearch = !s ||
      (d.deliveryNumber && d.deliveryNumber.toLowerCase().includes(s)) ||
      (d.orderRef && d.orderRef.toLowerCase().includes(s)) ||
      (d.customerName && d.customerName.toLowerCase().includes(s)) ||
      (d.vehicleReg && d.vehicleReg.toLowerCase().includes(s)) ||
      (d.driverName && d.driverName.toLowerCase().includes(s));
    return matchesShop && matchesStatus && matchesSearch;
  });

  // When a sale is selected in the modal, autofill
  const handleSelectSale = (saleId) => {
    setSelectedSaleId(saleId);
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
      setOrderRef(sale.id);
      setCustomerName(sale.customerName || '');
      setCustomerPhone(sale.customerPhone || '');
      setDeliveryItems(
        (sale.items || []).map(it => ({
          productId: it.productId,
          sku: it.sku,
          name: it.name,
          unit: it.unit || 'Pcs',
          quantity: it.quantity,
          notes: ''
        }))
      );
    }
  };

  const handleAddCustomItem = () => {
    if (!customItemName.trim()) return;
    setDeliveryItems(prev => [
      ...prev,
      {
        productId: '',
        sku: '',
        name: customItemName.trim(),
        unit: customItemUnit,
        quantity: Number(customItemQty) || 1,
        notes: ''
      }
    ]);
    setCustomItemName('');
    setCustomItemQty(1);
  };

  const handleUpdateItemQty = (index, qty) => {
    setDeliveryItems(prev => {
      const next = [...prev];
      next[index].quantity = Math.max(1, Number(qty) || 1);
      return next;
    });
  };

  const handleRemoveItem = (index) => {
    setDeliveryItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (deliveryItems.length === 0) {
      alert('Please add at least one item to dispatch.');
      return;
    }

    const payload = {
      orderRef,
      shopId: currentShop?.id || 'shop-main',
      shopName: currentShop?.name || 'Main Hardware Store',
      dispatcherId: currentUser?.id || 'admin',
      dispatcherName: currentUser?.name || 'Store Dispatcher',
      customerName: customerName.trim() || 'Valued Customer',
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim() || 'Site Delivery',
      vehicleReg: vehicleReg.trim().toUpperCase(),
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      dispatchDate,
      items: deliveryItems,
      notes: notes.trim(),
      status: 'dispatched'
    };

    await onCreateDeliveryNote(payload);
    setIsCreateModalOpen(false);
    // Reset
    setSelectedSaleId('');
    setOrderRef('');
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setVehicleReg('');
    setDriverName('');
    setDriverPhone('');
    setDeliveryItems([]);
    setNotes('');
  };

  const handleMarkDelivered = async (note) => {
    if (confirm(`Mark Delivery Note ${note.deliveryNumber} as Delivered / Completed?`)) {
      await onUpdateDeliveryNote(note.id, {
        status: 'delivered',
        deliveredAt: new Date().toISOString()
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
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
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <Truck className="w-5 h-5 text-amber-500" />
                <span>Delivery Notes & Dispatch Manifests</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Issue goods delivery notes with driver sign-offs, customer confirmation signatures, and universal printer support.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center space-x-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Delivery Note</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Delivery #, Order ref, customer, driver or vehicle..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            <option value="all">All Deliveries ({deliveryNotes.length})</option>
            <option value="dispatched">Dispatched / En Route</option>
            <option value="delivered">Delivered / Signed</option>
            <option value="returned">Returned / Failed</option>
          </select>
        </div>
      </div>

      {/* Delivery Notes Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3 px-4">Delivery No</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Customer & Site</th>
                <th className="py-3 px-4">Vehicle & Driver</th>
                <th className="py-3 px-4">Dispatch Date</th>
                <th className="py-3 px-4 text-center">Items Qty</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">No Delivery Notes found</p>
                    <p className="text-xs mt-1">Create a delivery note when dispatching materials to customer sites.</p>
                  </td>
                </tr>
              ) : (
                filteredNotes.map((note) => {
                  const totalUnits = (note.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
                  return (
                    <tr key={note.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 text-xs block">{note.deliveryNumber}</span>
                        <span className="text-[10px] text-slate-400">By {note.dispatcherName}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-700">
                        {note.orderRef || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{note.customerName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 inline" />
                          <span className="truncate max-w-[170px]">{note.deliveryAddress}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {note.vehicleReg && (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 font-mono font-bold text-[10px] text-slate-800 border border-slate-200 mb-0.5">
                            {note.vehicleReg}
                          </span>
                        )}
                        <div className="text-slate-700 font-medium">{note.driverName || 'No driver listed'}</div>
                        {note.driverPhone && <div className="text-[10px] text-slate-400">{note.driverPhone}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {note.dispatchDate}
                        {note.deliveredAt && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Delivered: {new Date(note.deliveredAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {note.items?.length || 0} items ({totalUnits} pcs)
                      </td>
                      <td className="py-3 px-4 text-center">
                        {note.status === 'delivered' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ Delivered
                          </span>
                        ) : note.status === 'returned' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            Returned
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Dispatched / On Way
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Print Delivery Note Button */}
                          <button
                            onClick={() => onOpenPrintModal('delivery', note)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition"
                            title="Print Delivery Note (A4 / Thermal)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Mark as Delivered */}
                          {note.status !== 'delivered' && (
                            <button
                              onClick={() => handleMarkDelivered(note)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                              title="Mark as delivered & signed"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Delete delivery note ${note.deliveryNumber}?`)) {
                                onDeleteDeliveryNote(note.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete delivery note"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* CREATE NEW DELIVERY NOTE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Truck className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-base text-white">Generate Delivery Note / Dispatch Manifest</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Option to load from completed sale */}
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-bold text-amber-900">Autofill from recent sale:</span>
                  <p className="text-amber-700 text-[11px]">Select a completed sale receipt to automatically load items & customer.</p>
                </div>
                <select
                  value={selectedSaleId}
                  onChange={(e) => handleSelectSale(e.target.value)}
                  className="bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-400 max-w-[260px]"
                >
                  <option value="">-- Or enter custom dispatch details --</option>
                  {sales.slice(0, 20).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.id} - {s.customerName} ({s.items?.length || 0} items)
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Details Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Invoice / Order Reference</label>
                  <input
                    type="text"
                    value={orderRef}
                    onChange={(e) => setOrderRef(e.target.value)}
                    placeholder="e.g. INV-2026-10293 or Cash Order"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Mhandisi Bakari / Site Foreman"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +255 754 112 233"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Destination / Site Address *</label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. Bunju B Site, Block 12, Plot 4"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Registration Number</label>
                  <input
                    type="text"
                    value={vehicleReg}
                    onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                    placeholder="e.g. T 412 DKM (Canter / Fuso)"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Transporter / Driver Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Juma Ally"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Driver Phone Number</label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="e.g. +255 688 990 011"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dispatch Date</label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Items to Dispatch */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Goods Items Dispatched</h3>
                  <span className="text-xs text-slate-500">{deliveryItems.length} items on manifest</span>
                </div>

                {/* Quick Add Custom Item */}
                <div className="flex gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="Add item name (e.g. Twiga Cement 42.5N)..."
                    className="flex-1 p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="number"
                    min="1"
                    value={customItemQty}
                    onChange={(e) => setCustomItemQty(e.target.value)}
                    placeholder="Qty"
                    className="w-20 p-1.5 bg-white border border-slate-300 rounded-lg text-xs text-center font-bold"
                  />
                  <select
                    value={customItemUnit}
                    onChange={(e) => setCustomItemUnit(e.target.value)}
                    className="w-20 p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Bag">Bag</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Sheet">Sheet</option>
                    <option value="Roll">Roll</option>
                    <option value="Kg">Kg</option>
                    <option value="Trip">Trip</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                  >
                    Add
                  </button>
                </div>

                {/* Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-2 text-center w-24">Unit</th>
                        <th className="py-2 px-2 text-center w-28">Quantity Dispatched</th>
                        <th className="py-2 px-2 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {deliveryItems.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-5 text-center text-slate-400">
                            No items added yet. Add items above or pick from a past sale.
                          </td>
                        </tr>
                      ) : (
                        deliveryItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-900">
                              {item.name}
                              {item.sku && <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>}
                            </td>
                            <td className="py-2 px-2 text-center text-slate-600 font-medium">{item.unit}</td>
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQty(idx, e.target.value)}
                                className="w-20 p-1 text-center font-bold border border-slate-300 rounded bg-white"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Special Handling / Offloading Instructions</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Handle roofing sheets carefully; stack cement off-ground on timber pallets."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deliveryItems.length === 0}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  Generate & Issue Delivery Note
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
