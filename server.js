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
      location: 'Commercial Center, Main Street',
      phone: '+254 700 000 000',
      email: 'store@business.co.ke',
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
      name: 'Store Owner / Director',
      role: 'admin',
      pin: '1234',
      assignedShopId: 'all',
      phone: '',
      active: true
    },
    {
      id: 'usr-cashier',
      username: 'cashier',
      name: 'Cashier 1',
      role: 'cashier',
      pin: '0000',
      assignedShopId: 'shop-main',
      phone: '',
      active: true
    },
    {
      id: 'usr-manager',
      username: 'manager',
      name: 'Store Manager',
      role: 'manager',
      pin: '5678',
      assignedShopId: 'shop-main',
      phone: '',
      active: true
    }
  ];

  const settings = {
    businessName: 'JENGA KWANZA HARDWARE & STORES',
    tagline: 'Ubora wa Vifaa vya Ujenzi, Mabati, Saruji na Rangi',
    currency: 'TZS',
    currencySymbol: 'Tsh',
    taxEnabled: false,
    taxRate: 18,
    traTin: '',
    phone: '+255 700 000 000',
    email: 'info@jengakwanza.co.tz',
    address: 'Kariakoo Commercial District, Dar es Salaam',
    receiptHeader: 'JENGA KWANZA HARDWARE & STORES',
    receiptFooter: 'Asante kwa kujenga nasi! Bidhaa zilizonunuliwa zinaweza kubadilishwa ndani ya siku 7 zikiwa katika hali nzuri na risiti halisi.'
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
    users,
    settings
  };
}

