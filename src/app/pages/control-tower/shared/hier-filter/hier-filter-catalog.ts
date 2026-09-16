// =============================================================================
// Shared filter catalogs — Region/Country, Department hierarchies.
// Values sourced from ADB organisational structure.
// =============================================================================

export interface HierGroup {
  /** Stable id used for selection state — usually the region/department code. */
  id: string;
  label: string;
  children: HierLeaf[];
}

export interface HierLeaf {
  /** Stable id used for selection state — ISO code or department code slug. */
  id: string;
  label: string;
}

/**
 * Build a HierFilter initial-selection array from `?region=…` / `?country=…`
 * query params (as written by the dashboard country drawer's "View X" links).
 * - `?region=cwrd` → returns every country leaf id under the CWRD group (which
 *   the HierFilter then renders as a fully-selected region).
 * - `?country=ph` → returns ['ph'].
 */
export function regionCountrySelectionFromParams(
  params: { region?: string | null; country?: string | null },
): string[] {
  const region  = params.region?.toLowerCase()  ?? null;
  const country = params.country?.toLowerCase() ?? null;
  if (region) {
    const group = REGION_GROUPS.find(g => g.id === region);
    return group ? group.children.map(c => c.id) : [];
  }
  if (country) return [country];
  return [];
}

// ----- Region / Country -----
export const REGION_GROUPS: HierGroup[] = [
  {
    id: 'resident-missions',
    label: 'Representative / Special Offices',
    children: [
      { id: 'be', label: 'Belgium' },
      { id: 'jp', label: 'Japan' },
      { id: 'sg', label: 'Singapore' },
      { id: 'us', label: 'United States' },
    ],
  },
  {
    id: 'cwrd',
    label: 'Central & West Asia (CWRD)',
    children: [
      { id: 'af', label: 'Afghanistan' },
      { id: 'am', label: 'Armenia' },
      { id: 'az', label: 'Azerbaijan' },
      { id: 'ge', label: 'Georgia' },
      { id: 'kz', label: 'Kazakhstan' },
      { id: 'kg', label: 'Kyrgyz Republic' },
      { id: 'pk', label: 'Pakistan' },
      { id: 'tj', label: 'Tajikistan' },
      { id: 'tm', label: 'Turkmenistan' },
      { id: 'uz', label: 'Uzbekistan' },
    ],
  },
  {
    id: 'eard',
    label: 'East Asia (EARD)',
    children: [
      { id: 'cn', label: "People's Republic of China" },
      { id: 'mn', label: 'Mongolia' },
    ],
  },
  {
    id: 'sard',
    label: 'South Asia (SARD)',
    children: [
      { id: 'bd', label: 'Bangladesh' },
      { id: 'bt', label: 'Bhutan' },
      { id: 'in', label: 'India' },
      { id: 'mv', label: 'Maldives' },
      { id: 'np', label: 'Nepal' },
      { id: 'lk', label: 'Sri Lanka' },
    ],
  },
  {
    id: 'serd',
    label: 'South East Asia (SERD)',
    children: [
      { id: 'kh', label: 'Cambodia' },
      { id: 'id', label: 'Indonesia' },
      { id: 'la', label: 'Lao PDR' },
      { id: 'mm', label: 'Myanmar' },
      { id: 'ph', label: 'Philippines' },
      { id: 'th', label: 'Thailand' },
      { id: 'tl', label: 'Timor-Leste' },
      { id: 'vn', label: 'Vietnam' },
    ],
  },
  {
    id: 'pard',
    label: 'Pacific (PARD)',
    children: [
      { id: 'ck', label: 'Cook Islands' },
      { id: 'fj', label: 'Fiji' },
      { id: 'ki', label: 'Kiribati' },
      { id: 'mh', label: 'Marshall Islands' },
      { id: 'fm', label: 'Federated States of Micronesia' },
      { id: 'nr', label: 'Nauru' },
      { id: 'nu', label: 'Niue' },
      { id: 'pw', label: 'Palau' },
      { id: 'pg', label: 'Papua New Guinea' },
      { id: 'ws', label: 'Samoa' },
      { id: 'sb', label: 'Solomon Islands' },
      { id: 'to', label: 'Tonga' },
      { id: 'tv', label: 'Tuvalu' },
      { id: 'vu', label: 'Vanuatu' },
    ],
  },
];

