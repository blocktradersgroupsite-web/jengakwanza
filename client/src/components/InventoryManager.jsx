import React, { useState, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Layers, 
  ArrowUpDown,
  Download,
  Upload,
  Boxes,
  FileSpreadsheet,
  CheckCircle,
  Barcode
} from 'lucide-react';
import ProductModal from './ProductModal';
import StockAdjustModal from './StockAdjustModal';

export default function InventoryManager({
  products,
  categories,
  shops,
  currentShopId,
  currentShop,
  currentUser,
  settings,
  onSaveProduct,
  onDeleteProduct,
  onAdjustStock,
  onBulkImport,
  onClearAll
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('all'); // all | low | out
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const s = search.toLowerCase().trim();
    const matchesSearch = !s ||
      p.name.toLowerCase().includes(s) ||
      (p.sku && p.sku.toLowerCase().includes(s)) ||
      (p.barcode && p.barcode.toLowerCase().includes(s)) ||
      (p.brand && p.brand.toLowerCase().includes(s));

    const totalStock = Object.values(p.stock || {}).reduce((a, b) => a + Number(b), 0);
    const shopStock = currentShopId === 'all' ? totalStock : Number(p.stock?.[currentShopId] || 0);

    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = shopStock <= p.minStockAlert && shopStock > 0;
    } else if (stockFilter === 'out') {
      matchesStock = shopStock <= 0;
    }

    return matchesCat && matchesSearch && matchesStock;
  });

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
      await onDeleteProduct(id);
    }
  };

  // --- CSV Export ---
  const exportToCSV = () => {
    if (products.length === 0) {
      alert('No products to export');
      return;
    }

    const headers = ['SKU', 'Barcode', 'Name', 'Category', 'Brand', 'Unit', 'CostPrice', 'RetailPrice', 'WholesalePrice', 'MinStockAlert', 'StockTotal'];
    const rows = products.map(p => {
      const totalStock = Object.values(p.stock || {}).reduce((a, b) => a + Number(b), 0);
      return [
        `"${p.sku || ''}"`,
        `"${p.barcode || ''}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${p.category || ''}"`,
        `"${p.brand || ''}"`,
        `"${p.unit || ''}"`,
        p.costPrice || 0,
        p.retailPrice || 0,
        p.wholesalePrice || 0,
        p.minStockAlert || 10,
        totalStock
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CSV Template Download ---
  const downloadTemplate = () => {
    const headers = ['SKU', 'Barcode', 'Name', 'Category', 'Brand', 'Unit', 'CostPrice', 'RetailPrice', 'WholesalePrice', 'MinStockAlert', 'InitialStock'];
    const sampleRows = [
      ['CEM-TWIGA-42', '6001002001', 'Twiga Extra Cement 42.5N (50kg Bag)', 'Cement & Aggregates', 'Twiga Cement', 'Bag', '18500', '22000', '20500', '50', '100'],
      ['STL-NONDO-Y12', '6001002002', 'Nondo Deformed Rebar Y12 (12m Bar)', 'Steel & Rebar', 'MMI Steel', 'Pcs', '32000', '38500', '36000', '50', '80'],
      ['PNT-CRW-WHT-20L', '6001002003', 'Coral Weather Guard Emulsion White (20L)', 'Paints & Finishes', 'Coral Paints', 'Bucket', '85000', '110000', '98000', '15', '25'],
      ['PLM-PVC-110MM', '6001002004', 'Bomba la PVC Drainage 110mm x 6m', 'Plumbing & Pipes', 'Simba Pipes', 'Pcs', '28000', '36000', '33000', '20', '40'],
      ['TOL-NAIL-3IN', '6001002005', 'Misumari Wire Nails 3-Inch (50kg Bag)', 'Tools & Fasteners', 'Tanzania Nails', 'Bag', '115000', '145000', '135000', '10', '15']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'hardware-inventory-import-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CSV File Parser ---
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setImportError('CSV file is empty or missing headers');
          return;
        }

        const headers = lines[0].split(',').map(h => h.replace(/["\r]/g, '').trim().toLowerCase());
        const parsed = [];

        for (let i = 1; i < lines.length; i++) {
          const rawLine = lines[i];
          // Handle quoted commas
          const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
          const matches = [];
          let match;
          while ((match = regex.exec(rawLine)) !== null) {
            let val = match[1] || '';
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.slice(1, -1).replace(/""/g, '"');
            }
            matches.push(val.trim());
            if (regex.lastIndex === rawLine.length) break;
          }

          if (matches.length > 0 && matches[0]) {
            const item = {
              sku: matches[0] || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
              barcode: matches[1] || `${Math.floor(6001000000 + Math.random() * 999999)}`,
              name: matches[2] || 'Unnamed Product',
              category: matches[3] || 'General Hardware',
              brand: matches[4] || 'General',
              unit: matches[5] || 'Pcs',
              costPrice: Number(matches[6]) || 0,
              retailPrice: Number(matches[7]) || 0,
              wholesalePrice: Number(matches[8]) || Number(matches[7]) || 0,
              minStockAlert: Number(matches[9]) || 10,
              initialStock: Number(matches[10]) || 0
            };
            if (item.name && item.name !== 'Unnamed Product') {
              parsed.push(item);
            }
          }
        }

        if (parsed.length === 0) {
          setImportError('Could not parse any valid product rows from CSV');
          return;
        }

        setImportPreview(parsed);
      } catch (err) {
        setImportError('Failed to read CSV file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const executeBulkImport = async () => {
    if (importPreview.length === 0) return;
    setIsImporting(true);
    try {
      await onBulkImport(importPreview);
      setIsImportModalOpen(false);
      setImportPreview([]);
      alert(`Successfully imported ${importPreview.length} products into inventory!`);
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner / Actions */}
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
              <Package className="w-5 h-5 text-amber-500" />
              <span>Inventory & Stock Management</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time stock catalog, reorder thresholds, multi-branch tracking, and bulk CSV spreadsheet import.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* CSV Export */}
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center space-x-1.5 transition"
            title="Download CSV spreadsheet of current products"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* CSV Import */}
          <button
            onClick={() => {
              setImportPreview([]);
              setImportError('');
              setIsImportModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center space-x-1.5 transition"
            title="Import products from Excel/CSV"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Import CSV</span>
          </button>

          {/* Add Product */}
          <button
            onClick={handleCreate}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-md shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* When Inventory is completely empty, offer quick-start options */}
      {products.length === 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 border border-amber-500/30 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center mx-auto font-black text-xl">
            ✨
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Your Inventory is Currently Clean & Empty</h3>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
              Start adding your actual products. You can enter items one by one or upload your existing Excel/CSV spreadsheet to get started immediately.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleCreate}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Product Manually</span>
            </button>

            <button
              onClick={() => {
                setImportPreview([]);
                setImportError('');
                setIsImportModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center space-x-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Upload CSV Spreadsheet</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, Barcode, Name, or Brand..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Category Filter */}
        <div className="min-w-[180px]">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white"
          >
            <option value="All">All Categories ({products.length})</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Stock Level Filter */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStockFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              stockFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Stock
          </button>
          <button
            onClick={() => setStockFilter('low')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              stockFilter === 'low' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-amber-700 hover:bg-amber-100'
            }`}
          >
            ⚠️ Low Stock
          </button>
          <button
            onClick={() => setStockFilter('out')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              stockFilter === 'out' ? 'bg-red-500 text-white shadow-xs' : 'text-red-700 hover:bg-red-100'
            }`}
          >
            🛑 Out of Stock
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">Item & Brand</th>
                <th className="py-3 px-3">Category & Unit</th>
                <th className="py-3 px-3">Buying Cost</th>
                <th className="py-3 px-3">Retail Price</th>
                <th className="py-3 px-3">Wholesale Price</th>
                <th className="py-3 px-3">Active Branch</th>
                <th className="py-3 px-3">Multi-Branch Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm">No inventory items match criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Use the "Add Item" button or "Import CSV" to add products.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const currentShopQty = Number(product.stock?.[currentShopId] || 0);
                  const totalStock = Object.values(product.stock || {}).reduce((a, b) => a + Number(b), 0);
                  const isLow = currentShopQty <= product.minStockAlert && currentShopQty > 0;
                  const isOut = currentShopQty <= 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50 transition">
                      {/* Name & SKU with Image Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0 bg-slate-50"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                              <Package className="w-5 h-5 opacity-50" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 leading-snug">{product.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-2 mt-0.5">
                              <span>SKU: {product.sku}</span>
                              <span>•</span>
                              <span>Bar: {product.barcode}</span>
                              <span>•</span>
                              <span className="text-amber-700 font-semibold">{product.brand}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Unit */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-700">{product.category}</div>
                        <span className="inline-block text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded uppercase mt-0.5">
                          {product.unit}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 font-semibold text-slate-600">
                        {currentUser?.role === 'admin' ? (
                          `${settings.currencySymbol} ${Number(product.costPrice).toLocaleString()}`
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px] italic" title="Cost price is confidential and restricted to Owner">🔒 Confidential</span>
                        )}
                      </td>

                      {/* Retail */}
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {settings.currencySymbol} {Number(product.retailPrice).toLocaleString()}
                      </td>

                      {/* Wholesale */}
                      <td className="py-3 px-3 font-bold text-amber-700">
                        {settings.currencySymbol} {Number(product.wholesalePrice).toLocaleString()}
                      </td>

                      {/* Active Branch Stock */}
                      <td className="py-3 px-3">
                        {currentShopId === 'all' ? (
                          <span className="text-xs font-extrabold text-slate-800">
                            {totalStock} {product.unit}s Total
                          </span>
                        ) : (
                          <span className={`inline-block font-extrabold px-2 py-0.5 rounded text-[11px] ${
                            isOut
                              ? 'bg-red-100 text-red-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {currentShopQty} {product.unit}s {isOut ? '(Out)' : isLow ? '(Low)' : ''}
                          </span>
                        )}
                      </td>

                      {/* Multi-Branch Stock Breakdown */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5 text-[10px]">
                          {shops.map(s => (
                            <div key={s.id} className="flex items-center space-x-1.5">
                              <span className="text-slate-400 truncate max-w-[80px]">{s.name.split('-')[1] || s.name}:</span>
                              <span className="font-bold text-slate-800">{product.stock?.[s.id] ?? 0}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setAdjustingProduct(product)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition"
                            title="Adjust Stock Count / Report Damage"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Product Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {currentUser?.role === 'admin' && (
                            <button
                              onClick={() => handleDelete(product.id, product.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
                              title="Delete Product (Owner Only)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Bulk CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base tracking-wide">Bulk Import Products from CSV</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-emerald-950 block">Step 1: Download Standard Hardware CSV Template</span>
                  <p className="text-emerald-700 mt-0.5">Includes columns for SKU, Barcode, Name, Category, Brand, Unit, Prices, and Initial Stock.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1 flex-shrink-0 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template.csv</span>
                </button>
              </div>

              <div>
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider block mb-1">
                  Step 2: Select your completed CSV file
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />
              </div>

              {importError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {importError}
                </div>
              )}

              {/* Preview Table */}
              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Step 3: Preview ({importPreview.length} products ready to import)
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold">✓ Format Verified</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Category</th>
                          <th className="p-2">Unit</th>
                          <th className="p-2">Cost</th>
                          <th className="p-2">Retail</th>
                          <th className="p-2">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreview.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-900">{item.name}</td>
                            <td className="p-2 text-slate-600">{item.category}</td>
                            <td className="p-2">{item.unit}</td>
                            <td className="p-2">{settings.currencySymbol} {item.costPrice}</td>
                            <td className="p-2 font-bold">{settings.currencySymbol} {item.retailPrice}</td>
                            <td className="p-2 font-bold text-emerald-700">{item.initialStock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importPreview.length === 0 || isImporting}
                  onClick={executeBulkImport}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-md transition disabled:opacity-40"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isImporting ? 'Importing Products...' : `Import ${importPreview.length} Products`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={editingProduct}
        categories={categories}
        shops={shops}
        settings={settings}
        onSave={onSaveProduct}
      />

      <StockAdjustModal
        isOpen={Boolean(adjustingProduct)}
        onClose={() => setAdjustingProduct(null)}
        product={adjustingProduct}
        currentShopId={currentShopId}
        shops={shops}
        currentUser={currentUser}
        onAdjust={onAdjustStock}
      />

    </div>
  );
}
