-- =========================================================================
-- JENGA KWANZA HARDWARE & STORES - COMPLETE SUPABASE CLOUD DATABASE SCHEMA
-- Copy and paste this script directly into your Supabase Dashboard:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. SHOPS / STORES BRANCHES TABLE
CREATE TABLE IF NOT EXISTS public.shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'hardware',
  location TEXT,
  phone TEXT,
  email TEXT,
  is_main BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PRODUCT CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'Folder'
);

-- 3. PRODUCTS & INVENTORY CATALOG
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT,
  barcode TEXT,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'General Hardware',
  brand TEXT DEFAULT 'General',
  unit TEXT DEFAULT 'Pcs',
  cost_price NUMERIC DEFAULT 0,
  retail_price NUMERIC DEFAULT 0,
  wholesale_price NUMERIC DEFAULT 0,
  min_stock_alert NUMERIC DEFAULT 10,
  stock JSONB DEFAULT '{"shop-main": 0}'::jsonb,
  description TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CUSTOMERS & CREDIT LEDGER
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  id_number TEXT,
  type TEXT DEFAULT 'retail',
  credit_limit NUMERIC DEFAULT 0,
  current_debt NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  categories JSONB DEFAULT '[]'::jsonb,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. POS SALES & INVOICES
CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY,
  shop_id TEXT DEFAULT 'shop-main',
  shop_name TEXT,
  cashier_id TEXT,
  cashier_name TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  discount_total NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_details JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. PROFORMA INVOICES & QUOTATIONS
