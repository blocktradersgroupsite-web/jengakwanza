import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  Package, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Link as LinkIcon 
} from 'lucide-react';

export default function ProductModal({
  isOpen,
  onClose,
  product,
  categories,
  shops,
  onSave,
  settings
}) {
  if (!isOpen) return null;

  const isEditing = Boolean(product);
  const [imageMode, setImageMode] = useState('upload'); // 'upload' | 'url'

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: categories[0]?.name || 'Cement & Aggregates',
    brand: '',
    unit: 'Bag',
    costPrice: '',
    retailPrice: '',
    wholesalePrice: '',
    minStockAlert: '10',
    description: '',
    image: '',
    stock: {}
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        category: product.category || categories[0]?.name || 'General',
        brand: product.brand || '',
        unit: product.unit || 'Pcs',
        costPrice: product.costPrice || '',
        retailPrice: product.retailPrice || '',
        wholesalePrice: product.wholesalePrice || '',
        minStockAlert: product.minStockAlert || '10',
        description: product.description || '',
        image: product.image || '',
        stock: product.stock || {}
      });
    } else {
      // Auto-generate random SKU and barcode for new products
      const randomSku = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
      const randomBarcode = `600100${Math.floor(1000 + Math.random() * 9000)}`;
      const initialStock = {};
      shops.forEach(s => { initialStock[s.id] = 0; });

      setFormData({
        name: '',
        sku: randomSku,
        barcode: randomBarcode,
        category: categories[0]?.name || 'Cement & Aggregates',
        brand: '',
        unit: 'Bag',
        costPrice: '',
        retailPrice: '',
        wholesalePrice: '',
        minStockAlert: '10',
        description: '',
        image: '',
        stock: initialStock
      });
    }
  }, [product, isOpen, categories, shops]);

  const generateBarcode = () => {
    setFormData(prev => ({
      ...prev,
      barcode: `600100${Math.floor(1000 + Math.random() * 9000)}`
    }));
  };

  const handleStockChange = (shopId, val) => {
    setFormData(prev => ({
      ...prev,
      stock: {
        ...prev.stock,
        [shopId]: Number(val) || 0
      }
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize and compress via canvas
        const canvas = document.createElement('canvas');
        const maxDim = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setFormData(prev => ({ ...prev, image: dataUrl }));
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave({
      ...formData,
      costPrice: Number(formData.costPrice) || 0,
      retailPrice: Number(formData.retailPrice) || 0,
      wholesalePrice: Number(formData.wholesalePrice) || Number(formData.retailPrice) || 0,
      minStockAlert: Number(formData.minStockAlert) || 10
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
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
            <h3 className="font-extrabold text-base tracking-wide">
              {isEditing ? 'Edit Hardware Product' : 'Add New Hardware Product'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Product Full Name: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Simba Cement 42.5N (50kg Bag) or TMT Rebar Y12 (12m)"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* SKU, Barcode & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                SKU Code:
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold"
                placeholder="CEM-001"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider flex justify-between">
                <span>Barcode:</span>
                <button
                  type="button"
                  onClick={generateBarcode}
                  className="text-[10px] text-amber-600 hover:underline flex items-center space-x-0.5"
                >
                  <RefreshCw className="w-2.5 h-2.5 mr-0.5" /> Auto
                </button>
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold"
                placeholder="6001002001"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Category:
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Brand, Unit & Min Reorder Alert */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Brand / Manufacturer:
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. Bamburi, Crown, Apex"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Unit of Measure:
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                {['Bag', 'Pcs', 'Kg', 'Liter', 'Meter', 'Roll', 'Sheet', 'Bucket', 'Box', 'Bundle', 'Pair'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Low Stock Alert Level:
              </label>
              <input
                type="number"
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                placeholder="10"
              />
            </div>
          </div>

          {/* Product Image Attachment */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <span>Product Image / Photo:</span>
              </label>
              <div className="flex items-center space-x-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`px-2 py-0.5 rounded font-semibold transition ${
                    imageMode === 'upload' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`px-2 py-0.5 rounded font-semibold transition ${
                    imageMode === 'url' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Paste URL
                </button>
              </div>
            </div>

            {formData.image ? (
              <div className="flex items-center gap-4 bg-white p-2.5 border border-slate-200 rounded-xl">
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0 flex items-center justify-center relative group">
                  <img
                    src={formData.image}
                    alt={formData.name || 'Product'}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=No+Img'; }}
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {formData.name || 'Attached Product Image'}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Visible on POS cards and Inventory catalogs.
                  </p>
                  <div className="flex items-center space-x-3 pt-1">
                    <label className="cursor-pointer text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Change Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {imageMode === 'upload' ? (
                  <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-white hover:bg-amber-50/20 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-amber-500 mb-1 transition" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-amber-700">
                      Click or drag & drop product photo to upload
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Supports JPG, PNG, WEBP (Auto-optimized for ultra-fast POS loading)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="https://example.com/images/twiga-cement.jpg"
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing Row: Cost Price, Retail Price, Wholesale Price */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <span className="text-[11px] font-black uppercase text-amber-900 tracking-wider block mb-2">
              Pricing Structure ({settings.currencySymbol}):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cost (Buying) Price:
                </label>
                <input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Retail Selling Price: <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.retailPrice}
                  onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wholesale / Contractor Price:
                </label>
                <input
                  type="number"
                  value={formData.wholesalePrice}
                  onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-amber-700"
                />
              </div>
            </div>
          </div>

          {/* Multi-Branch Initial Stock Levels */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Stock Quantity Across Shops / Branches:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {shops.map(shop => (
                <div key={shop.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-bold text-slate-800 truncate mb-1">
                    {shop.isMain ? '⭐ ' : ''}{shop.name}
                  </div>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="0"
                      value={formData.stock[shop.id] ?? 0}
                      onChange={(e) => handleStockChange(shop.id, e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
                    />
                    <span className="text-[11px] text-slate-400 font-medium">{formData.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Item Notes / Technical Specifications:
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Dimensions, standard compliance (TBS / ISO), color code..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:bg-white"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-md shadow-amber-500/20 transition"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Update Product' : 'Create Product'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
