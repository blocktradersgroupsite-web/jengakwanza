import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight, 
  Trash2, 
  Truck, 
  User, 
  Building2, 
  Calendar, 
  ShoppingBag,
  Percent,
  AlertCircle
} from 'lucide-react';

export default function ProformaManager({
  proformas = [],
  products = [],
  customers = [],
  shops = [],
  currentShopId,
  currentShop,
  currentUser,
  settings,
  onCreateProforma,
  onUpdateProforma,
  onDeleteProforma,
  onConvertToSale,
  onOpenPrintModal,
  onGenerateDeliveryNote
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [convertingId, setConvertingId] = useState(null);

  // New Proforma Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [customCustomerAddress, setCustomCustomerAddress] = useState('');
  const [customCustomerTin, setCustomCustomerTin] = useState('');
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [proformaItems, setProformaItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [applyTax, setApplyTax] = useState(settings?.taxEnabled || false);
  const [productSearch, setProductSearch] = useState('');

  const currencySymbol = settings?.currencySymbol || 'Tsh';

  // Filter proformas
  const filteredProformas = proformas.filter(p => {
    const matchesShop = currentShopId === 'all' || p.shopId === currentShopId;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const s = searchQuery.toLowerCase().trim();
    const matchesSearch = !s || 
      (p.proformaNumber && p.proformaNumber.toLowerCase().includes(s)) ||
      (p.customerName && p.customerName.toLowerCase().includes(s)) ||
      (p.customerPhone && p.customerPhone.toLowerCase().includes(s));
    return matchesShop && matchesStatus && matchesSearch;
  });

  // Calculate totals for new proforma
  const subtotal = proformaItems.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
  const discountTotal = proformaItems.reduce((acc, item) => acc + (Number(item.discount || 0) * Number(item.quantity || 1)), 0);
  const taxRate = applyTax ? (settings?.taxRate || 18) : 0;
  const taxAmount = applyTax ? Math.round(subtotal * (taxRate / 100)) : 0;
  const grandTotal = subtotal + taxAmount;

  // Add product to new proforma
  const handleAddItem = (product) => {
    const existingIndex = proformaItems.findIndex(i => i.productId === product.id);
    if (existingIndex > -1) {
      setProformaItems(prev => {
        const next = [...prev];
        const it = next[existingIndex];
        const newQty = it.quantity + 1;
        next[existingIndex] = {
          ...it,
          quantity: newQty,
          total: (it.unitPrice - it.discount) * newQty
        };
        return next;
      });
    } else {
      setProformaItems(prev => [
        ...prev,
        {
          productId: product.id,
          sku: product.sku || '',
          name: product.name,
          unit: product.unit || 'Pcs',
          unitPrice: product.retailPrice || 0,
          discount: 0,
          quantity: 1,
          total: product.retailPrice || 0
        }
      ]);
    }
  };

  const handleUpdateItem = (index, field, value) => {
    setProformaItems(prev => {
      const next = [...prev];
      const it = { ...next[index], [field]: value };
      const qty = Number(it.quantity) || 1;
      const price = Number(it.unitPrice) || 0;
      const disc = Number(it.discount) || 0;
      it.total = Math.max(0, (price - disc) * qty);
      next[index] = it;
      return next;
    });
  };

  const handleRemoveItem = (index) => {
    setProformaItems(prev => prev.filter((_, i) => i !== index));
  };

  // Submit new proforma
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (proformaItems.length === 0) {
      alert('Please add at least one item to the proforma.');
      return;
    }

    const customerObj = customers.find(c => c.id === selectedCustomerId);
    const finalCustomerName = customerObj ? customerObj.name : (customCustomerName.trim() || 'Walk-in Cash Customer');
    const finalCustomerPhone = customerObj ? customerObj.phone : customCustomerPhone.trim();

    const payload = {
      shopId: currentShop?.id || 'shop-main',
      shopName: currentShop?.name || 'Main Hardware Store',
      creatorId: currentUser?.id || 'admin',
      creatorName: currentUser?.name || 'Director',
      customerId: selectedCustomerId || null,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      customerAddress: customCustomerAddress.trim(),
      customerTin: customCustomerTin.trim(),
      items: proformaItems,
      subtotal,
      discountTotal,
      taxRate,
      taxAmount,
      grandTotal,
      validUntil,
      notes,
      status: 'issued'
    };

    await onCreateProforma(payload);
    setIsCreateModalOpen(false);
    // Reset form
    setProformaItems([]);
    setSelectedCustomerId('');
    setCustomCustomerName('');
    setCustomCustomerPhone('');
    setCustomCustomerAddress('');
    setCustomCustomerTin('');
    setNotes('');
  };

  // 1-Click Convert Proforma to Sale
  const handleConvert = async (proforma) => {
    if (proforma.status === 'converted') {
      alert('This proforma invoice has already been converted to an active sale.');
      return;
    }

    if (!confirm(`Convert Proforma ${proforma.proformaNumber} (${currencySymbol} ${Number(proforma.grandTotal).toLocaleString()}) to an active sale?\n\nThis will deduct stock and record a completed sale transaction.`)) {
      return;
    }

    setConvertingId(proforma.id);
    try {
      await onConvertToSale(proforma);
    } finally {
      setConvertingId(null);
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
                <FileText className="w-5 h-5 text-amber-500" />
                <span>Proforma Invoices & Quotations</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Generate formal building material quotations, print on any printer, and convert to sales with 1 click.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center space-x-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Proforma Invoice</span>
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
            placeholder="Search by Proforma #, customer name or phone..."
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
            <option value="all">All Statuses ({proformas.length})</option>
            <option value="issued">Issued / Active</option>
            <option value="converted">Converted to Sale</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Proforma Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3 px-4">Proforma No</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Date / Expiry</th>
                <th className="py-3 px-4 text-right">Items</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProformas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">No Proforma Invoices found</p>
                    <p className="text-xs mt-1">Click "New Proforma Invoice" above to generate a price quote.</p>
                  </td>
                </tr>
              ) : (
                filteredProformas.map((p) => {
                  const isExpired = p.validUntil && new Date(p.validUntil) < new Date() && p.status === 'issued';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 text-xs block">{p.proformaNumber}</span>
                        <span className="text-[10px] text-slate-400">By {p.creatorName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.customerName}</div>
                        {p.customerPhone && <div className="text-[11px] text-slate-500">{p.customerPhone}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {p.shopName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800">{new Date(p.createdAt).toLocaleDateString()}</div>
                        <div className={`text-[10px] font-semibold ${isExpired ? 'text-red-500' : 'text-slate-500'}`}>
                          Valid to: {p.validUntil} {isExpired ? '(Expired)' : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {p.items?.length || 0}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-amber-700 text-sm">
                        {currencySymbol} {Number(p.grandTotal).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.status === 'converted' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ Converted to Sale
                          </span>
                        )}
                        {p.status === 'issued' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Active Quote
                          </span>
                        )}
                        {p.status === 'cancelled' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Print Button (A4 / 80mm / 58mm modal) */}
                          <button
                            onClick={() => onOpenPrintModal('proforma', p)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition"
                            title="Print Proforma Invoice (A4 / Thermal)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Convert to Sale */}
                          {p.status !== 'converted' && (
                            <button
                              onClick={() => handleConvert(p)}
                              disabled={convertingId === p.id}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow-sm flex items-center space-x-1 transition disabled:opacity-50"
                              title="Convert this quote to a completed sale"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{convertingId === p.id ? 'Converting...' : 'Sell'}</span>
                            </button>
                          )}

                          {/* Generate Delivery Note */}
                          <button
                            onClick={() => onGenerateDeliveryNote(p)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition"
                            title="Generate Delivery Note from this items list"
                          >
                            <Truck className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Delete proforma ${p.proformaNumber}?`)) {
                                onDeleteProforma(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete proforma"
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

      {/* CREATE NEW PROFORMA MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-base text-white">Create Proforma Invoice / Quotation</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Customer Selector & Quick Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Registered Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      const c = customers.find(cust => cust.id === e.target.value);
                      if (c) {
                        setCustomCustomerName(c.name);
                        setCustomCustomerPhone(c.phone || '');
                      }
                    }}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">-- Or enter custom client details below --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Client / Company Name *</label>
                  <input
                    type="text"
                    required
                    value={customCustomerName}
                    onChange={(e) => setCustomCustomerName(e.target.value)}
                    placeholder="e.g. Salim Enterprises Ltd or John Doe"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={customCustomerPhone}
                    onChange={(e) => setCustomCustomerPhone(e.target.value)}
                    placeholder="e.g. +255 712 345 678"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Site / Address</label>
                  <input
                    type="text"
                    value={customCustomerAddress}
                    onChange={(e) => setCustomCustomerAddress(e.target.value)}
                    placeholder="e.g. Mbezi Beach Site Plot 42"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer TRA TIN (Optional)</label>
                  <input
                    type="text"
                    value={customCustomerTin}
                    onChange={(e) => setCustomCustomerTin(e.target.value)}
                    placeholder="e.g. 100-200-300"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quotation Valid Until</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Product Picker & Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Add Items to Quotation</h3>
                  <span className="text-xs text-slate-500">{proformaItems.length} items added</span>
                </div>

                {/* Autocomplete / Search products */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Type to search and click to add items from inventory..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Quick Add Suggestions based on search */}
                {productSearch.trim().length > 0 && (
                  <div className="max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-2 divide-y divide-slate-100">
                    {products
                      .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase())))
                      .slice(0, 8)
                      .map(prod => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            handleAddItem(prod);
                            setProductSearch('');
                          }}
                          className="py-2 px-3 hover:bg-amber-50 cursor-pointer flex justify-between items-center rounded-lg text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{prod.name}</span>
                            <span className="text-[10px] text-slate-500 ml-2 font-mono">{prod.sku} • {prod.unit}</span>
                          </div>
                          <span className="font-mono font-bold text-amber-700">
                            {currencySymbol} {Number(prod.retailPrice).toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Added Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-2 text-center w-20">Unit</th>
                        <th className="py-2 px-2 text-center w-24">Quantity</th>
                        <th className="py-2 px-2 text-right w-28">Price ({currencySymbol})</th>
                        <th className="py-2 px-2 text-right w-28">Total ({currencySymbol})</th>
                        <th className="py-2 px-2 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {proformaItems.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-6 text-center text-slate-400">
                            No items added yet. Search above to add items to this proforma.
                          </td>
                        </tr>
                      ) : (
                        proformaItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-900">
                              {item.name}
                              <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                            </td>
                            <td className="py-2 px-2 text-center text-slate-600 font-medium">
                              {item.unit}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                                className="w-16 p-1 text-center font-bold border border-slate-300 rounded bg-white"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                                className="w-24 p-1 text-right font-mono border border-slate-300 rounded bg-white"
                              />
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                              {Number(item.total).toLocaleString()}
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

              {/* Totals & Additional Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Quotation Conditions</label>
                  <textarea
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Includes delivery to site within Dar es Salaam; price valid subject to stock availability."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-400"
                  ></textarea>
                  
                  <div className="mt-2 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="applyTaxToggle"
                      checked={applyTax}
                      onChange={(e) => setApplyTax(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <label htmlFor="applyTaxToggle" className="text-xs text-slate-700 font-medium cursor-pointer">
                      Include VAT ({settings?.taxRate || 18}%) in this quotation
                    </label>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">{currencySymbol} {subtotal.toLocaleString()}</span>
                  </div>
                  {applyTax && (
                    <div className="flex justify-between text-slate-600">
                      <span>VAT ({taxRate}%):</span>
                      <span className="font-mono font-semibold">{currencySymbol} {taxAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-300 text-sm font-black text-slate-950">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base text-amber-700">{currencySymbol} {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
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
                  disabled={proformaItems.length === 0}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  Save & Issue Proforma
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
