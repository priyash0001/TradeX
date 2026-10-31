/** All 28 Indian states + 8 union territories with map centers. */
export type IndiaRegionKind = 'STATE' | 'UT';

export interface IndiaRegion {
  name: string;
  kind: IndiaRegionKind;
  iso: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const INDIA_REGIONS: IndiaRegion[] = [
  { name: 'Andhra Pradesh', kind: 'STATE', iso: 'IN-AP', lat: 15.9129, lng: 79.7400, zoom: 7 },
  { name: 'Arunachal Pradesh', kind: 'STATE', iso: 'IN-AR', lat: 28.2180, lng: 94.7278, zoom: 7 },
  { name: 'Assam', kind: 'STATE', iso: 'IN-AS', lat: 26.2006, lng: 92.9376, zoom: 7 },
  { name: 'Bihar', kind: 'STATE', iso: 'IN-BR', lat: 25.0961, lng: 85.3131, zoom: 7 },
  { name: 'Chhattisgarh', kind: 'STATE', iso: 'IN-CT', lat: 21.2787, lng: 81.8661, zoom: 7 },
  { name: 'Goa', kind: 'STATE', iso: 'IN-GA', lat: 15.2993, lng: 74.1240, zoom: 9 },
  { name: 'Gujarat', kind: 'STATE', iso: 'IN-GJ', lat: 22.2587, lng: 71.1924, zoom: 7 },
  { name: 'Haryana', kind: 'STATE', iso: 'IN-HR', lat: 29.0588, lng: 76.0856, zoom: 8 },
  { name: 'Himachal Pradesh', kind: 'STATE', iso: 'IN-HP', lat: 31.1048, lng: 77.1734, zoom: 8 },
  { name: 'Jharkhand', kind: 'STATE', iso: 'IN-JH', lat: 23.6102, lng: 85.2799, zoom: 7 },
  { name: 'Karnataka', kind: 'STATE', iso: 'IN-KA', lat: 15.3173, lng: 75.7139, zoom: 7 },
  { name: 'Kerala', kind: 'STATE', iso: 'IN-KL', lat: 10.8505, lng: 76.2711, zoom: 7 },
  { name: 'Madhya Pradesh', kind: 'STATE', iso: 'IN-MP', lat: 22.9734, lng: 78.6569, zoom: 6 },
  { name: 'Maharashtra', kind: 'STATE', iso: 'IN-MH', lat: 19.7515, lng: 75.7139, zoom: 7 },
  { name: 'Manipur', kind: 'STATE', iso: 'IN-MN', lat: 24.6637, lng: 93.9063, zoom: 8 },
  { name: 'Meghalaya', kind: 'STATE', iso: 'IN-ML', lat: 25.4670, lng: 91.3662, zoom: 8 },
  { name: 'Mizoram', kind: 'STATE', iso: 'IN-MZ', lat: 23.1645, lng: 92.9376, zoom: 8 },
  { name: 'Nagaland', kind: 'STATE', iso: 'IN-NL', lat: 26.1584, lng: 94.5624, zoom: 8 },
  { name: 'Odisha', kind: 'STATE', iso: 'IN-OR', lat: 20.9517, lng: 85.0985, zoom: 7 },
  { name: 'Punjab', kind: 'STATE', iso: 'IN-PB', lat: 31.1471, lng: 75.3412, zoom: 8 },
  { name: 'Rajasthan', kind: 'STATE', iso: 'IN-RJ', lat: 27.0238, lng: 74.2179, zoom: 6 },
  { name: 'Sikkim', kind: 'STATE', iso: 'IN-SK', lat: 27.5330, lng: 88.5122, zoom: 9 },
  { name: 'Tamil Nadu', kind: 'STATE', iso: 'IN-TN', lat: 11.1271, lng: 78.6569, zoom: 7 },
  { name: 'Telangana', kind: 'STATE', iso: 'IN-TG', lat: 18.1124, lng: 79.0193, zoom: 7 },
  { name: 'Tripura', kind: 'STATE', iso: 'IN-TR', lat: 23.9408, lng: 91.9882, zoom: 8 },
  { name: 'Uttar Pradesh', kind: 'STATE', iso: 'IN-UP', lat: 26.8467, lng: 80.9462, zoom: 6 },
  { name: 'Uttarakhand', kind: 'STATE', iso: 'IN-UT', lat: 30.0668, lng: 79.0193, zoom: 7 },
  { name: 'West Bengal', kind: 'STATE', iso: 'IN-WB', lat: 22.9868, lng: 87.8550, zoom: 7 },
  { name: 'Andaman and Nicobar Islands', kind: 'UT', iso: 'IN-AN', lat: 11.7401, lng: 92.6586, zoom: 7 },
  { name: 'Chandigarh', kind: 'UT', iso: 'IN-CH', lat: 30.7333, lng: 76.7794, zoom: 12 },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', kind: 'UT', iso: 'IN-DH', lat: 20.1809, lng: 73.0169, zoom: 9 },
  { name: 'Delhi', kind: 'UT', iso: 'IN-DL', lat: 28.6139, lng: 77.2090, zoom: 10 },
  { name: 'Jammu and Kashmir', kind: 'UT', iso: 'IN-JK', lat: 33.2778, lng: 75.3412, zoom: 7 },
  { name: 'Ladakh', kind: 'UT', iso: 'IN-LA', lat: 34.1526, lng: 77.5770, zoom: 7 },
  { name: 'Lakshadweep', kind: 'UT', iso: 'IN-LD', lat: 10.5667, lng: 72.6417, zoom: 8 },
  { name: 'Puducherry', kind: 'UT', iso: 'IN-PY', lat: 11.9416, lng: 79.8083, zoom: 10 },
];

export const INDIA_MAP_CENTER: { center: [number, number]; zoom: number } = {
  center: [22.3511, 78.6677],
  zoom: 5,
};

export const STATE_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = Object.fromEntries(
  INDIA_REGIONS.map((r) => [r.name, { lat: r.lat, lng: r.lng, zoom: r.zoom }]),
);

export const INDIA_STATE_NAMES = INDIA_REGIONS.map((r) => r.name);

export function getRegionCenter(state?: string | null): { lat: number; lng: number; zoom: number } {
  if (state && STATE_CENTERS[state]) return STATE_CENTERS[state];
  return { lat: INDIA_MAP_CENTER.center[0], lng: INDIA_MAP_CENTER.center[1], zoom: INDIA_MAP_CENTER.zoom };
}
