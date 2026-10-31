import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Building2, Store, Plus, Package, Inbox, TrendingUp, Edit3, CheckCircle, Clock, FileText } from 'lucide-react';

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return map[s] || 'bg-slate-100 text-slate-700';
};

export default async function SupplierDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role === 'BUYER') redirect('/dashboard/buyer');

  let [profile, notifications] = await Promise.all([
    prisma.supplierProfile.findUnique({
      where: { userId: user.userId },
      include: {
        user: true,
        products: { orderBy: { createdAt: 'desc' }, take: 5 },
        rfqs: {
          include: {
            buyer: { select: { name: true, companyName: true } },
            quotations: { where: { supplierId: user.userId } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    }),
    prisma.notification.findMany({
      where: { userId: user.userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  if (!profile) {
    profile = await prisma.supplierProfile.create({
      data: { userId: user.userId },
      include: { user: true, products: true, rfqs: { include: { buyer: { select: { name: true, companyName: true } }, quotations: true } } },
    });
  }

  const pendingRFQs = profile.rfqs.filter((r) => r.status === 'PENDING').length;
  const quotationsSent = profile.rfqs.reduce((acc, r) => acc + r.quotations.length, 0);
  const accepted = profile.rfqs.filter((r) => r.status === 'COMPLETED').length;
  const totalRFQsReceived = profile.rfqs.length;
  const responseRate = totalRFQsReceived > 0 ? Math.round((quotationsSent / totalRFQsReceived) * 100) : 100;
  const isManufacturer = user.role === 'MANUFACTURER';

  // Calculate Profile Completeness
  let completeness = 0;
  const missingItems: string[] = [];
  if (profile.user?.companyName) completeness += 20; else missingItems.push('Company Name');
  if (profile.gstNumber) completeness += 20; else missingItems.push('GST Number');
  if (profile.address && profile.city) completeness += 20; else missingItems.push('Factory Address');
  if (profile.products.length > 0) completeness += 20; else missingItems.push('Product Catalog');
  if (profile.description && profile.description.length > 10) completeness += 20; else missingItems.push('Company / Machine Bio');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 ${isManufacturer ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
            {isManufacturer ? <Building2 className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
            {isManufacturer ? 'Manufacturer' : 'Vendor'} Dashboard
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {profile.user?.companyName || user.name}! 👋
          </h1>
          <p className="text-sm text-slate-600">{user.email}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/supplier/products" className="px-4 py-2 bg-slate-100/90 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold transition flex items-center gap-2">
            <Package className="w-4 h-4" /> Manage Products
          </Link>
          <Link href="/dashboard/supplier/profile" className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-2">
            <Edit3 className="w-4 h-4" /> Edit Profile
          </Link>
        </div>
      </div>

      {/* Profile Completeness Score Card */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-300">Profile Strength</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-semibold">{completeness}% Complete</span>
            </div>
            <h3 className="text-lg font-bold mt-1">
              {completeness === 100
                ? '🌟 Perfect! Your supplier profile is 100% complete and verified.'
                : `Complete your profile to rank higher in buyer searches.`}
            </h3>
          </div>
          {completeness < 100 && (
            <Link
              href="/dashboard/supplier/profile"
              className="px-4 py-2 bg-white text-sky-900 hover:bg-sky-50 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm"
            >
              Add {missingItems[0] || 'Details'} →
            </Link>
          )}
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              completeness >= 80 ? 'bg-emerald-400' : completeness >= 50 ? 'bg-amber-400' : 'bg-sky-400'
            }`}
            style={{ width: `${completeness}%` }}
          />
        </div>
        {missingItems.length > 0 && (
          <p className="text-xs text-sky-200">
            Suggested additions: {missingItems.join(' · ')}
          </p>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="bg-amber-50/90 backdrop-blur-md border border-amber-200/80 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">
            🔔 {notifications.length} Unread Notification{notifications.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50/90 text-amber-600 rounded-xl"><Package className="w-5 h-5" /></div>
          <div>
            <div className="text-2xl font-bold">{profile.products.length}</div>
            <div className="text-xs text-slate-500 font-medium">Products Listed</div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50/90 text-blue-600 rounded-xl"><Inbox className="w-5 h-5" /></div>
          <div>
            <div className="text-2xl font-bold">{pendingRFQs}</div>
            <div className="text-xs text-slate-500 font-medium">Pending RFQs</div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50/90 text-sky-600 rounded-xl"><FileText className="w-5 h-5" /></div>
          <div>
            <div className="text-2xl font-bold">{quotationsSent}</div>
            <div className="text-xs text-slate-500 font-medium">Quotations Sent ({responseRate}% Response)</div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50/90 text-emerald-600 rounded-xl"><CheckCircle className="w-5 h-5" /></div>
          <div>
            <div className="text-2xl font-bold">{accepted}</div>
            <div className="text-xs text-slate-500 font-medium">Deals Closed</div>
          </div>
        </div>
      </div>

      {/* Incoming RFQs */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Inbox className="w-5 h-5 text-sky-600" /> Incoming RFQs
          </h2>
          <span className="text-xs text-slate-500">{profile.rfqs.length} total</span>
        </div>

        {profile.rfqs.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700">No RFQs received yet</h3>
            <p className="text-sm text-slate-500 mt-1">Complete your profile and list products to start receiving buyer enquiries.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {profile.rfqs.map((rfq) => (
              <Link key={rfq.id} href={`/rfq/${rfq.id}`} className="flex items-center justify-between p-5 hover:bg-slate-50 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900 truncate">{rfq.productName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${statusBadge(rfq.status)}`}>
                      {rfq.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    From: {rfq.buyer.companyName || rfq.buyer.name} · Qty: {rfq.quantity} {rfq.unit}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {rfq.quotations.length > 0 ? 'Quotation sent ✓' : 'No quotation sent yet'}
                    {' · '}{new Date(rfq.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  {rfq.quotations.length === 0 && rfq.status === 'PENDING' && (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">
                      Respond Now
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
