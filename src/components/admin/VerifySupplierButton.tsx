'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VerifySupplierButtonProps {
  supplierId: string;
  isVerified: boolean;
  supplierName: string;
}

export default function VerifySupplierButton({
  supplierId,
  isVerified: initialVerified,
  supplierName,
}: VerifySupplierButtonProps) {
  const [isVerified, setIsVerified] = useState(initialVerified);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    const nextAction = isVerified ? 'UNVERIFY' : 'VERIFY';
    setLoading(true);

    try {
      const res = await fetch('/api/admin/verify-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, action: nextAction }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsVerified(data.isVerified);
        router.refresh();
      } else {
        alert(data.error || 'Failed to update verification status');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while updating supplier verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
        isVerified
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
          : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isVerified ? `Click to revoke verification for ${supplierName}` : `Approve & verify ${supplierName}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isVerified ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified (Revoke)</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Approve &amp; Verify</span>
        </>
      )}
    </button>
  );
}
