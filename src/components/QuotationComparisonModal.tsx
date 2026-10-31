'use client';

import { X, CheckCircle, Award, Zap, Building2, Calendar, FileText } from 'lucide-react';

interface Quotation {
  id: string;
  pricePerUnit: number;
  totalPrice: number;
  deliveryDays: number;
  notes: string;
  status: string;
  createdAt: string;
  poNumber?: string | null;
  supplier: { id: string; name: string; companyName: string | null };
}

interface QuotationComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotations: Quotation[];
  productName: string;
  quantity: number;
  unit: string;
  onAccept: (quotationId: string) => void;
  acceptingId?: string;
  isBuyer: boolean;
}

export default function QuotationComparisonModal({
  isOpen,
  onClose,
  quotations,
  productName,
  quantity,
  unit,
  onAccept,
  acceptingId,
  isBuyer,
}: QuotationComparisonModalProps) {
  if (!isOpen) return null;

  // Find best metrics
  const sortedByPrice = [...quotations].sort((a, b) => a.pricePerUnit - b.pricePerUnit);
  const sortedByTime = [...quotations].sort((a, b) => a.deliveryDays - b.deliveryDays);

  const lowestPriceId = sortedByPrice[0]?.id;
  const fastestDeliveryId = sortedByTime[0]?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-900">Quotation Comparison Matrix</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparing {quotations.length} quote{quotations.length === 1 ? '' : 's'} for <strong>{productName}</strong> ({quantity} {unit})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-x-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {quotations.map((q) => {
              const isLowestPrice = q.id === lowestPriceId;
              const isFastestDelivery = q.id === fastestDeliveryId;
              const isAccepted = q.status === 'ACCEPTED';

              return (
                <div
                  key={q.id}
                  className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                    isAccepted
                      ? 'border-emerald-400 bg-emerald-50/50 shadow-md ring-2 ring-emerald-400/30'
                      : isLowestPrice
                      ? 'border-sky-300 bg-sky-50/30 shadow-sm'
                      : 'border-slate-200 bg-white shadow-sm'
                  }`}
                >
                  <div>
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {isAccepted && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Accepted Quotation
                        </span>
                      )}
                      {isLowestPrice && !isAccepted && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Award className="w-3 h-3" /> Best Price
                        </span>
                      )}
                      {isFastestDelivery && !isAccepted && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Fastest Delivery
                        </span>
                      )}
                    </div>

                    {/* Supplier info */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          {q.supplier.companyName || q.supplier.name}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Quoted on {new Date(q.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs text-slate-500">Unit Price:</span>
                        <span className="text-lg font-extrabold text-sky-700">
                          ₹{q.pricePerUnit.toLocaleString('en-IN')} / {unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline pt-1 border-t border-slate-200/60">
                        <span className="text-xs font-medium text-slate-600">Total Amount:</span>
                        <span className="text-sm font-bold text-slate-900">
                          ₹{q.totalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Timeline & Notes */}
                    <div className="space-y-2 text-xs text-slate-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Lead Time: <strong className="text-slate-900">{q.deliveryDays} business days</strong></span>
                      </div>
                      {q.notes && (
                        <div className="flex items-start gap-2 pt-1">
                          <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <p className="text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100 line-clamp-3">
                            "{q.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {isBuyer && q.status === 'PENDING' && (
                    <button
                      onClick={() => onAccept(q.id)}
                      disabled={acceptingId === q.id}
                      className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50 shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {acceptingId === q.id ? 'Accepting...' : 'Accept & Issue PO'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