// ----- Department groups (authoritative ADB department catalogue) -----
// Leaf ids are prefixed with `vpu-` so they remain unique across catalogs
// (department codes may overlap with region group ids).
export const VPU_GROUPS: HierGroup[] = [
  {
    id: 'vp-offices',
    label: 'VP Offices',
    children: [
      { id: 'vpu-vpac', label: 'VPAC — VP Administration & Corporate Management' },
      { id: 'vpu-vpfr', label: 'VPFR — VP Finance & Risk Management' },
      { id: 'vpu-vpms', label: 'VPMS — VP Multilateral Sustainable Development' },
      { id: 'vpu-vpr1', label: 'VPR1 — VP Regional Operations 1' },
      { id: 'vpu-vpr2', label: 'VPR2 — VP Regional Operations 2' },
      { id: 'vpu-vpst', label: 'VPST — VP Strategy & Policy' },
    ],
  },
  {
    id: 'regional-ops',
    label: 'Regional Departments',
    children: [
      { id: 'vpu-cwrd', label: 'CWRD — Central and West Asia' },
      { id: 'vpu-eard', label: 'EARD — East Asia' },
      { id: 'vpu-pard', label: 'PARD — Pacific' },
      { id: 'vpu-sard', label: 'SARD — South Asia' },
      { id: 'vpu-serd', label: 'SERD — Southeast Asia' },
    ],
  },
  {
    id: 'sectors-themes',
    label: 'Sectors & Themes',
    children: [
      { id: 'vpu-ccsd', label: 'CCSD — Climate Change & Sustainable Development' },
      { id: 'vpu-sd1',  label: 'SD1 — Sectors Department 1' },
      { id: 'vpu-sd2',  label: 'SD2 — Sectors Department 2' },
      { id: 'vpu-sd3',  label: 'SD3 — Sectors Department 3' },
    ],
  },
  {
    id: 'private-sector',
    label: 'Private Sector & Capital Markets',
    children: [
      { id: 'vpu-psod', label: 'PSOD — Private Sector Operations' },
      { id: 'vpu-omdp', label: 'OMDP — Office of Markets Development & PPP' },
      { id: 'vpu-opec', label: 'OPEC — Office of Public-Private & Capital Market Dev.' },
    ],
  },
  {
    id: 'finance-treasury',
    label: 'Finance & Treasury',
    children: [
      { id: 'vpu-ctl',  label: 'CTL — Controller\'s Department' },
      { id: 'vpu-osfg', label: 'OSFG — Office of Sustainable Finance & Guarantees' },
      { id: 'vpu-ospf', label: 'OSPF — Office of Special Project Financing' },
      { id: 'vpu-ppfd', label: 'PPFD — Procurement, Portfolio & Financial Management' },
      { id: 'vpu-td',   label: 'TD — Treasury Department' },
    ],
  },
  {
    id: 'knowledge-strategy',
    label: 'Knowledge & Strategy',
    children: [
      { id: 'vpu-dock', label: 'DOCK — Communications & Knowledge Management' },
      { id: 'vpu-erdi', label: 'ERDI — Economic Research & Development Impact' },
      { id: 'vpu-spd',  label: 'SPD — Strategy and Policy' },
    ],
  },
  {
    id: 'corporate-services',
    label: 'Corporate Services',
    children: [
      { id: 'vpu-bpmsd', label: 'BPMSD — Budget, People & Management Systems' },
      { id: 'vpu-csd',   label: 'CSD — Corporate Services Department' },
      { id: 'vpu-itd',   label: 'ITD — Information Technology' },
      { id: 'vpu-orm',   label: 'ORM — Office of Risk Management' },
      { id: 'vpu-sec',   label: 'SEC — Office of the Secretary' },
    ],
  },
  {
    id: 'operations-mgmt',
    label: 'Operations Management',
    children: [
      { id: 'vpu-ied',  label: 'IED — Independent Evaluation' },
      { id: 'vpu-oomp', label: 'OOMP — Office of Operations Management & Portfolio' },
      { id: 'vpu-opr',  label: 'OPR — Office of Pacific Regional Cooperation' },
    ],
  },
  {
    id: 'legal-compliance',
    label: 'Legal, Compliance & Integrity',
    children: [
      { id: 'vpu-oag',  label: 'OAG — Office of the Auditor General' },
      { id: 'vpu-oai',  label: 'OAI — Office of Anticorruption & Integrity' },
      { id: 'vpu-ocrp', label: 'OCRP — Office of Cofinancing & Resource Partnerships' },
      { id: 'vpu-ogc',  label: 'OGC — Office of the General Counsel' },
    ],
  },
  {
    id: 'governance-other',
    label: 'Governance & Other',
    children: [
      { id: 'vpu-adbx', label: 'ADBx' },
      { id: 'vpu-bioc', label: 'BIOC' },
      { id: 'vpu-bod',  label: 'BOD — Board of Directors' },
      { id: 'vpu-crpn', label: 'CRPN' },
    ],
  },
];

// ----- Vertical / Sector (ADB sector framework) -----
export const VERTICAL_GROUPS: HierGroup[] = [
  {
    id: 'infrastructure-connectivity',
    label: 'Infrastructure & Connectivity',
    children: [
      { id: 'transport',            label: 'Transport' },
      { id: 'energy',               label: 'Energy' },
      { id: 'digital-infra',        label: 'Digital Infrastructure' },
      { id: 'water-urban',          label: 'Water & Urban' },
    ],
  },
  {
    id: 'social-sectors',
    label: 'Social Sectors',
    children: [
      { id: 'education',            label: 'Education' },
      { id: 'health-social',        label: 'Health & Social Protection' },
      { id: 'gender-equity',        label: 'Gender Equity' },
    ],
  },
  {
    id: 'finance-private-sector',
    label: 'Finance & Private Sector',
    children: [
      { id: 'finance',              label: 'Finance' },
      { id: 'capital-markets',      label: 'Capital Markets' },
      { id: 'private-sector-dev',   label: 'Private Sector Dev' },
    ],
  },
  {
    id: 'environment-climate',
    label: 'Environment & Climate',
    children: [
      { id: 'climate-change',       label: 'Climate Change' },
      { id: 'environment',          label: 'Environment' },
      { id: 'disaster-risk',        label: 'Disaster Risk' },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    children: [
      { id: 'public-sector-mgmt',   label: 'Public Sector Mgmt' },
      { id: 'regional-cooperation', label: 'Regional Cooperation' },
      { id: 'anticorruption',       label: 'Anticorruption' },
    ],
  },
];
