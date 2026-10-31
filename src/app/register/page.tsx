'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Building2, Store, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { user: authUser, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<'BUYER' | 'MANUFACTURER' | 'VENDOR'>('BUYER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('Nashik');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard immediately
  useEffect(() => {
    if (authUser) {
      const target = authUser.role === 'BUYER' ? '/dashboard/buyer' : '/dashboard/supplier';
      window.location.href = target;
    }
  }, [authUser]);

  useEffect(() => {
    const roleParam = searchParams.get('role')?.toUpperCase();
    if (roleParam === 'BUYER' || roleParam === 'MANUFACTURER' || roleParam === 'VENDOR') {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          mobile,
          password,
          role,
          companyName,
          location,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Update global auth state
      login(data.user);

      // Clean redirect to dashboard
      const target = role === 'BUYER' ? '/dashboard/buyer' : '/dashboard/supplier';
      window.location.href = target;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/85 backdrop-blur-md p-8 rounded-2xl border border-slate-200/80 shadow-lg">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900">
            Create TradeX Account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Phase 1 • User Registration & Role Selection
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {/* User Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('BUYER')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-semibold ${
                  role === 'BUYER'
                    ? 'border-sky-600 bg-sky-50 text-sky-800 ring-2 ring-sky-600/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShoppingBag className="w-5 h-5 text-sky-600" />
                Buyer
              </button>

              <button
                type="button"
                onClick={() => setRole('MANUFACTURER')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-semibold ${
                  role === 'MANUFACTURER'
                    ? 'border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-600/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-5 h-5 text-amber-600" />
                Manufacturer
              </button>

              <button
                type="button"
                onClick={() => setRole('VENDOR')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-semibold ${
                  role === 'VENDOR'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Store className="w-5 h-5 text-emerald-600" />
                Vendor
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Mobile Number *</label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@business.com"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Company / Business Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Industrial Traders"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">City / Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Nashik, Maharashtra"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition"
          >
            {loading ? 'Creating Account...' : 'Register & Continue'}
          </button>

          <div className="text-center text-xs text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-sky-600 hover:text-sky-700">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
