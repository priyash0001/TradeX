'use client';

import { X, Printer, Download, CheckCircle, Building2, Package, ShieldCheck } from 'lucide-react';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfq: {
    id: string;
    productName: string;
    description: string;
    quantity: number;
    unit: string;
    createdAt: string;
    buyer: { name: string; companyName: string | null; email: string; mobile: string };
    supplier: { city: string; user: { name: string; companyName: string | null; email?: string } };
  };
  quotation: {
    id: string;
    pricePerUnit: number;
    totalPrice: number;
    deliveryDays: number;
    notes: string;
    poNumber?: string | null;
    createdAt: string;
  };
}

export default function PurchaseOrderModal({ isOpen, onClose, rfq, quotation }: PurchaseOrderModalProps) {
  if (!isOpen) return null;

  const poNumber = quotation.poNumber || `PO-${new Date().getFullYear()}-${quotation.id.slice(0, 6).toUpperCase()}`;
  const issueDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const deliveryEstimated = new Date(Date.now() + quotation.deliveryDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2 text-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold">Official Purchase Order</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable PO Sheet */}
        <div className="p-8 overflow-y-auto flex-1 space-y-6 text-slate-900 text-sm print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-300 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-black text-sm">
                  TX
                </div>
                <h1 className="text-2xl font-black text-sky-950 tracking-tight">TradeX B2B</h1>
              </div>
              <p className="text-xs text-slate-500">Maharashtra Industrial B2B Marketplace</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs uppercase mb-1">
                Purchase Order
              </span>
              <p className="font-mono text-base font-extrabold text-slate-900">{poNumber}</p>
              <p className="text-xs text-slate-500">Date: {issueDate}</p>
            </div>
          </div>

          {/* Parties: Buyer & Supplier */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200 print:bg-transparent">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Issued By (Buyer)</p>
              <p className="font-bold text-slate-900">{rfq.buyer.companyName || rfq.buyer.name}</p>
              <p className="text-xs text-slate-600">{rfq.buyer.email}</p>
              <p className="text-xs text-slate-600">Mobile: {rfq.buyer.mobile}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Vendor / Supplier</p>
              <p className="font-bold text-slate-900">{rfq.supplier.user.companyName || rfq.supplier.user.name}</p>
              <p className="text-xs text-slate-600">Location: {rfq.supplier.city}, Maharashtra</p>
              {rfq.supplier.user.email && <p className="text-xs text-slate-600">{rfq.supplier.user.email}</p>}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Unit Price (₹)</th>
                  <th className="p-3 text-right">Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 text-slate-400 font-mono">01</td>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{rfq.productName}</p>
                    {rfq.description && <p className="text-slate-500 text-[11px] mt-0.5">{rfq.description}</p>}
                  </td>
                  <td className="p-3 text-right font-medium">{rfq.quantity} {rfq.unit}</td>
                  <td className="p-3 text-right font-medium">₹{quotation.pricePerUnit.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-bold text-slate-900">₹{quotation.totalPrice.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50/80 border-t border-slate-200 font-bold">
                <tr>
                  <td colSpan={4} className="p-3 text-right text-slate-600">Grand Total:</td>
                  <td className="p-3 text-right text-base text-sky-800 font-extrabold">
                    ₹{quotation.totalPrice.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Delivery & Terms */}
          <div className="grid grid-cols-2 gap-6 pt-2 text-xs">
            <div>
              <p className="font-bold text-slate-900 mb-1">Estimated Delivery Schedule:</p>
              <p className="text-slate-600">Within {quotation.deliveryDays} business days (~{deliveryEstimated})</p>
              {quotation.notes && (
                <div className="mt-3">
                  <p className="font-bold text-slate-900 mb-0.5">Supplier Quoted Terms:</p>
                  <p className="text-slate-600 italic">"{quotation.notes}"</p>
                </div>
              )}
            </div>
            <div className="text-right flex flex-col justify-end">
              <div className="border-t border-slate-300 pt-2 w-48 ml-auto">
                <p className="font-bold text-slate-900 text-xs">Authorized Signatory</p>
                <p className="text-[11px] text-slate-400">TradeX Verified Electronic PO</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
