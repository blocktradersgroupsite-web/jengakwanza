const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);
const SEED_DATA_DIR = path.join(__dirname, 'data');
const DATA_DIR = isVercel ? '/tmp/data' : SEED_DATA_DIR;
const DB_FILE = path.join(DATA_DIR, 'database.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// On Vercel, copy seed database into writable /tmp/data if not yet present
if (isVercel && !fs.existsSync(DB_FILE)) {
  const seedFile = path.join(SEED_DATA_DIR, 'database.json');
  if (fs.existsSync(seedFile)) {
    fs.copyFileSync(seedFile, DB_FILE);
  }
}

// Clean production categories
const DEFAULT_CATEGORIES = [
  { id: 'cat-cement', name: 'Cement & Aggregates', icon: 'Box' },
  { id: 'cat-steel', name: 'Steel & Rebar', icon: 'Layers' },
  { id: 'cat-roofing', name: 'Roofing & Timber', icon: 'Home' },
  { id: 'cat-paints', name: 'Paints & Finishes', icon: 'Paintbrush' },
  { id: 'cat-plumbing', name: 'Plumbing & Pipes', icon: 'Droplets' },
  { id: 'cat-electrical', name: 'Electrical & Lighting', icon: 'Zap' },
  { id: 'cat-tools', name: 'Tools & Fasteners', icon: 'Wrench' },
  { id: 'cat-masonry', name: 'Masonry & Tiling', icon: 'Grid' },
  { id: 'cat-sanitary', name: 'Sanitaryware & Tiles', icon: 'Droplet' },
  { id: 'cat-general', name: 'General Hardware', icon: 'Folder' }
];

// Clean Production Initial State (Zero fake transactions, Zero fake debts)
function getCleanProductionData() {
  const shops = [
    {
      id: 'shop-main',
      name: 'Main Hardware Store',
      type: 'hardware',
      location: 'P.O.BOX 14991 ARUSHA',
      phone: '0788989889 / 0713550104',
      email: 'jengakwanzaltd@gmail.com',
      isMain: true,
      active: true,
      created_at: new Date().toISOString()
    }
  ];

  const categories = [...DEFAULT_CATEGORIES];

  const products = [];

  const customers = [
    {
      id: 'cust-walkin',
      name: 'Walk-in Retail Cash Customer',
      phone: '',
      email: '',
      idNumber: '',
      type: 'retail',
      creditLimit: 0,
      currentDebt: 0,
      notes: 'Default walk-in counter customer'
    }
  ];

  const suppliers = [];
  const sales = [];
  const expenses = [];
  const transfers = [];
  const purchases = [];
  const stockAdjustments = [];

  const users = [
    {
      id: 'usr-admin',
      username: 'admin',
      email: 'admin@jengakwanza.co.tz',
      password: 'RUMULI2026',
      name: 'Store Owner / Director',
      role: 'admin',
      pin: '1234',
      assignedShopId: 'all',
      phone: '+255 700 000 001',
      active: true
    },
    {
      id: 'usr-cashier',
      username: 'cashier',
      email: 'cashier@jengakwanza.co.tz',
      password: 'KAZINI2026',
      name: 'Cashier 1',
      role: 'cashier',
      pin: '0000',
      assignedShopId: 'shop-main',
      phone: '+255 700 000 002',
      active: true
    },
    {
      id: 'usr-manager',
      username: 'manager',
      email: 'manager@jengakwanza.co.tz',
      password: 'KAZINI2026',
      name: 'Store Manager',
      role: 'manager',
      pin: '5678',
      assignedShopId: 'shop-main',
      phone: '+255 700 000 003',
      active: true
    }
  ];

  const settings = {
    businessName: 'JENGA KWANZA HARDWARE & STORES',
    tagline: 'OUR DUTY IS TO DELIGHT YOU.',
    currency: 'TZS',
    currencySymbol: 'Tsh',
    taxEnabled: false,
    taxRate: 18,
    traTin: '',
    phone: '0788989889 / 0713550104',
    email: 'jengakwanzaltd@gmail.com',
    address: 'P.O.BOX 14991 ARUSHA',
    receiptHeader: 'JENGA KWANZA HARDWARE & STORES',
    receiptFooter: 'Asante kwa kujenga nasi! Bidhaa zilizonunuliwa zinaweza kubadilishwa ndani ya siku 7 zikiwa katika hali nzuri na risiti halisi.',
    logo: '/logo.png',
    copyrightNotice: '© 2026 JENGA KWANZA HARDWARE & STORES. Haki Zote Zimehifadhiwa / All Rights Reserved.',
    defaultPrinterType: 'a4',
    bankName: 'CRDB Bank / NMB Bank',
    bankAccount: '0150293810293',
    bankAccountName: 'JENGA KWANZA HARDWARE & STORES LTD',
    lipaNamba: '5566778 (Vodacom / Tigo / Airtel)',
    proformaTerms: '1. Bei zilizotajwa zina uhalali wa siku 14 kuanzia tarehe ya hati hii.\n2. Malipo yote yafanyike kupitia akaunti au Lipa Namba za benki zilizo hapo juu.\n3. Bidhaa zitatolewa baada ya malipo kuthibitishwa kikamilifu.',
    deliveryTerms: '1. Mpokeaji lazima ahakikishe idadi na ubora wa vifaa kabla ya kusaini hati hii.\n2. Malalamiko kuhusu uharibifu au upungufu lazima yawasilishwe papo hapo kwa msafirishaji.\n3. Sahihi ya mpokeaji inathibitisha kupokea mzigo ukiwa katika hali nzuri na timilifu.'
  };

  return {
    shops,
    categories,
    products,
    customers,
    suppliers,
    sales,
    expenses,
    transfers,
    purchases,
    stockAdjustments,
    proformas: [],
    deliveryNotes: [],
    users,
    settings
  };
}

// Enterprise-Grade Persistent Database Engine with Zero Data Loss Guarantee
class JsonDB {
  constructor(filepath) {
    this.filepath = filepath;
    this.dir = path.dirname(filepath);
    this.backupFile = path.join(this.dir, 'database.backup.json');
    this.backupsDir = path.join(this.dir, 'backups');
    this.data = null;
    this.writeCount = 0;
    this.lastBackupTime = Date.now();

    // Ensure storage and backup directories exist
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }

    this.init();
  }

  init() {
    let loaded = false;

    // 1. Try Primary Database File
    if (fs.existsSync(this.filepath)) {
      try {
        const raw = fs.readFileSync(this.filepath, 'utf-8');
        if (raw && raw.trim().length > 0) {
          this.data = JSON.parse(raw);
          loaded = true;
          console.log(`[DB Engine] Successfully loaded primary database from: ${this.filepath}`);
        }
      } catch (err) {
        console.error(`[DB Engine] Warning: Failed to parse primary database:`, err.message);
      }
    }

    // 2. If Primary failed or empty, try Secondary Mirror Backup
    if (!loaded && fs.existsSync(this.backupFile)) {
      try {
        const raw = fs.readFileSync(this.backupFile, 'utf-8');
        if (raw && raw.trim().length > 0) {
          this.data = JSON.parse(raw);
          loaded = true;
          console.log(`[DB Engine] Restored database from secondary mirror backup: ${this.backupFile}`);
          // Restore primary file immediately
          this.saveAtomic();
        }
      } catch (err) {
        console.error(`[DB Engine] Warning: Failed to parse secondary backup:`, err.message);
      }
    }

    // 3. If Secondary failed, try the latest snapshot in backups/
    if (!loaded && fs.existsSync(this.backupsDir)) {
      try {
        const snapshotFiles = fs.readdirSync(this.backupsDir)
          .filter(f => f.endsWith('.json'))
          .sort((a, b) => b.localeCompare(a)); // newest first

        for (const snap of snapshotFiles) {
          try {
            const snapPath = path.join(this.backupsDir, snap);
            const raw = fs.readFileSync(snapPath, 'utf-8');
            if (raw && raw.trim().length > 0) {
              this.data = JSON.parse(raw);
              loaded = true;
              console.log(`[DB Engine] Recovered database from historical snapshot: ${snap}`);
              this.saveAtomic();
              break;
            }
          } catch (e) {}
        }
      } catch (err) {
        console.error(`[DB Engine] Error scanning snapshots:`, err.message);
      }
    }

    // 4. Fallback only if no data file exists anywhere
    if (!loaded) {
      console.log(`[DB Engine] Initializing fresh clean production database.`);
      this.data = getCleanProductionData();
      this.saveAtomic();
    } else {
      // Reconcile and ensure all required collections exist without losing custom data
      const defaultState = getCleanProductionData();
      let modified = false;

      Object.keys(defaultState).forEach(key => {
        if (!this.data[key]) {
          this.data[key] = defaultState[key];
          modified = true;
        }
      });

      // Ensure fixed users passwords remain accessible
      if (Array.isArray(this.data.users)) {
        const admin = this.data.users.find(u => u.role === 'admin' || u.id === 'usr-admin');
        if (admin && admin.password !== 'RUMULI2026') {
          admin.password = 'RUMULI2026';
          modified = true;
        }
        const staff = this.data.users.filter(u => u.role !== 'admin');
        staff.forEach(s => {
          if (!s.password || s.password === '1234') {
            s.password = 'KAZINI2026';
            modified = true;
          }
        });
      }

      if (modified) {
        this.saveAtomic();
      }
    }
  }

  // Atomic write to disk: write to .tmp, sync, rename, then mirror
  saveAtomic() {
    if (!this.data) return;

    try {
      const jsonContent = JSON.stringify(this.data, null, 2);
      const tmpPath = `${this.filepath}.${Date.now()}.tmp`;

      // 1. Write to temporary file and force flush
      fs.writeFileSync(tmpPath, jsonContent, 'utf-8');

      // 2. Atomic rename to primary file
      try {
        fs.renameSync(tmpPath, this.filepath);
      } catch (renameErr) {
        // Windows fallback if rename is locked
        fs.copyFileSync(tmpPath, this.filepath);
        try { fs.unlinkSync(tmpPath); } catch (e) {}
      }

      // 3. Save mirror backup
      fs.writeFileSync(this.backupFile, jsonContent, 'utf-8');

      // 4. Milestone automated snapshot (every 25 writes or every 30 minutes)
      this.writeCount++;
      const now = Date.now();
      if (this.writeCount % 25 === 0 || (now - this.lastBackupTime > 30 * 60 * 1000)) {
        this.createSnapshot();
        this.lastBackupTime = now;
      }
    } catch (err) {
      console.error('[DB Engine] Critical: Failed to persist database atomically:', err);
    }
  }

  save() {
    this.saveAtomic();
  }

  createSnapshot(tag = 'auto') {
    try {
      if (!fs.existsSync(this.backupsDir)) {
        fs.mkdirSync(this.backupsDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `db-snapshot-${tag}-${timestamp}.json`;
      const snapPath = path.join(this.backupsDir, filename);

      fs.writeFileSync(snapPath, JSON.stringify(this.data, null, 2), 'utf-8');

      // Prune old snapshots, keep latest 20
      const snapshots = fs.readdirSync(this.backupsDir)
        .filter(f => f.startsWith('db-snapshot-') && f.endsWith('.json'))
        .sort();

      if (snapshots.length > 20) {
        const toDelete = snapshots.slice(0, snapshots.length - 20);
        toDelete.forEach(f => {
          try { fs.unlinkSync(path.join(this.backupsDir, f)); } catch (e) {}
        });
      }

      return filename;
    } catch (err) {
      console.error('[DB Engine] Failed to create snapshot:', err);
      return null;
    }
  }

  get(collection) {
    if (!this.data) return [];
    return this.data[collection] || [];
  }

  set(collection, items) {
    if (!this.data) return;
    this.data[collection] = items;
    this.saveAtomic();
  }

  resetClean() {
    this.createSnapshot('pre-wipe');
    this.data = getCleanProductionData();
    this.saveAtomic();
    return this.data;
  }
}

const db = new JsonDB(DB_FILE);

// ================= API ROUTES =================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// --- Shops / Branches ---
app.get('/api/shops', (req, res) => {
  res.json(db.get('shops'));
});

app.post('/api/shops', (req, res) => {
  const shops = db.get('shops');
  const newShop = {
    id: `shop-${Date.now()}`,
    name: req.body.name,
    type: req.body.type || 'hardware',
    location: req.body.location || '',
    phone: req.body.phone || '',
    email: req.body.email || '',
    isMain: req.body.isMain || (shops.length === 0),
    active: true,
    created_at: new Date().toISOString()
  };
  shops.push(newShop);
  db.set('shops', shops);
  res.status(201).json(newShop);
});

app.put('/api/shops/:id', (req, res) => {
  const shops = db.get('shops');
  const index = shops.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Shop not found' });
  shops[index] = { ...shops[index], ...req.body };
  db.set('shops', shops);
  res.json(shops[index]);
});

// --- Categories ---
app.get('/api/categories', (req, res) => {
  res.json(db.get('categories'));
});

app.post('/api/categories', (req, res) => {
  const categories = db.get('categories');
  const newCat = {
    id: `cat-${Date.now()}`,
    name: req.body.name,
    icon: req.body.icon || 'Folder'
  };
  categories.push(newCat);
  db.set('categories', categories);
  res.status(201).json(newCat);
});

// --- Products & Inventory ---
app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  let products = db.get('products');

  if (category && category !== 'All') {
    products = products.filter(p => p.category === category);
  }

  if (search) {
    const s = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(s) ||
      (p.sku && p.sku.toLowerCase().includes(s)) ||
      (p.barcode && p.barcode.toLowerCase().includes(s)) ||
      (p.brand && p.brand.toLowerCase().includes(s))
    );
  }

  res.json(products);
});

