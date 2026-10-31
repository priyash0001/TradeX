'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Send, Clock, CheckCircle, Package, Award, FileText } from 'lucide-react';
import RfqChatBox from '@/components/RfqChatBox';
import QuotationComparisonModal from '@/components/QuotationComparisonModal';
import PurchaseOrderModal from '@/components/PurchaseOrderModal';
import { useAuth } from '@/context/AuthContext';

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

interface RFQ {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  unit: string;
  deadline: string | null;
  status: string;
  createdAt: string;
  buyer: { id: string; name: string; companyName: string | null; email: string; mobile: string };
  supplier: { id: string; city: string; user: { id: string; name: string; companyName: string | null; role: string; email?: string } };
  quotations: Quotation[];
}

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return map[s] || 'bg-slate-100 text-slate-700';
};

export default function RFQDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState('');

  // Modals
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [activePoQuotation, setActivePoQuotation] = useState<Quotation | null>(null);

  // Supplier quotation form
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  // Session from AuthContext (already populated server-side, no extra fetch needed)
  const { user: currentUser } = useAuth();

  const fetchRFQ = () => {
    fetch(`/api/rfqs/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setRfq(data.rfq);
      })
      .catch(() => setError('Failed to load RFQ'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (id) fetchRFQ(); }, [id]);

  const acceptQuotation = async (quotationId: string) => {
    setAccepting(quotationId);
    await fetch(`/api/rfqs/${id}/quotations/${quotationId}/accept`, { method: 'POST' });
    fetchRFQ();
    setAccepting('');
    setIsCompareOpen(false);
  };

  const submitQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingQuote(true);
    try {
      const res = await fetch(`/api/rfqs/${id}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricePerUnit, deliveryDays, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuoteSuccess(true);
      fetchRFQ();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingQuote(false);
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto py-8 px-4 animate-pulse"><div className="h-60 bg-slate-200 rounded-xl" /></div>;
  if (error || !rfq) return <div className="max-w-4xl mx-auto py-8 px-4 text-red-600">{error || 'RFQ not found'}</div>;

  const isBuyer = currentUser?.role === 'BUYER';
  const acceptedQuote = rfq.quotations.find((q) => q.status === 'ACCEPTED');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-600 hover:text-sky-600 font-medium">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      {/* RFQ Header */}
      <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusBadge(rfq.status)}`}>
                {rfq.status.replace('_', ' ')}
              </span>
              {acceptedQuote && (
                <button
                  onClick={() => setActivePoQuotation(acceptedQuote)}
                  className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                >
                  <FileText className="w-3.5 h-3.5" /> View Purchase Order ({acceptedQuote.poNumber || 'PO Issued'})
                </button>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-sky-600" /> {rfq.productName}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Qty: <strong>{rfq.quantity} {rfq.unit}</strong>
              {rfq.deadline && ` · Deadline: ${new Date(rfq.deadline).toLocaleDateString('en-IN')}`}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>{new Date(rfq.createdAt).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {rfq.description && (
          <div className="bg-slate-50/80 rounded-xl p-4 mb-4 border border-slate-100">
            <p className="text-sm text-slate-700">{rfq.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">Buyer</p>
            <p className="font-semibold text-slate-900">{rfq.buyer.companyName || rfq.buyer.name}</p>
            <p className="text-xs text-slate-600">{rfq.buyer.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">Supplier / Vendor</p>
            <p className="font-semibold text-slate-900">{rfq.supplier.user.companyName || rfq.supplier.user.name}</p>
            <p className="text-xs text-slate-600">{rfq.supplier.city}</p>
          </div>
        </div>
      </div>

      {/* Quotations */}
      <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Quotations {rfq.quotations.length > 0 && `(${rfq.quotations.length})`}
          </h2>
          {rfq.quotations.length > 0 && (
            <button
              onClick={() => setIsCompareOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs rounded-xl border border-sky-200 transition shadow-sm"
            >
              <Award className="w-4 h-4 text-sky-600" /> Compare Quotations Matrix
            </button>
          )}
        </div>

        {rfq.quotations.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            No quotations received yet. Waiting for supplier response...
          </div>
        )}

        {rfq.quotations.length > 0 && (
          <div className="space-y-4">
            {rfq.quotations.map((q) => (
              <div
                key={q.id}
                className={`border rounded-xl p-5 ${
                  q.status === 'ACCEPTED'
                    ? 'border-emerald-300 bg-emerald-50/90 shadow-sm'
                    : q.status === 'REJECTED'
                    ? 'border-slate-200 bg-slate-50/70 opacity-60'
                    : 'border-slate-200/80 bg-white/75 backdrop-blur-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-900">{q.supplier.companyName || q.supplier.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        q.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800'
                          : q.status === 'REJECTED' ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {q.status}
                      </span>
                      {q.status === 'ACCEPTED' && (
                        <button
                          onClick={() => setActivePoQuotation(q)}
                          className="text-xs text-sky-700 font-bold underline hover:text-sky-800"
                        >
                          View Official PO
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-sky-700">₹{q.pricePerUnit.toLocaleString('en-IN')}/{rfq.unit}</p>
                    <p className="text-xs text-slate-500">Total: ₹{q.totalPrice.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="flex gap-4 text-sm text-slate-700 mb-2">
                  <span>🚚 Delivery: <strong>{q.deliveryDays} days</strong></span>
                </div>

                {q.notes && <p className="text-sm text-slate-600 bg-slate-100/80 rounded-lg px-3 py-2">{q.notes}</p>}

                {isBuyer && rfq.status !== 'COMPLETED' && q.status === 'PENDING' && (
                  <button
                    onClick={() => acceptQuotation(q.id)}
                    disabled={accepting === q.id}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {accepting === q.id ? 'Accepting...' : 'Accept This Quotation & Issue PO'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supplier Submit Quotation Form */}
      {!isBuyer && rfq.status !== 'COMPLETED' && rfq.quotations.filter(q => q.status === 'PENDING').length === 0 && (
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-sky-600" /> Submit Your Quotation
          </h2>

          {quoteSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm mb-4">
              ✓ Quotation submitted! The buyer has been notified.
            </div>
          )}

          <form onSubmit={submitQuotation} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price per {rfq.unit} (₹) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  placeholder="e.g. 12.50"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                {pricePerUnit && (
                  <p className="text-xs text-slate-500 mt-1">
                    Total: ₹{(parseFloat(pricePerUnit) * rfq.quantity).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Days *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  placeholder="e.g. 7"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes & Terms</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention payment terms, taxes, packaging, delivery details..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submittingQuote}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submittingQuote ? 'Submitting...' : 'Submit Quotation'}
            </button>
          </form>
        </div>
      )}

      {/* RFQ Direct Clarification & Chat Box */}
      {currentUser && (
        <RfqChatBox
          rfqId={rfq.id}
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
          userRole={currentUser.role}
        />
      )}

      {/* Comparison Modal */}
      <QuotationComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        quotations={rfq.quotations}
        productName={rfq.productName}
        quantity={rfq.quantity}
        unit={rfq.unit}
        onAccept={acceptQuotation}
        acceptingId={accepting}
        isBuyer={isBuyer}
      />

      {/* Purchase Order Modal */}
      {activePoQuotation && (
        <PurchaseOrderModal
          isOpen={!!activePoQuotation}
          onClose={() => setActivePoQuotation(null)}
          rfq={rfq}
          quotation={activePoQuotation}
        />
      )}
    </div>
  );
}
