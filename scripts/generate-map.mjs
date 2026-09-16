import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { feature as topoFeature } from 'topojson-client';
import { geoMercator, geoPath } from 'd3-geo';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const REGIONS = [
  {
    id: 'cwrd', name: 'Central and West Asia', shortName: 'CWRD',
    color: '#007DB7', officeCity: 'Tashkent', officeLngLat: [69.2797, 41.2995],
    stat: '10 member countries',
    countryCodes: { AFG:4, ARM:51, AZE:31, GEO:268, KAZ:398, KGZ:417, PAK:586, TJK:762, TKM:795, UZB:860 }
  },
  {
    id: 'eard', name: 'East Asia', shortName: 'EARD',
    color: '#8DC63F', officeCity: 'Beijing', officeLngLat: [116.4074, 39.9042],
    stat: '5 member countries',
    countryCodes: { CHN:156, HKG:344, KOR:410, MNG:496, TWN:158 }
  },
  {
    id: 'sard', name: 'South Asia', shortName: 'SARD',
    color: '#FDB915', officeCity: 'New Delhi', officeLngLat: [77.2167, 28.6448],
    stat: '6 member countries',
    countryCodes: { BGD:50, BTN:64, IND:356, MDV:462, NPL:524, LKA:144 }
  },
  {
    id: 'serd', name: 'Southeast Asia', shortName: 'SERD',
    color: '#00A5D2', officeCity: 'Manila', officeLngLat: [120.9842, 14.5995],
    stat: '11 member countries',
    countryCodes: { BRN:96, KHM:116, IDN:360, LAO:418, MYS:458, MMR:104, PHL:608, SGP:702, THA:764, TLS:626, VNM:704 }
  },
  {
    id: 'pard', name: 'Pacific', shortName: 'PARD',
    color: '#E9532B', officeCity: 'Port Moresby', officeLngLat: [147.1803, -9.4438],
    stat: '14 member countries',
    countryCodes: { COK:184, FJI:242, KIR:296, MHL:584, FSM:583, NRU:520, NIU:570, PLW:585, PNG:598, WSM:882, SLB:90, TON:776, TUV:798, VUT:548 }
  }
];

const CAPITAL_FALLBACKS = {
  TWN: [121.5654, 25.0329], HKG: [114.1694, 22.3193],
  MDV: [73.5089, 4.1755],   SGP: [103.8198, 1.3521],
  BRN: [114.9420, 4.9031],  TLS: [125.5736, -8.5569],
  COK: [-159.7777, -21.2075], NRU: [166.9209, -0.5477],
  NIU: [-169.9200, -19.0544], TUV: [179.1940, -8.5243],
  MHL: [171.3803, 7.0897],   PLW: [134.6239, 7.5004],
  FSM: [158.1850, 6.9147],   KIR: [173.0176, 1.3291],
  WSM: [-171.7694, -13.8333], TON: [-175.2166, -21.1361],
};

const topoRaw = readFileSync(resolve(root, 'node_modules/world-atlas/countries-50m.json'), 'utf8');
const topology = JSON.parse(topoRaw);
const allFeatures = topoFeature(topology, topology.objects.countries);

console.log('Sample feature id:', allFeatures.features[0]?.id, 'type:', typeof allFeatures.features[0]?.id);

const featureByNumericId = new Map();
for (const f of allFeatures.features) {
  const num = parseInt(String(f.id), 10);
  if (!isNaN(num)) featureByNumericId.set(num, f);
}

const matched = new Map();
const missing = [];

for (const region of REGIONS) {
  for (const [alpha3, numId] of Object.entries(region.countryCodes)) {
    if (featureByNumericId.has(numId)) {
      matched.set(alpha3, { feature: featureByNumericId.get(numId), regionId: region.id });
    } else {
      missing.push({ alpha3, numId, regionId: region.id });
    }
  }
}

console.log(`Matched ${matched.size} polygons.`);
if (missing.length) {
  console.warn('Missing polygons (capital marker fallback):', missing.map(m => `${m.alpha3}(${m.numId})`).join(', '));
}

const W = 960, H = 500;

const filteredFC = {
  type: 'FeatureCollection',
  features: [...matched.values()].map(m => m.feature)
};

const projection = geoMercator()
  .rotate([-150, 0])
  .fitSize([W, H], filteredFC);

const pathGen = geoPath().projection(projection);

const countryEntries = [];
for (const [alpha3, { feature: f, regionId }] of matched.entries()) {
  const d = pathGen(f);
  if (d) countryEntries.push({ iso: alpha3, regionId, path: d, hasPolygon: true });
}
for (const { alpha3, regionId } of missing) {
  countryEntries.push({ iso: alpha3, regionId, path: null, hasPolygon: false });
}

const regionEntries = REGIONS.map(r => {
  const [lng, lat] = r.officeLngLat;
  const proj = projection([lng, lat]);
  const x = proj ? (proj[0] / W) * 100 : 50;
  const y = proj ? (proj[1] / H) * 100 : 50;
  return {
    id: r.id, name: r.name, shortName: r.shortName,
    color: r.color, officeCity: r.officeCity,
    countries: Object.keys(r.countryCodes),
    stat: r.stat,
    markerX: Math.round(x * 100) / 100,
    markerY: Math.round(y * 100) / 100,
  };
});

const markerOnlyEntries = missing.map(({ alpha3, regionId }) => {
  const fallback = CAPITAL_FALLBACKS[alpha3];
  if (!fallback) { console.warn(`No capital fallback for ${alpha3}`); return null; }
  const proj = projection(fallback);
  return {
    iso: alpha3, regionId,
    markerX: proj ? Math.round((proj[0] / W) * 10000) / 100 : null,
    markerY: proj ? Math.round((proj[1] / H) * 10000) / 100 : null,
  };
}).filter(Boolean);

const publicDir = resolve(root, 'public');
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

const output = {
  viewBox: `0 0 ${W} ${H}`,
  width: W, height: H,
  countries: countryEntries,
  regions: regionEntries,
  markerOnly: markerOnlyEntries,
};

writeFileSync(resolve(publicDir, 'adb-map.json'), JSON.stringify(output, null, 2), 'utf8');
console.log(`Written public/adb-map.json — ${countryEntries.length} countries, ${regionEntries.length} regions`);
console.log('Region markers:');
for (const r of regionEntries) console.log(`  ${r.shortName}: x=${r.markerX}% y=${r.markerY}%`);