// Starter hardware catalog (optional 1-click import for standard building materials)
function getStarterProducts(shopId = 'shop-main') {
  return [
    {
      id: `prod-${Date.now()}-1`,
      sku: 'CEM-TWIGA-42',
      barcode: '6001002001',
      name: 'Twiga Extra Cement 42.5N (50kg Bag)',
      category: 'Cement & Aggregates',
      brand: 'Twiga Cement (Heidelberg)',
      unit: 'Bag',
      costPrice: 18500,
      retailPrice: 22000,
      wholesalePrice: 20500,
      minStockAlert: 50,
      stock: { [shopId]: 0 },
      description: 'Dar es Salaam manufactured structural Portland cement for high strength multi-storey slabs and columns.',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: `prod-${Date.now()}-2`,
      sku: 'CEM-SIMBA-32',
      barcode: '6001002002',
      name: 'Simba Bora Cement 32.5R (50kg Bag)',
      category: 'Cement & Aggregates',
      brand: 'Tanga Simba Cement',
      unit: 'Bag',
      costPrice: 17000,
      retailPrice: 20000,
      wholesalePrice: 18800,
      minStockAlert: 40,
      stock: { [shopId]: 0 },
      description: 'High quality Portland composite cement suitable for plastering, brick molding, and masonry foundation walls.',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: `prod-${Date.now()}-3`,
      sku: 'STL-NONDO-Y10',
      barcode: '6001002003',
      name: 'Nondo Deformed Rebar Y10 (12m Bar)',
      category: 'Steel & Rebar',
      brand: 'MMI Steel / SteelCo',
      unit: 'Pcs',
      costPrice: 22000,
      retailPrice: 27000,
      wholesalePrice: 25000,
      minStockAlert: 50,
      stock: { [shopId]: 0 },
      description: 'TBS certified BS4449 grade 500 nondo reinforcement steel bar 10mm x 12m for floor rings and beams.',
      image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: `prod-${Date.now()}-4`,
      sku: 'STL-NONDO-Y12',
      barcode: '6001002004',
      name: 'Nondo Deformed Rebar Y12 (12m Bar)',
      category: 'Steel & Rebar',
      brand: 'MMI Steel / Kamal',
      unit: 'Pcs',
      costPrice: 32000,
      retailPrice: 38500,
      wholesalePrice: 36000,
      minStockAlert: 50,
      stock: { [shopId]: 0 },
      description: 'High yield 12mm x 12m deformed ribbed nondo steel for main structural pillars and foundation footing.',
      image: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: `prod-${Date.now()}-5`,
      sku: 'STL-NONDO-Y16',
      barcode: '6001002005',
      name: 'Nondo Deformed Rebar Y16 (12m Bar)',
      category: 'Steel & Rebar',
      brand: 'MMI Steel',
      unit: 'Pcs',
      costPrice: 58000,
      retailPrice: 68000,
      wholesalePrice: 64000,
      minStockAlert: 30,
      stock: { [shopId]: 0 },
      description: 'Heavy gauge 16mm x 12m tensile structural rebar for heavy civil and commercial foundation pads.',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: `prod-${Date.now()}-6`,
      sku: 'STL-BIND-25K',
      barcode: '6001002006',
      name: 'Black Annealed Waya wa Kufungia (25kg Roll)',
      category: 'Steel & Rebar',
      brand: 'Tanzania Wire Ltd',
      unit: 'Roll',
      costPrice: 65000,
      retailPrice: 82000,
      wholesalePrice: 76000,
      minStockAlert: 10,
      stock: { [shopId]: 0 },
      description: 'Standard 16-gauge flexible binding wire roll for tying nondo rebar junctions securely.',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: `prod-${Date.now()}-7`,
      sku: 'ROOF-ALAF-28G',
      barcode: '6001002007',
      name: 'ALAF Dumu Zas Mabati Gauge 28 (3.0m Sheet)',
      category: 'Roofing & Timber',
      brand: 'ALAF Tanzania',
      unit: 'Sheet',
      costPrice: 24000,
      retailPrice: 29500,
      wholesalePrice: 27500,
      minStockAlert: 30,
      stock: { [shopId]: 0 },
      description: 'Original ALAF rust-resistant anti-corrosion corrugated galvanized iron roofing sheet with 28-gauge durability.',
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: `prod-${Date.now()}-8`,
      sku: 'TMB-2X4-TREATED',
      barcode: '6001002008',
      name: 'Mbao 2x4 Dawa Treated Timber (Per Running Meter)',
      category: 'Roofing & Timber',
      brand: 'Sao Hill / Mafinga',
      unit: 'Meter',
      costPrice: 2800,
      retailPrice: 3800,
      wholesalePrice: 3400,
      minStockAlert: 100,
      stock: { [shopId]: 0 },
      description: 'Termite and borer pressure treated kiln-dried pine & cypress timber for roof trusses and ceiling battens.',
      image: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: `prod-${Date.now()}-9`,
      sku: 'PNT-CRW-WHT-20L',
      barcode: '6001002009',
      name: 'Coral Weather Guard Emulsion Brilliant White (20L)',
      category: 'Paints & Finishes',
      brand: 'Coral Paints / Sadolin',
      unit: 'Bucket',
      costPrice: 85000,
      retailPrice: 110000,
      wholesalePrice: 98000,
      minStockAlert: 10,
      stock: { [shopId]: 0 },
      description: 'Premium acrylic fungus-resistant exterior and interior weatherguard white emulsion paint with high coverage.',
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: `prod-${Date.now()}-10`,
      sku: 'PNT-GLS-BLK-4L',
      barcode: '6001002010',
      name: 'Insignia Super Gloss Enamel Paint Black (4L)',
      category: 'Paints & Finishes',
      brand: 'Insignia Coral',
      unit: 'Pcs',
      costPrice: 32000,
      retailPrice: 42000,
      wholesalePrice: 38000,
      minStockAlert: 8,
      stock: { [shopId]: 0 },
      description: 'Gloss oil enamel for grill gates, window frames, metal doors and timber skirting.',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: `prod-${Date.now()}-11`,
      sku: 'PLM-PVC-110MM',
      barcode: '6001002011',
      name: 'Bomba la PVC Underground Drainage 110mm x 6m',
      category: 'Plumbing & Pipes',
      brand: 'Simba Pipes / Astral',
      unit: 'Pcs',
      costPrice: 28000,
      retailPrice: 36000,
      wholesalePrice: 33000,
      minStockAlert: 15,
      stock: { [shopId]: 0 },
      description: 'Class 41 heavy duty underground wastewater drainage pipe with rubber socket joint.',
      image: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: `prod-${Date.now()}-12`,
      sku: 'PLM-PPR-25MM',
      barcode: '6001002012',
      name: 'Bomba la PPR Hot & Cold Water 25mm (4m)',
      category: 'Plumbing & Pipes',
      brand: 'DuraPPR',
      unit: 'Pcs',
      costPrice: 9500,
      retailPrice: 13500,
      wholesalePrice: 12000,
      minStockAlert: 20,
      stock: { [shopId]: 0 },
      description: 'PN20 high pressure fusion thermal plumbing pipe for clean domestic potable water systems.',
      image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: `prod-${Date.now()}-13`,
      sku: 'ELE-CBL-2.5-T&E',
      barcode: '6001002013',
      name: 'Waya wa Shaba Copper Cable 2.5mm² Twin & Earth (100m Roll)',
      category: 'Electrical & Lighting',
      brand: 'East African Cables Tanzania',
      unit: 'Roll',
      costPrice: 180000,
      retailPrice: 225000,
      wholesalePrice: 210000,
      minStockAlert: 5,
      stock: { [shopId]: 0 },
      description: 'TBS certified 100% pure copper multi-strand domestic and commercial power cable.',
      image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: `prod-${Date.now()}-14`,
      sku: 'TOL-NAIL-3IN-50K',
      barcode: '6001002014',
      name: 'Misumari Wire Nails 3-Inch (50kg Gunny Bag)',
      category: 'Tools & Fasteners',
      brand: 'Tanzania Nails',
      unit: 'Bag',
      costPrice: 115000,
      retailPrice: 145000,
      wholesalePrice: 135000,
      minStockAlert: 5,
      stock: { [shopId]: 0 },
      description: 'Heavy duty round steel wire timber framing nails 3 inch.',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: `prod-${Date.now()}-15`,
      sku: 'TOL-WHL-BRW-HD',
      barcode: '6001002015',
      name: 'Toroli Contractor Heavy Duty Wheelbarrow',
      category: 'Tools & Fasteners',
      brand: 'Total / Ingco',
      unit: 'Pcs',
      costPrice: 95000,
      retailPrice: 130000,
      wholesalePrice: 118000,
      minStockAlert: 5,
      stock: { [shopId]: 0 },
      description: 'Heavy gauge pressed seamless steel tray with solid puncture-proof rubber wheel for construction concrete moving.',
      image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=400&q=80'
    }
  ];
}