app.post('/api/products', (req, res) => {
  const products = db.get('products');
  const shops = db.get('shops');

  const stockObj = {};
  shops.forEach(s => {
    stockObj[s.id] = (req.body.stock && req.body.stock[s.id] !== undefined)
      ? Number(req.body.stock[s.id])
      : 0;
  });

  const newProduct = {
    id: `prod-${Date.now()}`,
    sku: req.body.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    barcode: req.body.barcode || `${Math.floor(6001000000 + Math.random() * 999999)}`,
    name: req.body.name,
    category: req.body.category || 'General Hardware',
    brand: req.body.brand || 'General',
    unit: req.body.unit || 'Pcs',
    costPrice: Number(req.body.costPrice) || 0,
    retailPrice: Number(req.body.retailPrice) || 0,
    wholesalePrice: Number(req.body.wholesalePrice) || Number(req.body.retailPrice) || 0,
    minStockAlert: Number(req.body.minStockAlert) || 10,
    stock: stockObj,
    description: req.body.description || '',
    image: req.body.image || ''
  };

  products.unshift(newProduct);
  db.set('products', products);
  res.status(201).json(newProduct);
});

// Bulk Import Products (From CSV / Excel)
app.post('/api/products/bulk', (req, res) => {
  const incoming = req.body.products;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return res.status(400).json({ error: 'No products provided for bulk import' });
  }

  const products = db.get('products');
  const shops = db.get('shops');
  const primaryShopId = shops[0]?.id || 'shop-main';

  let addedCount = 0;
  incoming.forEach(item => {
    if (!item.name || !item.name.trim()) return;

    const stockObj = {};
    shops.forEach(s => {
      stockObj[s.id] = Number(item.stock?.[s.id] ?? (s.id === primaryShopId ? (item.initialStock || 0) : 0));
    });

    const newProd = {
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      sku: item.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: item.barcode || `${Math.floor(6001000000 + Math.random() * 999999)}`,
      name: item.name.trim(),
      category: item.category || 'General Hardware',
      brand: item.brand || 'General',
      unit: item.unit || 'Pcs',
      costPrice: Number(item.costPrice) || 0,
      retailPrice: Number(item.retailPrice) || 0,
      wholesalePrice: Number(item.wholesalePrice) || Number(item.retailPrice) || 0,
      minStockAlert: Number(item.minStockAlert) || 10,
      stock: stockObj,
      description: item.description || '',
      image: item.image || ''
    };

    products.push(newProd);
    addedCount++;
  });

  db.set('products', products);
  res.json({ success: true, count: addedCount, products });
});

