import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TablerIconComponent } from '@tabler/icons-angular';
import { DateRangeFilter } from '../../shared/date-range-filter/date-range-filter';

type KptTab = 'knowledge' | 'people' | 'tasks';
type SortDir = 'asc' | 'desc';
type ResourceSortKey = 'name' | 'type' | 'uploaded' | 'retrievals' | 'utilization' | 'negative' | 'positive';
type PromptSortKey = 'name' | 'negative' | 'positive';
type DrawerView = 'resource' | 'prompt';
type ContributionMode = 'vpu' | 'country';

interface ContributionSlice {
  label: string;
  fullName: string;   // Tooltip text — for department codes this expands to the unit name.
  count: number;
  pct: number;
  color: string;
  pathD: string;
}

/** ADB department code → full unit name. Sourced from the ADB organisational
 *  structure. Falls back to the code itself when unknown so the tooltip is
 *  never empty. */
const VPU_FULL_NAMES: Record<string, string> = {
  DOCK:  'Communications & Knowledge Management',
  ITD:   'Information Technology Department',
  ORM:   'Office of Risk Management',
  PSOD:  'Private Sector Operations Department',
  ERDI:  'Economic Research & Development Impact Department',
  SARD:  'South Asia Department',
  CWRD:  'Central and West Asia Department',
  EARD:  'East Asia Department',
  SERD:  'Southeast Asia Department',
  PARD:  'Pacific Department',
  BPMSD: 'Budget, People & Management Systems Department',
  CCSD:  'Climate Change & Sustainable Development Department',
  SD1:   'Sectors Department 1',
  SD2:   'Sectors Department 2',
  SD3:   'Sectors Department 3',
};

/** A user-prompt *type* — i.e. many submissions that share the same intent
 *  against this resource. Carries the aggregated feedback shown in the
 *  prompt detail drawer view: total positive/negative counts plus a
 *  breakdown of negatives across the five standard reason labels. */
interface NegReasonCount { label: string; count: number; }
interface UserPrompt {
  text: string;
  negative: number;     // % of submissions that gave a thumbs-down
  positive: number;     // % of submissions that gave a thumbs-up
  positiveCount: number;
  negativeCount: number;
  /** Fixed length 5, ordered: instructions, factual, offensive, language, other. */
  negativeBreakdown: NegReasonCount[];
  /** Free-text comments captured when a user picked "Other" as the reason. */
  otherComments: string[];
}

/** Standard reason labels used in the negative-feedback breakdown. Mirrors
 *  the analysis page so the two views stay in lockstep. */
const NEG_REASON_LABELS = [
  'Did not Follow Instructions',
  'Not Factually Correct',
  'Offensive/Unsafe',
  'Wrong Language',
  'Other',
] as const;

interface KpiMetric { value: string; label?: string; delta?: string; }
interface PromptCategory { label: string; pct: number; prompts: number; }
interface ResourceRow {
  name: string;
  type: string;
  uploaded: string;          // ISO yyyy-mm-dd for sort
  uploadedDisplay: string;   // pre-formatted
  retrievals: number;        // 0-100 %
  utilization: number;       // 0-100 %
  negative: number;          // count
  positive: number;          // count
  // Provenance — captured at upload time. vpu = contributing unit code,
  // country = ISO label of the contributing country.
  vpu: string;
  country: string;
}

