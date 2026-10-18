import React, { useRef } from 'react';
import { Printer, Download, CheckCircle, X, Store, Calendar, User, Phone, FileText } from 'lucide-react';

export default function ReceiptModal({ sale, settings, onClose }) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          #thermal-receipt-print-area,
          #thermal-receipt-print-area * {
            visibility: visible !important;
          }
          #thermal-receipt-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 2mm !important;
            border: 1px solid #000 !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 print:max-w-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Header Bar */}
        <div className="bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">Sale Completed Successfully</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content Container (Formatted for 80mm thermal printers) */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div 
            id="thermal-receipt-print-area" 
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm font-mono text-xs text-slate-800 max-w-[340px] mx-auto leading-relaxed"
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <div className="mb-2 flex justify-center">
                <div className="inline-block bg-[#082825] p-1.5 rounded-xl border border-slate-700/80">
                  <img 
                    src={settings?.logo || '/logo.png'} 
                    alt={settings?.businessName || 'Logo'} 
                    className="max-h-10 max-w-[120px] object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              </div>
              <h2 className="font-black text-sm text-slate-950 uppercase tracking-wider">{settings?.receiptHeader || settings?.businessName || 'JENGA KWANZA HARDWARE & STORES'}</h2>
              <p className="text-[11px] text-slate-600 font-bold">{sale.shopName || settings?.businessName}</p>
              <p className="text-[10px] text-slate-700 font-semibold">{settings?.address || 'P.O.BOX 14991 ARUSHA'}</p>
              <p className="text-[10px] text-slate-700 font-bold">Tel: {settings?.phone || '0788989889 / 0713550104'}</p>
              <p className="text-[10px] text-slate-600">Email: {settings?.email || 'jengakwanzaltd@gmail.com'}</p>
              {(settings?.traTin || settings?.kraPin) && <p className="text-[10px] text-slate-600 font-semibold">TIN: {settings.traTin || settings.kraPin}</p>}
            </div>

            {/* Invoice Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-bold text-slate-900">{sale.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{new Date(sale.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier:</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[170px]">{sale.customerName || 'Walk-in Customer'}</span>
              </div>
              {sale.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span>{sale.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-[10px] uppercase text-slate-600 pb-1.5 border-b border-slate-200">
                <span className="w-1/2">Item</span>
                <span className="w-1/4 text-center">Qty x Price</span>
                <span className="w-1/4 text-right">Total</span>
              </div>
              <div className="divide-y divide-slate-100">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between text-[11px] items-start">
                    <div className="w-1/2 pr-1">
                      <div className="font-medium text-slate-900 leading-snug">{item.name}</div>
                      <div className="text-[9px] text-slate-500">{item.sku} • {item.unit} {item.priceType === 'wholesale' ? '(Wholesale)' : ''}</div>
                    </div>
                    <div className="w-1/4 text-center text-[10px] text-slate-600 whitespace-nowrap">
                      {item.quantity} x {Number(item.unitPrice).toLocaleString()}
                    </div>
                    <div className="w-1/4 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {settings.currencySymbol} {Number(item.total).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Payments */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{settings.currencySymbol} {Number(sale.subtotal).toLocaleString()}</span>
              </div>
              {sale.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span>- {settings.currencySymbol} {Number(sale.discountTotal).toLocaleString()}</span>
                </div>
              )}
              {sale.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>VAT ({sale.taxRate}%):</span>
                  <span>{settings.currencySymbol} {Number(sale.taxAmount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-slate-950 pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>{settings.currencySymbol} {Number(sale.grandTotal).toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1 bg-slate-50/50 p-2 rounded">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-bold uppercase text-slate-900">{sale.paymentMethod}</span>
              </div>

              {sale.paymentMethod === 'cash' && sale.paymentDetails?.cashTendered && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cash Tendered:</span>
                    <span>{settings.currencySymbol} {Number(sale.paymentDetails.cashTendered).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Change:</span>
                    <span>{settings.currencySymbol} {Number(sale.paymentDetails.change || 0).toLocaleString()}</span>
                  </div>
                </>
              )}

              {sale.paymentMethod === 'mpesa' && (
                <>
                  {sale.paymentDetails?.mpesaRef && (
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>M-Pesa Ref:</span>
                      <span>{sale.paymentDetails.mpesaRef}</span>
                    </div>
                  )}
                  {sale.paymentDetails?.mpesaPhone && (
                    <div className="flex justify-between text-slate-600">
                      <span>M-Pesa Phone:</span>
                      <span>{sale.paymentDetails.mpesaPhone}</span>
                    </div>
                  )}
                </>
              )}

              {sale.paymentMethod === 'credit' && (
                <div className="text-amber-800 text-[10px] font-semibold bg-amber-50 p-1 rounded">
                  ⚠️ Billed on Customer Credit Account.
                </div>
              )}

              {sale.paymentMethod === 'split' && sale.paymentDetails && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Cash Portion:</span>
                    <span>{settings.currencySymbol} {Number(sale.paymentDetails.splitCash || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>M-Pesa Portion ({sale.paymentDetails.splitMpesaRef || 'Ref'}):</span>
                    <span>{settings.currencySymbol} {Number(sale.paymentDetails.splitMpesa || 0).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer Message */}
            <div className="text-center pt-3 text-[10px] text-slate-500 space-y-1">
              <p className="font-medium text-slate-700">{settings?.receiptFooter || 'Asante kwa kujenga nasi!'}</p>
              <p className="text-[9px] text-slate-600 font-semibold">📍 {settings?.address || 'P.O.BOX 14991 ARUSHA'} | 📞 {settings?.phone || '0788989889 / 0713550104'}</p>
              <p className="text-[9px] text-slate-400">Powered by Jenga Kwanza Business Management</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-white flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
          >
            New Sale / Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-amber-500/20 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt (80mm)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
