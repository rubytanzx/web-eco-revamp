/**
 * Generates adb-map.json with full world map paths.
 * Uses world-atlas (110m simplified), topojson-client, and d3-geo.
 * Run: node scripts/generate-world-map.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { geoEquirectangular, geoPath } from 'd3-geo';
import * as topojson from 'topojson-client';

const WIDTH  = 1000;
const HEIGHT = 500;

// ── Load source data ──────────────────────────────────────────────────────────
const world    = JSON.parse(readFileSync('./node_modules/world-atlas/countries-110m.json', 'utf8'));
const existing = JSON.parse(readFileSync('./public/adb-map.json', 'utf8'));

// ── ISO numeric → alpha-3 (subset needed; others show as un-assigned grey) ───
const NUM_TO_A3 = {
  '004':'AFG','008':'ALB','012':'DZA','024':'AGO','031':'AZE','032':'ARG',
  '036':'AUS','040':'AUT','048':'BHR','050':'BGD','056':'BEL','064':'BTN',
  '068':'BOL','070':'BIH','076':'BRA','096':'BRN','100':'BGR','104':'MMR',
  '112':'BLR','116':'KHM','120':'CMR','124':'CAN','144':'LKA','152':'CHL',
  '156':'CHN','158':'TWN','170':'COL','178':'COG','180':'COD','184':'COK',
  '191':'HRV','192':'CUB','203':'CZE','208':'DNK','214':'DOM','218':'ECU',
  '231':'ETH','233':'EST','242':'FJI','246':'FIN','250':'FRA','268':'GEO',
  '275':'PSE','276':'DEU','288':'GHA','296':'KIR','300':'GRC','324':'GIN',
  '332':'HTI','344':'HKG','348':'HUN','356':'IND','360':'IDN','364':'IRN',
  '368':'IRQ','372':'IRL','376':'ISR','380':'ITA','384':'CIV','388':'JAM',
  '392':'JPN','398':'KAZ','400':'JOR','404':'KEN','408':'PRK','410':'KOR',
  '414':'KWT','417':'KGZ','418':'LAO','422':'LBN','428':'LVA','434':'LBY',
  '440':'LTU','442':'LUX','458':'MYS','462':'MDV','466':'MLI','484':'MEX',
  '496':'MNG','499':'MNE','504':'MAR','508':'MOZ','512':'OMN','520':'NRU',
  '524':'NPL','528':'NLD','540':'NCL','548':'VUT','554':'NZL','558':'NIC',
  '562':'NER','566':'NGA','570':'NIU','578':'NOR','583':'FSM','584':'MHL',
  '585':'PLW','586':'PAK','598':'PNG','600':'PRY','604':'PER','608':'PHL',
  '616':'POL','620':'PRT','626':'TLS','634':'QAT','642':'ROU','643':'RUS',
  '682':'SAU','686':'SEN','688':'SRB','694':'SLE','702':'SGP','703':'SVK',
  '704':'VNM','705':'SVN','706':'SOM','710':'ZAF','716':'ZWE','724':'ESP',
  '736':'SDN','748':'SWZ','752':'SWE','756':'CHE','760':'SYR','762':'TJK',
  '764':'THA','776':'TON','784':'ARE','788':'TUN','792':'TUR','795':'TKM',
  '798':'TUV','800':'UGA','804':'UKR','807':'MKD','818':'EGY','826':'GBR',
  '834':'TZA','840':'USA','854':'BFA','858':'URY','860':'UZB','862':'VEN',
  '882':'WSM','887':'YEM','894':'ZMB','090':'SLB',
};

// ── ADB region assignments ────────────────────────────────────────────────────
const REGION_MAP = {
  AFG:'cwrd', ARM:'cwrd', AZE:'cwrd', GEO:'cwrd', KAZ:'cwrd',
  KGZ:'cwrd', PAK:'cwrd', TJK:'cwrd', TKM:'cwrd', UZB:'cwrd',
  CHN:'eard', HKG:'eard', KOR:'eard', MNG:'eard', TWN:'eard',
  BGD:'sard', BTN:'sard', IND:'sard', MDV:'sard', NPL:'sard', LKA:'sard',
  BRN:'serd', KHM:'serd', IDN:'serd', LAO:'serd', MYS:'serd',
  MMR:'serd', PHL:'serd', SGP:'serd', THA:'serd', TLS:'serd', VNM:'serd',
  COK:'pard', FJI:'pard', KIR:'pard', MHL:'pard', FSM:'pard',
  NRU:'pard', NIU:'pard', PLW:'pard', PNG:'pard', WSM:'pard',
  SLB:'pard', TON:'pard', VUT:'pard', TUV:'pard',
};

// ── Projection ────────────────────────────────────────────────────────────────
const projection = geoEquirectangular()
  .scale(WIDTH / (2 * Math.PI))
  .translate([WIDTH / 2, HEIGHT / 2]);

const pathGen = geoPath(projection);

// ── Generate country paths ────────────────────────────────────────────────────
const features = topojson.feature(world, world.objects.countries).features;

const countries = features
  .map(f => {
    const numId = String(f.id).padStart(3, '0');
    const iso    = NUM_TO_A3[numId] ?? null;
    const d      = pathGen(f);
    if (!d) return null;
    return { iso: iso ?? `n${f.id}`, regionId: iso ? (REGION_MAP[iso] ?? null) : null, path: d };
  })
  .filter(Boolean);

// ── Marker helpers ────────────────────────────────────────────────────────────
function pct(lng, lat) {
  return {
    x: +( ((lng + 180) / 360) * 100 ).toFixed(2),
    y: +( ((90 - lat)  / 180) * 100 ).toFixed(2),
  };
}

// ── Updated region markers ────────────────────────────────────────────────────
const REGION_COORDS = {
  cwrd: { lng:  69.3, lat:  41.3 }, // Tashkent
  eard: { lng: 116.4, lat:  39.9 }, // Beijing
  sard: { lng:  77.2, lat:  28.6 }, // New Delhi
  serd: { lng: 121.0, lat:  14.6 }, // Manila
  pard: { lng: 147.2, lat:  -9.44 }, // Port Moresby
};

const regions = existing.regions.map(r => {
  const c = REGION_COORDS[r.id];
  if (!c) return r;
  const { x, y } = pct(c.lng, c.lat);
  return { ...r, markerX: x, markerY: y };
});

// ── Updated liaison office markers ───────────────────────────────────────────
const LIAISON_COORDS = {
  ero:  { lng:   8.7, lat:  50.1 }, // Frankfurt
  jro:  { lng: 139.7, lat:  35.7 }, // Tokyo
  naro: { lng: -77.0, lat:  38.9 }, // Washington D.C.
  plco: { lng: 178.4, lat: -18.1 }, // Suva
  pso:  { lng: 147.2, lat:  -9.44 }, // Port Moresby
  sgo:  { lng: 103.8, lat:   1.3 }, // Singapore
};

const liaisonOffices = existing.liaisonOffices.map(o => {
  const c = LIAISON_COORDS[o.id];
  if (!c) return o;
  const { x, y } = pct(c.lng, c.lat);
  return { ...o, markerX: x, markerY: y };
});

// ── Write output ──────────────────────────────────────────────────────────────
const out = {
  viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
  width:  WIDTH,
  height: HEIGHT,
  countries,
  regions,
  markerOnly: [],
  liaisonOffices,
};

writeFileSync('./public/adb-map.json', JSON.stringify(out));
console.log(`✓ ${countries.length} countries written to public/adb-map.json`);
console.log('Region markers:');
regions.forEach(r => console.log(`  ${r.id}: ${r.markerX}%, ${r.markerY}%`));
console.log('Liaison markers:');
liaisonOffices.forEach(o => console.log(`  ${o.id}: ${o.markerX ?? 'null'}%, ${o.markerY ?? 'null'}%`));