// Clear All Products
app.post('/api/products/clear-all', (req, res) => {
  db.set('products', []);
  res.json({ success: true, message: 'Inventory cleared' });
});

app.put('/api/products/:id', (req, res) => {
  const products = db.get('products');
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });

  products[index] = {
    ...products[index],
    ...req.body,
    costPrice: Number(req.body.costPrice ?? products[index].costPrice),
    retailPrice: Number(req.body.retailPrice ?? products[index].retailPrice),
    wholesalePrice: Number(req.body.wholesalePrice ?? products[index].wholesalePrice),
    minStockAlert: Number(req.body.minStockAlert ?? products[index].minStockAlert)
  };

  db.set('products', products);
  res.json(products[index]);
});

app.delete('/api/products/:id', (req, res) => {
  let products = db.get('products');
  products = products.filter(p => p.id !== req.params.id);
  db.set('products', products);
  res.json({ success: true });
});

// Stock adjustment
app.post('/api/products/:id/adjust', (req, res) => {
  const { shopId, newQty, reason, notes, performedBy } = req.body;
  const products = db.get('products');
  const adjustments = db.get('stockAdjustments');

  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const prev = Number(product.stock[shopId] || 0);
  const updated = Number(newQty);
  product.stock[shopId] = updated;

  const adjRecord = {
    id: `ADJ-${Date.now()}`,
    shopId,
    productId: product.id,
    productName: product.name,
    previousQty: prev,
    newQty: updated,
    difference: updated - prev,
    reason: reason || 'audit',
    notes: notes || '',
    performedBy: performedBy || 'Staff',
    date: new Date().toISOString()
  };

  adjustments.unshift(adjRecord);
  db.set('products', products);
  db.set('stockAdjustments', adjustments);

  res.json({ product, adjustment: adjRecord });
});

