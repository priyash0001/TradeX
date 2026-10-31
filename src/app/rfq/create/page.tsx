'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, CheckCircle, AlertCircle, Users, X } from 'lucide-react';

interface SupplierOption {
  id: string;
  name: string;
  companyName: string | null;
  city?: string;
}

export default function CreateRFQPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawSupplierIds = searchParams.get('supplierIds') || searchParams.get('supplierId') || '';
  const initialSupplierIds = rawSupplierIds ? rawSupplierIds.split(',').filter(Boolean) : [];
  const prefillProduct = searchParams.get('product') || '';

  const [broadcastSupplierIds, setBroadcastSupplierIds] = useState<string[]>(initialSupplierIds);
  const [selectedSupplierId, setSelectedSupplierId] = useState(initialSupplierIds[0] || '');
  const [supplierList, setSupplierList] = useState<SupplierOption[]>([]);
  const [supplierDetails, setSupplierDetails] = useState<{ name: string; companyName: string | null; city?: string } | null>(null);
  const [broadcastSuppliers, setBroadcastSuppliers] = useState<SupplierOption[]>([]);
  const [productName, setProductName] = useState(prefillProduct);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('units');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(1);
  const [error, setError] = useState('');

  const isBroadcast = broadcastSupplierIds.length > 1;

  // Fetch supplier list for dropdown
  useEffect(() => {
    fetch('/api/suppliers/search?limit=30')
      .then((r) => r.json())
      .then((data) => {
        if (data.suppliers && Array.isArray(data.suppliers)) {
          const list: SupplierOption[] = data.suppliers.map((s: any) => ({
            id: s.id || s.profileId || s.userId,
            name: s.name || s.user?.name || s.companyName || 'Supplier',
            companyName: s.companyName || s.user?.companyName || null,
            city: s.city || s.location || '',
          }));
          setSupplierList(list);
          if (!selectedSupplierId && broadcastSupplierIds.length === 0 && list.length > 0) {
            setSelectedSupplierId(list[0].id);
          }

          // Resolve broadcast suppliers
          if (broadcastSupplierIds.length > 0) {
            const matched = list.filter((s) => broadcastSupplierIds.includes(s.id));
            setBroadcastSuppliers(matched);
          }
        }
      })
      .catch((err) => console.warn('Could not load supplier options:', err));
  }, [broadcastSupplierIds]);

  // Fetch single supplier details when single selection
  useEffect(() => {
    const singleId = isBroadcast ? '' : selectedSupplierId || broadcastSupplierIds[0];
    if (!singleId) return;

    fetch(`/api/suppliers/${singleId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.supplier) {
          const s = data.supplier;
          setSupplierDetails({
            name: s.name || s.user?.name || s.companyName || '',
            companyName: s.companyName || s.user?.companyName || null,
            city: s.city || s.location || '',
          });
        }
      })
      .catch(() => {});
  }, [selectedSupplierId, broadcastSupplierIds, isBroadcast]);

  const removeBroadcastSupplier = (idToRemove: string) => {
    const updated = broadcastSupplierIds.filter((id) => id !== idToRemove);
    setBroadcastSupplierIds(updated);
    setBroadcastSuppliers((prev) => prev.filter((s) => s.id !== idToRemove));
    if (updated.length === 1) {
      setSelectedSupplierId(updated[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetIds = isBroadcast ? broadcastSupplierIds : selectedSupplierId ? [selectedSupplierId] : broadcastSupplierIds;
    if (targetIds.length === 0) {
      setError('Please select at least one supplier to receive this RFQ.');
      return;
    }
    if (!productName.trim()) {
      setError('Product/Service name is required.');
      return;
    }
    const parsedQty = parseInt(quantity, 10);
    if (!quantity || isNaN(parsedQty) || parsedQty <= 0) {
      setError('Please enter a valid quantity greater than 0.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierIds: targetIds,
          supplierId: targetIds[0],
          productName: productName.trim(),
          description: description.trim(),
          quantity: parsedQty,
          unit,
          deadline: deadline || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send RFQ');
      setSuccessCount(targetIds.length);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard/buyer?tab=rfqs#dashboard-content'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send RFQ');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {successCount > 1 ? `Broadcast RFQ Sent to ${successCount} Suppliers!` : 'RFQ Sent Successfully!'}
        </h2>
        <p className="text-sm text-slate-600">
          The supplier{successCount > 1 ? 's have' : ' has'} been notified. Redirecting to your dashboard RFQs...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">Send Request for Quotation</h1>
          </div>

          {isBroadcast ? (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200 mb-3">
                <Users className="w-4 h-4 text-sky-600" />
                <span>Broadcasting to {broadcastSupplierIds.length} Selected Suppliers</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {broadcastSuppliers.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-800 font-medium px-2.5 py-1 rounded-lg border border-slate-200"
                  >
                    {s.companyName || s.name}
                    <button
                      type="button"
                      onClick={() => removeBroadcastSupplier(s.id)}
                      className="text-slate-400 hover:text-red-500 ml-1"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : supplierDetails ? (
            <p className="text-sm text-slate-600 mt-1">
              To: <span className="font-semibold">{supplierDetails.companyName || supplierDetails.name}</span>
              {supplierDetails.city ? ` — ${supplierDetails.city}` : ''}
            </p>
          ) : (
            <p className="text-sm text-slate-500 mt-1">Specify your requirements to receive competitive quotations</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!initialSupplierIds.length && supplierList.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Supplier *</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">-- Select a supplier --</option>
                {supplierList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName || s.name} {s.city ? `(${s.city})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product / Service Required *</label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. CNC Machined Flange 50mm"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description / Specifications</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe specifications, material, grade, finish, or any other requirements..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity Required *</label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {['units', 'kg', 'tons', 'litres', 'meters', 'boxes', 'pcs', 'sheets', 'rolls'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-sm text-sm transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {loading
              ? 'Sending RFQ...'
              : isBroadcast
              ? `Broadcast RFQ to ${broadcastSupplierIds.length} Suppliers`
              : 'Send RFQ to Supplier'}
          </button>
        </form>
      </div>
    </div>
  );
}