const SLUG_TO_NAME: Record<string, string> = {
  // ADB collections registry rows
  'climate-adaptation-financing-framework':  'Climate Adaptation Financing Framework',
  'water-resilience-toolkit':                'Water Resilience Toolkit',
  'urban-flooding-drainage-reports':         'Urban Flooding & Drainage Reports',
  'digital-public-infrastructure-playbook':  'Digital Public Infrastructure Playbook',
  'ai-readiness-country-assessments':        'AI Readiness Country Assessments',
  'health-systems-resilience-notes':         'Health Systems Resilience Notes',
  'education-technology-deployment-cases':   'Education Technology Deployment Cases',
  'debt-sustainability-analysis-repository': 'Debt Sustainability Analysis Repository',
  'sme-growth-and-jobs-repository':          'SME Growth and Jobs Repository',
  // Dashboard country-drawer ADB collections
  'board-paper-library':                     'Board Paper Library',
  'publications':                            'Publications',
  'afnr':                                    'AFNR',
  'operation-manuals-and-staff-instruction': 'Operation Manuals & Staff Instruction',
  'project-admin-instructions':              'Project Admin Instructions',
  'navigator-faqs':                          'Navigator FAQs',
  'eoperations-library':                     'eOperations Library',
  // Analysis-page collections
  'country-growth-and-jobs':                 'Country Growth and Jobs',
  'fiscal-policy-and-growth':                'Fiscal Policy and Growth',
  'macro-poverty-outlook':                   'Macro Poverty Outlook',
  'country-economic-updates':                'Country Economic Updates',
  'public-finance-review':                   'Public Finance Review',
  'other-collections':                       'Other Collections',
  'climate-adaptation-toolkit':              'Climate Adaptation Toolkit',
  'water-policy-notes':                      'Water Policy Notes',
  'debt-sustainability-analysis':            'Debt Sustainability Analysis',
  'regional-energy-strategy':                'Regional Energy Strategy',
  'trade-corridor-studies':                  'Trade Corridor Studies',
  'education-sector-notes':                  'Education Sector Notes',
  // People-domain collections
  'staff-expertise-directory':               'Staff Expertise Directory',
  'project-team-histories':                  'Project Team Histories',
  'mission-and-btor-archives':               'Mission & BTOR Archives',
  'country-operations-metadata':             'Country Operations Metadata',
  'communities-of-practice':                 'Communities of Practice',
  'external-publications':                   'External Publications',
  // Tasks-domain
  'tor-library':                             'Project Brief Template Library',
  'tor-genie-templates':                     'Project Brief Templates',
  'project-concept-notes-archive':           'Project Concept Notes Archive',
  'standard-specifications':                 'Standard Specifications',
  'operations-policy-library':               'Operations Policy Library',
  'procurement-notices-archive':             'Procurement Notices Archive',
  'knowledge-notes':                         'Knowledge Notes',
  // Lessons
  'icrr-archive':                            'ICRR Archive',
  'ppar-database':                           'PPAR Database',
  'performance-and-learning-reviews':        'Performance and Learning Reviews',
  'ieg-independent-review':                  'IED Independent Evaluation',
  // Other featured
  'policy-research-working-papers':          'Policy Research Working Papers',
  'ifc-insights-and-reports':               'AFNR',
};

@Component({
  selector: 'app-collection-detail',
  imports: [TablerIconComponent, RouterLink, DateRangeFilter],
  templateUrl: './collection-detail.html',
  styleUrl: './collection-detail.css',
})
export class CollectionDetail {
  private readonly route = inject(ActivatedRoute);

  readonly slug = signal<string>(this.route.snapshot.paramMap.get('slug') ?? 'water-resilience-toolkit');
  readonly name = computed(() => SLUG_TO_NAME[this.slug()] ?? 'Water Resilience Toolkit');

  // ----- header metadata pills -----
  readonly meta = {
    type:      'Strategic Toolkit',
    domain:    'Infrastructure & Financing',
    verticals: 'Infrastructure, Finance',
    updated:   '2 hours ago',
    sectors:   'Water, Climate',
  };

  // ----- KPI cards: Health Score | Source Utilisation | Total Queries | Last Updated -----
  readonly kpis: { title: string; metrics: KpiMetric[]; sub?: string; feedback?: { positive: number; negative: number } }[] = [
    {
      title: 'Health Score',
      metrics: [{ value: '82', delta: '+4' }],
      sub: 'out of 100',
    },
    {
      title: 'Source Utilisation',
      metrics: [{ value: '67%', delta: '+4pp' }],
      sub: 'documents retrieved or cited at least once',
    },
    {
      title: 'Total Queries',
      metrics: [{ value: '847', delta: '+12%' }],
      sub: 'prompts referencing this collection',
    },
    {
      title: 'Last Updated',
      metrics: [{ value: 'Jul 7' }],
      sub: '40 days ago',
    },
  ];