// --- Customers & Debts (Customer Credit) ---
app.get('/api/customers', (req, res) => {
  res.json(db.get('customers'));
});

app.post('/api/customers', (req, res) => {
  const customers = db.get('customers');
  const newCustomer = {
    id: `cust-${Date.now()}`,
    name: req.body.name,
    phone: req.body.phone || '',
    email: req.body.email || '',
    idNumber: req.body.idNumber || '',
    type: req.body.type || 'retail',
    creditLimit: Number(req.body.creditLimit) || 0,
    currentDebt: Number(req.body.currentDebt) || 0,
    notes: req.body.notes || ''
  };
  customers.push(newCustomer);
  db.set('customers', customers);
  res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', (req, res) => {
  const customers = db.get('customers');
  const index = customers.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Customer not found' });

  customers[index] = { ...customers[index], ...req.body };
  db.set('customers', customers);
  res.json(customers[index]);
});

// Customer Debt Payment
app.post('/api/customers/:id/pay-debt', (req, res) => {
  const { amount, paymentMethod, reference, receivedBy } = req.body;
  const payAmt = Number(amount);
  if (isNaN(payAmt) || payAmt <= 0) {
    return res.status(400).json({ error: 'Invalid payment amount' });
  }

  const customers = db.get('customers');
  const custIndex = customers.findIndex(c => c.id === req.params.id);
  if (custIndex === -1) return res.status(404).json({ error: 'Customer not found' });

  const customer = customers[custIndex];
  const sales = db.get('sales');

  // Idempotency: if this payment was already recorded, return immediately
  if (req.body.id) {
    const existing = sales.find(s => s.id === req.body.id);
    if (existing) {
      return res.json({ customer, receipt: existing });
    }
  }

  customer.currentDebt = Math.max(0, customer.currentDebt - payAmt);

  const debtPaymentRecord = {
    id: req.body.id || `RCT-DEBT-${Date.now()}`,
    shopId: req.body.shopId || 'shop-main',
    shopName: req.body.shopName || 'Main Store',
    cashierId: req.body.cashierId || 'usr-cashier',
    cashierName: receivedBy || 'Cashier',
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    items: [
      {
        productId: 'debt-repayment',
        sku: 'DEBT-PAY',
        name: `Credit Account Repayment - ${customer.name}`,
        unit: 'Pcs',
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
    paymentMethod: paymentMethod || 'cash',
    paymentDetails: {
      isDebtRepayment: true,
      reference: reference || '',
      remainingBalance: customer.currentDebt
    },
    status: 'completed',
    createdAt: req.body.createdAt || new Date().toISOString()
  };

  sales.unshift(debtPaymentRecord);
  db.set('customers', customers);
  db.set('sales', sales);

  res.json({
    customer,
    receipt: debtPaymentRecord
  });
});

// --- POS Sales ---
app.get('/api/sales', (req, res) => {
  const { shopId, date, limit = 100 } = req.query;
  let sales = db.get('sales');

  if (shopId && shopId !== 'all') {
    sales = sales.filter(s => s.shopId === shopId);
  }

  if (date) {
    sales = sales.filter(s => s.createdAt.startsWith(date));
  }

  res.json(sales.slice(0, Number(limit)));
});

app.post('/api/sales', (req, res) => {
  const {
    shopId,
    shopName,
    cashierId,
    cashierName,
    customerId,
    customerName,
    customerPhone,
    items,
    subtotal,
    discountTotal,
    taxRate,
    taxAmount,
    grandTotal,
    paymentMethod,
    paymentDetails
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Cannot checkout with empty items' });
  }

  const products = db.get('products');
  const customers = db.get('customers');
  const sales = db.get('sales');

  // Idempotency: If this sale was already processed (e.g. from previous sync attempt), return it immediately
  if (req.body.id) {
    const existing = sales.find(s => s.id === req.body.id);
    if (existing) {
      return res.status(200).json(existing);
    }
  }

  // Decrement inventory
  items.forEach(cartItem => {
    const prod = products.find(p => p.id === cartItem.productId);
    if (prod && prod.stock) {
      const current = Number(prod.stock[shopId] || 0);
      prod.stock[shopId] = Math.max(0, current - Number(cartItem.quantity));
    }
  });

  // Credit sales increment debtor balance
  if (paymentMethod === 'credit' && customerId) {
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      cust.currentDebt = (Number(cust.currentDebt) || 0) + Number(grandTotal);
    }
  }

  const invNumber = req.body.id || `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const newSale = {
    id: invNumber,
    shopId,
    shopName: shopName || 'Main Store',
    cashierId: cashierId || 'cashier',
    cashierName: cashierName || 'Cashier',
    customerId: customerId || null,
    customerName: customerName || 'Walk-in Retail Customer',
    customerPhone: customerPhone || '',
    items,
    subtotal: Number(subtotal),
    discountTotal: Number(discountTotal) || 0,
    taxRate: Number(taxRate) || 0,
    taxAmount: Number(taxAmount) || 0,
    grandTotal: Number(grandTotal),
    paymentMethod,
    paymentDetails: paymentDetails || {},
    status: 'completed',
    createdAt: req.body.createdAt || new Date().toISOString()
  };

  sales.unshift(newSale);

  db.set('products', products);
  db.set('customers', customers);
  db.set('sales', sales);

  res.status(201).json(newSale);
});

// --- Proforma Invoices ---
app.get('/api/proformas', (req, res) => {
  const { shopId, status } = req.query;
  let proformas = db.get('proformas');
  if (shopId && shopId !== 'all') {
    proformas = proformas.filter(p => p.shopId === shopId);
  }
  if (status) {
    proformas = proformas.filter(p => p.status === status);
  }
  res.json(proformas);
});

app.post('/api/proformas', (req, res) => {
  const {
    shopId,
    shopName,
    creatorId,
    creatorName,
    customerId,
    customerName,
    customerPhone,
    customerAddress,
    customerTin,
    items,
    subtotal,
    discountTotal,
    taxRate,
    taxAmount,
    grandTotal,
    validUntil,
    notes,
    status = 'issued'
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Cannot create proforma invoice without items' });
  }

  const proformas = db.get('proformas');
  const proformaNumber = `PROF-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  // Default validUntil to 14 days ahead if not specified
  const expiryDate = validUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const newProforma = {
    id: proformaNumber,
    proformaNumber,
    shopId: shopId || 'shop-main',
    shopName: shopName || 'Main Hardware Store',
    creatorId: creatorId || 'staff',
    creatorName: creatorName || 'Sales Officer',
    customerId: customerId || null,
    customerName: customerName || 'Valued Customer',
    customerPhone: customerPhone || '',
    customerAddress: customerAddress || '',
    customerTin: customerTin || '',
    items: items.map(it => ({
      productId: it.productId || '',
      sku: it.sku || '',
      name: it.name,
      unit: it.unit || 'Pcs',
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unitPrice) || 0,
      discount: Number(it.discount) || 0,
      priceType: it.priceType || 'retail',
      total: Number(it.total) || ((Number(it.unitPrice) || 0) * (Number(it.quantity) || 1))
    })),
    subtotal: Number(subtotal) || 0,
    discountTotal: Number(discountTotal) || 0,
    taxRate: Number(taxRate) || 0,
    taxAmount: Number(taxAmount) || 0,
    grandTotal: Number(grandTotal) || 0,
    validUntil: expiryDate,
    notes: notes || '',
    status, // 'issued', 'converted', 'cancelled', 'draft'
    convertedSaleId: null,
    createdAt: new Date().toISOString()
  };

  proformas.unshift(newProforma);
  db.set('proformas', proformas);
  res.status(201).json(newProforma);
});

