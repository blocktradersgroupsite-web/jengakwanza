# Jenga Kwanza Enterprise ERP & POS System
### Multi-Branch Retail & Hardware Store Management Platform

**Jenga Kwanza** is a modern, high-speed, full-stack Business Management and Point of Sale (POS) system specifically built for hardware stores, building materials depots, electrical centers, and multiple retail branch operations.

---

## 🌟 Key Modules & Features

### 1. Point of Sale (POS) Terminal
- **Instant Checkout**: High-speed item search by Name, SKU, Brand, or Barcode scanner.
- **Hardware Units of Measure**: Native handling for Bags (cement), Bars/Pcs (steel rebar), Kgs (wire nails), Liters/Buckets (paint), Meters (timber, electrical cables, pipes), Rolls (binding wire), Sheets (iron roofing).
- **Dual Pricing Tiers**: Instant toggle between **Retail Price** and **Wholesale / Contractor Price** per item.
- **Park & Resume Orders**: Cashiers can hold/park customer carts and resume them later with 1 click.
- **Multi-Payment Modes**:
  - **Cash** (with automated change calculation and quick note buttons)
  - **M-Pesa / Mobile Money** (phone number and transaction reference code verification)
  - **Customer Credit ("Mali Kauli")** with real-time credit limit checking
  - **Split Payments** (part Cash, part M-Pesa)
  - **Bank / Cheque**
- **Thermal Receipt & Invoice Generation**:
  - Direct 80mm thermal receipt printing format with barcode, breakdown, KRA PIN, cashier name, and customizable exchange policy.

### 2. Multi-Shop & Multi-Branch Management
- Switch effortlessly between branches:
  - *Main Hub Hardware & Construction Materials*
  - *Branch 2 - Electricals & Lighting*
  - *Branch 3 - Paints & Plumbing Depot*
  - Or add unlimited custom shops / branches.
- Real-time stock visibility across all shops in a single consolidated screen.

### 3. Inventory & Stock Control
- Product catalog with SKU, Barcode, Brand, Category, Buying Cost, Retail Price, Wholesale Price, and Min Reorder Alert thresholds.
- **Stock Audit & Damage Adjustments**: Record damaged bags of cement, cut timber offcuts, and physical count discrepancies.

### 4. Inter-Branch Stock Transfers
- Request and dispatch transfers between shops (e.g. from Main Hub to Branch 3).
- Status tracking: `In Transit` ➔ `Received` (receiving manager confirmation automatically increments stock in destination branch).

### 5. Customer & Debtors Ledger ("Mali Kauli")
- Manage site contractors, masons, plumbers (fundis), and corporate clients.
- Credit limits, current debt ledger, and debt utilization percentages.
- **Debt Repayment Processing**: Receive debt payments via Cash or M-Pesa and issue official repayment receipts.

### 6. Procurement & Suppliers (Goods Received Notes - GRN)
- Supplier directory for cement mills, steel factories, paint manufacturers, and import distributors.
- Purchase Orders (POs) and receiving goods: Automatically adds received quantities into store inventory.
- Supplier Payables tracking (what you owe suppliers).

### 7. Daily Store Expenses & Petty Cash
- Log daily operational overheads: casual offloaders squad, delivery vehicle fuel, electricity tokens, staff lunch & tea, and county permits.

### 8. Executive Financial Reports & Analytics
- **Live KPIs**: Today's Sales, Cost of Goods Sold (COGS), Gross Profit, Store Expenses, and **Net Bottom-Line Profit**.
- Total inventory asset valuation calculated in real time.
- Payment method breakdown charts (Cash vs M-Pesa vs Credit vs Bank).
- Top 5 best-selling hardware products by revenue.

### 9. User Roles & PIN Security
- **Director / Admin**: Full company-wide access and reports.
- **Branch Manager**: Branch operations, discount authorization, and PO approvals.
- **Head Cashier**: Fast POS checkout and sales shift.
- **Storekeeper**: Receiving consignments and stock transfers.
- **Fast 4-digit PIN Pad**: Rapidly lock/unlock and switch cashiers at the counter.

### 10. System Backup & Disaster Recovery
- One-click **JSON Database Export**.
- One-click **Database Restore**.
- One-click **Demo Data Reset**.

---

## 🚀 How to Run the Application

The system is already running on your machine at:
👉 **[http://localhost:5000](http://localhost:5000)**

### Starting the server manually:
```bash
# In the project root directory:
npm start
```
The server will start on port `5000` and automatically serve the built client application and API.

### Developing or Modifying Frontend:
```bash
# Run Vite dev server with Hot Module Reload:
npm run dev
```

---

## 🔑 Default Staff PINs (for User Switching)
- **Admin / Owner**: `1234`
- **Head Cashier (Grace)**: `0000`
- **Branch Manager (Kevin)**: `5678`
- **Storekeeper (Sammy)**: `4321`

---

## 🛠️ Technology Stack
- **Backend**: Node.js, Express 5, Atomic JSON Database Engine with transaction persistence in `./data/database.json`.
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons.
- **Printing**: Native browser 80mm thermal receipt and A4 invoice printer stylesheets.
