'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Star, Building2, Store, Package, Send, Bookmark, Phone, Mail,
  ShieldCheck, ChevronLeft, MessageSquare, Award
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  minOrderQuantity: number;
  unit: string;
  indicativePrice: number | null;
  isAvailable: boolean;
  category: { name: string } | null;
}

interface Rating {
  id: string;
  score: number;
  comment: string;
  createdAt: string;
  buyer: { name: string; companyName: string | null };
}

interface Supplier {
  id: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string | null;
  established: number | null;
  employeeCount: string | null;
  machinery?: string | null;
  certifications?: string | null;
  isVerified: boolean;
  averageRating: number;
  totalRatings: number;
  latitude?: number | null;
  longitude?: number | null;
  user: {
    id: string; name: string; companyName: string | null; role: string;
    location: string | null; email: string; mobile: string; createdAt: string;
  };
  products: Product[];
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= score ? 'text-amber-400 fill-current' : 'text-slate-300'}`}
        />
      ))}
    </div>
  );
}

/**
 * Builds a Google Maps Directions URL for a given company.
 * Prefers lat/lng coordinates; falls back to a full address string.
 */
function buildGoogleMapsUrl(supplier: Supplier): string {
  if (
    supplier.latitude != null &&
    supplier.longitude != null &&
    Number.isFinite(supplier.latitude) &&
    Number.isFinite(supplier.longitude)
  ) {
    return `https://www.google.com/maps/dir/?api=1&destination=${supplier.latitude},${supplier.longitude}`;
  }
  const parts = [
    supplier.address,
    supplier.city,
    supplier.state,
    supplier.pincode,
  ].filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parts)}`;
}


export default function SupplierProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);

  // Rating state
  const [userScore, setUserScore] = useState(0);
  const [hoveredScore, setHoveredScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/suppliers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setSupplier(data.supplier);
        setRatings(data.ratings || []);
      })
      .catch(() => setError('Failed to load supplier profile'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSavingLoading(true);
    try {
      const res = await fetch('/api/saved-suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: id }),
      });
      const data = await res.json();
      setSaved(data.saved);
    } finally {
      setSavingLoading(false);
    }
  };

  const submitRating = async () => {
    if (!userScore) return;
    setSubmittingRating(true);
    try {
      await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: supplier?.user.id, score: userScore, comment: ratingComment }),
      });
      setRatingSuccess(true);
      setUserScore(0);
      setRatingComment('');
      // Refresh ratings
      const res = await fetch(`/api/suppliers/${id}`);
      const data = await res.json();
      setRatings(data.ratings || []);
      if (data.supplier) setSupplier(data.supplier);
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-40 bg-slate-200 rounded-2xl" />
        <div className="h-60 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600">{error || 'Supplier not found'}</p>
        <button onClick={() => router.back()} className="mt-4 text-sky-600 hover:underline text-sm">
          ← Go Back
        </button>
      </div>
    );
  }

  const isManufacturer = supplier.user.role === 'MANUFACTURER';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-600 hover:text-sky-600 transition">
        <ChevronLeft className="w-4 h-4" /> Back to Search
      </button>

      {/* Hero Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-sky-900/90 to-slate-800/90 backdrop-blur-md p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    isManufacturer ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                  }`}
                >
                  {isManufacturer ? <Building2 className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                  {isManufacturer ? 'Manufacturer' : 'Vendor'}
                </span>
                {supplier.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-200 text-sky-900">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {supplier.user.companyName || supplier.user.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-2 text-sky-200 text-sm">
                <MapPin className="w-4 h-4" />
                {supplier.city}, {supplier.state}
                {supplier.pincode && ` — ${supplier.pincode}`}
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleSave}
                disabled={savingLoading}
                className={`p-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition ${
                  saved ? 'bg-white/20' : ''
                }`}
              >
                <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
              </button>
              <a
                href={buildGoogleMapsUrl(supplier)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white font-medium rounded-xl text-sm transition"
              >
                <MapPin className="w-4 h-4" /> Location
              </a>
              <Link
                href={`/rfq/create?supplierId=${supplier.id}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl text-sm transition"
              >
                <Send className="w-4 h-4" /> Send RFQ
              </Link>
            </div>
          </div>

          {/* Rating Row */}
          <div className="mt-4 flex items-center gap-3">
            {supplier.averageRating > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(supplier.averageRating) ? 'text-amber-400 fill-current' : 'text-white/30'}`} />
                  ))}
                </div>
                <span className="text-white font-bold">{supplier.averageRating.toFixed(1)}</span>
                <span className="text-sky-300 text-sm">({supplier.totalRatings} reviews)</span>
              </>
            ) : (
              <span className="text-sky-300 text-sm">No reviews yet — be the first!</span>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">About</h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {supplier.description || 'No description provided.'}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Business Details</h3>
            <div className="space-y-1.5 text-sm text-slate-700">
              {supplier.established && <p>Est. {supplier.established}</p>}
              {supplier.employeeCount && <p>Employees: {supplier.employeeCount}</p>}
              {supplier.gstNumber && <p>GST: <strong className="text-slate-900">{supplier.gstNumber}</strong></p>}
              {supplier.address && <p>{supplier.address}</p>}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact</h3>
            <div className="space-y-2 text-sm">
              <a href={`mailto:${supplier.user.email}`} className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium">
                <Mail className="w-4 h-4" /> {supplier.user.email}
              </a>
              <a href={`tel:${supplier.user.mobile}`} className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium">
                <Phone className="w-4 h-4" /> {supplier.user.mobile}
              </a>
            </div>
          </div>
        </div>

        {/* Machinery & Certifications Row */}
        {(supplier.machinery || supplier.certifications) && (
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
            {supplier.machinery && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>⚙️ Plant Machinery &amp; Equipment</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {supplier.machinery.split(',').map((m, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold px-2.5 py-1 bg-white text-slate-800 rounded-lg border border-slate-200 shadow-sm"
                    >
                      {m.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {supplier.certifications && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>🛡️ Quality Certifications</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {supplier.certifications.split(',').map((c, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 shadow-sm"
                    >
                      {c.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Products */}
      {supplier.products.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-sky-600" /> Products & Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplier.products.map((product) => (
              <div key={product.id} className="border border-slate-200/80 bg-white/70 backdrop-blur-sm rounded-xl p-4 hover:border-sky-300 transition">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-slate-900 text-sm">{product.name}</h4>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${product.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {product.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                {product.category && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mb-2 inline-block">
                    {product.category.name}
                  </span>
                )}
                {product.description && (
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{product.description}</p>
                )}
                <div className="mt-3 text-xs space-y-0.5">
                  <div className="text-slate-700">
                    <span className="text-slate-500">MOQ: </span>
                    {product.minOrderQuantity} {product.unit}
                  </div>
                  {product.indicativePrice && (
                    <div className="text-sky-700 font-semibold">
                      Starting ₹{product.indicativePrice}/{product.unit}
                    </div>
                  )}
                </div>
                <Link
                  href={`/rfq/create?supplierId=${supplier.id}&product=${encodeURIComponent(product.name)}`}
                  className="mt-3 flex items-center justify-center gap-1 w-full text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white py-1.5 rounded-lg transition"
                >
                  <Send className="w-3.5 h-3.5" /> Request Quote
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ratings Section */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-sky-600" /> Ratings & Reviews
        </h2>

        {/* Submit Rating */}
        <div className="bg-slate-50/80 rounded-xl p-4 mb-6 border border-slate-200/80">
          <p className="text-sm font-semibold text-slate-700 mb-2">Rate this supplier</p>
          {ratingSuccess && (
            <p className="text-emerald-700 text-xs bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg mb-3">
              ✓ Your rating was submitted successfully!
            </p>
          )}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onMouseEnter={() => setHoveredScore(s)}
                onMouseLeave={() => setHoveredScore(0)}
                onClick={() => setUserScore(s)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-7 h-7 transition ${
                    s <= (hoveredScore || userScore)
                      ? 'text-amber-400 fill-current'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
            {userScore > 0 && (
              <span className="ml-2 text-sm font-semibold text-slate-700">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][userScore]}
              </span>
            )}
          </div>
          <textarea
            rows={2}
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            placeholder="Optional: share your experience with this supplier..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            onClick={submitRating}
            disabled={!userScore || submittingRating}
            className="mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
          >
            {submittingRating ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>

        {/* Ratings List */}
        {ratings.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {ratings.map((r) => (
              <div key={r.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">
                      {r.buyer.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {r.buyer.companyName || r.buyer.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <StarRating score={r.score} />
                </div>
                {r.comment && <p className="text-sm text-slate-700 ml-10">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