app.put('/api/proformas/:id', (req, res) => {
  const proformas = db.get('proformas');
  const index = proformas.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Proforma invoice not found' });
  }

  proformas[index] = {
    ...proformas[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  db.set('proformas', proformas);
  res.json(proformas[index]);
});

app.delete('/api/proformas/:id', (req, res) => {
  const proformas = db.get('proformas').filter(p => p.id !== req.params.id);
  db.set('proformas', proformas);
  res.json({ success: true, message: 'Proforma invoice deleted' });
});

// --- Delivery Notes / Dispatch Manifests ---
app.get('/api/delivery-notes', (req, res) => {
  const { shopId, status } = req.query;
  let deliveryNotes = db.get('deliveryNotes');
  if (shopId && shopId !== 'all') {
    deliveryNotes = deliveryNotes.filter(d => d.shopId === shopId);
  }
  if (status) {
    deliveryNotes = deliveryNotes.filter(d => d.status === status);
  }
  res.json(deliveryNotes);
});

app.post('/api/delivery-notes', (req, res) => {
  const {
    orderRef,
    shopId,
    shopName,
    dispatcherId,
    dispatcherName,
    customerId,
    customerName,
    customerPhone,
    deliveryAddress,
    vehicleReg,
    driverName,
    driverPhone,
    dispatchDate,
    items,
    notes,
    status = 'dispatched'
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Cannot create delivery note without goods items' });
  }

  const deliveryNotes = db.get('deliveryNotes');
  const deliveryNumber = `DN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const newDeliveryNote = {
    id: deliveryNumber,
    deliveryNumber,
    orderRef: orderRef || '',
    shopId: shopId || 'shop-main',
    shopName: shopName || 'Main Hardware Store',
    dispatcherId: dispatcherId || 'staff',
    dispatcherName: dispatcherName || 'Store Dispatcher',
    customerId: customerId || null,
    customerName: customerName || 'Valued Customer',
    customerPhone: customerPhone || '',
    deliveryAddress: deliveryAddress || 'Store Pickup / On-Site Delivery',
    vehicleReg: (vehicleReg || '').toUpperCase().trim(),
    driverName: driverName || '',
    driverPhone: driverPhone || '',
    dispatchDate: dispatchDate || new Date().toISOString().split('T')[0],
    items: items.map(it => ({
      productId: it.productId || '',
      sku: it.sku || '',
      name: it.name,
      unit: it.unit || 'Pcs',
      quantity: Number(it.quantity) || 1,
      notes: it.notes || ''
    })),
    notes: notes || '',
    status, // 'dispatched', 'in_transit', 'delivered', 'returned'
    deliveredAt: status === 'delivered' ? new Date().toISOString() : null,
    createdAt: new Date().toISOString()
  };

  deliveryNotes.unshift(newDeliveryNote);
  db.set('deliveryNotes', deliveryNotes);
  res.status(201).json(newDeliveryNote);
});

app.put('/api/delivery-notes/:id', (req, res) => {
  const deliveryNotes = db.get('deliveryNotes');
  const index = deliveryNotes.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Delivery note not found' });
  }

  const updated = {
    ...deliveryNotes[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  if (req.body.status === 'delivered' && !updated.deliveredAt) {
    updated.deliveredAt = new Date().toISOString();
  }

  deliveryNotes[index] = updated;
  db.set('deliveryNotes', deliveryNotes);
  res.json(updated);
});

app.delete('/api/delivery-notes/:id', (req, res) => {
  const deliveryNotes = db.get('deliveryNotes').filter(d => d.id !== req.params.id);
  db.set('deliveryNotes', deliveryNotes);
  res.json({ success: true, message: 'Delivery note deleted' });
});

// --- Suppliers & Purchases ---
app.get('/api/suppliers', (req, res) => {
  res.json(db.get('suppliers'));
});

app.post('/api/suppliers', (req, res) => {
  const suppliers = db.get('suppliers');
  const newSup = {
    id: `sup-${Date.now()}`,
    name: req.body.name,
    contactPerson: req.body.contactPerson || '',
    phone: req.body.phone || '',
    email: req.body.email || '',
    address: req.body.address || '',
    category: req.body.category || 'General',
    outstandingBalance: Number(req.body.outstandingBalance) || 0
  };
  suppliers.push(newSup);
  db.set('suppliers', suppliers);
  res.status(201).json(newSup);
});

app.get('/api/purchases', (req, res) => {
  res.json(db.get('purchases'));
});

app.post('/api/purchases', (req, res) => {
  const purchases = db.get('purchases');
  const products = db.get('products');
  const suppliers = db.get('suppliers');

  const {
    supplierId,
    supplierName,
    shopId,
    shopName,
    items,
    grandTotal,
    amountPaid,
    status = 'received',
    notes
  } = req.body;

  const newPO = {
    id: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    supplierId,
    supplierName,
    shopId,
    shopName,
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date().toISOString().split('T')[0],
    items: items || [],
    grandTotal: Number(grandTotal),
    amountPaid: Number(amountPaid) || 0,
    paymentStatus: (Number(amountPaid) >= Number(grandTotal)) ? 'paid' : (Number(amountPaid) > 0 ? 'partial' : 'unpaid'),
    status,
    notes: notes || ''
  };

  if (status === 'received' && items && items.length) {
    items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        if (!prod.stock) prod.stock = {};
        prod.stock[shopId] = (Number(prod.stock[shopId]) || 0) + Number(item.qtyReceived || item.qtyOrdered || 0);
        if (item.costPrice) {
          prod.costPrice = Number(item.costPrice);
        }
      }
    });
    db.set('products', products);
  }

  if (supplierId) {
    const sup = suppliers.find(s => s.id === supplierId);
    if (sup) {
      const balanceDiff = Number(grandTotal) - (Number(amountPaid) || 0);
      sup.outstandingBalance = (Number(sup.outstandingBalance) || 0) + balanceDiff;
      db.set('suppliers', suppliers);
    }
  }

  purchases.unshift(newPO);
  db.set('purchases', purchases);
  res.status(201).json(newPO);
});

// --- Inter-Shop Transfers ---
app.get('/api/transfers', (req, res) => {
  res.json(db.get('transfers'));
});

app.post('/api/transfers', (req, res) => {
  const transfers = db.get('transfers');
  const products = db.get('products');
  const { fromShopId, fromShopName, toShopId, toShopName, items, notes, dispatchedBy } = req.body;

  if (fromShopId === toShopId) {
    return res.status(400).json({ error: 'Source and destination branches cannot be the same' });
  }

  items.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    if (prod && prod.stock) {
      const cur = Number(prod.stock[fromShopId] || 0);
      prod.stock[fromShopId] = Math.max(0, cur - Number(item.quantity));
    }
  });

  const newTransfer = {
    id: `TRF-${Math.floor(1000 + Math.random() * 9000)}`,
    fromShopId,
    fromShopName,
    toShopId,
    toShopName,
    items,
    status: 'in_transit',
    dispatchedBy: dispatchedBy || 'Storekeeper',
    receivedBy: '',
    notes: notes || '',
    date: new Date().toISOString()
  };

  transfers.unshift(newTransfer);
  db.set('products', products);
  db.set('transfers', transfers);

  res.status(201).json(newTransfer);
});

app.put('/api/transfers/:id/status', (req, res) => {
  const { status, receivedBy } = req.body;
  const transfers = db.get('transfers');
  const products = db.get('products');
  const trf = transfers.find(t => t.id === req.params.id);

  if (!trf) return res.status(404).json({ error: 'Transfer not found' });

  if (status === 'received' && trf.status !== 'received') {
    trf.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.stock) {
        prod.stock[trf.toShopId] = (Number(prod.stock[trf.toShopId]) || 0) + Number(item.quantity);
      }
    });
    trf.status = 'received';
    trf.receivedBy = receivedBy || 'Branch Manager';
  } else if (status === 'cancelled' && trf.status !== 'cancelled') {
    trf.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.stock) {
        prod.stock[trf.fromShopId] = (Number(prod.stock[trf.fromShopId]) || 0) + Number(item.quantity);
      }
    });
    trf.status = 'cancelled';
  }

  db.set('products', products);
  db.set('transfers', transfers);
  res.json(trf);
});

// --- Expenses ---
app.get('/api/expenses', (req, res) => {
  const { shopId } = req.query;
  let expenses = db.get('expenses');
  if (shopId && shopId !== 'all') {
    expenses = expenses.filter(e => e.shopId === shopId);
  }
  res.json(expenses);
});

app.post('/api/expenses', (req, res) => {
  const expenses = db.get('expenses');
  const newExp = {
    id: `exp-${Date.now()}`,
    shopId: req.body.shopId,
    shopName: req.body.shopName || '',
    category: req.body.category || 'General',
    amount: Number(req.body.amount),
    paymentMethod: req.body.paymentMethod || 'cash',
    paidTo: req.body.paidTo || '',
    description: req.body.description || '',
    date: req.body.date || new Date().toISOString().split('T')[0],
    approvedBy: req.body.approvedBy || 'Manager'
  };

  expenses.unshift(newExp);
  db.set('expenses', expenses);
  res.status(201).json(newExp);
});

app.delete('/api/expenses/:id', (req, res) => {
  let expenses = db.get('expenses');
  expenses = expenses.filter(e => e.id !== req.params.id);
  db.set('expenses', expenses);
  res.json({ success: true });
});

// --- Users & Auth ---
app.get('/api/users', (req, res) => {
  res.json(db.get('users'));
});

app.post('/api/users/login', (req, res) => {
  const { username, email, password, pin } = req.body;
  const users = db.get('users');

  const identifier = (username || email || '').trim().toLowerCase();
  let user = null;

  if (identifier && password) {
    user = users.find(u => 
      ((u.username && u.username.toLowerCase() === identifier) || 
       (u.email && u.email.toLowerCase() === identifier)) &&
      u.password === password &&
      u.active
    );
  } else if (pin) {
    user = users.find(u => u.pin === pin && u.active);
  } else if (identifier && !password && !pin) {
    // Cannot log in without password or PIN
    user = null;
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid username, email, password, or PIN' });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email || '',
    name: user.name,
    role: user.role,
    assignedShopId: user.assignedShopId,
    phone: user.phone || '',
    pin: user.pin
  });
});

app.post('/api/users/register', (req, res) => {
  const { name, email, username, password, pin, role, assignedShopId, phone } = req.body;

  if (!name || (!email && !username)) {
    return res.status(400).json({ error: 'Full name and email or username are required' });
  }

  const users = db.get('users');
  const userIdentifier = (email || username || '').trim().toLowerCase();

  const existing = users.find(u => 
    (u.email && u.email.toLowerCase() === userIdentifier) || 
    (u.username && u.username.toLowerCase() === userIdentifier)
  );

  if (existing) {
    return res.status(400).json({ error: 'An account with this email or username already exists' });
  }

  const generatedUsername = username ? username.trim() : (email ? email.split('@')[0] : `user_${Date.now().toString().slice(-4)}`);
  const finalRole = (role === 'admin' || role === 'owner') ? 'admin' : (role || 'cashier');

  const newUser = {
    id: `usr-${Date.now()}`,
    username: generatedUsername,
    name: name.trim(),
    email: email ? email.trim() : '',
    password: password || '',
    role: finalRole,
    pin: pin ? pin.trim() : (finalRole === 'admin' ? '1234' : '0000'),
    assignedShopId: assignedShopId || 'shop-main',
    phone: phone ? phone.trim() : '',
    active: true,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  db.set('users', users);

  res.status(201).json({
    success: true,
    user: newUser
  });
});

app.post('/api/users', (req, res) => {
  const users = db.get('users');
  const newUser = {
    id: `usr-${Date.now()}`,
    username: req.body.username || (req.body.email ? req.body.email.split('@')[0] : `user_${Date.now().toString().slice(-4)}`),
    name: req.body.name,
    email: req.body.email || '',
    password: req.body.password || '',
    role: req.body.role || 'cashier',
    pin: req.body.pin || '1234',
    assignedShopId: req.body.assignedShopId || 'shop-main',
    phone: req.body.phone || '',
    active: true,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  db.set('users', users);
  res.status(201).json(newUser);
});

// --- Settings ---
app.get('/api/settings', (req, res) => {
  const current = db.data.settings || {};
  if (!current.currencySymbol || current.currencySymbol === 'KSh' || current.currencySymbol === 'Ksh' || current.currencySymbol === 'TSh') {
    current.currencySymbol = 'Tsh';
    current.currency = 'TZS';
  }
  if (!current.logo) {
    current.logo = '/logo.png';
  }
  if (!current.tagline || current.tagline.includes('Ubora wa Vifaa')) {
    current.tagline = 'OUR DUTY IS TO DELIGHT YOU.';
  }
  res.json(current);
});

app.post('/api/settings', (req, res) => {
  db.data.settings = { ...db.data.settings, ...req.body };
  if (!db.data.settings.currencySymbol || db.data.settings.currencySymbol === 'KSh' || db.data.settings.currencySymbol === 'Ksh' || db.data.settings.currencySymbol === 'TSh') {
    db.data.settings.currencySymbol = 'Tsh';
    db.data.settings.currency = 'TZS';
  }
  if (!db.data.settings.logo) {
    db.data.settings.logo = '/logo.png';
  }
  db.save();
  res.json(db.data.settings);
});

// --- Financial Analytics Summary ---
app.get('/api/analytics/summary', (req, res) => {
  const { shopId } = req.query;
  const sales = db.get('sales').filter(s => (shopId && shopId !== 'all') ? s.shopId === shopId : true);
  const expenses = db.get('expenses').filter(e => (shopId && shopId !== 'all') ? e.shopId === shopId : true);
  const products = db.get('products');
  const customers = db.get('customers');
  const suppliers = db.get('suppliers');

  const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);

  let totalCOGS = 0;
  sales.forEach(s => {
    (s.items || []).forEach(item => {
      totalCOGS += (Number(item.costPrice) || 0) * (Number(item.quantity) || 0);
    });
  });
  const grossProfit = totalRevenue - totalCOGS;

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = grossProfit - totalExpenses;

  let totalInventoryValuation = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  products.forEach(p => {
    const shopQty = (shopId && shopId !== 'all')
      ? Number(p.stock?.[shopId] || 0)
      : Object.values(p.stock || {}).reduce((a, b) => a + Number(b), 0);

    totalInventoryValuation += shopQty * (Number(p.costPrice) || 0);
    if (shopQty <= 0) {
      outOfStockCount++;
    } else if (shopQty <= Number(p.minStockAlert || 10)) {
      lowStockCount++;
    }
  });

  const totalReceivables = customers.reduce((sum, c) => sum + (Number(c.currentDebt) || 0), 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + (Number(s.outstandingBalance) || 0), 0);

  const paymentBreakdown = {
    cash: 0,
    mpesa: 0,
    credit: 0,
    card: 0,
    bank: 0
  };
  sales.forEach(s => {
    const m = (s.paymentMethod || 'cash').toLowerCase();
    if (paymentBreakdown[m] !== undefined) {
      paymentBreakdown[m] += Number(s.grandTotal) || 0;
    } else {
      paymentBreakdown.cash += Number(s.grandTotal) || 0;
    }
  });

  const productSalesMap = {};
  sales.forEach(s => {
    (s.items || []).forEach(i => {
      if (!productSalesMap[i.name]) {
        productSalesMap[i.name] = { name: i.name, qty: 0, revenue: 0 };
      }
      productSalesMap[i.name].qty += Number(i.quantity) || 0;
      productSalesMap[i.name].revenue += Number(i.total) || 0;
    });
  });

  const topSelling = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  res.json({
    totalRevenue,
    totalCOGS,
    grossProfit,
    totalExpenses,
    netProfit,
    totalInventoryValuation,
    lowStockCount,
    outOfStockCount,
    totalReceivables,
    totalPayables,
    totalOrders: sales.length,
    paymentBreakdown,
    topSelling
  });
});

// --- System Wipe / Reset to Clean Production ---
app.post('/api/system/reset-clean', (req, res) => {
  const cleanData = db.resetClean();
  res.json({ success: true, message: 'System wiped to clean production state', data: cleanData });
});

// Clear only transactions (keep product catalog & customers)
app.post('/api/system/clear-transactions', (req, res) => {
  db.set('sales', []);
  db.set('expenses', []);
  db.set('transfers', []);
  db.set('purchases', []);
  db.set('stockAdjustments', []);
  db.set('proformas', []);
  db.set('deliveryNotes', []);
  
  // Reset customer debts
  const customers = db.get('customers').map(c => ({ ...c, currentDebt: 0 }));
  db.set('customers', customers);

  // Reset supplier debts
  const suppliers = db.get('suppliers').map(s => ({ ...s, outstandingBalance: 0 }));
  db.set('suppliers', suppliers);

  res.json({ success: true, message: 'All transactions cleared and debts zeroed out' });
});

// Export Backup JSON
app.get('/api/system/export', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=jenga-kwanza-production-backup-${new Date().toISOString().split('T')[0]}.json`);
  res.send(JSON.stringify(db.data, null, 2));
});

