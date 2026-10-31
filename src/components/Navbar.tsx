'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LogOut, Store, ShoppingBag, Search, Bell, Package, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout, unreadCount } = useAuth();
  const pathname = usePathname();

  const getRoleBadge = (role: string) => {
    const configs: Record<string, { label: string; cls: string; Icon: any }> = {
      BUYER: { label: 'Buyer', cls: 'bg-blue-100 text-blue-800 border-blue-200', Icon: ShoppingBag },
      MANUFACTURER: { label: 'Manufacturer', cls: 'bg-amber-100 text-amber-800 border-amber-200', Icon: Building2 },
      VENDOR: { label: 'Vendor', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', Icon: Store },
    };
    const c = configs[role];
    if (!c) return null;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${c.cls}`}>
        <c.Icon className="w-3 h-3" /> {c.label}
      </span>
    );
  };

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/70 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={user ? '/dashboard' : '/login'}
          className="flex items-center space-x-2 focus:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-black text-xl shadow">
            T
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Trade<span className="text-sky-600">X</span>
          </span>
        </Link>

        {/* Primary Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Always Available */}
          <Link
            href="/search"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              pathname === '/search'
                ? 'bg-sky-50 text-sky-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4" /> Search
          </Link>
          {/* Authenticated Links */}
          {user && (
            <>
              <Link
                href={user.role === 'BUYER' ? '/dashboard/buyer' : '/dashboard/supplier'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname.startsWith('/dashboard') && pathname !== '/dashboard/supplier/products'
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              {user.role !== 'BUYER' && (
                <Link
                  href="/dashboard/supplier/products"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    pathname === '/dashboard/supplier/products'
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-4 h-4" /> Products
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Right Section: Authenticated User Menu OR Public Auth Links */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {user ? (
            /* Authenticated User Menu (Completely replaces Log In / Get Started) */
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Notifications Bell */}
              <div className="relative">
                <Link
                  href={user.role === 'BUYER' ? '/dashboard/buyer' : '/dashboard/supplier'}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-100 transition flex items-center justify-center"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                </Link>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center pointer-events-none shadow-sm animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>

              {/* Role Badge */}
              <div className="hidden sm:block">
                {getRoleBadge(user.role)}
              </div>

              {/* User Profile Info & Avatar */}
              <div
                className="flex items-center gap-2 pl-1 sm:pl-2 sm:border-l sm:border-slate-200"
                title={`${user.name} (${user.email})`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-sky-500 text-white font-bold text-xs flex items-center justify-center shadow-sm ring-2 ring-sky-100">
                  {userInitial}
                </div>
                <div className="hidden lg:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Log Out Button */}
              <button
                onClick={logout}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 transition"
                title="Log out of TradeX"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          ) : (
            /* Public Guest Links */
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-sky-600 transition px-3 py-1.5 rounded-lg hover:bg-slate-100"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
