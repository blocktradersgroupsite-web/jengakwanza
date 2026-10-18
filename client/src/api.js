// Centralized API Client for Jenga Kwanza System
// Supports Direct Supabase Cloud Backend + Local API + Full Offline Resilience & Auto-Sync

import { getSupabase, isSupabaseConfigured } from './supabase';
import { 
  getLocalCache, 
  setLocalCache, 
  addToOfflineQueue, 
  getOnlineStatus 
} from './utils/offlineSync';

const API_BASE = '/api';

// Safe fetch wrapper that automatically uses local cache if offline or on network failure
async function resilientFetch(url, options = {}, cacheKey = null, fallback = []) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (cacheKey && data) {
      setLocalCache(cacheKey, data);
    }
    return data;
  } catch (err) {
    if (cacheKey) {
      return getLocalCache(cacheKey, fallback);
    }
    throw err;
  }
}

export const api = {
  // ==========================================
  // SHOPS
  // ==========================================
  getShops: async () => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const { data, error } = await sb.from('shops').select('*').order('created_at', { ascending: true });
        if (!error && data && data.length) {
          const formatted = data.map(s => ({
            ...s,
            isMain: s.is_main,
            createdAt: s.created_at
          }));
          setLocalCache('shops', formatted);
          return formatted;
        }
      } catch (err) {
        console.warn('Supabase getShops error, falling back to local:', err);
      }
    }
    return resilientFetch(`${API_BASE}/shops`, {}, 'shops', [
      { id: 'shop-main', name: 'Main Hardware Store', isMain: true }
    ]);
  },

  createShop: async (data) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const row = {
          id: data.id || `shop-${Date.now()}`,
          name: data.name,
          type: data.type || 'hardware',
          location: data.location || '',
          phone: data.phone || '',
          email: data.email || '',
          is_main: Boolean(data.isMain),
          active: true
        };
        const { data: created, error } = await sb.from('shops').insert(row).select().single();
        if (!error && created) {
          return { ...created, isMain: created.is_main };
        }
      } catch (err) {
        console.warn('Supabase createShop fallback:', err);
      }
    }
    return fetch(`${API_BASE}/shops`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    }).then(r => r.json());
  },

  updateShop: async (id, data) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const { data: updated, error } = await sb.from('shops').update(data).eq('id', id).select().single();
        if (!error && updated) return updated;
      } catch (err) {}
    }
    return fetch(`${API_BASE}/shops/${id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    }).then(r => r.json());
  },

  // ==========================================
  // CATEGORIES
  // ==========================================
  getCategories: async () => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const { data, error } = await sb.from('categories').select('*').order('name', { ascending: true });
        if (!error && data && data.length) {
          setLocalCache('categories', data);
          return data;
        }
      } catch (err) {}
    }
    return resilientFetch(`${API_BASE}/categories`, {}, 'categories', []);
  },

  createCategory: async (data) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const row = { id: data.id || `cat-${Date.now()}`, name: data.name, icon: data.icon || 'Folder' };
        const { data: created, error } = await sb.from('categories').insert(row).select().single();
        if (!error && created) return created;
      } catch (err) {}
    }
    return fetch(`${API_BASE}/categories`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    }).then(r => r.json());
  },

  // ==========================================
  // PRODUCTS & INVENTORY
  // ==========================================
  getProducts: async (params = {}) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        let query = sb.from('products').select('*');
        if (params.category && params.category !== 'All') {
          query = query.eq('category', params.category);
        }
        if (params.search) {
          query = query.ilike('name', `%${params.search}%`);
        }
        const { data, error } = await query;
        if (!error && data) {
          const formatted = data.map(p => ({
            ...p,
            costPrice: Number(p.cost_price || 0),
            retailPrice: Number(p.retail_price || 0),
            wholesalePrice: Number(p.wholesale_price || 0),
            minStockAlert: Number(p.min_stock_alert || 0)
          }));
          setLocalCache('products', formatted);
          return formatted;
        }
      } catch (err) {}
    }
    const query = new URLSearchParams(params).toString();
    return resilientFetch(`${API_BASE}/products${query ? `?${query}` : ''}`, {}, 'products', []);
  },

  createProduct: async (data) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const row = {
          id: data.id || `prod-${Date.now()}`,
          sku: data.sku || `SKU-${Date.now().toString().slice(-4)}`,
          barcode: data.barcode || '',
          name: data.name,
          category: data.category || 'General',
          brand: data.brand || '',
          unit: data.unit || 'Pcs',
          cost_price: Number(data.costPrice || 0),
          retail_price: Number(data.retailPrice || 0),
          wholesale_price: Number(data.wholesalePrice || 0),
          min_stock_alert: Number(data.minStockAlert || 10),
          stock: data.stock || { 'shop-main': 0 },
          description: data.description || '',
          image: data.image || ''
        };
        const { data: created, error } = await sb.from('products').insert(row).select().single();
        if (!error && created) {
          const formatted = {
            ...created,
            costPrice: Number(created.cost_price || 0),
            retailPrice: Number(created.retail_price || 0),
            wholesalePrice: Number(created.wholesale_price || 0),
            minStockAlert: Number(created.min_stock_alert || 0)
          };
          const localProds = getLocalCache('products', []);
          setLocalCache('products', [...localProds, formatted]);
          return formatted;
        }
      } catch (err) {}
    }

    try {
      const res = await fetch(`${API_BASE}/products`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      if (res.ok) {
        const created = await res.json();
        const localProds = getLocalCache('products', []);
        setLocalCache('products', [...localProds, created]);
        return created;
      }
    } catch (err) {
      console.warn('Network failed during createProduct, queueing offline:', err);
    }

    // Offline Fallback
    const offlineProd = {
      id: data.id || `prod-off-${Date.now()}`,
      sku: data.sku || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: data.barcode || '',
      name: data.name,
      category: data.category || 'General',
      brand: data.brand || '',
      unit: data.unit || 'Pcs',
      costPrice: Number(data.costPrice || 0),
      retailPrice: Number(data.retailPrice || 0),
      wholesalePrice: Number(data.wholesalePrice || 0),
      minStockAlert: Number(data.minStockAlert || 10),
      stock: data.stock || { 'shop-main': 0 },
      description: data.description || '',
      image: data.image || '',
      isOfflinePending: true
    };
    const localProds = getLocalCache('products', []);
    setLocalCache('products', [...localProds, offlineProd]);
    addToOfflineQueue({
      type: 'PRODUCT_CREATE',
      payload: offlineProd,
      description: `Create product ${offlineProd.name}`
    });
    return offlineProd;
  },

  updateProduct: async (id, data) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const updatePayload = {
          name: data.name,
          sku: data.sku,
          barcode: data.barcode,
          category: data.category,
          brand: data.brand,
          unit: data.unit,
          cost_price: Number(data.costPrice !== undefined ? data.costPrice : data.cost_price || 0),
          retail_price: Number(data.retailPrice !== undefined ? data.retailPrice : data.retail_price || 0),
          wholesale_price: Number(data.wholesalePrice !== undefined ? data.wholesalePrice : data.wholesale_price || 0),
          min_stock_alert: Number(data.minStockAlert !== undefined ? data.minStockAlert : data.min_stock_alert || 10),
          stock: data.stock,
          description: data.description,
          image: data.image
        };
        const { data: updated, error } = await sb.from('products').update(updatePayload).eq('id', id).select().single();
        if (!error && updated) {
          const formatted = {
            ...updated,
            costPrice: Number(updated.cost_price || 0),
            retailPrice: Number(updated.retail_price || 0),
            wholesalePrice: Number(updated.wholesale_price || 0),
            minStockAlert: Number(updated.min_stock_alert || 0)
          };
          const localProds = getLocalCache('products', []);
          setLocalCache('products', localProds.map(p => p.id === id ? formatted : p));
          return formatted;
        }
      } catch (err) {}
    }

    try {
      const res = await fetch(`${API_BASE}/products/${id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      if (res.ok) {
        const updated = await res.json();
        const localProds = getLocalCache('products', []);
        setLocalCache('products', localProds.map(p => p.id === id ? updated : p));
        return updated;
      }
    } catch (err) {
      console.warn('Network failed during updateProduct, queueing offline:', err);
    }

    // Offline Fallback
    const localProds = getLocalCache('products', []);
    const updated = localProds.map(p => p.id === id ? { ...p, ...data, isOfflinePending: true } : p);
    setLocalCache('products', updated);
    addToOfflineQueue({
      type: 'PRODUCT_UPDATE',
      payload: { id, data },
      description: `Update product ${data.name || id}`
    });
    return updated.find(p => p.id === id) || { id, ...data };
  },

  deleteProduct: async (id) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        await sb.from('products').delete().eq('id', id);
      } catch (err) {}
    }
    fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' }).catch(() => {});
    const localProds = getLocalCache('products', []);
    setLocalCache('products', localProds.filter(p => p.id !== id));
    return { success: true };
  },

  adjustStock: async (id, data) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const { shopId, newQty, reason, notes, performedBy } = data;
        const { data: prod } = await sb.from('products').select('*').eq('id', id).single();
        if (prod) {
          const stockObj = { ...(prod.stock || {}) };
          const prev = Number(stockObj[shopId] || 0);
          stockObj[shopId] = Number(newQty);

          await sb.from('products').update({ stock: stockObj }).eq('id', id);
          await sb.from('stock_adjustments').insert({
            id: `ADJ-${Date.now()}`,
            shop_id: shopId,
            product_id: id,
            product_name: prod.name,
            previous_qty: prev,
            new_qty: Number(newQty),
            difference: Number(newQty) - prev,
            reason: reason || 'audit',
            notes: notes || '',
            performed_by: performedBy || 'Staff'
          });

          const localProds = getLocalCache('products', []);
          const updated = localProds.map(p => p.id === id ? { ...p, stock: stockObj } : p);
          setLocalCache('products', updated);

          return { product: { ...prod, stock: stockObj } };
        }
      } catch (err) {}
    }

    try {
      const res = await fetch(`${API_BASE}/products/${id}/adjust`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      if (res.ok) {
        const result = await res.json();
        const localProds = getLocalCache('products', []);
        const updated = localProds.map(p => p.id === id ? result.product : p);
        setLocalCache('products', updated);
        return result;
      }
    } catch (err) {
      console.warn('Network failed during adjustStock, queueing offline:', err);
    }

    // Offline Fallback: Update stock locally in cache & queue adjustment
    const localProds = getLocalCache('products', []);
    let updatedProduct = null;
    const updated = localProds.map(p => {
      if (p.id === id) {
        const stockObj = { ...(p.stock || {}) };
        stockObj[data.shopId] = Number(data.newQty);
        updatedProduct = { ...p, stock: stockObj, isOfflinePending: true };
        return updatedProduct;
      }
      return p;
    });

    if (updatedProduct) {
      setLocalCache('products', updated);
      addToOfflineQueue({
        type: 'STOCK_ADJUST',
        payload: { id, data },
        description: `Stock adjustment for ${updatedProduct.name} (${data.newQty})`
      });
      return { product: updatedProduct };
    }

    return { product: null };
  },

  bulkImportProducts: async (products) => {
    return fetch(`${API_BASE}/products/bulk`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ products }) 
    }).then(r => r.json());
  },

  clearAllProducts: async () => {
    setLocalCache('products', []);
    return fetch(`${API_BASE}/products/clear-all`, { method: 'POST' }).then(r => r.json());
  },

  // ==========================================
  // CUSTOMERS & DEBTS
  // ==========================================
  getCustomers: async () => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const { data, error } = await sb.from('customers').select('*').order('name', { ascending: true });
        if (!error && data) {
          const formatted = data.map(c => ({
            ...c,
            creditLimit: Number(c.credit_limit || 0),
            currentDebt: Number(c.current_debt || 0),
            idNumber: c.id_number
          }));
          setLocalCache('customers', formatted);
          return formatted;
        }
      } catch (err) {}
    }
    return resilientFetch(`${API_BASE}/customers`, {}, 'customers', []);
  },

  createCustomer: async (data) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const row = {
          id: data.id || `cust-${Date.now()}`,
          name: data.name,
          phone: data.phone || '',
          email: data.email || '',
          id_number: data.idNumber || '',
          type: data.type || 'retail',
          credit_limit: Number(data.creditLimit || 0),
          current_debt: Number(data.currentDebt || 0),
          notes: data.notes || ''
        };
        const { data: created, error } = await sb.from('customers').insert(row).select().single();
        if (!error && created) {
          const formatted = {
            ...created,
            creditLimit: Number(created.credit_limit || 0),
            currentDebt: Number(created.current_debt || 0),
            idNumber: created.id_number
          };
          const localCusts = getLocalCache('customers', []);
          setLocalCache('customers', [...localCusts, formatted]);
          return formatted;
        }
      } catch (err) {}
    }

    try {
      const res = await fetch(`${API_BASE}/customers`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      if (res.ok) {
        const created = await res.json();
        const localCusts = getLocalCache('customers', []);
        setLocalCache('customers', [...localCusts, created]);
        return created;
      }
    } catch (err) {
      console.warn('Network failed during createCustomer, queueing offline:', err);
    }

    // Offline Fallback
    const offlineCust = {
      id: data.id || `cust-off-${Date.now()}`,
      name: data.name,
      phone: data.phone || '',
      email: data.email || '',
      idNumber: data.idNumber || '',
      type: data.type || 'retail',
      creditLimit: Number(data.creditLimit || 0),
      currentDebt: Number(data.currentDebt || 0),
      notes: data.notes || '',
      isOfflinePending: true
    };
    const localCusts = getLocalCache('customers', []);
    setLocalCache('customers', [...localCusts, offlineCust]);
    addToOfflineQueue({
      type: 'CUSTOMER_CREATE',
      payload: offlineCust,
      description: `Create customer ${offlineCust.name}`
    });
    return offlineCust;
  },

  updateCustomer: async (id, data) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const row = {
          name: data.name,
          phone: data.phone,
          email: data.email,
          id_number: data.idNumber !== undefined ? data.idNumber : data.id_number,
          type: data.type,
          credit_limit: Number(data.creditLimit !== undefined ? data.creditLimit : data.credit_limit || 0),
          current_debt: Number(data.currentDebt !== undefined ? data.currentDebt : data.current_debt || 0),
          notes: data.notes
        };
        const { data: updated, error } = await sb.from('customers').update(row).eq('id', id).select().single();
        if (!error && updated) {
          const formatted = {
            ...updated,
            creditLimit: Number(updated.credit_limit || 0),
            currentDebt: Number(updated.current_debt || 0),
            idNumber: updated.id_number
          };
          const localCusts = getLocalCache('customers', []);
          setLocalCache('customers', localCusts.map(c => c.id === id ? formatted : c));
          return formatted;
        }
      } catch (err) {}
    }

    try {
      const res = await fetch(`${API_BASE}/customers/${id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      if (res.ok) {
        const updated = await res.json();
        const localCusts = getLocalCache('customers', []);
        setLocalCache('customers', localCusts.map(c => c.id === id ? updated : c));
        return updated;
      }
    } catch (err) {
      console.warn('Network failed during updateCustomer, queueing offline:', err);
    }

    // Offline Fallback
    const localCusts = getLocalCache('customers', []);
    const updated = localCusts.map(c => c.id === id ? { ...c, ...data, isOfflinePending: true } : c);
    setLocalCache('customers', updated);
    addToOfflineQueue({
      type: 'CUSTOMER_UPDATE',
      payload: { id, data },
      description: `Update customer ${data.name || id}`
    });
    return updated.find(c => c.id === id) || { id, ...data };
  },

  payDebt: async (id, data) => {
    // If this is a background sync call, forward directly to server
    if (data.isSync) {
      return fetch(`${API_BASE}/customers/${id}/pay-debt`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      }).then(r => r.json());
    }

    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const { amount, paymentMethod, reference } = data;
        const { data: cust } = await sb.from('customers').select('*').eq('id', id).single();
        if (cust) {
          const prevDebt = Number(cust.current_debt || 0);
          const payAmt = Number(amount || 0);
          const newDebt = Math.max(0, prevDebt - payAmt);

          await sb.from('customers').update({ current_debt: newDebt }).eq('id', id);

          const receipt = {
            id: data.id || `DEBT-PAY-${Date.now()}`,
            shop_id: data.shopId || 'shop-main',
            shop_name: data.shopName || 'Main Hardware Store',
            customer_id: cust.id,
            customer_name: cust.name,
            items: [{ name: `Debt Payment: ${cust.name}`, quantity: 1, unitPrice: payAmt, total: payAmt }],
            subtotal: payAmt,
            grand_total: payAmt,
            payment_method: paymentMethod || 'cash',
            payment_details: { isDebtRepayment: true, reference: reference || '', remainingBalance: newDebt },
            status: 'completed',
            created_at: data.createdAt || new Date().toISOString()
          };
          await sb.from('sales').insert(receipt);

          const localCusts = getLocalCache('customers', []);
          const updatedCusts = localCusts.map(c => c.id === id ? { ...c, currentDebt: newDebt } : c);
          setLocalCache('customers', updatedCusts);

          return { customer: { ...cust, currentDebt: newDebt }, receipt };
        }
      } catch (err) {
        console.warn('Supabase payDebt error, falling back:', err);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/customers/${id}/pay-debt`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      if (res.ok) {
        const result = await res.json();
        // Update local caches
        const localCusts = getLocalCache('customers', []);
        setLocalCache('customers', localCusts.map(c => c.id === id ? result.customer : c));
        if (result.receipt) {
          const localSales = getLocalCache('sales', []);
          setLocalCache('sales', [result.receipt, ...localSales.filter(s => s.id !== result.receipt.id)]);
        }
        return result;
      }
    } catch (err) {
      console.warn('Network failed during payDebt, processing locally & queueing offline:', err);
    }

    // OFFLINE FALLBACK FOR DEBT REPAYMENT:
    const payAmt = Number(data.amount || 0);
    const localCusts = getLocalCache('customers', []);
    let targetCust = localCusts.find(c => c.id === id);
    const prevDebt = Number(targetCust?.currentDebt || 0);
    const newDebt = Math.max(0, prevDebt - payAmt);

    if (targetCust) {
      targetCust = { ...targetCust, currentDebt: newDebt, isOfflinePending: true };
      const updatedCusts = localCusts.map(c => c.id === id ? targetCust : c);
      setLocalCache('customers', updatedCusts);
    }

    const offlineReceipt = {
      id: data.id || `RCT-DEBT-OFFLINE-${Date.now()}`,
      shopId: data.shopId || 'shop-main',
      shopName: data.shopName || 'Main Hardware Store',
      cashierId: data.cashierId || 'cashier',
      cashierName: data.receivedBy || 'Cashier',
      customerId: id,
      customerName: targetCust?.name || 'Customer',
      customerPhone: targetCust?.phone || '',
      items: [
        {
          productId: 'debt-repayment',
          sku: 'DEBT-PAY',
          name: `Debt Payment: ${targetCust?.name || 'Customer'}`,
          quantity: 1,
          unitPrice: payAmt,
          costPrice: 0,
          discount: 0,
          priceType: 'credit_pay',
          total: payAmt
        }
      ],
      subtotal: payAmt,
      discountTotal: 0,
      taxRate: 0,
      taxAmount: 0,
      grandTotal: payAmt,
      paymentMethod: data.paymentMethod || 'cash',
      paymentDetails: {
        isDebtRepayment: true,
        reference: data.reference || '',
        remainingBalance: newDebt,
        isOffline: true
      },
      status: 'completed',
      isOfflinePending: true,
      createdAt: data.createdAt || new Date().toISOString()
    };

    const localSales = getLocalCache('sales', []);
    setLocalCache('sales', [offlineReceipt, ...localSales.filter(s => s.id !== offlineReceipt.id)]);

    addToOfflineQueue({
      type: 'DEBT_PAY',
      payload: { 
        customerId: id, 
        data: { 
          ...data, 
          id: offlineReceipt.id, 
          createdAt: offlineReceipt.createdAt 
        } 
      },
      description: `Debt payment for ${targetCust?.name || id} (Tsh ${payAmt.toLocaleString()})`
    });

    return { 
      customer: targetCust || { id, currentDebt: newDebt }, 
      receipt: offlineReceipt 
    };
  },

  // ==========================================
  // SALES (POINT OF SALE)
  // ==========================================
  getSales: async (params = {}) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        let query = sb.from('sales').select('*').order('created_at', { ascending: false });
        if (params.shopId && params.shopId !== 'all') {
          query = query.eq('shop_id', params.shopId);
        }
        if (params.limit) {
          query = query.limit(Number(params.limit));
        }
        const { data, error } = await query;
        if (!error && data) {
          const formatted = data.map(s => ({
            ...s,
            shopId: s.shop_id,
            shopName: s.shop_name,
            cashierId: s.cashier_id,
            cashierName: s.cashier_name,
            customerId: s.customer_id,
            customerName: s.customer_name,
            customerPhone: s.customer_phone,
            subtotal: Number(s.subtotal || 0),
            discountTotal: Number(s.discount_total || 0),
            taxRate: Number(s.tax_rate || 0),
            taxAmount: Number(s.tax_amount || 0),
            grandTotal: Number(s.grand_total || 0),
            paymentMethod: s.payment_method,
            paymentDetails: s.payment_details,
            createdAt: s.created_at
          }));
          setLocalCache('sales', formatted);
          return formatted;
        }
      } catch (err) {}
    }
    const query = new URLSearchParams(params).toString();
    return resilientFetch(`${API_BASE}/sales${query ? `?${query}` : ''}`, {}, 'sales', []);
  },

  createSale: async (data) => {
    // If this is a background synchronization request, execute directly to server
    if (data.isSync) {
      return fetch(`${API_BASE}/sales`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      }).then(r => r.json());
    }

    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const saleRow = {
          id: data.id || `REC-${Date.now()}`,
          shop_id: data.shopId || 'shop-main',
          shop_name: data.shopName || '',
          cashier_id: data.cashierId || '',
          cashier_name: data.cashierName || '',
          customer_id: data.customerId || '',
          customer_name: data.customerName || 'Walk-in Cash Customer',
          customer_phone: data.customerPhone || '',
          items: data.items || [],
          subtotal: Number(data.subtotal || 0),
          discount_total: Number(data.discountTotal || 0),
          tax_rate: Number(data.taxRate || 0),
          tax_amount: Number(data.taxAmount || 0),
          grand_total: Number(data.grandTotal || 0),
          payment_method: data.paymentMethod || 'cash',
          payment_details: data.paymentDetails || {},
          status: 'completed',
          created_at: data.createdAt || new Date().toISOString()
        };

        const { data: created, error } = await sb.from('sales').insert(saleRow).select().single();
        if (!error && created) {
          // Deduct stock in Supabase
          for (const item of (data.items || [])) {
            const pId = item.productId || item.id;
            if (pId) {
              const { data: p } = await sb.from('products').select('stock').eq('id', pId).single();
              if (p && p.stock) {
                const stockObj = { ...p.stock };
                const currentShop = data.shopId || 'shop-main';
                stockObj[currentShop] = Math.max(0, Number(stockObj[currentShop] || 0) - Number(item.quantity || 1));
                await sb.from('products').update({ stock: stockObj }).eq('id', pId);
              }
            }
          }

          // If credit sale, update debtor balance
          if (data.paymentMethod === 'credit' && data.customerId) {
            const { data: cust } = await sb.from('customers').select('current_debt').eq('id', data.customerId).single();
            if (cust) {
              await sb.from('customers').update({
                current_debt: Number(cust.current_debt || 0) + Number(data.grandTotal || 0)
              }).eq('id', data.customerId);
            }
          }

          const formatted = {
            ...created,
            shopId: created.shop_id,
            shopName: created.shop_name,
            cashierId: created.cashier_id,
            cashierName: created.cashier_name,
            customerId: created.customer_id,
            customerName: created.customer_name,
            customerPhone: created.customer_phone,
            subtotal: Number(created.subtotal || 0),
            discountTotal: Number(created.discount_total || 0),
            grandTotal: Number(created.grand_total || 0),
            paymentMethod: created.payment_method,
            paymentDetails: created.payment_details,
            createdAt: created.created_at
          };

          // Update local sales cache
          const localSales = getLocalCache('sales', []);
          setLocalCache('sales', [formatted, ...localSales.filter(s => s.id !== formatted.id)]);
          return formatted;
        }
      } catch (err) {
        console.warn('Supabase createSale error, trying local server:', err);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/sales`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      if (res.ok) {
        const created = await res.json();
        // Update local sales cache
        const localSales = getLocalCache('sales', []);
        setLocalCache('sales', [created, ...localSales.filter(s => s.id !== created.id)]);
        return created;
      }
    } catch (err) {
      console.warn('Network unreachable for createSale, executing 100% OFFLINE:', err);
    }

    // -------------------------------------------------------------------------
    // 100% OFFLINE POS SALE EXECUTION:
    // Guarantees zero downtime, instant receipt generation, local inventory decrement
    // -------------------------------------------------------------------------
    const offlineId = data.id || `INV-OFFLINE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const offlineSale = {
      id: offlineId,
      shopId: data.shopId || 'shop-main',
      shopName: data.shopName || 'Main Hardware Store',
      cashierId: data.cashierId || 'cashier',
      cashierName: data.cashierName || 'Cashier',
      customerId: data.customerId || null,
      customerName: data.customerName || 'Walk-in Retail Customer',
      customerPhone: data.customerPhone || '',
      items: data.items || [],
      subtotal: Number(data.subtotal || 0),
      discountTotal: Number(data.discountTotal || 0),
      taxRate: Number(data.taxRate || 0),
      taxAmount: Number(data.taxAmount || 0),
      grandTotal: Number(data.grandTotal || 0),
      paymentMethod: data.paymentMethod || 'cash',
      paymentDetails: { ...(data.paymentDetails || {}), isOffline: true },
      status: 'completed',
      isOfflinePending: true,
      createdAt: data.createdAt || new Date().toISOString()
    };

    // 1. Immediately deduct stock locally in cached products
    const localProds = getLocalCache('products', []);
    if (localProds && localProds.length) {
      const updatedProds = localProds.map(p => {
        const soldItem = (data.items || []).find(it => (it.productId === p.id || it.id === p.id));
        if (soldItem && p.stock) {
          const currentStock = { ...p.stock };
          const shopKey = data.shopId || 'shop-main';
          currentStock[shopKey] = Math.max(0, Number(currentStock[shopKey] || 0) - Number(soldItem.quantity || 1));
          return { ...p, stock: currentStock };
        }
        return p;
      });
      setLocalCache('products', updatedProds);
    }

    // 2. If credit sale, update debtor balance locally
    if (data.paymentMethod === 'credit' && data.customerId) {
      const localCusts = getLocalCache('customers', []);
      if (localCusts && localCusts.length) {
        const updatedCusts = localCusts.map(c => {
          if (c.id === data.customerId) {
            return { ...c, currentDebt: Number(c.currentDebt || 0) + Number(data.grandTotal || 0) };
          }
          return c;
        });
        setLocalCache('customers', updatedCusts);
      }
    }

    // 3. Add to local sales cache
    const localSales = getLocalCache('sales', []);
    const updatedSales = [offlineSale, ...localSales.filter(s => s.id !== offlineSale.id)];
    setLocalCache('sales', updatedSales);

    // 4. Enqueue in offline queue for auto-sync
    addToOfflineQueue({
      id: `OFFLINE-SALE-${offlineSale.id}`,
      type: 'SALE',
      payload: offlineSale,
      description: `Sale ${offlineSale.id} (${offlineSale.paymentMethod} - Tsh ${offlineSale.grandTotal.toLocaleString()})`
    });

    return offlineSale;
  },

  // ==========================================
  // PROFORMA INVOICES
  // ==========================================
  getProformas: async (params = {}) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        let query = sb.from('proformas').select('*').order('created_at', { ascending: false });
        if (params.shopId && params.shopId !== 'all') {
          query = query.eq('shop_id', params.shopId);
        }
        const { data, error } = await query;
        if (!error && data) {
          const formatted = data.map(p => ({
            ...p,
            proformaNumber: p.proforma_number,
            shopId: p.shop_id,
            shopName: p.shop_name,
            cashierId: p.cashier_id,
            cashierName: p.cashier_name,
            customerId: p.customer_id,
            customerName: p.customer_name,
            customerPhone: p.customer_phone,
            customerTin: p.customer_tin,
            subtotal: Number(p.subtotal || 0),
            discountTotal: Number(p.discount_total || 0),
            taxRate: Number(p.tax_rate || 0),
            taxAmount: Number(p.tax_amount || 0),
            grandTotal: Number(p.grand_total || 0),
            validUntil: p.valid_until,
            convertedSaleId: p.converted_sale_id,
            createdAt: p.created_at
          }));
          setLocalCache('proformas', formatted);
          return formatted;
        }
      } catch (err) {}
    }
    const query = new URLSearchParams(params).toString();
    return resilientFetch(`${API_BASE}/proformas${query ? `?${query}` : ''}`, {}, 'proformas', []);
  },

  createProforma: async (data) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const count = Date.now().toString().slice(-4);
        const row = {
          id: data.id || `PROF-${Date.now()}`,
          proforma_number: `PRO-${new Date().getFullYear()}-${count}`,
          shop_id: data.shopId || 'shop-main',
          shop_name: data.shopName || '',
          cashier_id: data.cashierId || '',
          cashier_name: data.cashierName || '',
          customer_id: data.customerId || '',
          customer_name: data.customerName || 'Walk-in Cash Customer',
          customer_phone: data.customerPhone || '',
          customer_tin: data.customerTin || '',
          items: data.items || [],
          subtotal: Number(data.subtotal || 0),
          discount_total: Number(data.discountTotal || 0),
          tax_rate: Number(data.taxRate || 0),
          tax_amount: Number(data.taxAmount || 0),
          grand_total: Number(data.grandTotal || 0),
          valid_until: data.validUntil || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          notes: data.notes || '',
          status: 'issued',
          created_at: data.createdAt || new Date().toISOString()
        };
        const { data: created, error } = await sb.from('proformas').insert(row).select().single();
        if (!error && created) {
          const formatted = {
            ...created,
            proformaNumber: created.proforma_number,
            shopId: created.shop_id,
            shopName: created.shop_name,
            cashierId: created.cashier_id,
            cashierName: created.cashier_name,
            customerId: created.customer_id,
            customerName: created.customer_name,
            customerPhone: created.customer_phone,
            subtotal: Number(created.subtotal || 0),
            grandTotal: Number(created.grand_total || 0),
            validUntil: created.valid_until,
            createdAt: created.created_at
          };
          const localProformas = getLocalCache('proformas', []);
          setLocalCache('proformas', [formatted, ...localProformas.filter(p => p.id !== formatted.id)]);
          return formatted;
        }
      } catch (err) {}
    }

    try {
      const res = await fetch(`${API_BASE}/proformas`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      if (res.ok) {
        const created = await res.json();
        const localProformas = getLocalCache('proformas', []);
        setLocalCache('proformas', [created, ...localProformas.filter(p => p.id !== created.id)]);
        return created;
      }
    } catch (err) {
      console.warn('Network unreachable for createProforma, executing offline:', err);
    }

    // Offline Proforma Creation
    const profNum = `PRO-OFFLINE-${Date.now().toString().slice(-6)}`;
    const offlineP = {
      id: data.id || profNum,
      proformaNumber: profNum,
      shopId: data.shopId || 'shop-main',
      shopName: data.shopName || '',
      creatorId: data.creatorId || 'staff',
      creatorName: data.creatorName || 'Sales Staff',
      customerId: data.customerId || null,
      customerName: data.customerName || 'Valued Customer',
      customerPhone: data.customerPhone || '',
      items: data.items || [],
      subtotal: Number(data.subtotal || 0),
      discountTotal: Number(data.discountTotal || 0),
      taxRate: Number(data.taxRate || 0),
      taxAmount: Number(data.taxAmount || 0),
      grandTotal: Number(data.grandTotal || 0),
      validUntil: data.validUntil || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      notes: data.notes || '',
      status: 'issued',
      isOfflinePending: true,
      createdAt: data.createdAt || new Date().toISOString()
    };
    const localProformas = getLocalCache('proformas', []);
    setLocalCache('proformas', [offlineP, ...localProformas.filter(p => p.id !== offlineP.id)]);
    addToOfflineQueue({
      type: 'PROFORMA_CREATE',
      payload: offlineP,
      description: `Proforma ${profNum} (${offlineP.customerName})`
    });
    return offlineP;
  },

  updateProforma: async (id, data) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const updateRow = {};
        if (data.status) updateRow.status = data.status;
        if (data.convertedSaleId) updateRow.converted_sale_id = data.convertedSaleId;
        const { data: updated, error } = await sb.from('proformas').update(updateRow).eq('id', id).select().single();
        if (!error && updated) return updated;
      } catch (err) {}
    }

    try {
      const res = await fetch(`${API_BASE}/proformas/${id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      if (res.ok) {
        const updated = await res.json();
        const localProformas = getLocalCache('proformas', []);
        setLocalCache('proformas', localProformas.map(p => p.id === id ? updated : p));
        return updated;
      }
    } catch (err) {
      console.warn('Network unreachable for updateProforma, updating offline:', err);
    }

    // Offline Fallback
    const localProformas = getLocalCache('proformas', []);
    const updated = localProformas.map(p => p.id === id ? { ...p, ...data, isOfflinePending: true } : p);
    setLocalCache('proformas', updated);
    addToOfflineQueue({
      type: 'PROFORMA_UPDATE',
      payload: { id, data },
      description: `Update proforma ${id}`
    });
    return updated.find(p => p.id === id) || { id, ...data };
  },

  deleteProforma: async (id) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        await sb.from('proformas').delete().eq('id', id);
      } catch (err) {}
    }
    fetch(`${API_BASE}/proformas/${id}`, { method: 'DELETE' }).catch(() => {});
    const localProformas = getLocalCache('proformas', []);
    setLocalCache('proformas', localProformas.filter(p => p.id !== id));
    return { success: true };
  },

  // ==========================================
  // DELIVERY NOTES
  // ==========================================
  getDeliveryNotes: async (params = {}) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        let query = sb.from('delivery_notes').select('*').order('created_at', { ascending: false });
        if (params.shopId && params.shopId !== 'all') {
          query = query.eq('shop_id', params.shopId);
        }
        const { data, error } = await query;
        if (!error && data) {
          const formatted = data.map(d => ({
            ...d,
            deliveryNumber: d.delivery_number,
            orderRef: d.order_ref,
            shopId: d.shop_id,
            shopName: d.shop_name,
            dispatcherId: d.dispatcher_id,
            dispatcherName: d.dispatcher_name,
            customerId: d.customer_id,
            customerName: d.customer_name,
            customerPhone: d.customer_phone,
            deliveryAddress: d.delivery_address,
            driverName: d.driver_name,
            driverPhone: d.driver_phone,
            vehicleReg: d.vehicle_reg,
            dispatchDate: d.dispatch_date,
            totalQuantity: Number(d.total_quantity || 0),
            createdAt: d.created_at
          }));
          setLocalCache('deliveryNotes', formatted);
          return formatted;
        }
      } catch (err) {}
    }
    const query = new URLSearchParams(params).toString();
    return resilientFetch(`${API_BASE}/delivery-notes${query ? `?${query}` : ''}`, {}, 'deliveryNotes', []);
  },

  createDeliveryNote: async (data) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const count = Date.now().toString().slice(-4);
        const row = {
          id: data.id || `DEL-${Date.now()}`,
          delivery_number: `DN-${new Date().getFullYear()}-${count}`,
          order_ref: data.orderRef || '',
          shop_id: data.shopId || 'shop-main',
          shop_name: data.shopName || '',
          dispatcher_id: data.dispatcherId || '',
          dispatcher_name: data.dispatcherName || '',
          customer_id: data.customerId || '',
          customer_name: data.customerName || 'Walk-in Cash Customer',
          customer_phone: data.customerPhone || '',
          delivery_address: data.deliveryAddress || '',
          driver_name: data.driverName || '',
          driver_phone: data.driverPhone || '',
          vehicle_reg: data.vehicleReg || '',
          dispatch_date: data.dispatchDate || new Date().toISOString().split('T')[0],
          items: data.items || [],
          total_quantity: Number(data.totalQuantity || (data.items || []).reduce((a, b) => a + Number(b.quantity || 1), 0)),
          notes: data.notes || '',
          status: 'dispatched',
          created_at: data.createdAt || new Date().toISOString()
        };
        const { data: created, error } = await sb.from('delivery_notes').insert(row).select().single();
        if (!error && created) {
          const formatted = {
            ...created,
            deliveryNumber: created.delivery_number,
            orderRef: created.order_ref,
            shopId: created.shop_id,
            shopName: created.shop_name,
            dispatcherId: created.dispatcher_id,
            dispatcherName: created.dispatcher_name,
            customerName: created.customer_name,
            deliveryAddress: created.delivery_address,
            driverName: created.driver_name,
            vehicleReg: created.vehicle_reg,
            dispatchDate: created.dispatch_date,
            createdAt: created.created_at
          };
          const localDeliveries = getLocalCache('deliveryNotes', []);
          setLocalCache('deliveryNotes', [formatted, ...localDeliveries.filter(d => d.id !== formatted.id)]);
          return formatted;
        }
      } catch (err) {}
    }

    try {
      const res = await fetch(`${API_BASE}/delivery-notes`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      if (res.ok) {
        const created = await res.json();
        const localDeliveries = getLocalCache('deliveryNotes', []);
        setLocalCache('deliveryNotes', [created, ...localDeliveries.filter(d => d.id !== created.id)]);
        return created;
      }
    } catch (err) {
      console.warn('Network unreachable for createDeliveryNote, executing offline:', err);
    }

    // Offline Delivery Note
    const delivNum = `DN-OFFLINE-${Date.now().toString().slice(-6)}`;
    const offlineD = {
      id: data.id || delivNum,
      deliveryNumber: delivNum,
      orderRef: data.orderRef || '',
      shopId: data.shopId || 'shop-main',
      shopName: data.shopName || '',
      dispatcherId: data.dispatcherId || '',
      dispatcherName: data.dispatcherName || '',
      customerId: data.customerId || null,
      customerName: data.customerName || 'Walk-in Cash Customer',
      customerPhone: data.customerPhone || '',
      deliveryAddress: data.deliveryAddress || '',
      driverName: data.driverName || '',
      driverPhone: data.driverPhone || '',
      vehicleReg: data.vehicleReg || '',
      dispatchDate: data.dispatchDate || new Date().toISOString().split('T')[0],
      items: data.items || [],
      totalQuantity: Number(data.totalQuantity || (data.items || []).reduce((a, b) => a + Number(b.quantity || 1), 0)),
      notes: data.notes || '',
      status: 'dispatched',
      isOfflinePending: true,
      createdAt: data.createdAt || new Date().toISOString()
    };
    const localDeliveries = getLocalCache('deliveryNotes', []);
    setLocalCache('deliveryNotes', [offlineD, ...localDeliveries.filter(d => d.id !== offlineD.id)]);
    addToOfflineQueue({
      type: 'DELIVERY_CREATE',
      payload: offlineD,
      description: `Delivery Note ${delivNum} (${offlineD.customerName})`
    });
    return offlineD;
  },

  updateDeliveryNote: async (id, data) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const { data: updated, error } = await sb.from('delivery_notes').update(data).eq('id', id).select().single();
        if (!error && updated) return updated;
      } catch (err) {}
    }
    return fetch(`${API_BASE}/delivery-notes/${id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    }).then(r => r.json());
  },

  deleteDeliveryNote: async (id) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        await sb.from('delivery_notes').delete().eq('id', id);
        return { success: true };
      } catch (err) {}
    }
    return fetch(`${API_BASE}/delivery-notes/${id}`, { method: 'DELETE' }).then(r => r.json());
  },

  // ==========================================
  // SUPPLIERS & PURCHASES
  // ==========================================
  getSuppliers: async () => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const { data, error } = await sb.from('suppliers').select('*').order('name', { ascending: true });
        if (!error && data) {
          setLocalCache('suppliers', data);
          return data;
        }
      } catch (err) {}
    }
    return resilientFetch(`${API_BASE}/suppliers`, {}, 'suppliers', []);
  },

  createSupplier: async (data) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const row = {
          id: data.id || `sup-${Date.now()}`,
          name: data.name,
          contact_person: data.contactPerson || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          payment_terms: data.paymentTerms || 'Net 30'
        };
        const { data: created, error } = await sb.from('suppliers').insert(row).select().single();
        if (!error && created) {
          const formatted = {
            ...created,
            contactPerson: created.contact_person,
            paymentTerms: created.payment_terms
          };
          const localSups = getLocalCache('suppliers', []);
          setLocalCache('suppliers', [...localSups, formatted]);
          return formatted;
        }
      } catch (err) {}
    }
    return fetch(`${API_BASE}/suppliers`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    }).then(r => r.json());
  },

  getPurchases: async () => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const { data, error } = await sb.from('purchases').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          const formatted = data.map(p => ({
            ...p,
            poNumber: p.po_number,
            shopId: p.shop_id,
            supplierId: p.supplier_id,
            supplierName: p.supplier_name,
            totalAmount: Number(p.total_amount || 0),
            createdAt: p.created_at
          }));
          setLocalCache('purchases', formatted);
          return formatted;
        }
      } catch (err) {}
    }
    return resilientFetch(`${API_BASE}/purchases`, {}, 'purchases', []);
  },

  createPurchase: async (data) => {
    return fetch(`${API_BASE}/purchases`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    }).then(r => r.json());
  },

  receivePurchase: async (id) => {
    return fetch(`${API_BASE}/purchases/${id}/receive`, { method: 'POST' }).then(r => r.json());
  },

  // ==========================================
  // TRANSFERS
  // ==========================================
  getTransfers: () => resilientFetch(`${API_BASE}/transfers`, {}, 'transfers', []),
  createTransfer: (data) => fetch(`${API_BASE}/transfers`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(r => r.json()),
  updateTransferStatus: (id, data) => fetch(`${API_BASE}/transfers/${id}/status`, { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(r => r.json()),

  // ==========================================
  // EXPENSES
  // ==========================================
  getExpenses: async (params = {}) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        let query = sb.from('expenses').select('*').order('date', { ascending: false });
        if (params.shopId && params.shopId !== 'all') {
          query = query.eq('shop_id', params.shopId);
        }
        const { data, error } = await query;
        if (!error && data) {
          const formatted = data.map(e => ({
            ...e,
            shopId: e.shop_id,
            amount: Number(e.amount || 0),
            createdBy: e.created_by,
            createdAt: e.created_at
          }));
          setLocalCache('expenses', formatted);
          return formatted;
        }
      } catch (err) {}
    }
    const query = new URLSearchParams(params).toString();
    return resilientFetch(`${API_BASE}/expenses${query ? `?${query}` : ''}`, {}, 'expenses', []);
  },

  createExpense: async (data) => {
    return fetch(`${API_BASE}/expenses`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    }).then(r => r.json());
  },

  deleteExpense: async (id) => {
    return fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' }).then(r => r.json());
  },

  // ==========================================
  // USERS
  // ==========================================
  getUsers: async () => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const { data, error } = await sb.from('profiles').select('*').order('name', { ascending: true });
        if (!error && data && data.length) {
          const formatted = data.map(u => ({
            id: u.id,
            username: u.username || u.name,
            name: u.name,
            role: u.role,
            pin: u.pin,
            assignedShopId: u.assigned_shop_id,
            phone: u.phone,
            active: u.active
          }));
          setLocalCache('users', formatted);
          return formatted;
        }
      } catch (err) {}
    }
    return resilientFetch(`${API_BASE}/users`, {}, 'users', [
      { id: 'usr-admin', name: 'Director / Store Owner', role: 'admin' },
      { id: 'usr-cashier', name: 'Cashier / Store Attendant', role: 'employee' }
    ]);
  },

  loginUser: (data) => fetch(`${API_BASE}/users/login`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(r => r.json()),

  registerUser: (data) => fetch(`${API_BASE}/users/register`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(r => r.json()),

  createUser: (data) => fetch(`${API_BASE}/users`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(r => r.json()),

  // ==========================================
  // ANALYTICS & SETTINGS
  // ==========================================
  getAnalyticsSummary: async (params = {}) => {
    try {
      const res = await fetch(`${API_BASE}/analytics/summary${params.shopId ? `?shopId=${params.shopId}` : ''}`);
      if (res.ok) return await res.json();
    } catch (err) {
      // Local fallback computation from cached sales
      const sales = getLocalCache('sales', []);
      const totalRevenue = sales.reduce((sum, s) => sum + Number(s.grandTotal || 0), 0);
      return {
        todaySales: totalRevenue,
        monthlySales: totalRevenue,
        salesCount: sales.length,
        isOfflineFallback: true
      };
    }
    return null;
  },

  getSettings: async () => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const { data, error } = await sb.from('settings').select('data').eq('id', 'app-settings').single();
        if (!error && data && data.data) {
          setLocalCache('settings', data.data);
          return data.data;
        }
      } catch (err) {}
    }
    return resilientFetch(`${API_BASE}/settings`, {}, 'settings', {
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
    });
  },

  saveSettings: async (data) => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        await sb.from('settings').upsert({ id: 'app-settings', data });
      } catch (err) {}
    }
    setLocalCache('settings', data);
    return fetch(`${API_BASE}/settings`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    }).then(r => r.json()).catch(() => data);
  },

  resetClean: () => fetch(`${API_BASE}/system/reset-clean`, { method: 'POST' }).then(r => r.json()),
  clearTransactions: () => fetch(`${API_BASE}/system/clear-transactions`, { method: 'POST' }).then(r => r.json()),
  importBackup: (data) => fetch(`${API_BASE}/system/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  exportBackupUrl: `${API_BASE}/system/export`
};

export default api;