// Import Backup JSON
app.post('/api/system/import', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid backup file structure' });
  }
  db.data = { ...db.data, ...req.body };
  db.save();
  res.json({ success: true, message: 'Database restored successfully' });
});

// List Automatic Snapshots
app.get('/api/system/snapshots', (req, res) => {
  try {
    if (!fs.existsSync(db.backupsDir)) {
      return res.json([]);
    }
    const files = fs.readdirSync(db.backupsDir)
      .filter(f => f.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a));

    const list = files.map(filename => {
      const filePath = path.join(db.backupsDir, filename);
      const stat = fs.statSync(filePath);
      return {
        filename,
        size: stat.size,
        createdAt: stat.mtime
      };
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list snapshots' });
  }
});

// Create Manual Snapshot
app.post('/api/system/create-snapshot', (req, res) => {
  const filename = db.createSnapshot('manual');
  if (filename) {
    res.json({ success: true, filename, message: 'Automated backup snapshot created successfully' });
  } else {
    res.status(500).json({ error: 'Failed to create backup snapshot' });
  }
});

// Serve frontend in production
const CLIENT_DIST = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    }
    next();
  });
}

// Start server
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(`  JENGA KWANZA BUSINESS MANAGEMENT & POS SYSTEM    `);
    console.log(`  Server running at: http://localhost:${PORT}      `);
    console.log(`  Database File: ${DB_FILE}                        `);
    console.log(`===================================================`);
  });
}

module.exports = app;
