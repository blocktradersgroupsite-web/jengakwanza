// Centralized API Client for Jenga Kwanza System
const API_BASE = '/api';

export const api = {
  // Shops
  getShops: () => fetch(`${API_BASE}/shops`).then(r => r.json()),
  createShop: (data) => fetch(`${API_BASE}/shops`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  updateShop: (id, data) => fetch(`${API_BASE}/shops/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),

  // Categories
  getCategories: () => fetch(`${API_BASE}/categories`).then(r => r.json()),
  createCategory: (data) => fetch(`${API_BASE}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/products${query ? `?${query}` : ''}`).then(r => r.json());
  },
  createProduct: (data) => fetch(`${API_BASE}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  updateProduct: (id, data) => fetch(`${API_BASE}/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteProduct: (id) => fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' }).then(r => r.json()),
  adjustStock: (id, data) => fetch(`${API_BASE}/products/${id}/adjust`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  bulkImportProducts: (products) => fetch(`${API_BASE}/products/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products }) }).then(r => r.json()),
  loadStarterCatalog: () => fetch(`${API_BASE}/products/load-starter`, { method: 'POST' }).then(r => r.json()),
  clearAllProducts: () => fetch(`${API_BASE}/products/clear-all`, { method: 'POST' }).then(r => r.json()),

  // Customers
  getCustomers: () => fetch(`${API_BASE}/customers`).then(r => r.json()),
  createCustomer: (data) => fetch(`${API_BASE}/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  updateCustomer: (id, data) => fetch(`${API_BASE}/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  payDebt: (id, data) => fetch(`${API_BASE}/customers/${id}/pay-debt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),

  // Sales
  getSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/sales${query ? `?${query}` : ''}`).then(r => r.json());
  },
  createSale: (data) => fetch(`${API_BASE}/sales`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),

  // Suppliers & Purchases
  getSuppliers: () => fetch(`${API_BASE}/suppliers`).then(r => r.json()),
  createSupplier: (data) => fetch(`${API_BASE}/suppliers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  getPurchases: () => fetch(`${API_BASE}/purchases`).then(r => r.json()),
  createPurchase: (data) => fetch(`${API_BASE}/purchases`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  receivePurchase: (id) => fetch(`${API_BASE}/purchases/${id}/receive`, { method: 'POST' }).then(r => r.json()),

  // Transfers
  getTransfers: () => fetch(`${API_BASE}/transfers`).then(r => r.json()),
  createTransfer: (data) => fetch(`${API_BASE}/transfers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  updateTransferStatus: (id, data) => fetch(`${API_BASE}/transfers/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),

  // Expenses
  getExpenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/expenses${query ? `?${query}` : ''}`).then(r => r.json());
  },
  createExpense: (data) => fetch(`${API_BASE}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteExpense: (id) => fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' }).then(r => r.json()),

  // Users
  getUsers: () => fetch(`${API_BASE}/users`).then(r => r.json()),
  loginUser: (data) => fetch(`${API_BASE}/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  createUser: (data) => fetch(`${API_BASE}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),

  // Analytics & Settings
  getAnalyticsSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/analytics/summary${query ? `?${query}` : ''}`).then(r => r.json());
  },
  getSettings: () => fetch(`${API_BASE}/settings`).then(r => r.json()),
  saveSettings: (data) => fetch(`${API_BASE}/settings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  resetClean: () => fetch(`${API_BASE}/system/reset-clean`, { method: 'POST' }).then(r => r.json()),
  clearTransactions: () => fetch(`${API_BASE}/system/clear-transactions`, { method: 'POST' }).then(r => r.json()),
  importBackup: (data) => fetch(`${API_BASE}/system/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  exportBackupUrl: `${API_BASE}/system/export`
};
