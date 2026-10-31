import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  Users, Package, FileText, CheckCircle, ShieldCheck, TrendingUp,
  Clock, CheckCircle2, Flame, PieChart, BarChart2, Award, MapPin
} from 'lucide-react';
import VerifySupplierButton from '@/components/admin/VerifySupplierButton';

export default async function AdminPanelPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'ADMIN') redirect('/dashboard');

  const [
    totalUsers,
    totalBuyers,
    totalSuppliers,
    totalRFQs,
    totalQuotations,
    totalProducts,
    recentUsers,
    completedRFQs,
    pendingRFQs,
    inProgressRFQs,
    totalMidc,
    supplierProfiles,
    rfqProducts,
    roleBreakdownData,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'BUYER' } }),
    prisma.user.count({ where: { role: { in: ['MANUFACTURER', 'VENDOR', 'SUPPLIER', 'DISTRIBUTOR'] } } }),
    prisma.rFQ.count(),
    prisma.quotation.count(),
    prisma.product.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, name: true, companyName: true, role: true, email: true, mobile: true, createdAt: true },
    }),
    prisma.rFQ.count({ where: { status: 'COMPLETED' } }),
    prisma.rFQ.count({ where: { status: 'PENDING' } }),
    prisma.rFQ.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.midcBusiness.count(),
    prisma.supplierProfile.findMany({
      include: {
        user: { select: { id: true, name: true, companyName: true, email: true, mobile: true, role: true, location: true } },
        products: { select: { id: true, name: true }, take: 3 },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.rFQ.findMany({
      select: { productName: true, quantity: true, unit: true },
      take: 100,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ]);

  // Aggregate Top Products Requested
  const productCountMap: Record<string, { count: number; totalQty: number; unit: string }> = {};
  rfqProducts.forEach((r) => {
    const key = r.productName.trim();
    if (!productCountMap[key]) {
      productCountMap[key] = { count: 0, totalQty: 0, unit: r.unit || 'units' };
    }
    productCountMap[key].count += 1;
    productCountMap[key].totalQty += r.quantity;
  });

  const topRequestedProducts = Object.entries(productCountMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const acceptanceRate = totalRFQs > 0 ? Math.round((completedRFQs / totalRFQs) * 100) : 0;
  const pendingVerificationCount = supplierProfiles.filter((s) => !s.isVerified).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-white text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin Control Panel
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Command Center</h1>
          <p className="text-sm text-slate-500">Live TradeX Industrial Marketplace Analytics &amp; Supplier Verification</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Healthy · {totalMidc} MIDC Indexed</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Users', value: totalUsers, cls: 'bg-slate-800 text-white', icon: Users },
          { label: 'Buyers', value: totalBuyers, cls: 'bg-blue-600 text-white', icon: Users },
          { label: 'Suppliers', value: totalSuppliers, cls: 'bg-amber-600 text-white', icon: Users },
          { label: 'Products', value: totalProducts, cls: 'bg-emerald-600 text-white', icon: Package },
          { label: 'Total RFQs', value: totalRFQs, cls: 'bg-sky-600 text-white', icon: FileText },
          { label: 'Deals Closed', value: completedRFQs, cls: 'bg-purple-600 text-white', icon: CheckCircle },
        ].map(({ label, value, cls, icon: Icon }) => (
          <div key={label} className={`${cls} p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center`}>
            <Icon className="w-5 h-5 mb-2 opacity-80" />
            <div className="text-3xl font-extrabold">{value}</div>
            <div className="text-xs opacity-80 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Section 1: Platform RFQ Sourcing Analytics */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-sky-600" /> Platform Sourcing &amp; RFQ Funnel
            </h2>
            <p className="text-xs text-slate-500">Live throughput across all active procurement cycles</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-sky-100 text-sky-800 rounded-full w-fit">
            {acceptanceRate}% Deal Conversion Rate
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700">Pending RFQs</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-900 mt-1">{pendingRFQs}</p>
            <p className="text-[11px] text-amber-600 mt-0.5">Awaiting first vendor quote</p>
          </div>

          <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700">In Negotiation</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">{inProgressRFQs}</p>
            <p className="text-[11px] text-blue-600 mt-0.5">Active quotes &amp; chat threads</p>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700">Completed Deals</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{completedRFQs}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Purchase Orders generated</p>
          </div>

          <div className="bg-purple-50/80 border border-purple-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700">Quotations Sent</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900 mt-1">{totalQuotations}</p>
            <p className="text-[11px] text-purple-600 mt-0.5">Total vendor submissions</p>
          </div>
        </div>

        {/* Funnel Progress Bar */}
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
            <span>Overall Sourcing Completion Ratio</span>
            <span className="font-bold text-slate-800">{completedRFQs} of {totalRFQs} RFQs Closed ({acceptanceRate}%)</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${totalRFQs > 0 ? (completedRFQs / totalRFQs) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Most Requested Products & User Role Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Requested Products */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-orange-500" /> Most Requested Products
            </h2>
            <p className="text-xs text-slate-500 mb-4">High-demand industrial materials &amp; services</p>

            {topRequestedProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Flame className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No RFQs recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topRequestedProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-orange-100 text-orange-800' :
                        idx === 1 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-900 text-sm">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                        {p.count} {p.count === 1 ? 'RFQ' : 'RFQs'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
            Based on buyer RFQs submitted across all categories
          </p>
        </div>

        {/* User Role Distribution */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-1">
              <PieChart className="w-5 h-5 text-purple-600" /> User Ecosystem Distribution
            </h2>
            <p className="text-xs text-slate-500 mb-4">Breakdown of registered marketplace participants</p>

            <div className="space-y-3.5">
              {roleBreakdownData.map((item) => {
                const percent = totalUsers > 0 ? Math.round((item._count.id / totalUsers) * 100) : 0;
                const roleColors: Record<string, { bar: string; badge: string }> = {
                  BUYER: { bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800' },
                  MANUFACTURER: { bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800' },
                  VENDOR: { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
                  SUPPLIER: { bar: 'bg-teal-500', badge: 'bg-teal-100 text-teal-800' },
                  DISTRIBUTOR: { bar: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-800' },
                  ADMIN: { bar: 'bg-slate-800', badge: 'bg-slate-100 text-slate-800' },
                };
                const col = roleColors[item.role] || { bar: 'bg-slate-500', badge: 'bg-slate-100 text-slate-700' };

                return (
                  <div key={item.role}>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${col.badge}`}>{item.role}</span>
                      <span className="font-bold text-slate-800">{item._count.id} ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${col.bar} rounded-full`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
            Total {totalUsers} registered verified &amp; standard accounts
          </p>
        </div>
      </div>

      {/* Section 3: Supplier Trust & Verification Queue */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Supplier Verification &amp; Trust Management
            </h2>
            <p className="text-xs text-slate-500">
              Audit supplier details, GST compliance, and toggle official verification badges
            </p>
          </div>
          {pendingVerificationCount > 0 && (
            <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full w-fit">
              {pendingVerificationCount} Pending Review
            </span>
          )}
        </div>

        {supplierProfiles.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No supplier profiles found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company / Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">GSTIN Number</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Machinery / Certs</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierProfiles.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{s.user.companyName || s.user.name}</div>
                      <div className="text-xs text-slate-500">{s.user.email} · {s.user.mobile}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>{s.city}, {s.state}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {s.gstNumber ? (
                        <span className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold">
                          {s.gstNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not provided</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px] truncate text-xs text-slate-600">
                        {s.machinery || s.certifications || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 ${
                        s.isVerified
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.isVerified ? '? Verified' : '? Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <VerifySupplierButton
                        supplierId={s.id}
                        isVerified={s.isVerified}
                        supplierName={s.user.companyName || s.user.name}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 4: Recently Joined Users */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100/80">
          <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-600" /> Recently Joined Marketplace Users
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100/80">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                  <td className="px-6 py-4 text-slate-600">{u.companyName || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      u.role === 'BUYER' ? 'bg-blue-100 text-blue-800'
                        : u.role === 'MANUFACTURER' ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{u.email}</td>
                  <td className="px-6 py-4 text-slate-600">{u.mobile}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