  // ----- Top Prompt Categories (tabbed treemap) -----
  readonly activeTab = signal<KptTab>('knowledge');
  readonly tabDefs: { id: KptTab; label: string }[] = [
    { id: 'knowledge', label: 'Knowledge' },
    { id: 'people',    label: 'People' },
    { id: 'tasks',     label: 'Tasks' },
  ];
  readonly categoriesByTab: Record<KptTab, PromptCategory[]> = {
    knowledge: [
      { label: 'Flood Resilience Planning',      pct: 39, prompts: 198 },
      { label: 'Climate Adaptation & Resilience Strategies', pct: 24, prompts: 122 },
      { label: 'Water & Infrastructure Financing',            pct: 22, prompts: 112 },
      { label: 'Urban Resilience',               pct:  9, prompts:  46 },
      { label: 'Disaster Preparedness',          pct:  6, prompts:  30 },
    ],
    people: [
      { label: 'Water Resources Specialists',    pct: 48, prompts: 100 },
      { label: 'Climate Adaptation & Resilience Leads', pct: 28, prompts:  59 },
      { label: 'Hydrologists',                   pct: 12, prompts:  25 },
      { label: 'Urban Planners',                 pct:  7, prompts:  15 },
      { label: 'M&E Specialists',                pct:  5, prompts:  10 },
    ],
    tasks: [
      { label: 'Project Brief: Water Sector Diagnostic',   pct: 52, prompts:  66 },
      { label: 'Project Concept Notes',                    pct: 22, prompts:  28 },
      { label: 'Synthesis: Drought Response',              pct: 14, prompts:  18 },
      { label: 'Briefs: Climate Adaptation & Resilience',  pct:  7, prompts:   9 },
      { label: 'Slides: Resilience Outcomes',              pct:  5, prompts:   6 },
    ],
  };
  readonly activeCategories = computed(() => this.categoriesByTab[this.activeTab()]);

  // ----- Contribution pie (By Department / By Country) -----
  readonly contributionMode = signal<ContributionMode>('vpu');
  setContributionMode(m: ContributionMode) { this.contributionMode.set(m); }

  private static readonly CONTRIBUTION_PALETTE = [
    '#E879F9', // fuchsia / magenta
    '#A78BFA', // violet
    '#67E8F9', // cyan
    '#34D399', // emerald
    '#A5B4FC', // indigo
    '#FCD34D', // amber
    '#FB7185', // rose
    '#22D3EE', // sky
  ];

