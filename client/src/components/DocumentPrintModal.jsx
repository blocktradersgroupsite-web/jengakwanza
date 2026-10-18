import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  FileText, 
  Truck, 
  Receipt, 
  Building, 
  Phone, 
  MapPin, 
  Mail, 
  Calendar, 
  User, 
  CheckSquare, 
  Square,
  CreditCard,
  CheckCircle2,
  SlidersHorizontal,
  Download,
  Info
} from 'lucide-react';

/**
 * Robust Number to Words Converter for Tanzanian Shillings / East African Commercial Documents
 */
function numberToWords(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '';
  const n = Math.floor(Math.abs(Number(amount)));
  if (n === 0) return 'ZERO TANZANIAN SHILLINGS ONLY';

  const units = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 
    'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
  ];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  
  function convertGroup(val) {
    let str = '';
    const h = Math.floor(val / 100);
    const t = val % 100;
    if (h > 0) {
      str += units[h] + ' HUNDRED';
      if (t > 0) str += ' AND ';
    }
    if (t > 0) {
      if (t < 20) {
        str += units[t];
      } else {
        const ten = Math.floor(t / 10);
        const unit = t % 10;
        str += tens[ten];
        if (unit > 0) str += '-' + units[unit];
      }
    }
    return str.trim();
  }

  let words = '';
  const billions = Math.floor(n / 1000000000);
  const millions = Math.floor((n % 1000000000) / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const remainder = n % 1000;

  if (billions > 0) words += convertGroup(billions) + ' BILLION ';
  if (millions > 0) words += convertGroup(millions) + ' MILLION ';
  if (thousands > 0) words += convertGroup(thousands) + ' THOUSAND ';
  if (remainder > 0) words += convertGroup(remainder) + ' ';

  return words.trim() + ' TANZANIAN SHILLINGS ONLY';
}

/**
 * Universal Document Print Modal for:
 * - Sales Order Receipt / Tax Invoice ('receipt')
 * - Proforma Invoice ('proforma')
 * - Delivery Note / Goods Dispatch Note ('delivery')
 * 
 * Supports printer formats:
 * - 'a4': Standard Office A4 Full-Page Laser/Inkjet (Edge-to-edge full paper layout)
 * - 'thermal80': 80mm Standard POS Thermal Roll
 * - 'thermal58': 58mm Mobile/Handheld Bluetooth Thermal Roll
 */
