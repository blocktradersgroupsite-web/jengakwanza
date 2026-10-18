// Offline Sync Engine for Jenga Kwanza POS & Management Platform
// Handles offline queueing, local state persistence, network status tracking, and auto-sync

const QUEUE_KEY = 'jk_offline_queue';
const CACHE_PREFIX = 'jk_cache_';

let isSyncing = false;
const networkListeners = new Set();
const queueListeners = new Set();

// ----------------------------------------------------
// 1. Network Status Tracking
// ----------------------------------------------------
let currentOnlineStatus = typeof navigator !== 'undefined' ? navigator.onLine : true;

export function getOnlineStatus() {
  return currentOnlineStatus;
}

export function subscribeNetworkStatus(callback) {
  networkListeners.add(callback);
  callback(currentOnlineStatus);
  return () => networkListeners.delete(callback);
}

function notifyNetworkStatus(isOnline) {
  currentOnlineStatus = isOnline;
  networkListeners.forEach(cb => {
    try { cb(isOnline); } catch (e) { console.warn('Network listener error:', e); }
  });
}

// Proactive ping test to verify actual backend/internet connectivity
export async function checkServerConnection() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    notifyNetworkStatus(false);
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('/api/health', { 
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    const isUp = res.ok;
    notifyNetworkStatus(isUp);
    return isUp;
  } catch (err) {
    notifyNetworkStatus(false);
    return false;
  }
}

// Listen to browser network events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    // Verify connection with health check
    checkServerConnection().then(isOnline => {
      if (isOnline) {
        // Broadcast custom event
        window.dispatchEvent(new CustomEvent('jk_network_online'));
      }
    });
  });

  window.addEventListener('offline', () => {
    notifyNetworkStatus(false);
    window.dispatchEvent(new CustomEvent('jk_network_offline'));
  });
}

// ----------------------------------------------------
// 2. Local Storage Cache Helpers
// ----------------------------------------------------
export function getLocalCache(key, fallback = []) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) ? parsed.length > 0 : parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn(`Error reading local cache for ${key}:`, e);
  }
  return fallback;
}

export function setLocalCache(key, value) {
  try {
    if (value !== undefined && value !== null) {
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(value));
    }
  } catch (e) {
    console.warn(`Error writing local cache for ${key}:`, e);
  }
}

// ----------------------------------------------------
// 3. Offline Action Queue Management
// ----------------------------------------------------
export function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Error reading offline queue:', e);
    return [];
  }
}

export function subscribeQueue(callback) {
  queueListeners.add(callback);
  callback(getOfflineQueue());
  return () => queueListeners.delete(callback);
}

function notifyQueueChange() {
  const q = getOfflineQueue();
  queueListeners.forEach(cb => {
    try { cb(q); } catch (e) { console.warn('Queue listener error:', e); }
  });
}

export function addToOfflineQueue(action) {
  const queue = getOfflineQueue();
  const queueItem = {
    id: action.id || `QUEUE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type: action.type, // 'SALE' | 'DEBT_PAY' | 'CUSTOMER_CREATE' | 'CUSTOMER_UPDATE' | 'STOCK_ADJUST' | 'PRODUCT_CREATE' | 'PRODUCT_UPDATE' | 'PROFORMA_CREATE' | 'DELIVERY_CREATE'
    payload: action.payload,
    description: action.description || `${action.type} Action`,
    createdAt: action.createdAt || new Date().toISOString(),
    attempts: 0,
    status: 'pending'
  };

  queue.push(queueItem);
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save to offline queue in localStorage:', e);
  }

  notifyQueueChange();
  return queueItem;
}

export function removeFromOfflineQueue(itemId) {
  const queue = getOfflineQueue().filter(item => item.id !== itemId);
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {}
  notifyQueueChange();
}

export function clearOfflineQueue() {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch (e) {}
  notifyQueueChange();
}

export function getPendingQueueCount() {
  return getOfflineQueue().length;
}

// ----------------------------------------------------
// 4. Synchronization Processor
// ----------------------------------------------------
export async function syncOfflineQueue(apiClient, onProgress = null) {
  if (isSyncing) {
    return { inProgress: true, message: 'Sync already in progress' };
  }

  const queue = getOfflineQueue();
  if (!queue.length) {
    return { syncedCount: 0, failedCount: 0, remaining: 0 };
  }

  // Check if network is really available before attempting sync
  const isUp = await checkServerConnection();
  if (!isUp) {
    return { syncedCount: 0, failedCount: 0, remaining: queue.length, offline: true };
  }

  isSyncing = true;
  let syncedCount = 0;
  let failedCount = 0;
  const errors = [];

  try {
    // Process queue items sequentially to ensure chronological consistency
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (onProgress) {
        onProgress({ current: i + 1, total: queue.length, item });
      }

      try {
        let success = false;

        switch (item.type) {
          case 'SALE': {
            // Send sale with original ID and creation time
            await apiClient.createSale({
              ...item.payload,
              id: item.payload.id,
              createdAt: item.payload.createdAt,
              isSync: true
            });
            success = true;
            break;
          }

          case 'DEBT_PAY': {
            const { customerId, data } = item.payload;
            await apiClient.payDebt(customerId, {
              ...data,
              isSync: true
            });
            success = true;
            break;
          }

          case 'CUSTOMER_CREATE': {
            await apiClient.createCustomer(item.payload);
            success = true;
            break;
          }

          case 'CUSTOMER_UPDATE': {
            const { id, data } = item.payload;
            await apiClient.updateCustomer(id, data);
            success = true;
            break;
          }

          case 'STOCK_ADJUST': {
            const { id, data } = item.payload;
            await apiClient.adjustStock(id, data);
            success = true;
            break;
          }

          case 'PRODUCT_CREATE': {
            await apiClient.createProduct(item.payload);
            success = true;
            break;
          }

          case 'PRODUCT_UPDATE': {
            const { id, data } = item.payload;
            await apiClient.updateProduct(id, data);
            success = true;
            break;
          }

          case 'PROFORMA_CREATE': {
            await apiClient.createProforma({
              ...item.payload,
              id: item.payload.id,
              createdAt: item.payload.createdAt
            });
            success = true;
            break;
          }

          case 'PROFORMA_UPDATE': {
            const { id, data } = item.payload;
            await apiClient.updateProforma(id, data);
            success = true;
            break;
          }

          case 'DELIVERY_CREATE': {
            await apiClient.createDeliveryNote({
              ...item.payload,
              id: item.payload.id,
              createdAt: item.payload.createdAt
            });
            success = true;
            break;
          }

          default:
            console.warn('Unknown offline queue action type:', item.type);
            success = true; // remove unrecognized item to avoid infinite loop
            break;
        }

        if (success) {
          removeFromOfflineQueue(item.id);
          syncedCount++;
        }
      } catch (err) {
        console.error(`Failed syncing queue item ${item.id} (${item.type}):`, err);
        failedCount++;
        errors.push({ id: item.id, error: err.message });

        // If network failed entirely during loop, break early and keep remaining
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          notifyNetworkStatus(false);
          break;
        }
      }
    }
  } finally {
    isSyncing = false;
  }

  const remaining = getPendingQueueCount();

  // Broadcast sync finished event
  if (typeof window !== 'undefined' && syncedCount > 0) {
    window.dispatchEvent(new CustomEvent('jk_sync_completed', {
      detail: { syncedCount, failedCount, remaining }
    }));
  }

  return { syncedCount, failedCount, remaining, errors };
}

export function isSyncActive() {
  return isSyncing;
}
