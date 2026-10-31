import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, Store, ShoppingBag, ArrowRight, ShieldCheck, Search, FileText } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto py-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold uppercase tracking-wider mb-6">
          Maharashtra MIDC Expansion Active • B2B Marketplace Platform
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Connect with Maharashtra <span className="text-sky-600">manufacturers &amp; suppliers</span> faster.
        </h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          TradeX is the B2B marketplace engineered for Indian industrial hubs across Pune, Mumbai, Chhatrapati Sambhajinagar, Nagpur, Kolhapur, Nashik and beyond to search products, compare verified MIDC suppliers, and exchange RFQs seamlessly.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-base shadow-md transition"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Role Selection Showcase */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

        {/* Buyer card */}
        <div className="role-card">
          <div className="w-12 h-12 bg-blue-400/20 rounded-lg flex items-center justify-center text-blue-300 mb-4 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">For Buyers</h3>
          <p className="text-sm text-slate-300 mt-2 flex-1">
            Small business owners, contractors, and retailers searching for local product sourcing and competitive RFQs.
          </p>
          <Link
            href="/register?role=BUYER"
            className="inline-block mt-4 text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors"
          >
            Register as Buyer →
          </Link>
        </div>

        {/* Manufacturer card */}
        <div className="role-card">
          <div className="w-12 h-12 bg-amber-400/20 rounded-lg flex items-center justify-center text-amber-300 mb-4 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">For Manufacturers</h3>
          <p className="text-sm text-slate-300 mt-2 flex-1">
            Local producers &amp; factories seeking digital visibility, direct buyer enquiries, and high-volume B2B lead generation.
          </p>
          <Link
            href="/register?role=MANUFACTURER"
            className="inline-block mt-4 text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors"
          >
            Register as Manufacturer →
          </Link>
        </div>

        {/* Vendor card */}
        <div className="role-card">
          <div className="w-12 h-12 bg-emerald-400/20 rounded-lg flex items-center justify-center text-emerald-300 mb-4 shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">For Vendors</h3>
          <p className="text-sm text-slate-300 mt-2 flex-1">
            Regional distributors and traders looking to expand their buyer base and fulfill localized demand.
          </p>
          <Link
            href="/register?role=VENDOR"
            className="inline-block mt-4 text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors"
          >
            Register as Vendor →
          </Link>
        </div>

      </div>

      {/* Feature Workflow Highlights */}
      <div className="sourcing-engine-card mt-16 text-white rounded-2xl p-8 sm:p-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
          The TradeX Sourcing Engine
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-sky-500/30 rounded-full flex items-center justify-center text-sky-300 font-bold text-lg mb-3">
              1
            </div>
            <h4 className="font-semibold text-lg">Search &amp; Discover</h4>
            <p className="text-sky-200 text-sm mt-1">
              Find verified nearby manufacturers and vendors filtered by location, price, and MOQ.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-sky-500/30 rounded-full flex items-center justify-center text-sky-300 font-bold text-lg mb-3">
              2
            </div>
            <h4 className="font-semibold text-lg">Send RFQ</h4>
            <p className="text-sky-200 text-sm mt-1">
              Submit structured requirements directly to suppliers in one click.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-sky-500/30 rounded-full flex items-center justify-center text-sky-300 font-bold text-lg mb-3">
              3
            </div>
            <h4 className="font-semibold text-lg">Compare &amp; Connect</h4>
            <p className="text-sky-200 text-sm mt-1">
              Receive formal quotations, compare terms, and initiate local business deals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