export default function DocumentPrintModal({
  isOpen,
  onClose,
  documentType = 'receipt', // 'receipt' | 'proforma' | 'delivery'
  documentData, // sale object | proforma object | delivery note object
  settings,
  defaultFormat = null
}) {
  if (!isOpen || !documentData) return null;

  // Selected printer format: 'a4' | 'thermal80' | 'thermal58'
  const [printerFormat, setPrinterFormat] = useState(
    defaultFormat || settings?.defaultPrinterType || 'a4'
  );

  const currencySymbol = settings?.currencySymbol || 'Tsh';
  const copyright = settings?.copyrightNotice || `© ${new Date().getFullYear()} ${settings?.businessName || 'JENGA KWANZA HARDWARE & STORES'}. Haki Zote Zimehifadhiwa / All Rights Reserved.`;

  // Standard Direct Print using browser print dialog with forced background graphics
  const handlePrint = () => {
    window.print();
  };

  // Helper to format currency
  const formatTsh = (val) => {
    return `${currencySymbol} ${Number(val || 0).toLocaleString()}`;
  };

  // Logo component
  const LogoBlock = ({ isSmall = false }) => {
    const logoSrc = settings?.logo || '/logo.png';
    return (
      <div className={`inline-block overflow-hidden rounded-xl border border-slate-800 bg-[#082825] p-2 shadow-xs ${
        isSmall ? 'max-w-[130px]' : 'max-w-[220px]'
      }`}>
        <img 
          src={logoSrc} 
          alt={settings?.businessName || 'Jenga Kwanza Logo'} 
          className={`object-contain mx-auto ${isSmall ? 'max-h-10 max-w-[120px]' : 'max-h-14 max-w-[180px]'}`} 
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  };

  const totalQuantity = (documentData.items || []).reduce((acc, i) => acc + Number(i.quantity || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      
      {/* High-Precision Print Stylesheet: Enforces layout design, borders, backgrounds and graphics on physical paper */}
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            width: 100% !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-document-container,
          #printable-document-container * {
            visibility: visible !important;
          }
          #printable-document-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: ${printerFormat === 'a4' ? '100%' : printerFormat === 'thermal80' ? '80mm' : '58mm'} !important;
            margin: 0 auto !important;
            padding: ${printerFormat === 'a4' ? '4mm 6mm' : '1.5mm'} !important;
            box-shadow: none !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: ${printerFormat === 'a4' ? 'A4 portrait' : printerFormat === 'thermal80' ? '80mm auto' : '58mm auto'};
            margin: ${printerFormat === 'a4' ? '6mm' : '1.5mm'};
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none print:overflow-visible print:w-full print:block">
        
        {/* Top Control Bar (Hidden on actual print) */}
        <div className="bg-slate-900 px-4 py-3 sm:px-6 text-white flex flex-wrap items-center justify-between gap-3 no-print border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              {documentType === 'receipt' && <Receipt className="w-5 h-5" />}
              {documentType === 'proforma' && <FileText className="w-5 h-5" />}
              {documentType === 'delivery' && <Truck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-wide text-white">
                {documentType === 'receipt' && 'Official Cash Receipt / Tax Invoice'}
                {documentType === 'proforma' && 'Proforma Invoice / Quotation'}
                {documentType === 'delivery' && 'Delivery Note / Goods Dispatch'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Document Ref: <span className="font-mono text-amber-400 font-bold">{documentData.id || documentData.deliveryNumber || documentData.proformaNumber}</span>
              </p>
            </div>
          </div>

          {/* Printer Format Switcher */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setPrinterFormat('a4')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                printerFormat === 'a4' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
              title="A4 Office Laser / Inkjet Printer"
            >
              <span>📄 A4 Paper Design</span>
            </button>
            <button
              onClick={() => setPrinterFormat('thermal80')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                printerFormat === 'thermal80' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
              title="80mm Thermal Receipt Printer"
            >
              <span>🧾 80mm Thermal</span>
            </button>
            <button
              onClick={() => setPrinterFormat('thermal58')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                printerFormat === 'thermal58' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
              title="58mm Mobile / Portable POS Printer"
            >
              <span>📱 58mm Mobile</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center space-x-2 transition cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative Tip Banner */}
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 text-[11px] text-amber-900 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              <strong>Paper Print Guarantee:</strong> Ensure <em>"Background graphics"</em> is enabled in your browser print window so all high-contrast lines, borders, and official layout blocks print sharply on paper.
            </span>
          </div>
          <span className="font-bold text-amber-800 uppercase text-[10px]">Print Preview Ready</span>
        </div>

        {/* Scrollable Preview Area */}
        <div className="p-4 sm:p-6 bg-slate-200/80 flex-1 overflow-y-auto flex justify-center print:p-0 print:bg-white print:overflow-visible print:w-full print:block">
          
          <div 
            id="printable-document-container"
            className={`bg-white text-slate-900 transition-all ${
              printerFormat === 'a4' 
                ? 'w-full max-w-[860px] p-6 sm:p-8 border-2 border-slate-900 shadow-xl rounded-xl print:max-w-none print:w-full print:border-2 print:border-slate-900 print:rounded-none print:shadow-none print:p-4' 
                : printerFormat === 'thermal80'
                ? 'w-[320px] max-w-[80mm] p-4 font-mono text-xs border-2 border-dashed border-slate-800 shadow-md rounded-xl print:max-w-[80mm] print:w-full print:border-dashed print:border-slate-800 print:rounded-none print:shadow-none print:p-1'
                : 'w-[230px] max-w-[58mm] p-2.5 font-mono text-[10px] border-2 border-dashed border-slate-800 shadow-md rounded-xl print:max-w-[58mm] print:w-full print:border-dashed print:border-slate-800 print:rounded-none print:shadow-none print:p-1'
            }`}
          >

            {/* ============================================================== */}
            {/* FORMAT 1: A4 FULL-PAGE OFFICIAL CORPORATE DOCUMENT             */}
            {/* ============================================================== */}
            {printerFormat === 'a4' && (
              <div className="space-y-5 w-full">
                
                {/* A4 Header: Company Info + Document Title & Meta */}
                <div className="flex justify-between items-start pb-5 border-b-2 border-slate-900 gap-6">
                  <div className="flex items-start space-x-4 flex-1">
                    <LogoBlock isSmall={false} />
                    <div className="flex-1">
                      <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
                        {settings?.businessName || 'JENGA KWANZA HARDWARE & STORES'}
                      </h1>
                      {settings?.tagline && (
                        <p className="text-xs text-amber-700 font-bold uppercase tracking-wider mt-0.5">{settings.tagline}</p>
                      )}
                      <div className="text-xs text-slate-700 space-y-0.5 mt-2 font-medium">
                        <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {settings?.address || 'P.O.BOX 14991 ARUSHA'}</p>
                        <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> Tel: <strong>{settings?.phone || '0788989889 / 0713550104'}</strong></p>
                        <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> Email: {settings?.email || 'jengakwanzaltd@gmail.com'}</p>
                        {settings?.traTin && <p className="font-extrabold text-slate-900">TRA TIN / VRN: {settings.traTin}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right min-w-[260px]">
                    <div className="inline-block bg-slate-900 text-white font-black px-4 py-2 rounded-lg text-sm uppercase tracking-wider mb-2 border border-slate-900 shadow-xs">
                      {documentType === 'receipt' && 'TAX INVOICE / CASH SALE RECEIPT'}
                      {documentType === 'proforma' && 'PROFORMA INVOICE / QUOTATION'}
                      {documentType === 'delivery' && 'GOODS DELIVERY NOTE'}
                    </div>
                    <div className="text-xs text-slate-800 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-300">
                      <p className="flex justify-between"><span className="text-slate-500 font-medium">Doc Number:</span> <strong className="font-mono text-slate-950 text-sm font-black">{documentData.id || documentData.deliveryNumber || documentData.proformaNumber}</strong></p>
                      <p className="flex justify-between"><span className="text-slate-500 font-medium">Date & Time:</span> <strong>{new Date(documentData.createdAt || documentData.dispatchDate || Date.now()).toLocaleString('en-GB')}</strong></p>
                      {documentType === 'delivery' && documentData.orderRef && (
                        <p className="flex justify-between"><span className="text-slate-500 font-medium">Order Ref:</span> <span className="font-mono font-black text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-300">{documentData.orderRef}</span></p>
                      )}
                      {documentType === 'proforma' && documentData.validUntil && (
                        <p className="flex justify-between"><span className="text-slate-500 font-medium">Valid Until:</span> <strong className="text-emerald-800 font-black">{documentData.validUntil}</strong></p>
                      )}
                      <p className="flex justify-between"><span className="text-slate-500 font-medium">Branch:</span> <strong>{documentData.shopName || settings?.businessName}</strong></p>
                      <p className="flex justify-between"><span className="text-slate-500 font-medium">Issued By:</span> <strong>{documentData.cashierName || documentData.creatorName || documentData.dispatcherName || 'Authorized Officer'}</strong></p>
                      {documentType === 'receipt' && (
                        <div className="pt-1 border-t border-slate-200 flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Payment Status:</span>
                          <span className="bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded text-[10px] uppercase border border-emerald-300">
                            ✓ PAID IN FULL
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* A4 Customer & Transaction Details Cards (Full Width) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
                  <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-800 shadow-xs">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2 pb-1.5 border-b border-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-700" />
                        Billed To / Customer Details
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">Mteja</span>
                    </h3>
                    <p className="font-black text-sm text-slate-950">{documentData.customerName || 'Walk-in Cash Customer'}</p>
                    {documentData.customerPhone && <p className="text-xs text-slate-700 font-semibold mt-1">Phone: <strong>{documentData.customerPhone}</strong></p>}
                    {documentData.customerAddress && <p className="text-xs text-slate-700 mt-0.5">Address / Site: {documentData.customerAddress}</p>}
                    {documentData.customerTin && <p className="text-xs text-slate-800 font-bold mt-0.5">Customer TIN: {documentData.customerTin}</p>}
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Customer Type: <span className="font-semibold text-slate-700">{documentData.customerId ? 'Registered Client' : 'Cash Retail Customer'}</span></p>
                  </div>

                  {documentType === 'delivery' ? (
                    <div className="bg-amber-50/70 p-4 rounded-xl border-2 border-amber-800 shadow-xs">
                      <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 mb-2 pb-1.5 border-b border-amber-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-amber-800" />
                          Logistics & Dispatch Information
                        </span>
                        <span className="text-[10px] font-bold text-amber-700">Usafirishaji</span>
                      </h3>
                      <div className="text-xs text-slate-900 space-y-1">
                        <p><span className="text-slate-600 font-medium">Destination / Site:</span> <strong>{documentData.deliveryAddress || 'On-Site Delivery'}</strong></p>
                        <p><span className="text-slate-600 font-medium">Transporter / Driver:</span> <strong>{documentData.driverName || 'Designated Driver'}</strong> {documentData.driverPhone ? `(${documentData.driverPhone})` : ''}</p>
                        <p><span className="text-slate-600 font-medium">Vehicle Reg No:</span> <strong className="font-mono bg-white px-2 py-0.5 rounded border-2 border-amber-800 font-black">{documentData.vehicleReg || 'Not specified'}</strong></p>
                        <p><span className="text-slate-600 font-medium">Dispatch Date:</span> <strong>{documentData.dispatchDate || new Date().toISOString().split('T')[0]}</strong></p>
                      </div>
                    </div>
                  ) : documentType === 'receipt' ? (
                    <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-800 shadow-xs">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2 pb-1.5 border-b border-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-slate-700" />
                          Payment & Transaction Mode
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">Njia ya Malipo</span>
                      </h3>
                      <div className="text-xs text-slate-900 space-y-1">
                        <p className="flex justify-between">
                          <span className="text-slate-600 font-medium">Payment Method:</span>
                          <strong className="font-black uppercase text-slate-950 bg-white px-2 py-0.5 rounded border border-slate-300">{documentData.paymentMethod || 'CASH'}</strong>
                        </p>
                        {documentData.paymentDetails?.cashTendered && (
                          <p className="flex justify-between">
                            <span className="text-slate-600 font-medium">Cash Tendered:</span>
                            <strong className="font-mono">{formatTsh(documentData.paymentDetails.cashTendered)}</strong>
                          </p>
                        )}
                        {documentData.paymentDetails?.change > 0 && (
                          <p className="flex justify-between text-emerald-800 font-bold">
                            <span>Change Returned:</span>
                            <strong className="font-mono">{formatTsh(documentData.paymentDetails.change)}</strong>
                          </p>
                        )}
                        {documentData.paymentDetails?.mpesaRef && (
                          <p className="flex justify-between">
                            <span className="text-slate-600 font-medium">M-Pesa Reference:</span>
                            <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 font-black">{documentData.paymentDetails.mpesaRef}</strong>
                          </p>
                        )}
                        {documentData.paymentDetails?.mpesaPhone && (
                          <p className="flex justify-between">
                            <span className="text-slate-600 font-medium">M-Pesa Phone:</span>
                            <strong>{documentData.paymentDetails.mpesaPhone}</strong>
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                          Transaction Ref: <span className="font-mono font-bold text-slate-700">{documentData.id}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-800 shadow-xs">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2 pb-1.5 border-b border-slate-300 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-slate-700" />
                        Official Payment / Bank Details
                      </h3>
                      <div className="text-xs text-slate-900 space-y-1">
                        <p><span className="text-slate-600 font-medium">Bank Name:</span> <strong>{settings?.bankName || 'CRDB Bank / NMB Bank'}</strong></p>
                        <p><span className="text-slate-600 font-medium">Account No:</span> <strong className="font-mono text-slate-950 font-black text-sm bg-white px-1.5 py-0.5 rounded border border-slate-300">{settings?.bankAccount || '0150293810293'}</strong></p>
                        <p><span className="text-slate-600 font-medium">A/C Name:</span> <strong>{settings?.bankAccountName || settings?.businessName}</strong></p>
                        <p><span className="text-slate-600 font-medium">Lipa Namba:</span> <strong className="font-mono text-amber-800 font-black bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">{settings?.lipaNamba || '5566778'}</strong></p>
                      </div>
                    </div>
                  )}
                </div>

                {/* A4 Items Table: Full Grid Borders for High Contrast on Paper */}
                <div className="border-2 border-slate-900 rounded-xl overflow-x-auto shadow-xs w-full">
                  <table className="w-full min-w-[540px] md:min-w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-extrabold uppercase text-[11px] tracking-wider border-b-2 border-slate-900">
                        <th className="py-3 px-3 w-12 text-center border-r border-slate-700">#</th>
                        {documentType === 'delivery' && <th className="py-3 px-2 w-14 text-center border-r border-slate-700">Check</th>}
                        <th className="py-3 px-3.5 border-r border-slate-700">Item Description & Specifications</th>
                        <th className="py-3 px-3 text-center w-24 border-r border-slate-700">Unit</th>
                        <th className="py-3 px-3 text-center w-20 border-r border-slate-700">Qty</th>
                        {documentType !== 'delivery' && (
                          <>
                            <th className="py-3 px-3 text-right w-32 border-r border-slate-700">Unit Price ({currencySymbol})</th>
                            <th className="py-3 px-3 text-right w-36">Total Amount ({currencySymbol})</th>
                          </>
                        )}
                        {documentType === 'delivery' && (
                          <th className="py-3 px-3 w-40">Condition / Remarks</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {(documentData.items || []).map((item, index) => (
                        <tr key={index} className={`border-b border-slate-300 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}`}>
                          <td className="py-3 px-3 text-center text-slate-600 font-mono font-bold border-r border-slate-300">{index + 1}</td>
                          {documentType === 'delivery' && (
                            <td className="py-3 px-2 text-center border-r border-slate-300">
                              <Square className="w-4 h-4 text-slate-800 inline-block" />
                            </td>
                          )}
                          <td className="py-3 px-3.5 border-r border-slate-300">
                            <span className="font-extrabold text-slate-950 text-sm block leading-snug">{item.name}</span>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-600 font-mono">
                              {item.sku && <span>SKU: {item.sku}</span>}
                              {item.priceType === 'wholesale' && (
                                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded border border-amber-300 font-sans">
                                  Wholesale
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-800 font-bold border-r border-slate-300">{item.unit || 'Pcs'}</td>
                          <td className="py-3 px-3 text-center font-black text-slate-950 text-sm border-r border-slate-300">{item.quantity}</td>
                          {documentType !== 'delivery' && (
                            <>
                              <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 border-r border-slate-300 text-sm">
                                {Number(item.unitPrice || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-black text-slate-950 text-sm">
                                {Number(item.total || ((item.unitPrice || 0) * (item.quantity || 1))).toLocaleString()}
                              </td>
                            </>
                          )}
                          {documentType === 'delivery' && (
                            <td className="py-3 px-3 text-slate-700 text-xs font-medium">
                              {item.notes || 'Received in Good Condition'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* A4 Full-Width Totals & Word Breakdown Section */}
                {documentType !== 'delivery' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 w-full">
                    {/* Left: Amount in Words & Official Verification (7 cols on desktop) */}
                    <div className="md:col-span-7 col-span-1 bg-slate-50 p-4 rounded-xl border-2 border-slate-800 flex flex-col justify-between space-y-3 shadow-xs">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                          Amount in Words / Kiasi kwa Maneno:
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-300 font-black text-xs text-slate-900 uppercase leading-relaxed tracking-wide shadow-2xs">
                          {numberToWords(documentData.grandTotal)}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between items-center text-slate-700">
                          <span className="font-medium">Total Quantity of Items:</span>
                          <strong className="font-mono text-slate-950">{totalQuantity} Units</strong>
                        </div>
                        <div className="flex justify-between items-center text-slate-700">
                          <span className="font-medium">Total Line Items:</span>
                          <strong className="font-mono text-slate-950">{(documentData.items || []).length} Product(s)</strong>
                        </div>
                        <p className="text-[10px] text-slate-500 pt-1">
                          Official computer-generated fiscal invoice. Valid without physical stamp when barcode/reference is verified.
                        </p>
                      </div>
                    </div>

                    {/* Right: Detailed Totals Box (5 cols on desktop) */}
                    <div className="md:col-span-5 col-span-1 bg-slate-50 p-4 rounded-xl border-2 border-slate-900 space-y-2 text-xs shadow-xs">
                      <div className="flex justify-between text-slate-700 font-semibold">
                        <span>Subtotal Amount:</span>
                        <span className="font-mono text-sm">{formatTsh(documentData.subtotal)}</span>
                      </div>
                      {documentData.discountTotal > 0 && (
                        <div className="flex justify-between text-emerald-800 font-bold">
                          <span>Discount Deducted:</span>
                          <span className="font-mono text-sm">- {formatTsh(documentData.discountTotal)}</span>
                        </div>
                      )}
                      {documentData.taxAmount > 0 && (
                        <div className="flex justify-between text-slate-700 font-semibold">
                          <span>VAT Tax ({documentData.taxRate || settings?.taxRate || 18}%):</span>
                          <span className="font-mono text-sm">{formatTsh(documentData.taxAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-baseline text-base font-black text-slate-950 pt-2 border-t-2 border-slate-900 bg-amber-500/10 p-2 rounded-lg border border-amber-500/30">
                        <span className="uppercase tracking-tight text-xs">GRAND TOTAL:</span>
                        <span className="font-mono text-lg font-black text-slate-950">{formatTsh(documentData.grandTotal)}</span>
                      </div>

                      {documentType === 'receipt' && documentData.paymentMethod && (
                        <div className="pt-2 border-t border-slate-300 text-[11px] space-y-1">
                          <div className="flex justify-between text-slate-800">
                            <span className="font-medium">Paid via:</span>
                            <span className="font-black uppercase text-slate-950">{documentData.paymentMethod}</span>
                          </div>
                          {documentData.paymentDetails?.cashTendered && (
                            <div className="flex justify-between text-slate-700">
                              <span>Cash Tendered:</span>
                              <span className="font-mono font-bold">{formatTsh(documentData.paymentDetails.cashTendered)}</span>
                            </div>
                          )}
                          {documentData.paymentDetails?.change > 0 && (
                            <div className="flex justify-between text-emerald-800 font-black">
                              <span>Change Returned:</span>
                              <span className="font-mono">{formatTsh(documentData.paymentDetails.change)}</span>
                            </div>
                          )}
                          {documentData.paymentDetails?.mpesaRef && (
                            <div className="flex justify-between text-slate-900 font-bold">
                              <span>M-Pesa Reference:</span>
                              <span className="font-mono bg-white px-1 border border-slate-300 rounded">{documentData.paymentDetails.mpesaRef}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Terms and Policies Box (Full Width) */}
                <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-800 text-xs text-slate-800 leading-relaxed shadow-xs w-full">
                  <h4 className="font-black text-slate-950 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                    <span>📋 Terms & Commercial Conditions / Masharti ya Mauzo:</span>
                  </h4>
                  {documentType === 'delivery' && (
                    <p className="whitespace-pre-line font-medium text-[11px]">{settings?.deliveryTerms || '1. Mpokeaji lazima ahakikishe idadi na ubora wa vifaa kabla ya kusaini hati hii.\n2. Malalamiko kuhusu uharibifu lazima yawasilishwe mara moja kwa msafirishaji.\n3. Sahihi ya mpokeaji inathibitisha mzigo kupokelewa ukiwa kamili na katika hali nzuri.'}</p>
                  )}
                  {documentType === 'proforma' && (
                    <p className="whitespace-pre-line font-medium text-[11px]">{settings?.proformaTerms || '1. Bei zilizotajwa zina uhalali wa siku 14 kuanzia tarehe ya hati hii.\n2. Malipo yote yafanyike kupitia akaunti au Lipa Namba za benki zilizo hapo juu.\n3. Bidhaa zitatolewa baada ya malipo kuthibitishwa kikamilifu.'}</p>
                  )}
                  {documentType === 'receipt' && (
                    <p className="font-medium text-[11px]">{settings?.receiptFooter || 'Asante sana kwa kufanya biashara nasi! Bidhaa zilizouzwa katika hali nzuri haziwezi kurudishwa baada ya siku 7. Tafadhali tunza risiti hii halisi kwa ajili ya madai yoyote au udhamini.'}</p>
                  )}
                </div>

                {/* A4 Signatures & Official Stamp Blocks (Full Width) */}
                {documentType === 'delivery' ? (
                  <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-900 w-full">
                    <div className="border-t-2 border-slate-900 pt-2 text-center text-xs">
                      <p className="font-black text-slate-950">Storekeeper / Prepared By</p>
                      <p className="text-[10px] text-slate-600 font-medium">Sign & Stamp</p>
                      <div className="h-10"></div>
                      <p className="text-[10px] text-slate-500 font-mono">Date: ____/____/2026</p>
                    </div>
                    <div className="border-t-2 border-slate-900 pt-2 text-center text-xs">
                      <p className="font-black text-slate-950">Transporter / Driver</p>
                      <p className="text-[10px] text-slate-600 font-medium">Sign & National ID No</p>
                      <div className="h-10"></div>
                      <p className="text-[10px] text-slate-500 font-mono">Date: ____/____/2026</p>
                    </div>
                    <div className="border-t-2 border-slate-900 pt-2 text-center text-xs">
                      <p className="font-black text-slate-950">Customer / Received By</p>
                      <p className="text-[10px] text-slate-600 font-medium">Sign & Official Stamp</p>
                      <div className="h-10"></div>
                      <p className="text-[10px] text-slate-500 font-mono">Date: ____/____/2026</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-900 items-end w-full">
                    <div className="text-center text-xs">
                      <div className="border-t-2 border-slate-900 pt-2">
                        <p className="font-black text-slate-950">Prepared By (Cashier)</p>
                        <p className="text-[11px] text-slate-700 font-bold">{documentData.cashierName || 'Cashier'}</p>
                        <div className="h-8"></div>
                        <p className="text-[10px] text-slate-500 font-mono">Signature: __________________</p>
                      </div>
                    </div>
                    
                    <div className="text-center text-xs">
                      <div className="border-t-2 border-slate-900 pt-2">
                        <p className="font-black text-slate-950">Customer / Mpokeaji</p>
                        <p className="text-[11px] text-slate-700 font-bold">{documentData.customerName || 'Customer'}</p>
                        <div className="h-8"></div>
                        <p className="text-[10px] text-slate-500 font-mono">Signature: __________________</p>
                      </div>
                    </div>

                    <div className="text-center text-xs">
                      <div className="border-2 border-dashed border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center bg-slate-50 min-h-[90px]">
                        <p className="font-black text-[11px] text-slate-900 uppercase">Official Company Seal</p>
                        <p className="text-[9px] text-slate-500 mt-1">Gonga Muhuri Hapa / Stamp Here</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* A4 Legal Copyright Footer (Full Width) */}
                <div className="pt-4 border-t-2 border-slate-900 text-center text-xs text-slate-700 space-y-1 w-full">
                  <p className="font-bold text-slate-900">
                    📍 {settings?.address || 'P.O.BOX 14991 ARUSHA'} • 📞 Tel: {settings?.phone || '0788989889 / 0713550104'} • ✉️ Email: {settings?.email || 'jengakwanzaltd@gmail.com'}
                  </p>
                  <p className="font-extrabold text-slate-950">{copyright}</p>
                  <p className="text-[10px] text-slate-500">
                    Electronic Commercial Document • System Ref: {documentData.id || documentData.deliveryNumber || documentData.proformaNumber} • Printed via Jenga Kwanza Enterprise ERP & POS
                  </p>
                </div>

              </div>
            )}

            {/* ============================================================== */}
            {/* FORMAT 2 & 3: 80mm & 58mm THERMAL RECEIPT ROLL FORMATS        */}
            {/* ============================================================== */}
            {(printerFormat === 'thermal80' || printerFormat === 'thermal58') && (
              <div className="space-y-3 leading-relaxed text-slate-900 w-full">
                
                {/* Store Branding Header */}
                <div className="text-center pb-2 border-b-2 border-dashed border-slate-800">
                  <div className="mb-1 flex justify-center">
                    <LogoBlock isSmall={true} />
                  </div>
                  <h2 className="font-black text-xs uppercase tracking-tight text-slate-950">
                    {settings?.receiptHeader || settings?.businessName || 'JENGA KWANZA HARDWARE & STORES'}
                  </h2>
                  <p className="text-[10px] text-slate-700 font-bold">{settings?.address || 'P.O.BOX 14991 ARUSHA'}</p>
                  <p className="text-[9px] text-slate-700 font-semibold">Tel: {settings?.phone || '0788989889 / 0713550104'}</p>
                  <p className="text-[9px] text-slate-600">Email: {settings?.email || 'jengakwanzaltd@gmail.com'}</p>
                  {settings?.traTin && <p className="text-[9px] text-slate-900 font-black">TIN: {settings.traTin}</p>}
                  
                  <div className="mt-1.5 inline-block bg-slate-900 text-white font-black px-2.5 py-0.5 rounded text-[10px] uppercase">
                    {documentType === 'receipt' && 'CASH SALE RECEIPT'}
                    {documentType === 'proforma' && 'PROFORMA INVOICE'}
                    {documentType === 'delivery' && 'DELIVERY NOTE'}
                  </div>
                </div>

                {/* Metadata */}
                <div className="py-1 border-b border-dashed border-slate-700 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Doc No:</span>
                    <span className="font-mono font-black text-slate-950">{documentData.id || documentData.deliveryNumber || documentData.proformaNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Date:</span>
                    <span>{new Date(documentData.createdAt || Date.now()).toLocaleString()}</span>
                  </div>
                  {documentType === 'delivery' && documentData.orderRef && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Order Ref:</span>
                      <span className="font-bold text-amber-900">{documentData.orderRef}</span>
                    </div>
                  )}
                  {documentType === 'delivery' && documentData.vehicleReg && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Vehicle:</span>
                      <span className="font-bold font-mono">{documentData.vehicleReg}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Staff:</span>
                    <span>{documentData.cashierName || documentData.creatorName || documentData.dispatcherName || 'Cashier'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Customer:</span>
                    <span className="font-bold text-slate-950 truncate max-w-[150px]">{documentData.customerName || 'Walk-in'}</span>
                  </div>
                  {documentData.customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Phone:</span>
                      <span>{documentData.customerPhone}</span>
                    </div>
                  )}
                </div>

                {/* Items List (Full Width Edge-to-Edge with Quantity x Unit Price) */}
                <div className="py-1 border-b-2 border-dashed border-slate-800">
                  <div className="flex justify-between font-bold text-[9px] uppercase text-slate-900 pb-1 border-b border-slate-800">
                    <span>Item & Description</span>
                    <span>Total</span>
                  </div>
                  <div className="divide-y divide-slate-200 text-[10px]">
                    {(documentData.items || []).map((item, idx) => (
                      <div key={idx} className="py-1.5 space-y-0.5">
                        <div className="font-bold text-slate-950 leading-tight">
                          {idx + 1}. {item.name}
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-600">
                          <span>
                            {item.quantity} {item.unit || 'pcs'} @ {Number(item.unitPrice || 0).toLocaleString()}
                          </span>
                          {documentType !== 'delivery' ? (
                            <span className="font-mono font-bold text-slate-950 text-[10px]">
                              {formatTsh(item.total || ((item.unitPrice || 0) * (item.quantity || 1)))}
                            </span>
                          ) : (
                            <span className="inline-block border border-slate-800 w-3 h-3 rounded-xs"></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Totals */}
                {documentType !== 'delivery' && (
                  <div className="py-1.5 border-b-2 border-dashed border-slate-800 space-y-0.5 text-[10px]">
                    <div className="flex justify-between text-slate-700">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatTsh(documentData.subtotal)}</span>
                    </div>
                    {documentData.discountTotal > 0 && (
                      <div className="flex justify-between text-emerald-800 font-bold">
                        <span>Discount:</span>
                        <span className="font-mono">- {formatTsh(documentData.discountTotal)}</span>
                      </div>
                    )}
                    {documentData.taxAmount > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>VAT ({documentData.taxRate || 18}%):</span>
                        <span className="font-mono">{formatTsh(documentData.taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-xs text-slate-950 pt-1 border-t-2 border-slate-900">
                      <span>TOTAL:</span>
                      <span className="font-mono text-amber-900 font-black">{formatTsh(documentData.grandTotal)}</span>
                    </div>

                    {/* Amount in words for thermal */}
                    <div className="pt-1 text-[8px] font-bold uppercase text-slate-700 border-t border-dashed border-slate-400">
                      Words: {numberToWords(documentData.grandTotal)}
                    </div>

                    {documentType === 'receipt' && documentData.paymentMethod && (
                      <div className="pt-1 text-[9px] text-slate-700 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Paid Mode:</span>
                          <span className="font-bold uppercase text-slate-900">{documentData.paymentMethod}</span>
                        </div>
                        {documentData.paymentDetails?.mpesaRef && (
                          <div className="flex justify-between">
                            <span>M-Pesa Ref:</span>
                            <span className="font-mono font-bold">{documentData.paymentDetails.mpesaRef}</span>
                          </div>
                        )}
                        {documentData.paymentDetails?.cashTendered && (
                          <div className="flex justify-between">
                            <span>Tendered:</span>
                            <span>{formatTsh(documentData.paymentDetails.cashTendered)}</span>
                          </div>
                        )}
                        {documentData.paymentDetails?.change > 0 && (
                          <div className="flex justify-between text-emerald-800 font-bold">
                            <span>Change:</span>
                            <span>{formatTsh(documentData.paymentDetails.change)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {documentType === 'proforma' && (
                      <div className="pt-1 text-[9px] text-slate-800 border-t border-dashed border-slate-400 space-y-0.5">
                        <p className="font-bold">Lipa Namba: {settings?.lipaNamba || '5566778'}</p>
                        <p>Bank: {settings?.bankName} ({settings?.bankAccount})</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Signatures for Thermal Delivery Note */}
                {documentType === 'delivery' && (
                  <div className="py-2 border-b-2 border-dashed border-slate-800 text-[9px] space-y-2.5">
                    <div>
                      <p className="text-slate-700 font-bold">Mpokeaji / Receiver Sign:</p>
                      <div className="border-b-2 border-slate-800 h-5"></div>
                    </div>
                    <div>
                      <p className="text-slate-700 font-bold">Dereva / Driver Sign:</p>
                      <div className="border-b-2 border-slate-800 h-5"></div>
                    </div>
                  </div>
                )}

                {/* Footer and Copyright Notice */}
                <div className="text-center pt-2 text-[9px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-900">
                    {documentType === 'delivery' 
                      ? (settings?.deliveryTerms || 'Hati halisi ya makabidhiano ya bidhaa.') 
                      : (settings?.receiptFooter || 'Asante kwa kujenga nasi!')}
                  </p>
                  <p className="text-[8px] text-slate-700 font-medium">
                    📍 {settings?.address || 'P.O.BOX 14991 ARUSHA'}
                  </p>
                  <p className="text-[8px] text-slate-700 font-semibold">
                    📞 {settings?.phone || '0788989889 / 0713550104'} | ✉️ {settings?.email || 'jengakwanzaltd@gmail.com'}
                  </p>
                  <p className="font-bold text-[8px] text-slate-800">{copyright}</p>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Modal Bottom Bar (Hidden when printing) */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex justify-between items-center no-print">
          <p className="text-xs text-slate-600">
            Selected Layout: <strong className="uppercase text-slate-900">{printerFormat === 'a4' ? 'A4 Paper Layout (Laser / Inkjet)' : `${printerFormat.replace('thermal', '')}mm Thermal Roll`}</strong>
          </p>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print to Paper</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