// Database Helper
class JsonDB {
  constructor(filepath) {
    this.filepath = filepath;
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(this.filepath)) {
        const raw = fs.readFileSync(this.filepath, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = getCleanProductionData();
        this.save();
      }
    } catch (e) {
      console.error('Error loading DB, initializing clean production database:', e);
      this.data = getCleanProductionData();
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist DB to disk:', e);
    }
  }

  get(collection) {
    return this.data[collection] || [];
  }

  set(collection, items) {
    this.data[collection] = items;
    this.save();
  }

  resetClean() {
    this.data = getCleanProductionData();
    this.save();
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

// Load Starter Hardware Catalog (Convenience option)
app.post('/api/products/load-starter', (req, res) => {
  const shops = db.get('shops');
  const primaryShopId = shops[0]?.id || 'shop-main';
  const starter = getStarterProducts(primaryShopId);
  db.set('products', starter);
  res.json({ success: true, count: starter.length, products: starter });
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
  customer.currentDebt = Math.max(0, customer.currentDebt - payAmt);

  const sales = db.get('sales');
  const debtPaymentRecord = {
    id: `RCT-DEBT-${Date.now()}`,
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
    createdAt: new Date().toISOString()
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

  const invNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
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
    createdAt: new Date().toISOString()
  };

  sales.unshift(newSale);

  db.set('products', products);
  db.set('customers', customers);
  db.set('sales', sales);

  res.status(201).json(newSale);
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
  const { username, pin } = req.body;
  const users = db.get('users');
  const user = users.find(u => (u.username === username || u.pin === pin) && u.active);

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or PIN' });
  }

  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    assignedShopId: user.assignedShopId,
    phone: user.phone
  });
});

app.post('/api/users', (req, res) => {
  const users = db.get('users');
  const newUser = {
    id: `usr-${Date.now()}`,
    username: req.body.username,
    name: req.body.name,
    role: req.body.role || 'cashier',
    pin: req.body.pin || '1234',
    assignedShopId: req.body.assignedShopId || 'all',
    phone: req.body.phone || '',
    active: true
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
  res.json(current);
});

app.post('/api/settings', (req, res) => {
  db.data.settings = { ...db.data.settings, ...req.body };
  if (!db.data.settings.currencySymbol || db.data.settings.currencySymbol === 'KSh' || db.data.settings.currencySymbol === 'Ksh' || db.data.settings.currencySymbol === 'TSh') {
    db.data.settings.currencySymbol = 'Tsh';
    db.data.settings.currency = 'TZS';
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
