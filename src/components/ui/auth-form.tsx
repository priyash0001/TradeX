'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface AuthFormProps {
  onSuccessRedirect?: string;
}

export function AuthForm({ onSuccessRedirect = '/dashboard' }: AuthFormProps) {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotPasswordMessage(null);

    if (!identifier.trim()) {
      setError('Please enter your email or mobile number.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      // Update global auth state immediately
      login(data.user);

      // Clean redirect to the correct role dashboard
      const targetRoute =
        data.user?.role === 'BUYER'
          ? '/dashboard/buyer'
          : data.user?.role
          ? '/dashboard/supplier'
          : onSuccessRedirect;

      window.location.href = targetRoute;
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Enter your registered email or mobile above, then click Forgot Password.');
      return;
    }
    setError(null);
    setForgotPasswordMessage(
      `Password reset instructions will be sent to "${identifier}". Please check your inbox or contact support@tradex.com.`
    );
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Ambient background glow & subtle grid */}
      <div className="absolute -top-16 -left-16 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/30 p-7 sm:p-9"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl p-1"
            title="TradeX Dashboard"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-black text-xl shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform">
              T
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Trade<span className="text-sky-600">X</span>
            </span>
          </Link>

          <h1 className="mt-4 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome to TradeX
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
            Sign in to access your B2B sourcing network and RFQs
          </p>
        </div>

        {/* Status Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden"
            >
              <div className="bg-red-50 border border-red-200/80 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            </motion.div>
          )}

          {forgotPasswordMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden"
            >
              <div className="bg-sky-50 border border-sky-200 text-sky-800 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed font-medium">{forgotPasswordMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email / Mobile Field */}
          <div>
            <label
              htmlFor="tradex-identifier"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Email or Mobile Number
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="tradex-identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@company.com or +91..."
                disabled={loading}
                className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/60 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="tradex-password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 focus:outline-none focus:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="tradex-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/60 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
              />
              <span className="text-xs font-medium text-slate-600">Remember this device</span>
            </label>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure 256-bit
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 shadow-md shadow-sky-600/20 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to TradeX</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Register */}
        <div className="mt-7 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
          New to TradeX?{' '}
          <Link
            href="/register"
            className="font-bold text-sky-600 hover:text-sky-700 focus:outline-none focus:underline"
          >
            Create an Account
          </Link>
        </div>

        {/* B2B Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-400" /> Verified Manufacturers
          </span>
          <span>•</span>
          <span>Direct RFQs</span>
        </div>
      </motion.div>
    </div>
  );
}

export default AuthForm;