CREATE TABLE IF NOT EXISTS public.proformas (
  id TEXT PRIMARY KEY,
  proforma_number TEXT NOT NULL,
  shop_id TEXT DEFAULT 'shop-main',
  shop_name TEXT,
  cashier_id TEXT,
  cashier_name TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_tin TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  discount_total NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  status TEXT DEFAULT 'issued',
  converted_sale_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. DELIVERY NOTES & DISPATCH MANIFESTS
CREATE TABLE IF NOT EXISTS public.delivery_notes (
  id TEXT PRIMARY KEY,
  delivery_number TEXT NOT NULL,
  order_ref TEXT,
  shop_id TEXT DEFAULT 'shop-main',
  shop_name TEXT,
  dispatcher_id TEXT,
  dispatcher_name TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_reg TEXT,
  dispatch_date DATE DEFAULT CURRENT_DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_quantity NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'dispatched',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  shop_id TEXT DEFAULT 'shop-main',
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. PURCHASES & PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS public.purchases (
  id TEXT PRIMARY KEY,
  po_number TEXT,
  shop_id TEXT DEFAULT 'shop-main',
  supplier_id TEXT,
  supplier_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'ordered',
  payment_status TEXT DEFAULT 'pending',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. STOCK ADJUSTMENT AUDIT LOG
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id TEXT PRIMARY KEY,
  shop_id TEXT DEFAULT 'shop-main',
  product_id TEXT NOT NULL,
  product_name TEXT,
  previous_qty NUMERIC DEFAULT 0,
  new_qty NUMERIC DEFAULT 0,
  difference NUMERIC DEFAULT 0,
  reason TEXT DEFAULT 'audit',
  notes TEXT,
  performed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. SYSTEM & STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

-- 13. USER PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier')),
  pin TEXT DEFAULT '0000',
  assigned_shop_id TEXT DEFAULT 'shop-main',
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- INITIAL SEED DATA (Creates default shop, categories, settings & walk-in customer)
-- =========================================================================

-- Seed Main Shop
INSERT INTO public.shops (id, name, type, location, phone, email, is_main, active)
VALUES ('shop-main', 'Main Hardware Store', 'hardware', 'Kariakoo Commercial District, Dar es Salaam', '+255 700 000 000', 'info@jengakwanza.co.tz', true, true)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Categories
INSERT INTO public.categories (id, name, icon) VALUES
  ('cat-cement', 'Cement & Aggregates', 'Box'),
  ('cat-steel', 'Steel & Rebar', 'Layers'),
  ('cat-roofing', 'Roofing & Timber', 'Home'),
  ('cat-paints', 'Paints & Finishes', 'Paintbrush'),
  ('cat-plumbing', 'Plumbing & Pipes', 'Droplets'),
  ('cat-electrical', 'Electrical & Lighting', 'Zap'),
  ('cat-tools', 'Tools & Fasteners', 'Wrench'),
  ('cat-masonry', 'Masonry & Tiling', 'Grid'),
  ('cat-sanitary', 'Sanitaryware & Tiles', 'Droplet'),
  ('cat-general', 'General Hardware', 'Folder')
ON CONFLICT (id) DO NOTHING;

-- Seed Default Walk-in Customer
INSERT INTO public.customers (id, name, phone, type, credit_limit, current_debt, notes)
VALUES ('cust-walkin', 'Walk-in Retail Cash Customer', '', 'retail', 0, 0, 'Default walk-in counter customer')
ON CONFLICT (id) DO NOTHING;

-- Seed Default Settings
INSERT INTO public.settings (id, data)
VALUES ('app-settings', '{
  "businessName": "JENGA KWANZA HARDWARE & STORES",
  "tagline": "Ubora wa Vifaa vya Ujenzi, Mabati, Saruji na Rangi",
  "currency": "TZS",
  "currencySymbol": "Tsh",
  "taxEnabled": false,
  "taxRate": 18,
  "traTin": "",
  "phone": "+255 700 000 000",
  "email": "info@jengakwanza.co.tz",
  "address": "Kariakoo Commercial District, Dar es Salaam",
  "receiptHeader": "JENGA KWANZA HARDWARE & STORES",
  "receiptFooter": "Asante kwa kujenga nasi! Bidhaa zilizonunuliwa zinaweza kubadilishwa ndani ya siku 7 zikiwa katika hali nzuri na risiti halisi.",
  "logo": "",
  "copyrightNotice": "© 2026 JENGA KWANZA HARDWARE & STORES. Haki Zote Zimehifadhiwa / All Rights Reserved.",
  "defaultPrinterType": "a4",
  "bankName": "CRDB Bank / NMB Bank",
  "bankAccount": "0150293810293",
  "bankAccountName": "JENGA KWANZA HARDWARE & STORES LTD",
  "lipaNamba": "5566778 (Vodacom / Tigo / Airtel)",
  "proformaTerms": "1. Bei zilizotajwa zina uhalali wa siku 14 kuanzia tarehe ya hati hii.\\n2. Malipo yote yafanyike kupitia akaunti au Lipa Namba za benki zilizo hapo juu.\\n3. Bidhaa zitatolewa baada ya malipo kuthibitishwa kikamilifu.",
  "deliveryTerms": "1. Mpokeaji lazima ahakikishe idadi na ubora wa vifaa kabla ya kusaini hati hii.\\n2. Malalamiko kuhusu uharibifu au upungufu lazima yawasilishwe papo hapo kwa msafirishaji.\\n3. Sahihi ya mpokeaji inathibitisha kupokea mzigo ukiwa katika hali nzuri na timilifu."
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Profiles
INSERT INTO public.profiles (id, username, name, role, pin, assigned_shop_id, phone, active) VALUES
  ('usr-admin', 'admin', 'Store Owner / Director', 'admin', '1234', 'all', '', true),
  ('usr-cashier', 'cashier', 'Cashier 1', 'cashier', '0000', 'shop-main', '', true),
  ('usr-manager', 'manager', 'Store Manager', 'manager', '5678', 'shop-main', '', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) on all tables with public access for authenticated & anon clients
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proformas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon/authenticated roles for ERP POS operations
CREATE POLICY "Allow all operations for anon" ON public.shops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON public.proformas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON public.delivery_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON public.purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON public.stock_adjustments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
