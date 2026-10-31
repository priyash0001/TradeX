'use client';

import dynamic from 'next/dynamic';
import type { MapSupplierLocation, BusinessFilter } from './VendorMapInner';

interface VendorMapProps {
  dbSuppliers?: MapSupplierLocation[];
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  className?: string;
  onMarkerClick?: (supplier: MapSupplierLocation) => void;
  businessFilter?: BusinessFilter;
}

const VendorMapInner = dynamic(() => import('./VendorMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center animate-pulse text-slate-400">
      <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-sm font-semibold text-slate-600">Loading TradeX Supplier Map…</p>
      <p className="text-xs text-slate-400">Company markers · TradeX directory</p>
    </div>
  ),
});

export default function VendorMap(props: VendorMapProps) {
  return <VendorMapInner {...props} />;
}

export type { MapSupplierLocation, BusinessFilter };
