import React, { useState, useEffect } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import PosTerminal from './components/PosTerminal';
import InventoryManager from './components/InventoryManager';
import CustomerLedger from './components/CustomerLedger';
import ProcurementManager from './components/ProcurementManager';
import ExpenseTracker from './components/ExpenseTracker';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SettingsManager from './components/SettingsManager';
import ReceiptModal from './components/ReceiptModal';
import UserPinModal from './components/UserPinModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pos'); // pos | inventory | debtors | procurement | expenses | analytics | settings
  const [currentShopId, setCurrentShopId] = useState('shop-main');
  
  // Data State
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sales, setSales] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({
    businessName: 'JENGA KWANZA HARDWARE & STORES',
    currency: 'TZS',
    currencySymbol: 'Tsh',
    taxRate: 18,
    taxEnabled: false
  });
  const [analytics, setAnalytics] = useState(null);

  // User & Modals State
  const [currentUser, setCurrentUser] = useState({
    id: 'usr-admin',
    name: 'Director / Store Owner',
    role: 'admin',
    pin: '1234'
  });
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

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
        api.getTransfers().catch(err => { console.warn('transfers error:', err); return []; }),
        api.getPurchases().catch(err => { console.warn('purchases error:', err); return []; }),
        api.getExpenses().catch(err => { console.warn('expenses error:', err); return []; }),
        api.getUsers().catch(err => { console.warn('users error:', err); return []; }),
        api.getSettings().catch(err => { console.warn('settings error:', err); return null; })
      ]);

      if (Array.isArray(shopsRes) && shopsRes.length) setShops(shopsRes);
      if (Array.isArray(catsRes) && catsRes.length) setCategories(catsRes);
      if (Array.isArray(prodsRes) && prodsRes.length) setProducts(prodsRes);
      if (Array.isArray(custsRes) && custsRes.length) setCustomers(custsRes);
      if (Array.isArray(supsRes) && supsRes.length) setSuppliers(supsRes);
      if (Array.isArray(salesRes) && salesRes.length) setSales(salesRes);
      if (Array.isArray(trfsRes) && trfsRes.length) setTransfers(trfsRes);
      if (Array.isArray(posRes) && posRes.length) setPurchases(posRes);
      if (Array.isArray(expsRes) && expsRes.length) setExpenses(expsRes);
      if (Array.isArray(usersRes) && usersRes.length) {
        setUsers(usersRes);
        setCurrentUser(usersRes[0]);
      }
      if (settRes && typeof settRes === 'object') {
        setSettings({
          ...settRes,
          currencySymbol: 'Tsh',
          currency: 'TZS'
        });
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
  }, []);

  useEffect(() => {
    if (!loading) {
      refreshAnalytics();
    }
  }, [loading, currentShopId, activeTab]);

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
    setActiveReceipt(newSale);
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
    refreshAnalytics();
  };

  const handleDeleteProduct = async (id) => {
    await api.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    refreshAnalytics();
  };

  const handleAdjustStock = async (id, payload) => {
    await api.adjustStock(id, payload);
    const updated = await api.getProducts();
    setProducts(updated);
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
  };

  const handlePayDebt = async (customerId, payload) => {
    const res = await api.payDebt(customerId, payload);
    const [updatedCusts, updatedSales] = await Promise.all([
      api.getCustomers(),
      api.getSales()
    ]);
    setCustomers(updatedCusts);
    setSales(updatedSales);
    if (res.receipt) {
      setActiveReceipt(res.receipt);
    }
    refreshAnalytics();
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

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-2xl tracking-tighter shadow-xl shadow-amber-500/20">
          JK
        </div>
        <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>Starting Jenga Kwanza Enterprise ERP & POS...</span>
        </div>
      </div>
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
        onOpenUserModal={() => setIsUserModalOpen(true)}
        cartCount={0}
        lowStockCount={lowStockCount}
      />

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
          />
        )}

        {activeTab === 'inventory' && (
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

        {activeTab === 'procurement' && (
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

        {activeTab === 'expenses' && (
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

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            analytics={analytics}
            sales={sales}
            shops={shops}
            currentShopId={currentShopId}
            currentShop={currentShop}
            settings={settings}
            onViewReceipt={(sale) => setActiveReceipt(sale)}
          />
        )}

        {activeTab === 'settings' && (
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

      {/* Global Thermal Receipt Modal */}
      <ReceiptModal
        sale={activeReceipt}
        settings={settings}
        onClose={() => setActiveReceipt(null)}
      />

      {/* User Switcher / PIN Pad Modal */}
      <UserPinModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onSwitchUser={setCurrentUser}
      />

    </div>
  );
}
