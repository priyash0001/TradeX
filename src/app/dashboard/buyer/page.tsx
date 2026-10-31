import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  ShoppingBag, Search, Send, Bookmark, FileText, CheckCircle,
  Clock, XCircle, MapPin, Star, TrendingUp, Award, BarChart2,
  Repeat
} from 'lucide-react';

const statusBadge = (s: string) => {
  const map: Record<string, { cls: string; icon: any }> = {
    PENDING: { cls: 'bg-amber-100 text-amber-800', icon: Clock },
    IN_PROGRESS: { cls: 'bg-blue-100 text-blue-800', icon: FileText },
    COMPLETED: { cls: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    CANCELLED: { cls: 'bg-red-100 text-red-800', icon: XCircle },
  };
  return map[s] || { cls: 'bg-slate-100 text-slate-700', icon: FileText };
};

export default async function BuyerDashboardPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'BUYER') redirect('/dashboard/supplier');

  const activeTab = searchParams?.tab || 'rfqs';

  const [rfqs, savedRecords, notifications] = await Promise.all([
    prisma.rFQ.findMany({
      where: { buyerId: user.userId },
      include: {
        supplier: {
          include: { user: { select: { name: true, companyName: true, role: true } } },
        },
        quotations: {
          include: { supplier: { select: { name: true, companyName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.savedSupplier.findMany({
      where: { buyerId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.notification.findMany({
      where: { userId: user.userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  // savedCount derived from the already-fetched savedRecords (no extra DB query)
  const savedCount = savedRecords.length;

  const savedSupplierIds = savedRecords.map((s) => s.supplierId);
  const savedSupplierProfiles = savedSupplierIds.length > 0
    ? await prisma.supplierProfile.findMany({
        where: { id: { in: savedSupplierIds } },
        include: {
          user: { select: { id: true, name: true, companyName: true, role: true, location: true, email: true, mobile: true } },
          products: { take: 3 },
        },
      })
    : [];

  const quotationsReceived = rfqs.reduce((acc, r) => acc + r.quotations.length, 0);

  // Filter RFQs that have at least one quotation for the Quotations view
  const rfqsWithQuotations = rfqs.filter((r) => r.quotations.length > 0);

  // --- Phase 3 Analytics Calculations ---
  const totalRFQs = rfqs.length;
  const completedRFQs = rfqs.filter((r) => r.status === 'COMPLETED').length;
  const inProgressRFQs = rfqs.filter((r) => r.status === 'IN_PROGRESS').length;
  const pendingRFQs = rfqs.filter((r) => r.status === 'PENDING').length;
  const rfqsWithQuotes = rfqsWithQuotations.length;

  let totalSpend = 0;
  const supplierDealMap: Record<string, { id: string; name: string; companyName: string; dealCount: number; totalSpend: number }> = {};
  let responseTimeSumHours = 0;
  let responseTimeCount = 0;

  rfqs.forEach((rfq) => {
    if (rfq.quotations.length > 0) {
      const earliestQuoteTime = Math.min(...rfq.quotations.map((q) => new Date(q.createdAt).getTime()));
      const rfqTime = new Date(rfq.createdAt).getTime();
      const diffHours = (earliestQuoteTime - rfqTime) / (1000 * 60 * 60);
      if (diffHours >= 0) {
        responseTimeSumHours += diffHours;
        responseTimeCount++;
      }
    }

    rfq.quotations.forEach((q) => {
      if (q.status === 'ACCEPTED') {
        totalSpend += q.totalPrice;
        const key = q.supplierId;
        const name = q.supplier?.name || 'Supplier';
        const companyName = q.supplier?.companyName || name;
        if (!supplierDealMap[key]) {
          supplierDealMap[key] = { id: key, name, companyName, dealCount: 0, totalSpend: 0 };
        }
        supplierDealMap[key].dealCount += 1;
        supplierDealMap[key].totalSpend += q.totalPrice;
      }
    });
  });

  const avgResponseTimeHours = responseTimeCount > 0 ? (responseTimeSumHours / responseTimeCount).toFixed(1) : null;
  const topSuppliers = Object.values(supplierDealMap)
    .sort((a, b) => b.dealCount - a.dealCount || b.totalSpend - a.totalSpend)
    .slice(0, 4);

  const conversionRate = totalRFQs > 0 ? Math.round((completedRFQs / totalRFQs) * 100) : 0;

  // Monthly Trend (last 6 calendar months)
  const months: { label: string; monthIndex: number; year: number; count: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('en-US', { month: 'short' }),
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      count: 0,
    });
  }
  rfqs.forEach((rfq) => {
    const rfqDate = new Date(rfq.createdAt);
    const m = months.find((entry) => entry.monthIndex === rfqDate.getMonth() && entry.year === rfqDate.getFullYear());
    if (m) m.count += 1;
  });
  const maxMonthlyCount = Math.max(...months.map((m) => m.count), 1);

  // Repeat Order Suggestions from completed/accepted RFQs
  const repeatSuggestions = Array.from(
    new Map(
      rfqs
        .filter((r) => r.status === 'COMPLETED' || r.quotations.some((q) => q.status === 'ACCEPTED'))
        .map((r) => [r.productName.toLowerCase(), r])
    ).values()
  ).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-2">
            <ShoppingBag className="w-3.5 h-3.5" /> Buyer Dashboard
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
          <p className="text-sm text-slate-600">{user.email}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/search" className="px-4 py-2 bg-slate-100/90 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold transition flex items-center gap-2">
            <Search className="w-4 h-4" /> Search Suppliers
          </Link>
          <Link href="/rfq/create" className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-2">
            <Send className="w-4 h-4" /> New RFQ
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="bg-sky-50/90 backdrop-blur-md border border-sky-200/80 rounded-2xl p-4">
          <p className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-3">
            🔔 {notifications.length} Unread Notification{notifications.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900">{n.title}: </span>
                  <span className="text-slate-700">{n.message}</span>
                </div>
                {n.rfqId && (
                  <Link href={`/rfq/${n.rfqId}`} className="ml-auto text-sky-600 hover:underline text-xs whitespace-nowrap">
                    View →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clickable Interactive Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Card 1: Total RFQs Sent */}
        <Link
          href="/dashboard/buyer?tab=rfqs#dashboard-content"
          className={`bg-white/80 backdrop-blur-md p-6 rounded-xl border ${
            activeTab === 'rfqs' ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' : 'border-slate-200/80 shadow-sm'
          } flex items-center justify-between gap-4 hover:shadow-md hover:border-blue-400 hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer group`}
          title="Click to view Total RFQs Sent"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50/90 text-blue-600 rounded-xl group-hover:bg-blue-100 transition"><FileText className="w-6 h-6" /></div>
            <div>
              <div className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition">{rfqs.length}</div>
              <div className="text-xs text-slate-500 font-medium">Total RFQs Sent</div>
            </div>
          </div>
          <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition hidden sm:inline">View →</span>
        </Link>

        {/* Card 2: Quotations Received */}
        <Link
          href="/dashboard/buyer?tab=quotations#dashboard-content"
          className={`bg-white/80 backdrop-blur-md p-6 rounded-xl border ${
            activeTab === 'quotations' ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-md' : 'border-slate-200/80 shadow-sm'
          } flex items-center justify-between gap-4 hover:shadow-md hover:border-emerald-400 hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer group`}
          title="Click to view Quotations Received"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50/90 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition"><Send className="w-6 h-6" /></div>
            <div>
              <div className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition">{quotationsReceived}</div>
              <div className="text-xs text-slate-500 font-medium">Quotations Received</div>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition hidden sm:inline">View →</span>
        </Link>

        {/* Card 3: Saved Suppliers */}
        <Link
          href="/dashboard/buyer?tab=saved#dashboard-content"
          className={`bg-white/80 backdrop-blur-md p-6 rounded-xl border ${
            activeTab === 'saved' ? 'border-amber-500 ring-2 ring-amber-100 shadow-md' : 'border-slate-200/80 shadow-sm'
          } flex items-center justify-between gap-4 hover:shadow-md hover:border-amber-400 hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer group`}
          title="Click to view Saved Suppliers"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50/90 text-amber-600 rounded-xl group-hover:bg-amber-100 transition"><Bookmark className="w-6 h-6" /></div>
            <div>
              <div className="text-2xl font-bold text-slate-900 group-hover:text-amber-600 transition">{savedCount}</div>
              <div className="text-xs text-slate-500 font-medium">Saved Suppliers</div>
            </div>
          </div>
          <span className="text-xs font-semibold text-amber-600 opacity-0 group-hover:opacity-100 transition hidden sm:inline">View →</span>
        </Link>
      </div>

      {/* Phase 3: Sourcing Intelligence & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: RFQ Funnel & Spend Overview */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-600" /> Procurement Funnel
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {conversionRate}% Close Rate
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Total RFQs */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Total RFQs Sent</span>
                  <span className="font-bold text-slate-900">{totalRFQs}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Quotes Received */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>With Quotes</span>
                  <span className="font-bold text-slate-900">
                    {rfqsWithQuotes} ({totalRFQs > 0 ? Math.round((rfqsWithQuotes / totalRFQs) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalRFQs > 0 ? (rfqsWithQuotes / totalRFQs) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Deals Closed */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Deals Closed (PO Issued)</span>
                  <span className="font-bold text-slate-900">{completedRFQs} ({conversionRate}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalRFQs > 0 ? (completedRFQs / totalRFQs) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* In Progress */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>In Negotiation / Pending</span>
                  <span className="font-bold text-slate-900">{inProgressRFQs + pendingRFQs}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalRFQs > 0 ? ((inProgressRFQs + pendingRFQs) / totalRFQs) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Procurement Spend</p>
              <p className="text-xl font-extrabold text-slate-900">
                ₹{totalSpend.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">Avg Quote Turnaround</p>
              <p className="text-sm font-bold text-sky-700">
                {avgResponseTimeHours ? `${avgResponseTimeHours} hrs` : 'Instant'}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Sourcing Velocity & Monthly Trend */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-600" /> Sourcing Activity Trend
              </h2>
              <span className="text-xs text-slate-500 font-medium">Last 6 Months</span>
            </div>

            <div className="h-44 flex items-end justify-between gap-2 pt-6 px-1">
              {months.map((m, idx) => {
                const heightPercent = Math.max(Math.round((m.count / maxMonthlyCount) * 100), m.count > 0 ? 18 : 8);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[11px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition">
                      {m.count}
                    </span>
                    <div className="w-full bg-slate-100 rounded-t-lg flex items-end h-28 p-1">
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          m.count > 0
                            ? 'bg-gradient-to-t from-sky-600 to-sky-400 group-hover:from-sky-700 group-hover:to-sky-500'
                            : 'bg-slate-200/60'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Procurement Inquiry Volume</span>
            <span className="font-bold text-slate-800">{totalRFQs} Total RFQs Sent</span>
          </div>
        </div>

        {/* Card 3: Top Partner Suppliers & Repeat Orders */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Top Partner Suppliers
              </h2>
              <span className="text-xs text-slate-500">By closed deals</span>
            </div>

            {topSuppliers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Award className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>Accept quotations to build your trusted supplier network.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {topSuppliers.map((supp, index) => (
                  <div
                    key={supp.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        index === 0 ? 'bg-amber-100 text-amber-800' :
                        index === 1 ? 'bg-slate-200 text-slate-700' :
                        index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        #{index + 1}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{supp.companyName}</p>
                        <p className="text-[11px] text-slate-500">₹{supp.totalSpend.toLocaleString('en-IN')} spend</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex-shrink-0">
                      {supp.dealCount} {supp.dealCount === 1 ? 'deal' : 'deals'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Repeat Suggestions */}
          {repeatSuggestions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Repeat className="w-3 h-3 text-sky-600" /> Quick Re-Order Suggestions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {repeatSuggestions.map((rec) => (
                  <Link
                    key={rec.id}
                    href={`/rfq/create?product=${encodeURIComponent(rec.productName)}&supplierId=${rec.supplierId}`}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-medium transition"
                    title={`Create new RFQ for ${rec.productName}`}
                  >
                    + {rec.productName}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Section with Tab Navigation */}
      <div id="dashboard-content" className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden scroll-mt-20">
        {/* Tab Headers */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/buyer?tab=rfqs#dashboard-content"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                activeTab === 'rfqs'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              My RFQs ({rfqs.length})
            </Link>
            <Link
              href="/dashboard/buyer?tab=quotations#dashboard-content"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                activeTab === 'quotations'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Quotations Received ({quotationsReceived})
            </Link>
            <Link
              href="/dashboard/buyer?tab=saved#dashboard-content"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                activeTab === 'saved'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Saved Suppliers ({savedCount})
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'rfqs' && (
              <Link href="/rfq/create" className="text-sm font-semibold text-sky-600 hover:underline">
                + New RFQ
              </Link>
            )}
            {activeTab === 'saved' && (
              <Link href="/search" className="text-sm font-semibold text-sky-600 hover:underline">
                + Browse Directory
              </Link>
            )}
          </div>
        </div>

        {/* Tab 1: RFQs List */}
        {activeTab === 'rfqs' && (
          <div>
            {rfqs.length === 0 ? (
              <div className="py-16 text-center">
                <Send className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-700">No RFQs yet</h3>
                <p className="text-sm text-slate-500 mt-1">Search for a supplier and send your first Request for Quotation.</p>
                <Link href="/search" className="inline-block mt-4 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-sm transition">
                  Find Suppliers
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {rfqs.map((rfq) => {
                  const { cls } = statusBadge(rfq.status);
                  return (
                    <Link key={rfq.id} href={`/rfq/${rfq.id}`} className="flex items-center justify-between p-5 hover:bg-slate-50 transition group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 truncate">{rfq.productName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${cls}`}>
                            {rfq.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          To: {rfq.supplier.user.companyName || rfq.supplier.user.name}
                          {' · '}Qty: {rfq.quantity} {rfq.unit}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {rfq.quotations.length > 0 ? `${rfq.quotations.length} quotation(s) received` : 'Awaiting quotation'}
                          {' · '}{new Date(rfq.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      {rfq.quotations.length > 0 && (
                        <div className="ml-4 text-right flex-shrink-0">
                          <p className="text-sm font-bold text-sky-700">
                            From ₹{Math.min(...rfq.quotations.map((q) => q.pricePerUnit)).toLocaleString('en-IN')}/{rfq.unit}
                          </p>
                          <p className="text-xs text-slate-500">Best price</p>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Quotations Received List */}
        {activeTab === 'quotations' && (
          <div>
            {quotationsReceived === 0 ? (
              <div className="py-16 text-center">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-700">No quotations received yet</h3>
                <p className="text-sm text-slate-500 mt-1">Suppliers will send quotations in response to your active RFQs.</p>
                <Link href="/search" className="inline-block mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition">
                  Search &amp; Send RFQ
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {rfqsWithQuotations.flatMap((rfq) =>
                  rfq.quotations.map((q) => (
                    <Link
                      key={q.id}
                      href={`/rfq/${rfq.id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 transition group gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900">{rfq.productName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            q.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.status === 'REJECTED'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            Quote {q.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          Supplier: <strong>{q.supplier.companyName || q.supplier.name}</strong>
                          {' · '}Delivery: {q.deliveryDays} days
                        </p>
                        {q.notes && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                            &quot;{q.notes}&quot;
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Received {new Date(q.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="sm:text-right flex-shrink-0">
                        <p className="text-lg font-extrabold text-emerald-700">
                          ₹{q.pricePerUnit.toLocaleString('en-IN')}/{rfq.unit}
                        </p>
                        <p className="text-xs text-slate-500">
                          Total: ₹{q.totalPrice.toLocaleString('en-IN')}
                        </p>
                        <span className="inline-block mt-1 text-xs font-semibold text-sky-600 group-hover:underline">
                          Review Quote →
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Saved Suppliers List */}
        {activeTab === 'saved' && (
          <div>
            {savedSupplierProfiles.length === 0 ? (
              <div className="py-16 text-center">
                <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-700">No saved suppliers yet</h3>
                <p className="text-sm text-slate-500 mt-1">Browse the TradeX directory and bookmark suppliers for fast one-click access.</p>
                <Link href="/search" className="inline-block mt-4 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm transition">
                  Explore Suppliers
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {savedSupplierProfiles.map((supplier) => (
                  <div key={supplier.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-base">
                          {supplier.user.companyName || supplier.user.name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          supplier.user.role === 'MANUFACTURER' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {supplier.user.role}
                        </span>
                        {supplier.isVerified && (
                          <span className="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-semibold">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{supplier.city}, {supplier.state}</span>
                      </div>
                      {supplier.products.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {supplier.products.map((p) => (
                            <span key={p.id} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                              {p.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/suppliers/${supplier.id}`}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition"
                      >
                        View Profile
                      </Link>
                      <Link
                        href={`/rfq/create?supplierId=${supplier.id}`}
                        className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" /> Send RFQ
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
