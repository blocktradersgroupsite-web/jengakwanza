import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import PosTerminal from './components/PosTerminal';
import InventoryManager from './components/InventoryManager';
import CustomerLedger from './components/CustomerLedger';
import ProcurementManager from './components/ProcurementManager';
import ExpenseTracker from './components/ExpenseTracker';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SettingsManager from './components/SettingsManager';
import DocumentPrintModal from './components/DocumentPrintModal';
import ProformaManager from './components/ProformaManager';
import DeliveryManager from './components/DeliveryManager';
import LoginPage from './components/LoginPage';
import { 
  getActiveSupabaseUser, 
  supabaseSignOut, 
  onSupabaseAuthStateChange 
} from './supabase';
import { 
  subscribeNetworkStatus, 
  subscribeQueue, 
  syncOfflineQueue, 
  getOnlineStatus, 
  getLocalCache, 
  setLocalCache,
  checkServerConnection 
} from './utils/offlineSync';
import { Loader2, WifiOff, CheckCircle2, RefreshCw } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pos'); // pos | proformas | deliveries | inventory | debtors | procurement | expenses | analytics | settings
  const [currentShopId, setCurrentShopId] = useState('shop-main');
  
  // Offline & Synchronization State
  const [isOnline, setIsOnline] = useState(() => getOnlineStatus());
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncBanner, setSyncBanner] = useState(null);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const stored = localStorage.getItem('jk_auth_user');
      return !!stored;
    } catch {
      return false;
    }
  });

  // User & Modals State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('jk_auth_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed parsing stored auth user:', e);
    }
    return {
      id: 'usr-admin',
      name: 'Director / Store Owner',
      role: 'admin',
      pin: '1234'
    };
  });

  // Data State with resilient local cache fallback
  const [shops, setShops] = useState(() => getLocalCache('shops', []));
  const [categories, setCategories] = useState(() => getLocalCache('categories', []));
  const [products, setProducts] = useState(() => getLocalCache('products', []));
  const [customers, setCustomers] = useState(() => getLocalCache('customers', []));
  const [suppliers, setSuppliers] = useState(() => getLocalCache('suppliers', []));
  const [sales, setSales] = useState(() => getLocalCache('sales', []));
  const [proformas, setProformas] = useState(() => getLocalCache('proformas', []));
  const [deliveryNotes, setDeliveryNotes] = useState(() => getLocalCache('deliveryNotes', []));
  const [transfers, setTransfers] = useState(() => getLocalCache('transfers', []));
  const [purchases, setPurchases] = useState(() => getLocalCache('purchases', []));
  const [expenses, setExpenses] = useState(() => getLocalCache('expenses', []));
  const [users, setUsers] = useState(() => getLocalCache('users', []));
  const [settings, setSettings] = useState(() => {
    const cached = getLocalCache('settings', null);
    const defaults = {
      businessName: 'JENGA KWANZA HARDWARE & STORES',
      tagline: 'OUR DUTY IS TO DELIGHT YOU.',
      currency: 'TZS',
      currencySymbol: 'Tsh',
      phone: '0788989889 / 0713550104',
      email: 'jengakwanzaltd@gmail.com',
      address: 'P.O.BOX 14991 ARUSHA',
      taxRate: 18,
      taxEnabled: false,
      logo: '/logo.png',
      receiptHeader: 'JENGA KWANZA HARDWARE & STORES',
      receiptFooter: 'Asante kwa kujenga nasi! Bidhaa zilizonunuliwa zinaweza kubadilishwa ndani ya siku 7 zikiwa katika hali nzuri na risiti halisi.',
      copyrightNotice: '© 2026 JENGA KWANZA HARDWARE & STORES. Haki Zote Zimehifadhiwa / All Rights Reserved.',
      defaultPrinterType: 'a4'
    };
    if (cached) {
      return {
        ...defaults,
        ...cached,
        phone: (!cached.phone || cached.phone.includes('700 000')) ? '0788989889 / 0713550104' : cached.phone,
        email: (!cached.email || cached.email.includes('info@') || cached.email.includes('store@')) ? 'jengakwanzaltd@gmail.com' : cached.email,
        address: (!cached.address || cached.address.includes('Kariakoo') || cached.address.includes('Main Street')) ? 'P.O.BOX 14991 ARUSHA' : cached.address,
      };
    }
    return defaults;
  });
  const [analytics, setAnalytics] = useState(null);

  const [deliveryPrefill, setDeliveryPrefill] = useState(null);
  const [printDoc, setPrintDoc] = useState({
    isOpen: false,
    type: 'receipt', // 'receipt' | 'proforma' | 'delivery'
    data: null
  });

  // Fetch all initial data
  const loadData = async () => {
    try {
      const [
        shopsRes,
        catsRes,
        prodsRes,
        custsRes,
        supsRes,
        salesRes,
        profRes,
        delivRes,
        trfsRes,
        posRes,
        expsRes,
        usersRes,
        settRes
      ] = await Promise.all([
        api.getShops().catch(err => { console.warn('shops error:', err); return []; }),
        api.getCategories().catch(err => { console.warn('categories error:', err); return []; }),
        api.getProducts().catch(err => { console.warn('products error:', err); return []; }),
        api.getCustomers().catch(err => { console.warn('customers error:', err); return []; }),
        api.getSuppliers().catch(err => { console.warn('suppliers error:', err); return []; }),
        api.getSales().catch(err => { console.warn('sales error:', err); return []; }),
        api.getProformas().catch(err => { console.warn('proformas error:', err); return []; }),
        api.getDeliveryNotes().catch(err => { console.warn('delivery notes error:', err); return []; }),
        api.getTransfers().catch(err => { console.warn('transfers error:', err); return []; }),
        api.getPurchases().catch(err => { console.warn('purchases error:', err); return []; }),
        api.getExpenses().catch(err => { console.warn('expenses error:', err); return []; }),
        api.getUsers().catch(err => { console.warn('users error:', err); return []; }),
        api.getSettings().catch(err => { console.warn('settings error:', err); return null; })
      ]);

      if (Array.isArray(shopsRes) && shopsRes.length) { setShops(shopsRes); setLocalCache('shops', shopsRes); }
      if (Array.isArray(catsRes) && catsRes.length) { setCategories(catsRes); setLocalCache('categories', catsRes); }
      if (Array.isArray(prodsRes) && prodsRes.length) { setProducts(prodsRes); setLocalCache('products', prodsRes); }
      if (Array.isArray(custsRes) && custsRes.length) { setCustomers(custsRes); setLocalCache('customers', custsRes); }
      if (Array.isArray(supsRes) && supsRes.length) { setSuppliers(supsRes); setLocalCache('suppliers', supsRes); }
      if (Array.isArray(salesRes) && salesRes.length) { setSales(salesRes); setLocalCache('sales', salesRes); }
      if (Array.isArray(profRes) && profRes.length) { setProformas(profRes); setLocalCache('proformas', profRes); }
      if (Array.isArray(delivRes) && delivRes.length) { setDeliveryNotes(delivRes); setLocalCache('deliveryNotes', delivRes); }
      if (Array.isArray(trfsRes) && trfsRes.length) { setTransfers(trfsRes); setLocalCache('transfers', trfsRes); }
      if (Array.isArray(posRes) && posRes.length) { setPurchases(posRes); setLocalCache('purchases', posRes); }
      if (Array.isArray(expsRes) && expsRes.length) { setExpenses(expsRes); setLocalCache('expenses', expsRes); }
      if (Array.isArray(usersRes) && usersRes.length) {
        setUsers(usersRes);
        setLocalCache('users', usersRes);
        setCurrentUser(prev => {
          if (!prev) return usersRes[0];
          const match = usersRes.find(u => u.id === prev.id);
          return match || prev;
        });
      }
      if (settRes && typeof settRes === 'object') {
        const mergedSettings = {
          ...settRes,
          phone: (!settRes.phone || settRes.phone.includes('700 000')) ? '0788989889 / 0713550104' : settRes.phone,
          email: (!settRes.email || settRes.email.includes('info@') || settRes.email.includes('store@')) ? 'jengakwanzaltd@gmail.com' : settRes.email,
          address: (!settRes.address || settRes.address.includes('Kariakoo') || settRes.address.includes('Main Street')) ? 'P.O.BOX 14991 ARUSHA' : settRes.address,
          logo: settRes.logo || '/logo.png',
          currencySymbol: 'Tsh',
          currency: 'TZS'
        };
        setSettings(mergedSettings);
        setLocalCache('settings', mergedSettings);
      }
    } catch (err) {
      console.error('Failed to load store data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh analytics whenever shop or tab changes
  const refreshAnalytics = async () => {
    try {
      const summary = await api.getAnalyticsSummary({ shopId: currentShopId });
      setAnalytics(summary);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  useEffect(() => {
    loadData();

    // Check & restore existing Supabase session if any
    getActiveSupabaseUser().then(sbUser => {
      if (sbUser) {
        setCurrentUser(sbUser);
        setIsAuthenticated(true);
        try {
          localStorage.setItem('jk_auth_user', JSON.stringify(sbUser));
        } catch (e) {}
      }
    });

    // Listen to Supabase auth events
    const unsubscribe = onSupabaseAuthStateChange((event, sbUser) => {
      if (event === 'SIGNED_IN' && sbUser) {
        setCurrentUser(sbUser);
        setIsAuthenticated(true);
        try {
          localStorage.setItem('jk_auth_user', JSON.stringify(sbUser));
        } catch (e) {}
      } else if (event === 'SIGNED_OUT') {
        const stored = localStorage.getItem('jk_auth_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.isSupabase) {
              setIsAuthenticated(false);
              localStorage.removeItem('jk_auth_user');
            }
          } catch (e) {}
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Offline Sync Trigger
  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncOfflineQueue(api);
      if (res && res.syncedCount > 0) {
        setSyncBanner(`✓ Successfully synchronized ${res.syncedCount} offline transaction${res.syncedCount > 1 ? 's' : ''}!`);
        setTimeout(() => setSyncBanner(null), 6000);
        await loadData();
        await refreshAnalytics();
      }
    } catch (err) {
      console.warn('Auto-sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Subscribe to network & offline queue events
  useEffect(() => {
    const unsubNet = subscribeNetworkStatus((online) => {
      setIsOnline(online);
      if (online) {
        triggerSync();
      }
    });

    const unsubQueue = subscribeQueue((q) => {
      setOfflineQueue(q);
    });

    const handleSyncCompleted = (e) => {
      const { syncedCount } = e.detail || {};
      if (syncedCount > 0) {
        setSyncBanner(`✓ Synced ${syncedCount} offline transaction${syncedCount > 1 ? 's' : ''} to central server!`);
        setTimeout(() => setSyncBanner(null), 6000);
        loadData();
        refreshAnalytics();
      }
    };

    window.addEventListener('jk_sync_completed', handleSyncCompleted);

    // Initial check & periodic heartbeat
    checkServerConnection();
    const interval = setInterval(() => {
      checkServerConnection().then(online => {
        if (online && offlineQueue.length > 0 && !isSyncing) {
          triggerSync();
        }
      });
    }, 25000);

    return () => {
      unsubNet();
      unsubQueue();
      window.removeEventListener('jk_sync_completed', handleSyncCompleted);
      clearInterval(interval);
    };
  }, [offlineQueue.length, isSyncing, triggerSync]);

  useEffect(() => {
    if (!loading) {
      refreshAnalytics();
    }
  }, [loading, currentShopId, activeTab]);

  // Role-based protection: non-admin employees are strictly restricted from administrative modules
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      const restrictedTabs = ['inventory', 'procurement', 'expenses', 'analytics', 'settings'];
      if (restrictedTabs.includes(activeTab)) {
        setActiveTab('pos');
      }
      // Employees are locked to their assigned branch
      if (currentShopId === 'all' && currentUser?.assignedShopId && currentUser.assignedShopId !== 'all') {
        setCurrentShopId(currentUser.assignedShopId);
      }
    }
  }, [currentUser, activeTab, currentShopId]);

  // Auth Handlers
  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('jk_auth_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed saving auth session:', e);
    }
    if (user.role !== 'admin') {
      setActiveTab('pos');
      if (user.assignedShopId && user.assignedShopId !== 'all') {
        setCurrentShopId(user.assignedShopId);
      }
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('jk_auth_user');
    } catch (e) {
      console.warn('Failed removing auth session:', e);
    }
    await supabaseSignOut().catch(() => {});
    setActiveTab('pos');
  };

  const currentShop = shops.find(s => s.id === currentShopId) || shops[0] || { id: 'shop-main', name: 'Main Hardware Hub' };

  // --- Handlers ---
  const handleCompleteSale = async (salePayload) => {
    const newSale = await api.createSale(salePayload);
    // Refresh products, customers, sales, and analytics
    const [updatedProds, updatedCusts, updatedSales] = await Promise.all([
      api.getProducts(),
      api.getCustomers(),
      api.getSales()
    ]);
    setProducts(updatedProds);
    setCustomers(updatedCusts);
    setSales(updatedSales);
    setLocalCache('products', updatedProds);
    setLocalCache('customers', updatedCusts);
    setLocalCache('sales', updatedSales);
    setPrintDoc({
      isOpen: true,
      type: 'receipt',
      data: newSale
    });
    refreshAnalytics();
    return newSale;
  };

  const handleSaveProduct = async (productData) => {
    if (productData.id) {
      await api.updateProduct(productData.id, productData);
    } else {
      await api.createProduct(productData);
    }
    const updated = await api.getProducts();
    setProducts(updated);
    setLocalCache('products', updated);
    refreshAnalytics();
  };

  const handleDeleteProduct = async (id) => {
    await api.deleteProduct(id);
    setProducts(prev => {
      const filtered = prev.filter(p => p.id !== id);
      setLocalCache('products', filtered);
      return filtered;
    });
    refreshAnalytics();
  };

  const handleAdjustStock = async (id, payload) => {
    await api.adjustStock(id, payload);
    const updated = await api.getProducts();
    setProducts(updated);
    setLocalCache('products', updated);
    refreshAnalytics();
  };

  const handleSaveCustomer = async (custData) => {
    if (custData.id) {
      await api.updateCustomer(custData.id, custData);
    } else {
      await api.createCustomer(custData);
    }
    const updated = await api.getCustomers();
    setCustomers(updated);
    setLocalCache('customers', updated);
  };

  const handlePayDebt = async (customerId, payload) => {
    const res = await api.payDebt(customerId, payload);
    const [updatedCusts, updatedSales] = await Promise.all([
      api.getCustomers(),
      api.getSales()
    ]);
    setCustomers(updatedCusts);
    setSales(updatedSales);
    setLocalCache('customers', updatedCusts);
    setLocalCache('sales', updatedSales);
    if (res.receipt) {
      setPrintDoc({
        isOpen: true,
        type: 'receipt',
        data: res.receipt
      });
    }
    refreshAnalytics();
  };

  // --- Proforma Invoices Handlers ---
  const handleCreateProforma = async (payload) => {
    const newP = await api.createProforma(payload);
    const updated = await api.getProformas();
    setProformas(updated);
    setLocalCache('proformas', updated);
    setPrintDoc({
      isOpen: true,
      type: 'proforma',
      data: newP
    });
    return newP;
  };

  const handleUpdateProforma = async (id, payload) => {
    const updated = await api.updateProforma(id, payload);
    setProformas(prev => {
      const list = prev.map(p => p.id === id ? updated : p);
      setLocalCache('proformas', list);
      return list;
    });
    return updated;
  };

  const handleDeleteProforma = async (id) => {
    await api.deleteProforma(id);
    setProformas(prev => {
      const list = prev.filter(p => p.id !== id);
      setLocalCache('proformas', list);
      return list;
    });
  };

  const handleConvertToSale = async (proforma) => {
    const salePayload = {
      shopId: proforma.shopId || currentShop.id,
      shopName: proforma.shopName || currentShop.name,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerId: proforma.customerId,
      customerName: proforma.customerName,
      customerPhone: proforma.customerPhone,
      items: proforma.items,
      subtotal: proforma.subtotal,
      discountTotal: proforma.discountTotal || 0,
      taxRate: proforma.taxRate || 0,
      taxAmount: proforma.taxAmount || 0,
      grandTotal: proforma.grandTotal,
      paymentMethod: 'cash',
      paymentDetails: {
        note: `Converted from Proforma ${proforma.proformaNumber}`
      }
    };

    const newSale = await api.createSale(salePayload);
    await api.updateProforma(proforma.id, {
      status: 'converted',
      convertedSaleId: newSale.id
    });

    const [updatedProds, updatedCusts, updatedSales, updatedProformas] = await Promise.all([
      api.getProducts(),
      api.getCustomers(),
      api.getSales(),
      api.getProformas()
    ]);
    setProducts(updatedProds);
    setCustomers(updatedCusts);
    setSales(updatedSales);
    setProformas(updatedProformas);
    setLocalCache('products', updatedProds);
    setLocalCache('customers', updatedCusts);
    setLocalCache('sales', updatedSales);
    setLocalCache('proformas', updatedProformas);
    refreshAnalytics();

    setPrintDoc({
      isOpen: true,
      type: 'receipt',
      data: newSale
    });
  };

  const handleSaveCartAsProforma = async ({ cart, subtotal, discountTotal, taxRate, taxAmount, grandTotal }) => {
    const payload = {
      shopId: currentShop.id,
      shopName: currentShop.name,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      customerId: null,
      customerName: 'Counter Cash Customer',
      customerPhone: '',
      items: cart.map(it => ({
        productId: it.productId,
        sku: it.sku,
        name: it.name,
        unit: it.unit,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount || 0,
        priceType: it.priceType,
        total: it.total
      })),
      subtotal,
      discountTotal,
      taxRate,
      taxAmount,
      grandTotal,
      notes: 'Counter Quotation generated from POS'
    };

    const newP = await api.createProforma(payload);
    const updated = await api.getProformas();
    setProformas(updated);
    setLocalCache('proformas', updated);
    setPrintDoc({
      isOpen: true,
      type: 'proforma',
      data: newP
    });
  };

  // --- Delivery Notes Handlers ---
  const handleCreateDeliveryNote = async (payload) => {
    const newD = await api.createDeliveryNote(payload);
    const updated = await api.getDeliveryNotes();
    setDeliveryNotes(updated);
    setLocalCache('deliveryNotes', updated);
    setPrintDoc({
      isOpen: true,
      type: 'delivery',
      data: newD
    });
    return newD;
  };

  const handleUpdateDeliveryNote = async (id, payload) => {
    const updated = await api.updateDeliveryNote(id, payload);
    setDeliveryNotes(prev => {
      const list = prev.map(d => d.id === id ? updated : d);
      setLocalCache('deliveryNotes', list);
      return list;
    });
    return updated;
  };

  const handleDeleteDeliveryNote = async (id) => {
    await api.deleteDeliveryNote(id);
    setDeliveryNotes(prev => {
      const list = prev.filter(d => d.id !== id);
      setLocalCache('deliveryNotes', list);
      return list;
    });
  };

  const handleGenerateDeliveryFromDoc = (doc) => {
    setDeliveryPrefill(doc);
    setActiveTab('deliveries');
  };

  const handleCreateTransfer = async (transferData) => {
    await api.createTransfer(transferData);
    const [updatedTrfs, updatedProds] = await Promise.all([
      api.getTransfers(),
      api.getProducts()
    ]);
    setTransfers(updatedTrfs);
    setProducts(updatedProds);
  };

  const handleUpdateTransferStatus = async (id, status, receivedBy) => {
    await api.updateTransferStatus(id, { status, receivedBy });
    const [updatedTrfs, updatedProds] = await Promise.all([
      api.getTransfers(),
      api.getProducts()
    ]);
    setTransfers(updatedTrfs);
    setProducts(updatedProds);
  };

  const handleCreateSupplier = async (data) => {
    await api.createSupplier(data);
    const updated = await api.getSuppliers();
    setSuppliers(updated);
  };

  const handleCreatePurchase = async (poData) => {
    await api.createPurchase(poData);
    const [updatedPOs, updatedProds, updatedSups] = await Promise.all([
      api.getPurchases(),
      api.getProducts(),
      api.getSuppliers()
    ]);
    setPurchases(updatedPOs);
    setProducts(updatedProds);
    setSuppliers(updatedSups);
    refreshAnalytics();
  };

  const handleReceivePurchase = async (id) => {
    await api.receivePurchase(id);
    const [updatedPOs, updatedProds] = await Promise.all([
      api.getPurchases(),
      api.getProducts()
    ]);
    setPurchases(updatedPOs);
    setProducts(updatedProds);
    refreshAnalytics();
  };

  const handleCreateExpense = async (expData) => {
    await api.createExpense(expData);
    const updated = await api.getExpenses();
    setExpenses(updated);
    refreshAnalytics();
  };

  const handleDeleteExpense = async (id) => {
    await api.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    refreshAnalytics();
  };

  const handleSaveSettings = async (newSettings) => {
    const saved = await api.saveSettings(newSettings);
    setSettings(saved);
  };

  const handleCreateShop = async (newShop) => {
    await api.createShop(newShop);
    const updated = await api.getShops();
    setShops(updated);
  };

  const handleBulkImport = async (importedProducts) => {
    await api.bulkImportProducts(importedProducts);
    const updated = await api.getProducts();
    setProducts(updated);
    refreshAnalytics();
  };

  const handleLoadStarter = async () => {
    await api.loadStarterCatalog();
    const updated = await api.getProducts();
    setProducts(updated);
    refreshAnalytics();
  };

  const handleClearAllProducts = async () => {
    await api.clearAllProducts();
    setProducts([]);
    refreshAnalytics();
  };

  // Low stock badge counter
  const lowStockCount = products.filter(p => {
    const qty = currentShopId === 'all'
      ? Object.values(p.stock || {}).reduce((a, b) => a + Number(b), 0)
      : Number(p.stock?.[currentShopId] || 0);
    return qty <= p.minStockAlert;
  }).length;

  const proformasCount = proformas.filter(p => p.status === 'issued').length;
  const deliveriesCount = deliveryNotes.filter(d => d.status === 'dispatched').length;

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="p-3 bg-[#082825] rounded-2xl border border-slate-700/80 shadow-2xl flex items-center justify-center max-w-[220px]">
          <img src="/logo.png" alt="Jenga Kwanza Logo" className="h-16 w-auto object-contain" />
        </div>
        <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>Starting Jenga Kwanza Enterprise ERP & POS...</span>
        </div>
      </div>
    );
  }

  // Gateway: If not authenticated, require Owner PIN or Staff selection
  if (!isAuthenticated) {
    return (
      <LoginPage
        users={users}
        settings={settings}
        shops={shops}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      
      {/* Global Navigation Bar */}
      <Navbar
        shops={shops}
        currentShopId={currentShopId}
        onSelectShop={setCurrentShopId}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        cartCount={0}
        lowStockCount={lowStockCount}
        proformasCount={proformasCount}
        deliveriesCount={deliveriesCount}
        isOnline={isOnline}
        pendingCount={offlineQueue.length}
        isSyncing={isSyncing}
        queueItems={offlineQueue}
        onTriggerSync={triggerSync}
      />

      {/* Sync Success Banner */}
      {syncBanner && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md animate-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{syncBanner}</span>
          </div>
          <button 
            onClick={() => setSyncBanner(null)} 
            className="text-white hover:text-emerald-200 text-xs font-black p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Offline Mode Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-3 sm:px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm border-b border-amber-700/60">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4 text-amber-200 animate-pulse shrink-0" />
            <span className="leading-tight">
              <strong>Offline Mode Active:</strong> You can continue selling, creating quotations, registering customers, and printing receipts. All data is safely stored locally and will automatically synchronize when connection is restored.
            </span>
          </div>
          {offlineQueue.length > 0 && (
            <span className="ml-2 bg-amber-800 text-amber-100 px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0">
              {offlineQueue.length} pending sync
            </span>
          )}
        </div>
      )}

      {/* Main Module Content */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'pos' && (
          <PosTerminal
            products={products}
            categories={categories}
            currentShopId={currentShopId}
            currentShop={currentShop}
            settings={settings}
            currentUser={currentUser}
            customers={customers}
            onCompleteSale={handleCompleteSale}
            onSaveCartAsProforma={handleSaveCartAsProforma}
          />
        )}

        {activeTab === 'proformas' && (
          <ProformaManager
            proformas={proformas}
            products={products}
            customers={customers}
            shops={shops}
            currentShopId={currentShopId}
            currentShop={currentShop}
            currentUser={currentUser}
            settings={settings}
            onCreateProforma={handleCreateProforma}
            onUpdateProforma={handleUpdateProforma}
            onDeleteProforma={handleDeleteProforma}
            onConvertToSale={handleConvertToSale}
            onOpenPrintModal={(type, doc) => setPrintDoc({ isOpen: true, type, data: doc })}
            onGenerateDeliveryNote={handleGenerateDeliveryFromDoc}
          />
        )}

        {activeTab === 'deliveries' && (
          <DeliveryManager
            deliveryNotes={deliveryNotes}
            sales={sales}
            products={products}
            customers={customers}
            shops={shops}
            currentShopId={currentShopId}
            currentShop={currentShop}
            currentUser={currentUser}
            settings={settings}
            onCreateDeliveryNote={handleCreateDeliveryNote}
            onUpdateDeliveryNote={handleUpdateDeliveryNote}
            onDeleteDeliveryNote={handleDeleteDeliveryNote}
            onOpenPrintModal={(type, doc) => setPrintDoc({ isOpen: true, type, data: doc })}
            prefilledData={deliveryPrefill}
          />
        )}

        {activeTab === 'inventory' && currentUser?.role === 'admin' && (
          <InventoryManager
            products={products}
            categories={categories}
            shops={shops}
            currentShopId={currentShopId}
            currentShop={currentShop}
            currentUser={currentUser}
            settings={settings}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onAdjustStock={handleAdjustStock}
            onBulkImport={handleBulkImport}
            onLoadStarter={handleLoadStarter}
            onClearAll={handleClearAllProducts}
          />
        )}

        {activeTab === 'debtors' && (
          <CustomerLedger
            customers={customers}
            currentShop={currentShop}
            currentUser={currentUser}
            settings={settings}
            onSaveCustomer={handleSaveCustomer}
            onPayDebt={handlePayDebt}
          />
        )}

        {activeTab === 'procurement' && currentUser?.role === 'admin' && (
          <ProcurementManager
            suppliers={suppliers}
            purchases={purchases}
            products={products}
            shops={shops}
            currentShopId={currentShopId}
            currentUser={currentUser}
            settings={settings}
            onCreateSupplier={handleCreateSupplier}
            onCreatePurchase={handleCreatePurchase}
            onReceivePurchase={handleReceivePurchase}
          />
        )}

        {activeTab === 'expenses' && currentUser?.role === 'admin' && (
          <ExpenseTracker
            expenses={expenses}
            shops={shops}
            currentShopId={currentShopId}
            currentShop={currentShop}
            currentUser={currentUser}
            settings={settings}
            onCreateExpense={handleCreateExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'analytics' && currentUser?.role === 'admin' && (
          <AnalyticsDashboard
            analytics={analytics}
            sales={sales}
            shops={shops}
            currentShopId={currentShopId}
            currentShop={currentShop}
            settings={settings}
            onViewReceipt={(sale) => setPrintDoc({ isOpen: true, type: 'receipt', data: sale })}
          />
        )}

        {activeTab === 'settings' && currentUser?.role === 'admin' && (
          <SettingsManager
            settings={settings}
            shops={shops}
            onSaveSettings={handleSaveSettings}
            onCreateShop={handleCreateShop}
            onClearTransactions={api.clearTransactions}
            onResetClean={api.resetClean}
            onImportBackup={api.importBackup}
            exportUrl={api.exportBackupUrl}
          />
        )}
      </main>

      {/* Universal Multi-Printer Document Modal (Receipts, Proformas, Delivery Notes) */}
      <DocumentPrintModal
        isOpen={printDoc.isOpen}
        onClose={() => setPrintDoc({ isOpen: false, type: 'receipt', data: null })}
        documentType={printDoc.type}
        documentData={printDoc.data}
        settings={settings}
      />

    </div>
  );
}
