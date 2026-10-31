'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, Filter, X, Send, Bookmark, Factory, ShieldCheck } from 'lucide-react';
import { INDIA_STATE_NAMES } from '@/lib/india-geography';

interface Product {
  id: string;
  name: string;
  minOrderQuantity: number;
  unit: string;
  indicativePrice: number | null;
  category: { name: string } | null;
}

interface Supplier {
  id: string;
  averageRating: number;
  totalRatings: number;
  isVerified: boolean;
  city: string;
  state: string;
  address?: string;
  user: { id: string; name: string; companyName: string | null; role: string; location: string | null };
  products: Product[];
  district?: string;
  midcArea?: string;
  industrialArea?: string;
  industrialAuthority?: string;
  plotAddress?: string;
  industry?: string;
  source?: string;
  verificationStatus?: string;
  businessType?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number | null;
}

const clientSearchCache = new Map<string, Supplier[]>();

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [midcArea, setMidcArea] = useState('');
  const [locationOptions, setLocationOptions] = useState<{
    cities: { city: string; state: string }[];
    industrialAreas: { name: string; city: string; state: string; authority?: string; district?: string }[];
  }>({ cities: [], industrialAreas: [] });
  const [industry, setIndustry] = useState('');
  const [capability, setCapability] = useState('');
  const [radiusKm, setRadiusKm] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Autocomplete (New) suggestions with debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/places/autocomplete?input=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : { suggestions: [] }))
        .then((d) => {
          setSuggestions(d.suggestions || []);
          setShowSuggestions(true);
        })
        .catch(() => {});
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (stateFilter) params.set('state', stateFilter);
    if (district) params.set('district', district);
    if (city) params.set('city', city);
    if (roleFilter) params.set('role', roleFilter);
    if (midcArea) params.set('midcArea', midcArea);
    if (industry) params.set('industry', industry);
    if (capability) params.set('capability', capability);
    if (radiusKm > 0) params.set('radiusKm', String(radiusKm));
    if (minRating > 0) params.set('minRating', String(minRating));

    const cacheKey = params.toString();
    const cached = clientSearchCache.get(cacheKey);

    if (cached) {
      setSuppliers(cached);
      setLoading(false);
      setError('');
    } else {
      setLoading(true);
      setError('');
    }

    const controller = new AbortController();

    fetch(`/api/suppliers/search?${cacheKey}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : { suppliers: [] }))
      .then((data) => {
        const results = data.suppliers || [];
        clientSearchCache.set(cacheKey, results);
        setSuppliers(results);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('Search failed. Please try again.');
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, stateFilter, district, city, roleFilter, midcArea, industry, capability, radiusKm, minRating]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (stateFilter) params.set('state', stateFilter);
    fetch(`/api/industrial/locations?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { cities: [], industrialAreas: [] }))
      .then((data) => {
        setLocationOptions({
          cities: data.cities || [],
          industrialAreas: data.industrialAreas || [],
        });
      })
      .catch(() => {});
  }, [stateFilter]);

  const toggleSave = async (supplierId: string) => {
    setSavingId(supplierId);
    try {
      await fetch('/api/saved-suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId }),
      });
      setSavedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(supplierId)) newSet.delete(supplierId);
        else newSet.add(supplierId);
        return newSet;
      });
    } finally {
      setSavingId('');
    }
  };

  const roleLabel = (role: string, businessType?: string) => {
    const type = (businessType || role || '').toUpperCase();
    if (type === 'DISTRIBUTOR') return { label: 'Distributor', cls: 'bg-purple-100 text-purple-800' };
    if (type === 'WHOLESALER') return { label: 'Wholesaler', cls: 'bg-cyan-100 text-cyan-800' };
    if (type === 'DEALER') return { label: 'Dealer', cls: 'bg-indigo-100 text-indigo-800' };
    if (type === 'TRADER') return { label: 'Trader', cls: 'bg-orange-100 text-orange-800' };
    if (type === 'SUPPLIER') return { label: 'Supplier', cls: 'bg-blue-100 text-blue-800' };
    if (type === 'MANUFACTURER') return { label: 'Manufacturer', cls: 'bg-amber-100 text-amber-800' };
    if (type === 'VENDOR') return { label: 'Vendor', cls: 'bg-emerald-100 text-emerald-800' };
    return { label: role || 'Business', cls: 'bg-slate-100 text-slate-700' };
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Search Header Container with Translucent Glassmorphism */}
      <div
        ref={searchContainerRef}
        className="bg-slate-900/40 backdrop-blur-xl text-white p-4 sm:p-6 rounded-2xl shadow-lg border border-white/15 transition-all duration-300 relative z-20"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3.5">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-100 flex items-center gap-2">
              {stateFilter === 'Maharashtra'
                ? 'Maharashtra MIDC Industrial Directory'
                : stateFilter
                  ? `${stateFilter} Industrial Directory & Suppliers`
                  : 'Find Suppliers & Industrial Directory'}
            </h1>
            <p className="text-sky-200/90 text-xs sm:text-sm font-normal mt-0.5">
              {stateFilter === 'Maharashtra'
                ? 'Search 100+ verified Maharashtra MIDC industrial manufacturers across Chakan, Waluj, Ambad, Taloja, and more'
                : stateFilter
                  ? `Search verified B2B manufacturers and suppliers across ${stateFilter} industrial zones`
                  : 'Search verified industrial companies across India — 28 States, 8 UTs, and major industrial development clusters'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-sky-950/60 backdrop-blur-md px-3 py-1 rounded-xl border border-sky-400/20 text-xs text-sky-200">
            <Factory className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {stateFilter === 'Maharashtra'
                ? 'Maharashtra MIDC Verified Directory'
                : stateFilter
                  ? `${stateFilter} Industrial Directory`
                  : 'All-India Industrial Directory · 28 States & 8 UTs'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search by product, company, or industrial area (e.g., stainless steel screws, Chakan MIDC, Tata Motors)..."
              className="w-full pl-10 pr-10 py-2.5 bg-white/95 text-slate-900 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-inner font-medium"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setShowSuggestions(false); }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`px-4 py-2.5 text-white font-medium rounded-xl text-sm transition flex items-center gap-2 ${
              showFilters || stateFilter || district || midcArea || industry || roleFilter ? 'bg-sky-600/90 ring-2 ring-sky-400' : 'bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters {(stateFilter || district || midcArea || industry || roleFilter) && '• Active'}
          </button>
        </div>

        {/* Google Places (New) Suggestions Panel */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mt-3 w-full bg-white/95 backdrop-blur-md text-slate-900 rounded-xl shadow-lg border border-slate-200/90 overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="px-4 py-2 bg-slate-100/90 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between sticky top-0 backdrop-blur-md z-10">
              <span>Google Places (New) Suggestions</span>
              <span className="text-sky-700">India industrial hubs</span>
            </div>
            {suggestions.slice(0, 6).map((s: any, idx: number) => {
              const text = s.placePrediction?.text?.text || s.queryPrediction?.text?.text || '';
              if (!text) return null;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(text);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-medium hover:bg-sky-50 focus:bg-sky-50 focus:outline-none transition flex items-center gap-2.5 text-slate-800"
                >
                  <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <span className="truncate">{text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Extended Filter Panel with District, MIDC Area, Industry & Role */}
        {showFilters && (
          <div className="mt-3.5 bg-black/25 backdrop-blur-md rounded-xl p-3.5 border border-white/10 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* State / UT */}
            <div>
              <label className="block text-xs font-medium text-sky-200 mb-1">State / UT</label>
              <select
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value);
                  setDistrict('');
                  setCity('');
                  setMidcArea('');
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs sm:text-sm font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="">All India</option>
                {INDIA_STATE_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* City / Region Filter */}
            <div>
              <label className="block text-xs font-medium text-sky-200 mb-1">City / Region</label>
              <select
                value={city || district}
                onChange={(e) => {
                  const val = e.target.value;
                  setCity(val);
                  if (stateFilter === 'Maharashtra') {
                    setDistrict(val);
                  } else {
                    setDistrict('');
                  }
                  setMidcArea('');
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs sm:text-sm font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="">
                  {!stateFilter ? 'All Cities / Regions' : stateFilter === 'Maharashtra' ? 'All Maharashtra' : `All Cities (${stateFilter})`}
                </option>
                {(() => {
                  const availableCities = locationOptions.cities.filter(
                    (c) => !stateFilter || c.state === stateFilter
                  );

                  if (!stateFilter) {
                    const groupedByState: Record<string, typeof availableCities> = {};
                    for (const c of availableCities) {
                      if (!groupedByState[c.state]) groupedByState[c.state] = [];
                      groupedByState[c.state].push(c);
                    }
                    return Object.entries(groupedByState).map(([stName, cityList]) => (
                      <optgroup key={stName} label={stName}>
                        {cityList.map((c) => (
                          <option key={`${c.state}-${c.city}`} value={c.city}>
                            {c.city}
                          </option>
                        ))}
                      </optgroup>
                    ));
                  }

                  return availableCities.map((c) => (
                    <option key={`${c.state}-${c.city}`} value={c.city}>
                      {c.city}
                    </option>
                  ));
                })()}
              </select>
            </div>

            {/* Industrial Area Filter */}
            <div>
              <label className="block text-xs font-medium text-sky-200 mb-1">
                {stateFilter === 'Maharashtra' ? 'MIDC Area' : 'Industrial Area'}
              </label>
              <select
                value={midcArea}
                onChange={(e) => setMidcArea(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs sm:text-sm font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="">
                  {stateFilter === 'Maharashtra' ? 'All MIDC Areas' : 'All Industrial Areas'}
                </option>
                {(() => {
                  const currentCity = city || district;
                  const availableAreas = locationOptions.industrialAreas.filter((a) => {
                    if (stateFilter && a.state !== stateFilter) return false;
                    if (currentCity && a.city !== currentCity && a.district !== currentCity) return false;
                    return true;
                  });

                  if (!stateFilter && !currentCity) {
                    const groupedByState: Record<string, typeof availableAreas> = {};
                    for (const a of availableAreas) {
                      if (!groupedByState[a.state]) groupedByState[a.state] = [];
                      groupedByState[a.state].push(a);
                    }
                    return Object.entries(groupedByState).map(([stName, areaList]) => (
                      <optgroup key={stName} label={stName}>
                        {areaList.map((a) => (
                          <option key={`${a.state}-${a.name}`} value={a.name}>
                            {a.name} ({a.city})
                          </option>
                        ))}
                      </optgroup>
                    ));
                  }

                  if (stateFilter && !currentCity) {
                    const groupedByCity: Record<string, typeof availableAreas> = {};
                    for (const a of availableAreas) {
                      const groupKey = a.district || a.city || a.state;
                      if (!groupedByCity[groupKey]) groupedByCity[groupKey] = [];
                      groupedByCity[groupKey].push(a);
                    }
                    return Object.entries(groupedByCity).map(([groupKey, areaList]) => (
                      <optgroup key={groupKey} label={groupKey}>
                        {areaList.map((a) => (
                          <option key={`${a.state}-${a.name}`} value={a.name}>
                            {a.name}
                          </option>
                        ))}
                      </optgroup>
                    ));
                  }

                  return availableAreas.map((a) => (
                    <option key={`${a.state}-${a.name}`} value={a.name}>
                      {a.name}
                    </option>
                  ));
                })()}
              </select>
            </div>

            {/* Industry Sector Filter */}
            <div>
              <label className="block text-xs font-medium text-sky-200 mb-1">Industry Sector</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs sm:text-sm font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="">All Industries</option>
                <option value="Construction & Building Materials">Construction &amp; Building Materials</option>
                <option value="Agriculture & Agricultural Equipment">Agriculture &amp; Agricultural Equipment</option>
                <option value="Mining & Minerals">Mining &amp; Minerals</option>
                <option value="Logistics & Transportation">Logistics &amp; Transportation</option>
                <option value="Warehousing & Storage">Warehousing &amp; Storage</option>
                <option value="Renewable Energy & Solar">Renewable Energy &amp; Solar</option>
                <option value="Machinery & Industrial Equipment">Machinery &amp; Industrial Equipment</option>
                <option value="HVAC & Refrigeration">HVAC &amp; Refrigeration</option>
                <option value="Medical Equipment">Medical Equipment</option>
                <option value="IT Hardware & Electronics">IT Hardware &amp; Electronics</option>
                <option value="Furniture & Office Equipment">Furniture &amp; Office Equipment</option>
                <option value="Safety Equipment & PPE">Safety Equipment &amp; PPE</option>
                <option value="Tools & Hardware">Tools &amp; Hardware</option>
                <option value="Paper & Stationery">Paper &amp; Stationery</option>
                <option value="Leather & Footwear">Leather &amp; Footwear</option>
                <option value="Glass & Ceramics">Glass &amp; Ceramics</option>
                <option value="Wood & Timber">Wood &amp; Timber</option>
                <option value="Metal & Steel">Metal &amp; Steel</option>
                <option value="Oil/Gas & Lubricants">Oil/Gas &amp; Lubricants</option>
                <option value="Promotional Products">Promotional Products</option>
                <option value="Automotive Components">Automotive Components</option>
                <option value="Engineering & Manufacturing">Engineering &amp; Manufacturing</option>
                <option value="Electrical & Electronics">Electrical &amp; Electronics</option>
                <option value="Plastics & Polymers">Plastics &amp; Polymers</option>
                <option value="Chemical & Agro">Chemical &amp; Agro</option>
                <option value="Pharmaceuticals & Healthcare">Pharmaceuticals &amp; Healthcare</option>
                <option value="Forgings & Foundries">Forgings &amp; Foundries</option>
                <option value="Textile & Garments">Textile &amp; Garments</option>
                <option value="Food Processing">Food Processing</option>
                <option value="Rubber & Tyres">Rubber &amp; Tyres</option>
                <option value="Packaging & Printing">Packaging &amp; Printing</option>
                <option value="CNC & Precision Tooling">CNC &amp; Precision Tooling</option>
              </select>
            </div>

            {/* Business Role Filter */}
            <div>
              <label className="block text-xs font-medium text-sky-200 mb-1">Business Type</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs sm:text-sm font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="">All Types</option>
                <option value="MANUFACTURER">Manufacturer</option>
                <option value="SUPPLIER">Supplier</option>
                <option value="VENDOR">Vendor</option>
                <option value="DISTRIBUTOR">Distributor</option>
                <option value="WHOLESALER">Wholesaler</option>
                <option value="DEALER">Dealer</option>
                <option value="TRADER">Trader</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-xs font-medium text-sky-200 mb-1">
                Min Rating: {minRating > 0 ? `${minRating}★+` : 'Any'}
              </label>
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full accent-sky-400 mt-1.5"
              />
            </div>

            {/* Radius / Distance Filter */}
            <div>
              <label className="block text-xs font-medium text-sky-200 mb-1">
                Radius Distance: {radiusKm > 0 ? `Within ${radiusKm} km` : 'Any Distance'}
              </label>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs sm:text-sm font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value={0}>All Distance / State</option>
                <option value={15}>Within 15 km</option>
                <option value={30}>Within 30 km</option>
                <option value={50}>Within 50 km</option>
                <option value={100}>Within 100 km</option>
                <option value={200}>Within 200 km</option>
              </select>
            </div>
          </div>

          {/* Quick Capability Tags */}
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-sky-200 mr-1">Machining &amp; Capabilities:</span>
            {[
              { id: '', label: 'All Capabilities' },
              { id: 'CNC', label: 'CNC Machining' },
              { id: 'VMC', label: 'VMC Milling' },
              { id: 'Laser', label: 'Laser Cutting' },
              { id: 'Sheet Metal', label: 'Sheet Metal' },
              { id: 'Lathe', label: 'Lathe / Turning' },
              { id: 'Molding', label: 'Injection Molding' },
              { id: 'Fabrication', label: 'Fabrication' },
              { id: 'Tool Room', label: 'Tool Room' },
            ].map((cap) => (
              <button
                key={cap.id}
                type="button"
                onClick={() => setCapability(cap.id === capability ? '' : cap.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                  capability === cap.id
                    ? 'bg-sky-500 text-white shadow-sm ring-1 ring-white/50'
                    : 'bg-white/15 text-white hover:bg-white/25 border border-white/10'
                }`}
              >
                {cap.label}
              </button>
            ))}
          </div>
        </div>
      )}
      </div>

      {/* Results Section */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/70 backdrop-blur-md p-6 rounded-xl border border-slate-200/80 animate-pulse">
              <div className="h-5 bg-slate-200/80 rounded mb-3 w-3/4" />
              <div className="h-4 bg-slate-100/80 rounded mb-2 w-1/2" />
              <div className="h-4 bg-slate-100/80 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Map View removed — use Location button on company detail page to open Google Maps */}

      {/* Results / List View */}
      <>
        {!loading && suppliers.length === 0 && (
          <div className="text-center py-16 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80">
            <Factory className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700">No industrial suppliers found</h3>
            <p className="text-sm text-slate-500 mt-1">Try broadening your search or resetting state / industrial-area filters.</p>
          </div>
        )}

        {!loading && suppliers.length > 0 && (
          <>
            <div className="flex items-center justify-between text-sm text-slate-600 font-medium">
              <span>{suppliers.length} verified industrial suppliers from the TradeX directory</span>
                {(stateFilter || district || midcArea || industry || roleFilter) && (
                  <button
                    onClick={() => { setStateFilter(''); setDistrict(''); setCity(''); setMidcArea(''); setIndustry(''); setRoleFilter(''); }}
                    className="text-xs text-sky-600 hover:underline"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {suppliers.map((supplier) => {
                  const r = roleLabel(supplier.user.role, supplier.businessType);
                  const isSaved = savedIds.has(supplier.id);
                  const isSelected = selectedSupplierIds.has(supplier.id);
                  const areaLabel = supplier.industrialArea || supplier.midcArea;
                  const isEstate = !!areaLabel;

                  return (
                    <div
                      key={supplier.id}
                      className={`bg-white/80 backdrop-blur-md p-5 rounded-xl border shadow-sm hover:shadow-md transition flex flex-col group relative ${
                        isSelected ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/40' : 'border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2.5 flex-1 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedSupplierIds((prev) => {
                                const newSet = new Set(prev);
                                if (newSet.has(supplier.id)) newSet.delete(supplier.id);
                                else newSet.add(supplier.id);
                                return newSet;
                              });
                            }}
                            className="mt-1 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                            title="Select for Broadcast RFQ"
                          />
                          <div>
                            <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-sky-700 transition-colors">
                              {supplier.user.companyName || supplier.user.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.cls}`}>
                                {r.label}
                              </span>
                              {isEstate && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold border border-amber-300/60 flex items-center gap-1">
                                  <Factory className="w-3 h-3 text-amber-600" />
                                  {areaLabel}
                                </span>
                              )}
                              {supplier.isVerified && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-sky-600" /> Verified
                                </span>
                              )}
                              {supplier.distanceKm !== undefined && supplier.distanceKm !== null && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                  📍 {supplier.distanceKm} km away
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleSave(supplier.id)}
                          disabled={savingId === supplier.id}
                          className={`p-1.5 rounded-lg transition ${
                            isSaved ? 'text-sky-600 bg-sky-50' : 'text-slate-400 hover:text-sky-600'
                          }`}
                          title={isSaved ? 'Unsave' : 'Save supplier'}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-slate-600 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{supplier.address || `${supplier.city}, ${supplier.state}`}</span>
                      </div>

                      {supplier.industry && (
                        <div className="text-xs text-slate-500 mb-2 font-medium">
                          Sector: <span className="text-slate-700">{supplier.industry}</span>
                        </div>
                      )}

                      {supplier.averageRating > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-amber-600 mb-3">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="font-bold">{supplier.averageRating.toFixed(1)}</span>
                          <span className="text-slate-500">({supplier.totalRatings} reviews)</span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 mb-3">No ratings yet</div>
                      )}

                      {supplier.products && supplier.products.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Products &amp; Capabilities</p>
                          <div className="flex flex-wrap gap-1.5">
                            {supplier.products.slice(0, 3).map((p) => (
                              <span
                                key={p.id}
                                className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full"
                              >
                                {p.name}
                                {p.indicativePrice && ` · ₹${p.indicativePrice}/${p.unit}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {supplier.source && (
                        <div className="text-[11px] text-slate-400 mb-3 font-mono">
                          Source: {supplier.source}
                        </div>
                      )}

                      <div className="mt-auto flex gap-2 pt-3 border-t border-slate-100">
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="flex-1 text-center text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-lg transition"
                        >
                          View Profile
                        </Link>
                        <Link
                          href={`/rfq/create?supplierId=${supplier.id}`}
                          className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white py-2 rounded-lg transition"
                        >
                          <Send className="w-3.5 h-3.5" /> Send RFQ
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>

      {/* Floating Broadcast RFQ Bar when multiple suppliers are selected */}
      {selectedSupplierIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-5 border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center font-bold">
              {selectedSupplierIds.size}
            </span>
            <span>Supplier{selectedSupplierIds.size > 1 ? 's' : ''} Selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedSupplierIds(new Set())}
              className="text-xs text-slate-400 hover:text-white transition underline"
            >
              Clear
            </button>
            <Link
              href={`/rfq/create?supplierIds=${Array.from(selectedSupplierIds).join(',')}`}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> Broadcast RFQ to Selected ({selectedSupplierIds.size})
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

