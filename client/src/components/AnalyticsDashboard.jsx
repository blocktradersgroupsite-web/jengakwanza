import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Users, 
  ArrowUpRight, 
  Printer, 
  Calendar,
  Layers,
  Percent,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function AnalyticsDashboard({
  analytics,
  sales,
  shops,
  currentShopId,
  currentShop,
  settings,
  onViewReceipt
}) {
  const [salesSearch, setSalesSearch] = useState('');

  if (!analytics) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold">Loading Financial Analytics...</p>
      </div>
    );
  }

  const {
    totalRevenue = 0,
    totalCOGS = 0,
    grossProfit = 0,
    totalExpenses = 0,
    netProfit = 0,
    totalInventoryValuation = 0,
    lowStockCount = 0,
    outOfStockCount = 0,
    totalReceivables = 0,
    totalPayables = 0,
    totalOrders = 0,
    paymentBreakdown = { cash: 0, mpesa: 0, credit: 0, card: 0 },
    topSelling = []
  } = analytics;

  const totalPayments = Object.values(paymentBreakdown).reduce((a, b) => a + Number(b), 0) || 1;

  // Filter sales list for active shop
  const filteredSales = sales.filter(s => {
    if (currentShopId !== 'all' && s.shopId !== currentShopId) return false;
    if (!salesSearch.trim()) return true;
    const q = salesSearch.toLowerCase();
    return s.id.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      (s.paymentDetails?.mpesaRef && s.paymentDetails.mpesaRef.toLowerCase().includes(q));
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="h-12 px-2.5 rounded-xl bg-[#082825] border border-slate-700/80 flex items-center justify-center shadow-xs">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-8 w-auto max-w-[110px] object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Executive Business Reports & Profit & Loss</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidated financial performance for {currentShopId === 'all' ? 'All Branches' : currentShop.name}.
            </p>
          </div>
        </div>

        <div className="text-xs bg-slate-100 font-bold text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Real-Time Financial Sync</span>
        </div>
      </div>

      {/* Main KPI Row: Revenue, Gross Profit, Expenses, Net Profit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800">
          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
            Total Sales Revenue
          </span>
          <div className="text-2xl font-black text-white mt-1">
            {settings.currencySymbol} {totalRevenue.toLocaleString()}
          </div>
          <div className="flex items-center space-x-1 text-slate-400 text-[11px] mt-1">
            <span>{totalOrders} invoices generated</span>
          </div>
        </div>

        {/* Cost of Goods Sold & Gross Profit */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
            Gross Trading Profit
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {settings.currencySymbol} {grossProfit.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Buying Cost (COGS): {settings.currencySymbol} {totalCOGS.toLocaleString()}
          </div>
        </div>

        {/* Total Store Expenses */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
            Store Expenses & Overheads
          </span>
          <div className="text-2xl font-black text-red-600 mt-1">
            {settings.currencySymbol} {totalExpenses.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Labor, transport, tea, utilities
          </div>
        </div>

        {/* Net Business Profit */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-2xl p-4 shadow-md shadow-amber-500/20">
          <span className="text-[10px] font-black uppercase text-slate-950/80 tracking-wider">
            Net Bottom-Line Profit
          </span>
          <div className="text-2xl font-black text-slate-950 mt-1">
            {settings.currencySymbol} {netProfit.toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-slate-950/80 mt-1">
            Margin: {totalRevenue ? Math.round((netProfit / totalRevenue) * 100) : 0}% of turnover
          </div>
        </div>
      </div>

      {/* Secondary Row: Inventory Valuation, Receivables, Payables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Stock Valuation */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Total Stock Asset Valuation (Cost)
            </span>
            <div className="text-xl font-black text-slate-900 mt-1">
              {settings.currencySymbol} {totalInventoryValuation.toLocaleString()}
            </div>
            <div className="text-[11px] font-semibold text-amber-700 mt-0.5">
              ⚠️ {lowStockCount} items at low reorder alert level
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Customer Receivables (Debts Owed to Us) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Customer Debts & Credit Receivables
            </span>
            <div className="text-xl font-black text-red-600 mt-1">
              {settings.currencySymbol} {totalReceivables.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Uncollected credit balances
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Supplier Payables (What We Owe) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Supplier Accounts Payables
            </span>
            <div className="text-xl font-black text-slate-800 mt-1">
              {settings.currencySymbol} {totalPayables.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Owed to cement mills & factories
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Middle Row: Payment Methods Breakdown & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span>Sales by Payment Method</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">100% Total Sales</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'M-Pesa / Mobile Money', val: paymentBreakdown.mpesa, color: 'bg-green-500', barColor: 'bg-green-500' },
              { label: 'Cash in Register', val: paymentBreakdown.cash, color: 'bg-emerald-600', barColor: 'bg-emerald-600' },
              { label: 'Customer Credit Sales', val: paymentBreakdown.credit, color: 'bg-amber-500', barColor: 'bg-amber-500' },
              { label: 'Bank Transfer / Cheque', val: paymentBreakdown.card + (paymentBreakdown.bank || 0), color: 'bg-blue-600', barColor: 'bg-blue-600' }
            ].map(m => {
              const pct = totalPayments ? Math.round((m.val / totalPayments) * 100) : 0;
              return (
                <div key={m.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{m.label}</span>
                    <span className="font-bold text-slate-900">
                      {settings.currencySymbol} {Number(m.val || 0).toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${m.barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Best Selling Items */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Top 5 Highest Revenue Products</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">By Sales Volume</span>
          </div>

          <div className="space-y-2.5">
            {topSelling.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No sales recorded yet.</p>
            ) : (
              topSelling.map((prod, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 truncate max-w-[200px]">{prod.name}</div>
                      <div className="text-[10px] text-slate-400">{prod.qty} units sold</div>
                    </div>
                  </div>
                  <div className="font-black text-slate-900">
                    {settings.currencySymbol} {Number(prod.revenue).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Sales Transactions & Receipts Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Recent Sales Invoices & Receipts Audit Trail
            </h3>
            <p className="text-xs text-slate-400">View details and reprint receipts for any sale</p>
          </div>

          <div className="w-64">
            <input
              type="text"
              value={salesSearch}
              onChange={(e) => setSalesSearch(e.target.value)}
              placeholder="Search Invoice #, Customer, Ref..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-2.5 px-3">Invoice No</th>
                <th className="py-2.5 px-3">Date & Branch</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Payment Mode</th>
                <th className="py-2.5 px-3">Cashier</th>
                <th className="py-2.5 px-3 text-right">Grand Total</th>
                <th className="py-2.5 px-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.slice(0, 15).map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{sale.id}</td>
                  <td className="py-2.5 px-3 text-slate-500">
                    <div>{new Date(sale.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">{sale.shopName}</div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{sale.customerName}</td>
                  <td className="py-2.5 px-3 uppercase font-bold text-[10px]">
                    <span className={`px-2 py-0.5 rounded ${
                      sale.paymentMethod === 'mpesa'
                        ? 'bg-green-100 text-green-800'
                        : sale.paymentMethod === 'cash'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sale.paymentMethod === 'credit'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {sale.paymentMethod} {sale.paymentDetails?.mpesaRef ? `(${sale.paymentDetails.mpesaRef})` : ''}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{sale.cashierName}</td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900">
                    {settings.currencySymbol} {Number(sale.grandTotal).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onViewReceipt(sale)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] inline-flex items-center space-x-1"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
