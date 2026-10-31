'use client';

// Leaflet map for TradeX companies only (DB + MIDC + filtered Google Places).
// Tiles: Esri Light Gray Canvas (no Carto API key; no POI icons).
// Clustering: supercluster — zoom to reach every individual company.

import { useEffect, useRef, useCallback } from 'react';
import type { BusinessType } from '@/app/api/map/businesses/route';

export interface MapSupplierLocation {
  id: string;
  name: string;
  companyName?: string | null;
  role: 'MANUFACTURER' | 'VENDOR' | string;
  city?: string;
  state?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  products?: { id: string; name: string; indicativePrice?: number | null; unit?: string }[];
  osmId?: string;
  businessType?: BusinessType | string;
  industry?: string;
  phone?: string;
  website?: string;
  source?: string;
}

export type { BusinessType } from '@/app/api/map/businesses/route';

export type BusinessFilter =
  | ''
  | 'manufacturer'
  | 'warehouse'
  | 'wholesale'
  | 'wholesaler'
  | 'distributor'
  | 'vendor'
  | 'supplier'
  | 'dealer'
  | 'trader'
  | 'industrial'
  | 'MANUFACTURER'
  | 'VENDOR'
  | 'SUPPLIER'
  | 'DISTRIBUTOR'
  | 'WHOLESALER'
  | 'DEALER'
  | 'TRADER';

interface VendorMapInnerProps {
  dbSuppliers?: MapSupplierLocation[];
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  className?: string;
  onMarkerClick?: (supplier: MapSupplierLocation) => void;
  businessFilter?: BusinessFilter;
}

const TYPE_COLOR: Record<string, string> = {
  manufacturer: '#d97706',
  vendor:       '#059669',
  supplier:     '#0284c7',
  distributor:  '#7c3aed',
  wholesaler:   '#0891b2',
  wholesale:    '#0891b2',
  dealer:       '#4f46e5',
  trader:       '#ea580c',
  warehouse:    '#6366f1',
  industrial:   '#b45309',
  other:        '#64748b',
};

const TYPE_LABEL: Record<string, string> = {
  manufacturer: 'Manufacturer',
  vendor:       'Vendor',
  supplier:     'Supplier',
  distributor:  'Distributor',
  wholesaler:   'Wholesaler',
  wholesale:    'Wholesaler',
  dealer:       'Dealer',
  trader:       'Trader',
  warehouse:    'Warehouse',
  industrial:   'Industrial',
  other:        'Company',
};

