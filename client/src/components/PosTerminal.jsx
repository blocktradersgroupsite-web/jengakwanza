import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  PauseCircle, 
  PlayCircle, 
  CreditCard, 
  ShoppingBag, 
  Tag, 
  AlertCircle, 
  Check, 
  Layers, 
  Percent,
  Clock,
  RotateCcw,
  Package,
  Image as ImageIcon
} from 'lucide-react';
import CheckoutModal from './CheckoutModal';

export default function PosTerminal({
  products,
  categories,
  currentShopId,
  currentShop,
  settings,
  currentUser,
  customers,
  onCompleteSale
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [parkedOrders, setParkedOrders] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [taxEnabled, setTaxEnabled] = useState(settings.taxEnabled || false);
  const barcodeInputRef = useRef(null);

  // Focus barcode input on mount and shortcut keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F2 or Ctrl+B focuses the search/barcode bar
      if (e.key === 'F2' || (e.ctrlKey && e.key === 'b')) {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter products based on active shop, category, and search query
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const s = searchQuery.toLowerCase().trim();
    const matchesSearch = !s || 
      p.name.toLowerCase().includes(s) ||
      (p.sku && p.sku.toLowerCase().includes(s)) ||
      (p.barcode && p.barcode.toLowerCase().includes(s)) ||
      (p.brand && p.brand.toLowerCase().includes(s));
    
    return matchesCategory && matchesSearch;
  });

  // Handle adding product to cart (or incrementing qty if already in cart)
  const addToCart = (product, forcedPriceType = null) => {
    const stockInShop = currentShopId === 'all'
      ? Object.values(product.stock || {}).reduce((a, b) => a + Number(b), 0)
      : Number(product.stock?.[currentShopId] || 0);

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.productId === product.id);
      if (existingIndex > -1) {
        const item = prevCart[existingIndex];
        const updatedQty = item.quantity + 1;
        const updatedItem = {
          ...item,
          quantity: updatedQty,
          total: Math.max(0, (updatedQty * item.unitPrice) - item.discount)
        };
        const newCart = [...prevCart];
        newCart[existingIndex] = updatedItem;
        return newCart;
      } else {
        const priceType = forcedPriceType || 'retail';
        const unitPrice = priceType === 'wholesale' ? product.wholesalePrice : product.retailPrice;
        return [
          ...prevCart,
          {
            productId: product.id,
            sku: product.sku,
            barcode: product.barcode,
            name: product.name,
            unit: product.unit,
            category: product.category,
            brand: product.brand,
            image: product.image || '',
            costPrice: product.costPrice,
            retailPrice: product.retailPrice,
            wholesalePrice: product.wholesalePrice,
            priceType,
            unitPrice,
            quantity: 1,
            discount: 0,
            total: unitPrice,
            maxStock: stockInShop
          }
        ];
      }
    });
  };

  // Handle Barcode Direct Enter
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check exact match by barcode or SKU
    const matched = products.find(p => 
      (p.barcode && p.barcode.toLowerCase() === searchQuery.toLowerCase().trim()) ||
      (p.sku && p.sku.toLowerCase() === searchQuery.toLowerCase().trim())
    );

    if (matched) {
      addToCart(matched);
      setSearchQuery('');
    } else if (filteredProducts.length === 1) {
      addToCart(filteredProducts[0]);
      setSearchQuery('');
    }
  };

  // Cart item modifications
  const updateQuantity = (productId, newQty) => {
    const qty = Math.max(1, Number(newQty) || 1);
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity: qty,
          total: Math.max(0, (qty * item.unitPrice) - item.discount)
        };
      }
      return item;
    }));
  };

  const togglePriceType = (productId) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newType = item.priceType === 'retail' ? 'wholesale' : 'retail';
        const newPrice = newType === 'wholesale' ? item.wholesalePrice : item.retailPrice;
        return {
          ...item,
          priceType: newType,
          unitPrice: newPrice,
          total: Math.max(0, (item.quantity * newPrice) - item.discount)
        };
      }
      return item;
    }));
  };

  const updateDiscount = (productId, discountVal) => {
    const disc = Math.max(0, Number(discountVal) || 0);
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          discount: disc,
          total: Math.max(0, (item.quantity * item.unitPrice) - disc)
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    if (cart.length && confirm('Are you sure you want to clear the active cart?')) {
      setCart([]);
    }
  };

  // Park Order (Hold sale)
  const parkOrder = () => {
    if (!cart.length) return;
    const orderTitle = prompt('Enter a reference label for this parked order (e.g. Customer Name or Token #):', `Order #${parkedOrders.length + 1}`);
    if (orderTitle !== null) {
      setParkedOrders(prev => [
        ...prev,
        {
          id: `PARK-${Date.now()}`,
          label: orderTitle.trim() || `Order #${prev.length + 1}`,
          cart: [...cart],
          time: new Date().toLocaleTimeString()
        }
      ]);
      setCart([]);
    }
  };

  const resumeParkedOrder = (parkedId) => {
    const parked = parkedOrders.find(p => p.id === parkedId);
    if (!parked) return;
    if (cart.length > 0) {
      if (!confirm('Active cart has items. Replace with parked order?')) return;
    }
    setCart(parked.cart);
    setParkedOrders(prev => prev.filter(p => p.id !== parkedId));
  };

  // Totals calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountTotal = cart.reduce((sum, item) => sum + item.discount, 0);
  const netSubtotal = Math.max(0, subtotal - discountTotal);
  const taxRate = taxEnabled ? (settings.taxRate || 16) : 0;
  const taxAmount = taxEnabled ? Math.round((netSubtotal * taxRate) / 100) : 0;
  const grandTotal = netSubtotal + taxAmount;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-105px)] overflow-hidden bg-slate-100">
      
      {/* LEFT COLUMN: Product Catalog & Fast Grid */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200">
        
        {/* Top Control Bar: Search & Barcode input */}
        <div className="p-3 bg-white border-b border-slate-200 flex items-center gap-3 shadow-xs">
          <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Scan Barcode or Search by Name, SKU, Brand (Press F2 or Ctrl+B)..."
              className="w-full pl-9 pr-24 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                [Enter to add]
              </span>
            </div>
          </form>

          {/* Parked Orders Badge / Restore button */}
          {parkedOrders.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-300 rounded-xl px-2.5 py-1 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-bold text-amber-800">{parkedOrders.length} Parked</span>
              <div className="flex space-x-1 ml-1">
                {parkedOrders.map(po => (
                  <button
                    key={po.id}
                    onClick={() => resumeParkedOrder(po.id)}
                    className="text-[10px] bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-1.5 py-0.5 rounded transition"
                    title={`Resume ${po.label} (${po.time})`}
                  >
                    {po.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Category Pills Bar */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex overflow-x-auto no-scrollbar gap-1.5">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Items ({products.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.name
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-3 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <ShoppingBag className="w-12 h-12 stroke-[1.5] mb-2 opacity-50" />
              <p className="text-sm font-semibold">No products found matching your search</p>
              <p className="text-xs">Try clearing the search query or changing category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {filteredProducts.map(product => {
                const stockInCurrentShop = currentShopId === 'all'
                  ? Object.values(product.stock || {}).reduce((a, b) => a + Number(b), 0)
                  : Number(product.stock?.[currentShopId] || 0);

                const isLow = stockInCurrentShop <= product.minStockAlert && stockInCurrentShop > 0;
                const isOut = stockInCurrentShop <= 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white rounded-xl border border-slate-200 p-2.5 flex flex-col justify-between hover:border-amber-500 hover:shadow-md cursor-pointer transition group active:scale-[0.98] select-none"
                  >
                    <div>
                      {/* Product Image Thumbnail */}
                      {product.image ? (
                        <div className="w-full h-24 mb-2 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center relative border border-slate-100">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200" 
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-12 mb-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-amber-500/60 transition">
                          <Package className="w-5 h-5 stroke-[1.5]" />
                        </div>
                      )}

                      {/* Top Badges: Brand & Unit */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[90px]">
                          {product.brand}
                        </span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded uppercase">
                          {product.unit}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h4 className="font-bold text-xs text-slate-800 group-hover:text-amber-600 line-clamp-2 leading-snug mb-1">
                        {product.name}
                      </h4>

                      {/* SKU / Barcode */}
                      <div className="text-[10px] font-mono text-slate-400 truncate mb-2">
                        {product.sku}
                      </div>
                    </div>

                    <div>
                      {/* Stock Level Indicator */}
                      <div className="flex items-center justify-between text-[11px] mb-2 pt-1 border-t border-slate-100">
                        <span className="text-slate-400">Stock:</span>
                        <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                          isOut 
                            ? 'bg-red-100 text-red-700' 
                            : isLow 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {stockInCurrentShop} {product.unit}s
                        </span>
                      </div>

                      {/* Pricing Box */}
                      <div className="bg-slate-50 p-1.5 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="text-[9px] text-slate-400 font-medium">Retail:</div>
                          <div className="font-black text-xs text-slate-900">
                            {settings.currencySymbol} {Number(product.retailPrice).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] text-slate-400 font-medium">Wholesale:</div>
                          <div className="font-semibold text-[11px] text-amber-600">
                            {settings.currencySymbol} {Number(product.wholesalePrice).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Active Cart & Quick Checkout Panel */}
      <div className="w-full lg:w-96 xl:w-[420px] bg-white flex flex-col h-full border-l border-slate-200 shadow-xl z-10">
        
        {/* Cart Header */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm tracking-wide">Current Cart</span>
            <span className="text-xs bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
              {cart.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {cart.length > 0 && (
              <>
                <button
                  onClick={parkOrder}
                  className="text-xs text-slate-300 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800 flex items-center space-x-1"
                  title="Hold / Park Sale"
                >
                  <PauseCircle className="w-4 h-4" />
                  <span className="text-[11px]">Hold</span>
                </button>
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <ShoppingBag className="w-12 h-12 stroke-[1] mb-2 opacity-40" />
              <p className="font-bold text-slate-600 text-sm">Cart is currently empty</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                Click any product on the left or scan a barcode to add to sale.
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="py-2.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-800 leading-tight truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {item.sku} • {item.unit}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-slate-400 hover:text-red-500 p-1 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Pricing Mode Toggle: Retail vs Wholesale */}
                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => togglePriceType(item.productId)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition flex items-center space-x-1 ${
                      item.priceType === 'wholesale'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title="Click to toggle Wholesale / Contractor price"
                  >
                    <Tag className="w-3 h-3 mr-0.5" />
                    <span>{item.priceType === 'wholesale' ? 'Wholesale' : 'Retail'}: {settings.currencySymbol} {Number(item.unitPrice).toLocaleString()}</span>
                  </button>

                  <div className="font-black text-xs text-slate-900">
                    {settings.currencySymbol} {item.total.toLocaleString()}
                  </div>
                </div>

                {/* Qty & Line Discount */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {/* Quantity adjustment buttons */}
                  <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-1 hover:bg-slate-200 rounded-l text-slate-600 transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, e.target.value)}
                      className="w-12 text-center text-xs font-bold bg-transparent text-slate-800 focus:outline-none"
                    />
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-1 hover:bg-slate-200 rounded-r text-slate-600 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line Discount input */}
                  <div className="flex items-center space-x-1 text-slate-500">
                    <span className="text-[10px]">Disc:</span>
                    <input
                      type="number"
                      min="0"
                      value={item.discount || ''}
                      onChange={(e) => updateDiscount(item.productId, e.target.value)}
                      placeholder="0"
                      className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-right text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Checkout Trigger */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{settings.currencySymbol} {subtotal.toLocaleString()}</span>
            </div>
            
            {discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Total Discount:</span>
                <span>- {settings.currencySymbol} {discountTotal.toLocaleString()}</span>
              </div>
            )}

            {/* VAT Tax Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <label className="flex items-center space-x-1.5 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={(e) => setTaxEnabled(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <span className="text-[11px] font-medium">Apply VAT ({settings.taxRate || 16}%):</span>
              </label>
              <span className="font-semibold text-slate-800">
                {settings.currencySymbol} {taxAmount.toLocaleString()}
              </span>
            </div>

            {/* Grand Total Bar */}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-300">
              <span className="text-sm font-extrabold text-slate-900 uppercase">Grand Total:</span>
              <span className="text-xl font-black text-amber-600">
                {settings.currencySymbol} {grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Button: Checkout */}
          <button
            onClick={() => setIsCheckoutOpen(true)}
            disabled={cart.length === 0}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay & Print Invoice ({settings.currencySymbol} {grandTotal.toLocaleString()})</span>
          </button>
        </div>

      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        subtotal={subtotal}
        discountTotal={discountTotal}
        taxRate={taxRate}
        taxAmount={taxAmount}
        grandTotal={grandTotal}
        customers={customers}
        currentShop={currentShop}
        currentUser={currentUser}
        settings={settings}
        onCompleteSale={async (salePayload) => {
          const saleResult = await onCompleteSale(salePayload);
          setCart([]); // Clear cart upon successful checkout
          return saleResult;
        }}
      />

    </div>
  );
}
