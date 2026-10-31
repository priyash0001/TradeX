import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — TradeX B2B Marketplace',
  description: 'Terms and Conditions for TradeX Indian Local B2B Industrial Marketplace.',
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800 transition">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to TradeX
      </Link>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-10 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Terms of Service</h1>
            <p className="text-xs text-slate-500 mt-0.5">Effective Date: September 2026</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Platform Scope</h2>
            <p>
              TradeX serves as a digital B2B marketplace platform connecting buyers, manufacturers, vendors, and distributors. TradeX facilitates inquiries, quotations, and purchase orders.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. User Accounts &amp; Verification</h2>
            <p>
              Users must provide accurate company and contact information during registration. Verified badges are awarded to suppliers verified via MIDC industrial records, GST validation, or TradeX administrative review.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. RFQs and Quotations</h2>
            <p>
              Buyers are responsible for specifying accurate technical specifications in RFQs. Quotations submitted by suppliers represent commercial estimates subject to the mutually agreed delivery terms and notes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Limitation of Liability</h2>
            <p>
              TradeX provides business discovery and negotiation tools in good faith. Commercial fulfillment, quality testing, and delivery execution remain between the transacting parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">5. Modifications</h2>
            <p>
              TradeX reserves the right to update these terms as features evolve. Continued use of the platform constitutes agreement to the current terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