const TYPE_GLYPH: Record<string, string> = {
  manufacturer: 'M',
  vendor:       'V',
  supplier:     'S',
  distributor:  'D',
  wholesaler:   'W',
  wholesale:    'W',
  dealer:       'L',
  trader:       'T',
  warehouse:    'H',
  industrial:   'I',
  other:        'C',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function normalizeBusinessType(role?: string, businessType?: string): string {
  const raw = `${businessType || ''} ${role || ''}`.toLowerCase();
  if (raw.includes('manufactur')) return 'manufacturer';
  if (raw.includes('distribut')) return 'distributor';
  if (raw.includes('wholesale') || raw.includes('wholesal')) return 'wholesaler';
  if (raw.includes('dealer')) return 'dealer';
  if (raw.includes('trader')) return 'trader';
  if (raw.includes('warehouse')) return 'warehouse';
  if (raw.includes('suppli')) return 'supplier';
  if (raw.includes('vendor')) return 'vendor';
  if (raw.includes('industrial')) return 'industrial';
  return 'vendor';
}

function matchesBusinessFilter(supplier: MapSupplierLocation, filter: BusinessFilter): boolean {
  if (!filter) return true;
  const type = normalizeBusinessType(supplier.role, supplier.businessType);
  const f = String(filter).toLowerCase();
  if (f === 'wholesale') return type === 'wholesaler';
  if (f === 'industrial') return type === 'manufacturer' || type === 'industrial' || type === 'warehouse';
  return type === f;
}

function makeSvgMarker(color: string, glyph: string, scale = 1): string {
  const w = Math.round(28 * scale);
  const h = Math.round(36 * scale);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 28 36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
            fill="${color}" stroke="white" stroke-width="2"/>
      <text x="14" y="18" font-family="system-ui,sans-serif" font-size="11"
            font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">${glyph}</text>
    </svg>`.trim();
}

function makeClusterSvg(count: number, color: string): string {
  const size = count < 10 ? 34 : count < 50 ? 40 : 48;
  const r = size / 2;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${r}" cy="${r}" r="${r}" fill="${color}" fill-opacity="0.20" stroke="${color}" stroke-width="2"/>
      <circle cx="${r}" cy="${r}" r="${r - 6}" fill="${color}"/>
      <text x="${r}" y="${r}" font-family="system-ui,sans-serif" font-size="${r < 18 ? 10 : 12}"
            font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">${count}</text>
    </svg>`.trim();
}

function buildPopupHtml(props: {
  name: string;
  businessType?: string;
  industry?: string;
  address?: string;
}): string {
  const typeKey = normalizeBusinessType(undefined, props.businessType);
  const label = TYPE_LABEL[typeKey] ?? 'Company';
  const color = TYPE_COLOR[typeKey] ?? TYPE_COLOR.other;
  const badgeStyle = `display:inline-block;font-size:10px;font-weight:700;padding:2px 7px;border-radius:9999px;background:${color}22;color:${color};text-transform:uppercase;`;
  const industry = props.industry
    ? `<div style="font-size:11px;color:#475569;margin-top:4px;">Industry: ${escapeHtml(props.industry)}</div>`
    : '';
  const addr = props.address
    ? `<div style="font-size:11px;color:#64748b;margin-top:4px;">${escapeHtml(props.address)}</div>`
    : '';

  return `
    <div style="font-family:Inter,system-ui,sans-serif;padding:4px 2px;min-width:180px;max-width:260px;">
      <div style="margin-bottom:4px;">
        <span style="${badgeStyle}">${escapeHtml(label)}</span>
      </div>
      <div style="font-size:14px;font-weight:700;color:#0f172a;line-height:1.3;">${escapeHtml(props.name)}</div>
      ${industry}${addr}
    </div>
  `;
}

let leafletPromise: Promise<any> | null = null;
let superclusterPromise: Promise<any> | null = null;

function loadMapModules() {
  if (!leafletPromise) {
    leafletPromise = import('leaflet');
  }
  if (!superclusterPromise) {
    superclusterPromise = import('supercluster').then((m) => m.default || m);
  }
  return Promise.all([leafletPromise, superclusterPromise]);
}

export default function VendorMapInner({
  dbSuppliers = [],
  initialCenter = [19.9975, 73.7898],
  initialZoom = 12,
  height = '500px',
  className = '',
  onMarkerClick,
  businessFilter = '',
}: VendorMapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const superclusterRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scClassRef = useRef<any>(null);

  const suppliersRef = useRef<MapSupplierLocation[]>(dbSuppliers);
  const filterRef = useRef<BusinessFilter>(businessFilter);
  const onMarkerClickRef = useRef(onMarkerClick);
  const fitKeyRef = useRef<string>('');

  suppliersRef.current = dbSuppliers;
  filterRef.current = businessFilter;
  onMarkerClickRef.current = onMarkerClick;

  const visibleCompanies = useCallback(() => {
    return suppliersRef.current.filter((s) => {
      if (s.latitude == null || s.longitude == null) return false;
      if (!Number.isFinite(s.latitude) || !Number.isFinite(s.longitude)) return false;
      return matchesBusinessFilter(s, filterRef.current);
    });
  }, []);

  const drawClustersFromIndex = useCallback((L: any, index: any, fitToCompanies = false) => {
    const map = mapRef.current;
    const layer = clusterLayerRef.current;
    if (!map || !layer || !index) return;

    const zoom = map.getZoom();
    const bounds = map.getBounds();
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
    const clusters = index.getClusters(bbox, Math.round(zoom));

    layer.clearLayers();

    for (const feature of clusters) {
      const [lng, lat] = feature.geometry.coordinates;

      if (feature.properties.cluster) {
        const count: number = feature.properties.point_count;
        const svg = makeClusterSvg(count, '#0284c7');
        const size = count < 10 ? 34 : count < 50 ? 40 : 48;
        const icon = L.divIcon({
          html: svg,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        const marker = L.marker([lat, lng], { icon });
        marker.on('click', () => {
          const expansionZoom = Math.min(
            index.getClusterExpansionZoom(feature.properties.cluster_id),
            16
          );
          map.flyTo([lat, lng], expansionZoom, { duration: 0.35 });
        });
        layer.addLayer(marker);
      } else {
        const company: MapSupplierLocation = feature.properties.company;
        const typeKey = normalizeBusinessType(company.role, company.businessType);
        const color = TYPE_COLOR[typeKey] ?? TYPE_COLOR.other;
        const glyph = TYPE_GLYPH[typeKey] ?? 'C';
        const svg = makeSvgMarker(color, glyph, 1.1);
        const icon = L.divIcon({
          html: svg,
          className: '',
          iconSize: [31, 40],
          iconAnchor: [15, 40],
          popupAnchor: [0, -38],
        });
        const marker = L.marker([lat, lng], { icon });
        const displayName = company.companyName || company.name;
        marker.bindPopup(
          buildPopupHtml({
            name: displayName,
            businessType: typeKey,
            industry: company.industry,
            address: company.address || [company.city, company.state].filter(Boolean).join(', '),
          }),
          { maxWidth: 280 }
        );

        marker.on('click', () => {
          onMarkerClickRef.current?.(company);
        });
        layer.addLayer(marker);
      }
    }

    if (fitToCompanies) {
      const companies = visibleCompanies();
      if (companies.length > 0) {
        const fitKey = companies.map((c) => c.id).join('|') + `:${filterRef.current}`;
        if (fitKey !== fitKeyRef.current) {
          fitKeyRef.current = fitKey;
          if (companies.length === 1) {
            map.setView([companies[0].latitude, companies[0].longitude], Math.max(initialZoom, 13), {
              animate: true,
            });
          } else {
            const latLngs = companies.map((c) => [c.latitude, c.longitude] as [number, number]);
            map.fitBounds(latLngs, { padding: [36, 36], maxZoom: 14, animate: true });
          }
        }
      }
    }
  }, [initialZoom, visibleCompanies]);

  const updateIndexAndRender = useCallback((fitToCompanies = false) => {
    if (!scClassRef.current || !lRef.current || !mapRef.current) return;
    const Supercluster = scClassRef.current;
    const L = lRef.current;

    const companies = visibleCompanies();
    const newIndex = new Supercluster({ radius: 56, maxZoom: 16, minZoom: 0 });
    newIndex.load(
      companies.map((s) => ({
        type: 'Feature' as const,
        properties: { company: s },
        geometry: { type: 'Point' as const, coordinates: [s.longitude as number, s.latitude as number] },
      }))
    );
    superclusterRef.current = newIndex;
    drawClustersFromIndex(L, newIndex, fitToCompanies);
  }, [drawClustersFromIndex, visibleCompanies]);

  const renderOnPanOrZoom = useCallback(() => {
    if (lRef.current && superclusterRef.current) {
      drawClustersFromIndex(lRef.current, superclusterRef.current, false);
    }
  }, [drawClustersFromIndex]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    loadMapModules().then(([L, Supercluster]) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      lRef.current = L;
      scClassRef.current = Supercluster;

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const map = L.map(containerRef.current!, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: true,
        attributionControl: true,
        maxZoom: 16,
      });

      // Light gray canvas: geography + roads only. Carto public tiles now watermark "API KEY REQUIRED".
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution:
            'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &middot; Esri, HERE, Garmin, FAO, NOAA, USGS',
          maxZoom: 16,
        }
      ).addTo(map);

      clusterLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      map.on('zoomend moveend', renderOnPanOrZoom);

      updateIndexAndRender(true);
    }).catch(console.error);

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      clusterLayerRef.current = null;
      superclusterRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateIndexAndRender(true);
  }, [dbSuppliers, businessFilter, updateIndexAndRender]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (visibleCompanies().length === 0) {
      map.setView(initialCenter, initialZoom);
    }
  }, [initialCenter, initialZoom, visibleCompanies]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm ${className}`}>
      <div
        ref={loadingRef}
        style={{ display: 'none' }}
        className="absolute inset-0 z-[100] pointer-events-none items-center justify-center bg-white/30 backdrop-blur-[2px]"
      >
        <div className="bg-white rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2.5 border border-slate-200">
          <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-700">Loading companies…</span>
        </div>
      </div>

      <div className="absolute top-12 right-3 z-[50] bg-white/95 backdrop-blur-sm px-3 py-2.5 rounded-xl shadow-md border border-slate-200 text-xs font-semibold space-y-1.5 pointer-events-none">
        {[
          { color: TYPE_COLOR.manufacturer, label: 'Manufacturer' },
          { color: TYPE_COLOR.vendor, label: 'Vendor' },
          { color: TYPE_COLOR.supplier, label: 'Supplier' },
          { color: TYPE_COLOR.distributor, label: 'Distributor' },
          { color: TYPE_COLOR.wholesaler, label: 'Wholesaler' },
          { color: TYPE_COLOR.dealer, label: 'Dealer' },
          { color: TYPE_COLOR.trader, label: 'Trader' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-slate-700">{label}</span>
          </div>
        ))}
      </div>

      <div ref={containerRef} style={{ height, width: '100%' }} />
    </div>
  );
}
