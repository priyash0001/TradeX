import Link from 'next/link';
import { ArrowLeft, Search, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-12 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-700 font-extrabold text-2xl flex items-center justify-center mx-auto shadow-sm">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Page Not Found</h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
            The industrial page, RFQ, or supplier profile you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-semibold transition"
          >
            <Search className="w-4 h-4" /> Search Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