  readonly contributionSlices = computed<ContributionSlice[]>(() => {
    const mode = this.contributionMode();
    const counts: Record<string, number> = {};
    for (const r of this.resources) {
      const key = mode === 'vpu' ? r.vpu : r.country;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const total = Object.values(counts).reduce((s, c) => s + c, 0);
    if (total === 0) return [];
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    const cx = 50, cy = 50, r = 40;
    let cumulative = 0;
    const palette = CollectionDetail.CONTRIBUTION_PALETTE;
    return entries.map(([label, count], i) => {
      const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
      const endAngle = ((cumulative + count) / total) * 2 * Math.PI - Math.PI / 2;
      cumulative += count;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      const pathD = entries.length === 1
        ? `M ${cx - r},${cy} A ${r},${r} 0 1 1 ${cx + r},${cy} A ${r},${r} 0 1 1 ${cx - r},${cy} Z`
        : `M ${cx},${cy} L ${x1.toFixed(2)},${y1.toFixed(2)} A ${r},${r} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
      return {
        label,
        fullName: mode === 'vpu' ? (VPU_FULL_NAMES[label] ?? label) : label,
        count,
        pct: Math.round((count / total) * 100),
        color: palette[i % palette.length],
        pathD,
      };
    });
  });

  // ----- Knowledge Coverage donut -----
  private static readonly DONUT_CIRC = 251.327;
  readonly coverage = { totalFiles: 2345, cited: 40, referenced: 27, notRetrieved: 33 };
  readonly donutCirc = CollectionDetail.DONUT_CIRC;
  readonly donutCited       = computed(() => (this.coverage.cited       / 100) * this.donutCirc);
  readonly donutReferenced  = computed(() => (this.coverage.referenced  / 100) * this.donutCirc);
  readonly donutNotRetrieved = computed(() => (this.coverage.notRetrieved / 100) * this.donutCirc);
  readonly donutOffsetReferenced  = computed(() => -this.donutCited());
  readonly donutOffsetNotRetrieved = computed(() => -(this.donutCited() + this.donutReferenced()));

  // ----- Resources table -----
  // ADB department codes sourced from ADB organisational catalogue.
  readonly resources: ResourceRow[] = [
    { name: 'Flood Resilience Financing.pdf',            type: 'Framework',    uploaded: '2026-05-14', uploadedDisplay: 'May 14, 2026', retrievals: 82, utilization: 95, negative: 6400, positive: 6400, vpu: 'CWRD', country: 'Uzbekistan' },
    { name: 'Urban Drainage Strategy 2024.docx',         type: 'Strategy',     uploaded: '2026-05-12', uploadedDisplay: 'May 12, 2026', retrievals: 79, utilization: 35, negative: 5900, positive: 5900, vpu: 'SERD', country: 'Philippines' },
    { name: 'Drought Resilience Case Studies',           type: 'Web Link',     uploaded: '2026-05-10', uploadedDisplay: 'May 10, 2026', retrievals: 74, utilization: 86, negative: 4800, positive: 4800, vpu: 'SARD', country: 'Bangladesh' },
    { name: 'Digital Public Infrastructure Playbook',    type: 'Playbook',     uploaded: '2026-04-12', uploadedDisplay: 'Apr 12, 2026', retrievals: 88, utilization: 56, negative: 3000, positive: 3000, vpu: 'DOCK', country: 'Philippines' },
    { name: 'AI Readiness Country Assessments',          type: 'Assessment',   uploaded: '2026-04-06', uploadedDisplay: 'Apr 6, 2026',  retrievals: 71, utilization: 43, negative: 2900, positive: 2900, vpu: 'ERDI', country: 'Indonesia' },
    { name: 'Health Systems Resilience Notes',           type: 'Notes',        uploaded: '2026-04-06', uploadedDisplay: 'Apr 6, 2026',  retrievals: 77, utilization: 93, negative: 2000, positive: 2000, vpu: 'SD2',  country: 'Bangladesh' },
    { name: 'Education Technology Deployment Cases',     type: 'Case Studies', uploaded: '2026-04-04', uploadedDisplay: 'Apr 4, 2026',  retrievals: 75, utilization: 82, negative: 1200, positive: 1200, vpu: 'EARD', country: 'China' },
    { name: 'Debt Sustainability Analysis Repository',   type: 'Repository',   uploaded: '2026-04-02', uploadedDisplay: 'Apr 2, 2026',  retrievals: 84, utilization: 68, negative: 1100, positive: 1100, vpu: 'ERDI', country: 'India' },
    { name: 'SME Growth and Jobs Repository',            type: 'Repository',   uploaded: '2026-04-01', uploadedDisplay: 'Apr 1, 2026',  retrievals: 69, utilization: 52, negative: 1000, positive: 1000, vpu: 'PSOD', country: 'India' },
  ];

  readonly resSortKey = signal<ResourceSortKey>('retrievals');
  readonly resSortDir = signal<SortDir>('desc');

  readonly sortedResources = computed(() => {
    const key = this.resSortKey();
    const mul = this.resSortDir() === 'asc' ? 1 : -1;
    return [...this.resources].sort((a, b) => {
      const va = this.resValue(a, key);
      const vb = this.resValue(b, key);
      if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * mul;
      return ((va as number) - (vb as number)) * mul;
    });
  });

  private resValue(r: ResourceRow, key: ResourceSortKey): string | number {
    switch (key) {
      case 'name':        return r.name;
      case 'type':        return r.type;
      case 'uploaded':    return new Date(r.uploaded).getTime();
      case 'retrievals':  return r.retrievals;
      case 'utilization': return r.utilization;
      case 'negative':    return r.negative;
      case 'positive':    return r.positive;
    }
  }

  toggleResSort(key: ResourceSortKey) {
    if (this.resSortKey() === key) {
      this.resSortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.resSortKey.set(key);
      this.resSortDir.set(key === 'name' || key === 'type' ? 'asc' : 'desc');
    }
  }

  formatNum(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return n.toLocaleString();
  }

  // ----- Resource Details drawer (two views: resource | prompt) -----
  readonly drawerOpen = signal(false);
  readonly drawerView = signal<DrawerView>('resource');
  readonly drawerResource = signal<ResourceRow | null>(null);
  readonly drawerPrompt = signal<UserPrompt | null>(null);
  readonly drawerResourceId = computed(() => {
    const r = this.drawerResource();
    if (!r) return '';
    const seed = (r.name.charCodeAt(0) * 31 + r.name.length * 7).toString(16);
    return `col_${seed.padStart(8, '0').slice(0, 8)}`;
  });

  openResourceDrawer(r: ResourceRow) {
    this.drawerResource.set(r);
    this.drawerView.set('resource');
    this.drawerPrompt.set(null);
    this.drawerOpen.set(true);
  }
  openPromptDetail(p: UserPrompt) {
    this.drawerPrompt.set(p);
    this.drawerView.set('prompt');
  }
  backToResource() {
    this.drawerView.set('resource');
    this.drawerPrompt.set(null);
  }
  closeDrawer() {
    this.drawerOpen.set(false);
    setTimeout(() => {
      this.drawerView.set('resource');
      this.drawerPrompt.set(null);
      this.drawerResource.set(null);
    }, 280);
  }

  readonly drawerSourceOccurrence = computed(() => {
    const r = this.drawerResource();
    return r ? Math.max(1, Math.round(r.retrievals / 7)) : 0;
  });
  readonly drawerReliability = computed(() => {
    const r = this.drawerResource();
    return r ? +(r.utilization / 500).toFixed(2) : 0;
  });

  readonly resourcePrompts: UserPrompt[] = [
    {
      text: 'What financing mechanisms support flood resilience infrastructure?',
      negative: 21, positive: 79,
      positiveCount: 84, negativeCount: 22,
      negativeBreakdown: [
        { label: NEG_REASON_LABELS[0], count: 8 },
        { label: NEG_REASON_LABELS[1], count: 7 },
        { label: NEG_REASON_LABELS[2], count: 0 },
        { label: NEG_REASON_LABELS[3], count: 2 },
        { label: NEG_REASON_LABELS[4], count: 5 },
      ],
      otherComments: [
        'Did not reference the latest ADB Country Partnership Strategy.',
        'Wanted project figures from 2025, not 2022.',
        'Missed disaggregated sector data for the CWRD region.',
      ],
    },
    {
      text: 'How can governments fund long-term climate resilience projects?',
      negative: 26, positive: 68,
      positiveCount: 54, negativeCount: 21,
      negativeBreakdown: [
        { label: NEG_REASON_LABELS[0], count: 6 },
        { label: NEG_REASON_LABELS[1], count: 8 },
        { label: NEG_REASON_LABELS[2], count: 0 },
        { label: NEG_REASON_LABELS[3], count: 2 },
        { label: NEG_REASON_LABELS[4], count: 5 },
      ],
      otherComments: [
        'Lacked comparable case studies from peer countries.',
        'No multi-year financing structures discussed.',
      ],
    },
    {
      text: 'What are effective investment models for urban drainage systems?',
      negative: 30, positive: 64,
      positiveCount: 38, negativeCount: 18,
      negativeBreakdown: [
        { label: NEG_REASON_LABELS[0], count: 5 },
        { label: NEG_REASON_LABELS[1], count: 7 },
        { label: NEG_REASON_LABELS[2], count: 0 },
        { label: NEG_REASON_LABELS[3], count: 1 },
        { label: NEG_REASON_LABELS[4], count: 5 },
      ],
      otherComments: [
        'Cost figures feel outdated.',
        'Wanted recent unit-cost benchmarks.',
      ],
    },
    {
      text: 'What PPP structures are commonly used for resilient water infrastructure?',
      negative: 24, positive: 70,
      positiveCount: 44, negativeCount: 15,
      negativeBreakdown: [
        { label: NEG_REASON_LABELS[0], count: 5 },
        { label: NEG_REASON_LABELS[1], count: 4 },
        { label: NEG_REASON_LABELS[2], count: 0 },
        { label: NEG_REASON_LABELS[3], count: 2 },
        { label: NEG_REASON_LABELS[4], count: 4 },
      ],
      otherComments: [
        'Missed concrete risk-allocation matrices.',
      ],
    },
    {
      text: 'How do countries finance disaster preparedness and flood recovery?',
      negative: 28, positive: 65,
      positiveCount: 32, negativeCount: 14,
      negativeBreakdown: [
        { label: NEG_REASON_LABELS[0], count: 4 },
        { label: NEG_REASON_LABELS[1], count: 5 },
        { label: NEG_REASON_LABELS[2], count: 0 },
        { label: NEG_REASON_LABELS[3], count: 2 },
        { label: NEG_REASON_LABELS[4], count: 3 },
      ],
      otherComments: [
        'Too focused on developed markets — wanted Asia-Pacific-specific examples.',
      ],
    },
    {
      text: 'What role do MDBs play in financing flood resilience projects?',
      negative: 25, positive: 70,
      positiveCount: 36, negativeCount: 13,
      negativeBreakdown: [
        { label: NEG_REASON_LABELS[0], count: 4 },
        { label: NEG_REASON_LABELS[1], count: 5 },
        { label: NEG_REASON_LABELS[2], count: 0 },
        { label: NEG_REASON_LABELS[3], count: 1 },
        { label: NEG_REASON_LABELS[4], count: 3 },
      ],
      otherComments: [
        'Wanted post-2024 MDB pledge data.',
      ],
    },
    {
      text: 'Which countries have successful flood resilience financing programs?',
      negative: 22, positive: 72,
      positiveCount: 28, negativeCount: 9,
      negativeBreakdown: [
        { label: NEG_REASON_LABELS[0], count: 3 },
        { label: NEG_REASON_LABELS[1], count: 3 },
        { label: NEG_REASON_LABELS[2], count: 0 },
        { label: NEG_REASON_LABELS[3], count: 1 },
        { label: NEG_REASON_LABELS[4], count: 2 },
      ],
      otherComments: [
        'Lacked evaluation outcomes — wanted impact evaluation summaries.',
      ],
    },
  ];

  readonly promptSortKey = signal<PromptSortKey>('negative');
  readonly promptSortDir = signal<SortDir>('desc');
  readonly sortedPrompts = computed(() => {
    const key = this.promptSortKey();
    const mul = this.promptSortDir() === 'asc' ? 1 : -1;
    return [...this.resourcePrompts].sort((a, b) => {
      if (key === 'name') return a.text.localeCompare(b.text) * mul;
      return ((a[key] as number) - (b[key] as number)) * mul;
    });
  });
  togglePromptSort(key: PromptSortKey) {
    if (this.promptSortKey() === key) {
      this.promptSortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.promptSortKey.set(key);
      this.promptSortDir.set(key === 'name' ? 'asc' : 'desc');
    }
  }

  // ----- Collection Health Score -----
  readonly healthScore = {
    score: 74,
    grade: 'Good' as const,
    breakdown: [
      { label: 'Knowledge Coverage',     score: 67, weight: 30 },
      { label: 'Feedback Positivity',    score: 72, weight: 25 },
      { label: 'Retrieval Rate',         score: 78, weight: 25 },
      { label: 'Content Freshness',      score: 82, weight: 20 },
    ],
  };

  // ----- Contributions per Dept/Owner -----
  readonly contributionsByDept: { vpu: string; name: string; resources: number; pct: number; lastAdded: string }[] = [
    { vpu: 'ERDI', name: 'Economic Research',               resources: 2, pct: 22, lastAdded: 'Apr 6, 2026' },
    { vpu: 'CWRD', name: 'Central and West Asia',           resources: 1, pct: 11, lastAdded: 'May 14, 2026' },
    { vpu: 'SERD', name: 'Southeast Asia',                  resources: 1, pct: 11, lastAdded: 'May 12, 2026' },
    { vpu: 'SARD', name: 'South Asia',                      resources: 1, pct: 11, lastAdded: 'May 10, 2026' },
    { vpu: 'DOCK', name: 'Communications & Knowledge',      resources: 1, pct: 11, lastAdded: 'Apr 12, 2026' },
    { vpu: 'SD2',  name: 'Sectors Department 2',            resources: 1, pct: 11, lastAdded: 'Apr 6, 2026' },
    { vpu: 'EARD', name: 'East Asia',                       resources: 1, pct: 11, lastAdded: 'Apr 4, 2026' },
    { vpu: 'PSOD', name: 'Private Sector Operations',       resources: 1, pct: 11, lastAdded: 'Apr 1, 2026' },
  ];

  // ----- Content Freshness by Contributor -----
  readonly contentFreshness: { vpu: string; latestDoc: string; avgAgeDays: number; staleCount: number }[] = [
    { vpu: 'CWRD', latestDoc: 'May 14, 2026', avgAgeDays:  94, staleCount: 0 },
    { vpu: 'SERD', latestDoc: 'May 12, 2026', avgAgeDays:  96, staleCount: 0 },
    { vpu: 'SARD', latestDoc: 'May 10, 2026', avgAgeDays:  98, staleCount: 0 },
    { vpu: 'DOCK', latestDoc: 'Apr 12, 2026', avgAgeDays: 126, staleCount: 0 },
    { vpu: 'ERDI', latestDoc: 'Apr 6, 2026',  avgAgeDays: 132, staleCount: 1 },
    { vpu: 'SD2',  latestDoc: 'Apr 6, 2026',  avgAgeDays: 132, staleCount: 0 },
    { vpu: 'EARD', latestDoc: 'Apr 4, 2026',  avgAgeDays: 134, staleCount: 0 },
    { vpu: 'PSOD', latestDoc: 'Apr 1, 2026',  avgAgeDays: 137, staleCount: 1 },
  ];

  // ----- Contribution Trend (weekly new resources added) -----
  private readonly trendWeeks = ['May 3', 'May 10', 'May 17', 'May 24', 'May 31', 'Jun 7', 'Jun 14', 'Jun 21'];
  private readonly trendAdded = [1, 2, 3, 1, 0, 1, 1, 0];
  readonly trendChartW = 480;
  readonly trendChartH = 100;
  private readonly trendPadL = 32;
  private readonly trendPadR = 12;
  private readonly trendPadT = 12;
  private readonly trendPadB = 28;
  private readonly trendYMax  = 4;

  private trendToX(i: number): number {
    const w = this.trendChartW - this.trendPadL - this.trendPadR;
    return this.trendPadL + (i / (this.trendWeeks.length - 1)) * w;
  }
  private trendToY(v: number): number {
    const h = this.trendChartH - this.trendPadT - this.trendPadB;
    return this.trendPadT + (1 - v / this.trendYMax) * h;
  }

  readonly trendBars = this.trendAdded.map((v, i) => ({
    x: this.trendToX(i) - 12,
    y: this.trendToY(v),
    width: 22,
    height: this.trendChartH - this.trendPadB - this.trendToY(v),
    label: this.trendWeeks[i],
    value: v,
  }));
  readonly trendXTicks = this.trendWeeks.map((label, i) => ({ label, x: this.trendToX(i) }));
}
