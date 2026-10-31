import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — TradeX B2B Marketplace',
  description: 'Privacy Policy for TradeX Indian Local B2B Industrial Marketplace.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800 transition">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to TradeX
      </Link>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-10 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Privacy Policy</h1>
            <p className="text-xs text-slate-500 mt-0.5">Last updated: September 2026</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
            <p>
              TradeX collects information essential for B2B transactions, including company names, GST numbers, contact person names, email addresses, phone numbers, factory/office addresses, industrial capabilities, and procurement inquiries (RFQs and Quotations).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. How We Use Information</h2>
            <p>
              We use collected information to facilitate buyer-supplier discovery across Maharashtra industrial corridors, manage RFQs, deliver verified supplier information, enable quotation comparisons, and issue purchase orders.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Data Security &amp; Protection</h2>
            <p>
              TradeX stores user passwords using cryptographic bcrypt hashing and secures authentication sessions with HTTP-only tokens. We do not sell or monetize personal or proprietary trade data to third-party marketers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Third-Party Integrations</h2>
            <p>
              Our location search and directory mapping features utilize the Google Places API in accordance with Google Maps Platform terms of service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">5. Contact Information</h2>
            <p>
              For privacy inquiries or account data requests, contact our compliance team at <span className="font-semibold text-slate-900">support@tradex.local</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
