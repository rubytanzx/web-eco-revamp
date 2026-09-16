import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TablerIconComponent } from '@tabler/icons-angular';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';

type Workspace = 'adb' | 'psod';
type HeatmapMode = 'region' | 'vpu';
type CollectionSort = 'feedback' | 'positive' | 'negative';
type FeedbackCategory = 'Incorrect Sources' | 'Irrelevant Response' | 'Unclear Answer' | 'Other Feedback';

interface KpiMetric { value: string; label?: string; delta?: string; }
interface PageKpi   { title: string; metrics: KpiMetric[]; sub?: string; }

interface FlaggedCategory {
  id: string;
  name: string;
  pct: number;       // size in treemap (share of flagged volume)
  count: number;     // negative responses
  color: string;
  trending?: boolean;
}

interface FlaggedCollection {
  rank: number;
  title: string;
  prompts: number;
  positiveCount: number;
  negativeCount: number;
  negativePct: number;
  positivePct: number;
  reliability: { relevancy: number; accuracy: number; completeness: number };
}

interface FeedbackRecord {
  id: number;
  userName: string;
  promptText: string;
  responseExcerpt: string;
  fullResponse: string;
  sentiment: 'positive' | 'negative';
  feedbackCategory: FeedbackCategory;
  feedbackNote?: string;
  userRole: string;
  department: string;
  collection?: string;
  timestamp: string;
  date: string;
}

type FeedbackTypeIcon =
  | 'alert-triangle'
  | 'message-report'
  | 'circle-x'
  | 'arrows-shuffle'
  | 'target';

interface NegativeFeedbackType {
  title: string;
  reports: number;
  sharePct: number;     // share of all negatives
  icon: FeedbackTypeIcon;
}

interface HeatmapCell {
  /** 0..1 intensity */
  value: number;
}

@Component({
  selector: 'app-feedback',
  imports: [TablerIconComponent, RouterLink, DateRangeFilter],
  templateUrl: './feedback.html',
  styleUrl: './feedback.css',
})
export class Feedback {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor() {
    const param = this.route.snapshot.queryParamMap.get('collection');
    if (param) {
      const match = this.flaggedCollections.find(c => c.title === param);
      if (match) this.openFbDrawer(match);
    }
  }

  openCollectionDrawer(name: string) {
    this.router.navigate(['/collections'], { queryParams: { open: name } });
  }

  // ---- Written feedback table scroll state ----
  readonly wfTableScrolled = signal(false);
  onWfTableScroll(e: Event) {
    this.wfTableScrolled.set((e.target as HTMLElement).scrollLeft > 0);
  }

  // ---- Workspace toggle (ADB / PSOD) ----
  readonly workspace = signal<Workspace>('adb');
  setWorkspace(w: Workspace) { this.workspace.set(w); }

  // ---- Top KPI row (4 cards) ----
  readonly feedbackKpis: { title: string; value: string; sub?: string; tooltip?: string }[] = [
    { title: 'Feedback Received', value: '1,496', tooltip: 'Total feedback responses submitted by users during this period.' },
    { title: 'Feedback Response Rate', value: '73%',   sub: 'of prompts',       tooltip: 'Percentage of prompts where users submitted a feedback rating.' },
    { title: 'Positive',          value: '1,077', sub: '72% of feedback',  tooltip: 'Responses rated as helpful or accurate by users.' },
    { title: 'Negative',          value: '419',   sub: '28% of feedback',  tooltip: 'Responses rated as unhelpful, inaccurate, or missing key information.' },
  ];

  // ---- Collection Feedback sort ----
  readonly sortOptions: { key: CollectionSort; label: string }[] = [
    { key: 'feedback', label: 'Most feedback' },
    { key: 'positive', label: 'Most positive' },
    { key: 'negative', label: 'Most negative' },
  ];
  readonly collectionSort = signal<CollectionSort>('feedback');
  readonly sortedCollections = computed(() => {
    const key = this.collectionSort();
    return [...this.flaggedCollections].sort((a, b) =>
      key === 'positive' ? b.positivePct - a.positivePct :
      key === 'negative' ? b.negativePct - a.negativePct :
      b.prompts - a.prompts
    );
  });

  // ---- Written feedback filters ----
  readonly feedbackSearch       = signal('');
  readonly sentimentFilter      = signal<'all' | 'positive' | 'negative'>('all');
  readonly categoryFilter       = signal<FeedbackCategory | 'all'>('all');
  readonly collectionFilterWF   = signal<string>('all');

  readonly filteredRecords = computed(() => {
    const q   = this.feedbackSearch().toLowerCase().trim();
    const s   = this.sentimentFilter();
    const fc  = this.categoryFilter();
    const col = this.collectionFilterWF();
    return this.feedbackRecords.filter(r =>
      (q   === '' || r.promptText.toLowerCase().includes(q) || r.responseExcerpt.toLowerCase().includes(q)) &&
      (s   === 'all' || r.sentiment === s) &&
      (fc  === 'all' || r.feedbackCategory === fc) &&
      (col === 'all' || r.collection === col)
    );
  });

  // ---- Feedback Details drawer ----
  readonly selectedRecord = signal<FeedbackRecord | null>(null);
  readonly drawerOpen     = computed(() => this.selectedRecord() !== null);
  openRecord(r: FeedbackRecord)  { this.selectedRecord.set(r); }
  closeRecord()                  { this.selectedRecord.set(null); }

  readonly feedbackCategories: FeedbackCategory[] = [
    'Incorrect Sources', 'Irrelevant Response', 'Unclear Answer', 'Other Feedback',
  ];

  copyPrompt(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  catSlug(cat: FeedbackCategory): string {
    return cat.toLowerCase().replace(/ /g, '-');
  }

  reliabilityLabel(v: number): string {
    if (v >= 70) return 'Good';
    if (v >= 55) return 'Fair';
    return 'Needs attention';
  }

  reliabilityColor(v: number): 'good' | 'fair' | 'poor' {
    if (v >= 70) return 'good';
    if (v >= 55) return 'fair';
    return 'poor';
  }

  // ---- Card 1: Most Flagged Prompt Categories (treemap) ----
  // Same colour language as the Prompts page treemap; pct drives cell size,
  // count is negative responses received in this category.
  readonly flaggedCategories: FlaggedCategory[][] = [
    [
      { id: 'eg',  name: 'Policies & Guidelines',             pct: 28, count: 79, color: '#c4385c' },
      { id: 'ml',  name: 'Admin & Employee Support',          pct: 17, count: 47, color: '#d44e74', trending: true },
      { id: 'oth', name: 'General',                           pct: 14, count: 40, color: '#b85c72' },
    ],
    [
      { id: 'exp', name: 'Templates & Documents',             pct: 13, count: 37, color: '#df7090' },
      { id: 'cli', name: 'IT Support',                        pct: 11, count: 31, color: '#c8647c' },
      { id: 'les', name: 'Acronym Definition',                pct: 9,  count: 26, color: '#da8294' },
      { id: 'hf',  name: 'Projects & Initiatives',            pct: 8,  count: 22, color: '#e496a6' },
    ],
  ];

  rowFlex = (row: FlaggedCategory[]) => row.reduce((s, t) => s + t.pct, 0);

  // ---- Card 2: Feedback by Collection (negative + positive + reliability breakdown) ----
  readonly flaggedCollections: FlaggedCollection[] = [
    { rank:  1, title: 'Board Paper Library',        prompts: 184, positiveCount: 127, negativeCount: 57,  negativePct: 31, positivePct: 69, reliability: { relevancy: 65, accuracy: 58, completeness: 71 } },
    { rank:  2, title: 'SovOps M1-3',               prompts: 168, positiveCount: 121, negativeCount: 47,  negativePct: 28, positivePct: 72, reliability: { relevancy: 74, accuracy: 68, completeness: 76 } },
    { rank:  3, title: 'AskHR KB Articles',          prompts: 156, positiveCount: 126, negativeCount: 30,  negativePct: 19, positivePct: 81, reliability: { relevancy: 82, accuracy: 79, completeness: 80 } },
    { rank:  4, title: 'Policy Architecture',        prompts: 148, positiveCount: 112, negativeCount: 36,  negativePct: 24, positivePct: 76, reliability: { relevancy: 77, accuracy: 72, completeness: 73 } },
    { rank:  5, title: 'SovOps M4-6',               prompts: 142, positiveCount: 105, negativeCount: 37,  negativePct: 26, positivePct: 74, reliability: { relevancy: 72, accuracy: 63, completeness: 68 } },
    { rank:  6, title: 'AskIT KB Articles',          prompts: 134, positiveCount: 106, negativeCount: 28,  negativePct: 21, positivePct: 79, reliability: { relevancy: 80, accuracy: 75, completeness: 78 } },
    { rank:  7, title: 'AFNR Document Library',      prompts:  98, positiveCount:  76, negativeCount: 22,  negativePct: 22, positivePct: 78, reliability: { relevancy: 78, accuracy: 71, completeness: 74 } },
    { rank:  8, title: 'Travel Concur',              prompts:  89, positiveCount:  74, negativeCount: 15,  negativePct: 17, positivePct: 83, reliability: { relevancy: 85, accuracy: 81, completeness: 82 } },
    { rank:  9, title: 'CSD Guidelines & Manuals',   prompts:  76, positiveCount:  58, negativeCount: 18,  negativePct: 24, positivePct: 76, reliability: { relevancy: 75, accuracy: 70, completeness: 72 } },
    { rank: 10, title: 'TORs (Consultants)',          prompts:  68, positiveCount:  48, negativeCount: 20,  negativePct: 29, positivePct: 71, reliability: { relevancy: 68, accuracy: 62, completeness: 66 } },
    { rank: 11, title: 'SEC-IAU Guidelines',         prompts:  62, positiveCount:  46, negativeCount: 16,  negativePct: 26, positivePct: 74, reliability: { relevancy: 73, accuracy: 67, completeness: 70 } },
    { rank: 12, title: 'Country Fact Sheets',        prompts:  58, positiveCount:  44, negativeCount: 14,  negativePct: 24, positivePct: 76, reliability: { relevancy: 76, accuracy: 71, completeness: 74 } },
    { rank: 13, title: 'AFNR – East Asia',           prompts:  54, positiveCount:  43, negativeCount: 11,  negativePct: 20, positivePct: 80, reliability: { relevancy: 80, accuracy: 74, completeness: 77 } },
    { rank: 14, title: 'AFNR – South Asia',          prompts:  46, positiveCount:  34, negativeCount: 12,  negativePct: 26, positivePct: 74, reliability: { relevancy: 73, accuracy: 68, completeness: 71 } },
    { rank: 15, title: 'Branding Toolkit',           prompts:  42, positiveCount:  36, negativeCount:  6,  negativePct: 14, positivePct: 86, reliability: { relevancy: 87, accuracy: 83, completeness: 85 } },
    { rank: 16, title: 'SEC-IAU Final Documents',    prompts:  38, positiveCount:  26, negativeCount: 12,  negativePct: 32, positivePct: 68, reliability: { relevancy: 64, accuracy: 60, completeness: 63 } },
    { rank: 17, title: 'AFNR – Central & West Asia', prompts:  34, positiveCount:  26, negativeCount:  8,  negativePct: 24, positivePct: 76, reliability: { relevancy: 75, accuracy: 70, completeness: 72 } },
    { rank: 18, title: 'ITD Sharepoint',             prompts:  28, positiveCount:  20, negativeCount:  8,  negativePct: 29, positivePct: 71, reliability: { relevancy: 69, accuracy: 64, completeness: 67 } },
  ];

  // ---- Written Feedback Records table ----
  readonly feedbackRecords: FeedbackRecord[] = [
    {
      id: 1,
      userName: 'Staff A',
      promptText: 'What is the current procurement policy for ICT contracts?',
      responseExcerpt: 'The current ICT procurement policy requires competitive bidding for contracts exceeding...',
      fullResponse: 'The current ICT procurement policy requires competitive bidding for contracts exceeding USD 100,000 for goods and services. All solicitations must be initiated through the eAcquire system and approved by the relevant VPU Head. Key thresholds are documented in the ADB Procurement Policy 2017 and Operations Manual Section D14. ICT-specific contracts additionally require a security review and sign-off from the Chief Information Officer\'s office.',
      sentiment: 'positive',
      feedbackCategory: 'Other Feedback',
      feedbackNote: 'Good summary but could include hyperlinks to the source documents.',
      userRole: 'Procurement Officer',
      department: 'PPFD',
      collection: 'Policy Architecture',
      timestamp: '2026-08-08 09:14',
      date: 'Aug 8, 2026',
    },
    {
      id: 2,
      userName: 'Staff B',
      promptText: 'Summarise the key findings from the latest AFNR sector assessment',
      responseExcerpt: 'The assessment highlights three priority areas: food security, sustainable water use...',
      fullResponse: 'The assessment highlights three priority areas: food security, sustainable water use, and rural infrastructure. However, the response drew from a 2024 publication and did not reflect the 2026 update. The current assessment places greater emphasis on climate-resilient agriculture and smallholder finance. The figures cited for irrigation coverage were also outdated and should not be used for official reporting.',
      sentiment: 'negative',
      feedbackCategory: 'Incorrect Sources',
      feedbackNote: 'The source used was outdated — the 2026 assessment was published in March.',
      userRole: 'Economist',
      department: 'ERCD',
      collection: 'AFNR Document Library',
      timestamp: '2026-08-08 10:32',
      date: 'Aug 8, 2026',
    },
    {
      id: 3,
      userName: 'Staff C',
      promptText: 'Who is the focal point for climate finance in SERD?',
      responseExcerpt: 'Based on the available directory information, the climate finance focal point for SERD is...',
      fullResponse: 'Based on the available directory information, the climate finance focal point for SERD is listed under the Environment and Climate Change team. The response correctly identified the division but could not confirm the current named focal person, as staff directory data may not be fully current. For the most up-to-date contact, please check the internal staff directory or reach out to the SERD front office.',
      sentiment: 'positive',
      feedbackCategory: 'Other Feedback',
      userRole: 'Project Officer',
      department: 'SERD',
      collection: 'SovOps M1-3',
      timestamp: '2026-08-07 14:05',
      date: 'Aug 7, 2026',
    },
    {
      id: 4,
      userName: 'Staff D',
      promptText: 'Generate a TOR for a consultancy on urban transport planning',
      responseExcerpt: 'Terms of Reference — Urban Transport Planning Consultant. 1. Background...',
      fullResponse: 'Terms of Reference — Urban Transport Planning Consultant\n\n1. Background: ADB is seeking a specialist consultant to support the design of sustainable urban transport systems in Southeast Asian cities.\n\n2. Scope of Work: The consultant will assess current transport infrastructure, identify gaps, and prepare a policy roadmap aligned with ADB\'s Strategy 2030 goals.\n\n3. Qualifications: Minimum 10 years of experience in urban transport planning; familiarity with ADB operations preferred.\n\n4. Duration: 6 months, with possibility of extension.',
      sentiment: 'positive',
      feedbackCategory: 'Unclear Answer',
      feedbackNote: 'The TOR structure was good but the qualification requirements were vague.',
      userRole: 'Senior Project Manager',
      department: 'SDNC',
      collection: 'TORs (Consultants)',
      timestamp: '2026-08-07 11:47',
      date: 'Aug 7, 2026',
    },
    {
      id: 5,
      userName: 'Staff E',
      promptText: 'What are the travel per diem rates for Manila missions?',
      responseExcerpt: 'The current per diem rates for Manila are not directly available in my training data...',
      fullResponse: 'The current per diem rates for Manila are not directly available in my knowledge base. The rates cited — USD 180/day for international staff — appear to be from the 2022 schedule and do not reflect the 2025 revision, which increased the Manila rate to USD 210/day following the cost-of-living adjustment. Please consult the latest Travel and Expense Policy circular on the intranet for the correct figures.',
      sentiment: 'negative',
      feedbackCategory: 'Incorrect Sources',
      feedbackNote: 'Quoted the 2022 rate — the 2025 revision was not reflected.',
      userRole: 'Operations Analyst',
      department: 'BPGE',
      collection: 'Travel Concur',
      timestamp: '2026-08-06 16:22',
      date: 'Aug 6, 2026',
    },
    {
      id: 6,
      userName: 'Staff F',
      promptText: 'What is ADB\'s policy on remote work for international staff?',
      responseExcerpt: 'ADB\'s hybrid work policy for international staff allows up to 2 days per week remote...',
      fullResponse: 'ADB\'s hybrid work policy for international staff allows up to 2 days per week of remote work, subject to supervisor approval and role suitability criteria. Staff must maintain a Manila base and be available during core hours (9:00 AM – 3:00 PM PHT). Requests are processed through the HR portal and reviewed quarterly. Extended remote arrangements require VP-level approval and must not conflict with operational requirements.',
      sentiment: 'positive',
      feedbackCategory: 'Other Feedback',
      userRole: 'HR Officer',
      department: 'BPHR',
      collection: 'AskHR KB Articles',
      timestamp: '2026-08-06 09:58',
      date: 'Aug 6, 2026',
    },
    {
      id: 7,
      userName: 'Staff G',
      promptText: 'List all board papers published in Q2 2026',
      responseExcerpt: 'I found references to several board papers from Q2 2026, however the full list may be incomplete...',
      fullResponse: 'I found references to several board papers from Q2 2026, however the full list may be incomplete. The Board Paper Library collection indexes papers up to early 2026, and some April–June 2026 documents may not yet be available in the searchable repository. I can retrieve individual papers by title or reference number if provided. For a complete official list, the Board Secretariat maintains the authoritative register at boardpapers.adb.org.',
      sentiment: 'negative',
      feedbackCategory: 'Irrelevant Response',
      feedbackNote: 'I needed a structured list — the response described limitations instead.',
      userRole: 'Executive Assistant',
      department: 'DOCK',
      collection: 'Board Paper Library',
      timestamp: '2026-08-05 15:10',
      date: 'Aug 5, 2026',
    },
    {
      id: 8,
      userName: 'Staff H',
      promptText: 'How do I apply for extended leave under the staff regulations?',
      responseExcerpt: 'Extended leave requests must be submitted via the HR portal at least 30 days in advance...',
      fullResponse: 'Extended leave requests must be submitted via the HR portal at least 30 days in advance of the intended start date. The request requires a supervisor endorsement and must specify the leave type (personal, medical, or family care). For leave exceeding 60 days, approval from the department Director General is required. Medical leave extensions above 90 days are additionally subject to review by the Staff Health Unit. Relevant forms are available on the HR intranet under Staff Leave Administration.',
      sentiment: 'positive',
      feedbackCategory: 'Other Feedback',
      userRole: 'Finance Specialist',
      department: 'CTLO',
      collection: 'AskHR KB Articles',
      timestamp: '2026-08-05 10:44',
      date: 'Aug 5, 2026',
    },
  ];

  // ---- Card 3: Top Negative Feedback Type (categorical, with icons) ----
  readonly topNegativeTypes: NegativeFeedbackType[] = [
    { title: 'Not factually correct',       reports: 412, sharePct: 38, icon: 'alert-triangle' },
    { title: 'Missing source citations',    reports: 287, sharePct: 27, icon: 'message-report' },
    { title: 'Did not follow instructions', reports: 196, sharePct: 18, icon: 'target' },
  ];

  // ---- Feedback Volume Trend (line chart) ----
  readonly chartW = 1400;
  readonly chartH = 200;
  readonly padL = 36;
  readonly padR = 20;
  readonly padT = 12;
  readonly padB = 30;

  private readonly allMonths     = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  private readonly allReceived   = [40, 50, 41, 49, 38, 47, 66, 88, 88, 97, 88, 82];
  private readonly allPositive   = [32, 38, 30, 35, 28, 36, 50, 64, 70, 72, 70, 68];
  private readonly allNegative   = [8,  12, 11, 14, 10, 11, 16, 24, 18, 25, 18, 14];

  // ---- Collection filter for the trend chart ----
  readonly trendCollectionFilter = signal<string>('all');

  readonly trendMonths = computed(() =>
    this.trendCollectionFilter() === 'all' ? this.allMonths : this.fbTrendMonths
  );

  readonly showReceivedLine = computed(() => this.trendCollectionFilter() === 'all');

  private readonly trendPositive = computed(() => {
    const col = this.trendCollectionFilter();
    if (col === 'all') return this.allPositive;
    return (this.collectionTrendData[col] ?? []).map(d => d.pos);
  });

  private readonly trendNegative = computed(() => {
    const col = this.trendCollectionFilter();
    if (col === 'all') return this.allNegative;
    return (this.collectionTrendData[col] ?? []).map(d => d.neg);
  });

  private readonly trendReceived = computed(() => {
    const col = this.trendCollectionFilter();
    if (col === 'all') return this.allReceived;
    return (this.collectionTrendData[col] ?? []).map(d => d.pos + d.neg);
  });

  private readonly trendMaxY = computed(() => {
    const col = this.trendCollectionFilter();
    if (col === 'all') return 100;
    const data = this.collectionTrendData[col] ?? [];
    const max = Math.max(...data.map(d => d.pos + d.neg), 1);
    return Math.ceil(max / 10) * 10;
  });

  // ---- Reactive path building ----
  private buildSmooth(values: number[], n: number, maxY: number): string {
    const toX = (i: number) => this.padL + (i / Math.max(n - 1, 1)) * (this.chartW - this.padL - this.padR);
    const toY = (v: number) => this.padT + (1 - v / maxY) * (this.chartH - this.padT - this.padB);
    const pts = values.map((v, i) => ({ x: toX(i), y: toY(v) }));
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }

  private buildArea(linePath: string, n: number): string {
    const toX = (i: number) => this.padL + (i / Math.max(n - 1, 1)) * (this.chartW - this.padL - this.padR);
    const baseY = this.chartH - this.padB;
    return `${linePath} L ${toX(n - 1).toFixed(1)},${baseY} L ${toX(0).toFixed(1)},${baseY} Z`;
  }

  readonly receivedLinePath = computed(() =>
    this.buildSmooth(this.trendReceived(), this.trendMonths().length, this.trendMaxY())
  );
  readonly positiveLinePath = computed(() =>
    this.buildSmooth(this.trendPositive(), this.trendMonths().length, this.trendMaxY())
  );
  readonly negativeLinePath = computed(() =>
    this.buildSmooth(this.trendNegative(), this.trendMonths().length, this.trendMaxY())
  );

  readonly receivedAreaPath = computed(() => this.buildArea(this.receivedLinePath(), this.trendMonths().length));
  readonly positiveAreaPath = computed(() => this.buildArea(this.positiveLinePath(), this.trendMonths().length));
  readonly negativeAreaPath = computed(() => this.buildArea(this.negativeLinePath(), this.trendMonths().length));

  // ---- Hover tooltip ----
  readonly hoveredMonth = signal<number | null>(null);

  readonly fbTooltipData = computed(() => {
    const i = this.hoveredMonth();
    if (i === null) return null;
    const months = this.trendMonths();
    const n      = months.length;
    const maxY   = this.trendMaxY();
    const toX = (idx: number) => this.padL + (idx / Math.max(n - 1, 1)) * (this.chartW - this.padL - this.padR);
    const toY = (v: number)   => this.padT + (1 - v / maxY) * (this.chartH - this.padT - this.padB);
    const x    = toX(i);
    const plotH = this.chartH - this.padT - this.padB;
    const pos = this.trendPositive()[i] ?? 0;
    const neg = this.trendNegative()[i] ?? 0;
    const rec = this.trendReceived()[i] ?? 0;
    const items = [
      ...(this.showReceivedLine() ? [{ label: 'Received', color: '#086ED3', val: rec, y: toY(rec) }] : []),
      { label: 'Positive', color: '#22c55e', val: pos, y: toY(pos) },
      { label: 'Negative', color: '#ef4444', val: neg, y: toY(neg) },
    ];
    const boxH = 18 + items.length * 15;
    const boxW = 130;
    const avgY = items.reduce((s, it) => s + it.y, 0) / items.length;
    const boxY = Math.max(this.padT + 4, Math.min(avgY - boxH / 2, this.chartH - this.padB - boxH - 4));
    const boxX = x + 14 + boxW > this.chartW - this.padR
      ? x - 14 - boxW
      : x + 14;
    return {
      month: months[i],
      x,
      lineY1: this.padT,
      lineY2: this.padT + plotH,
      items,
      boxH,
      boxX,
      boxY,
    };
  });

  // X-axis tick positions
  readonly xTicks = computed(() => {
    const months = this.trendMonths();
    const n = months.length;
    const toX = (i: number) => this.padL + (i / Math.max(n - 1, 1)) * (this.chartW - this.padL - this.padR);
    return months.map((m, i) => ({ label: m, x: toX(i) }));
  });

  // Y-axis tick positions
  readonly yTicks = computed(() => {
    const maxY = this.trendMaxY();
    const toY = (v: number) => this.padT + (1 - v / maxY) * (this.chartH - this.padT - this.padB);
    const step = maxY <= 20 ? 5 : maxY <= 50 ? 10 : 20;
    const ticks: { label: number; y: number }[] = [];
    for (let v = 0; v <= maxY; v += step) ticks.push({ label: v, y: toY(v) });
    return ticks;
  });

  // ---- Heatmap: Feedback Friction Areas by Topic Category ----
  readonly heatmapMode = signal<HeatmapMode>('region');
  setHeatmapMode(m: HeatmapMode) { this.heatmapMode.set(m); }

  // Each heat-map column maps to a topic id consumed by the Analysis page
  // (see /prompts/analysis ?topic=…). The two-line `label` is split on `\n`
  // by the column-label template.
  readonly heatmapColumns: { label: string; topicId: string }[] = [
    { label: 'Infrastructure\nFinancing',    topicId: 'eg' },
    { label: 'Central Asia\nLabour Markets', topicId: 'ml' },
    { label: 'Climate &\nResilience',        topicId: 'cli-adapt' },
    { label: 'Project Brief\nGeneration',    topicId: 'tor' },
    { label: 'Regional\nCooperation',        topicId: 'hf' },
  ];

  // ADB operating regions (matches ADB operational region groupings).
  readonly heatmapRowsRegion = ['SARD', 'CWRD', 'EARD', 'SERD'];
  // Real ADB department codes.
  readonly heatmapRowsVpu    = ['DOCK', 'ITD', 'ORM', 'PSOD'];

  // Intensity per (row, col). 0 = lightest, 1 = darkest red.
  private readonly heatmapDataRegion: number[][] = [
    [0.08, 0.10, 0.10, 0.10, 0.40],
    [0.32, 0.10, 0.10, 0.08, 0.10],
    [0.10, 0.30, 0.90, 0.10, 0.10],
    [0.10, 0.55, 0.10, 0.10, 0.10],
  ];

  private readonly heatmapDataVpu: number[][] = [
    [0.10, 0.45, 0.20, 0.15, 0.30],
    [0.50, 0.10, 0.15, 0.20, 0.10],
    [0.15, 0.25, 0.85, 0.10, 0.10],
    [0.10, 0.65, 0.10, 0.30, 0.20],
  ];

  readonly heatmapRows = computed(() =>
    this.heatmapMode() === 'region' ? this.heatmapRowsRegion : this.heatmapRowsVpu,
  );

  readonly heatmapData = computed(() =>
    this.heatmapMode() === 'region' ? this.heatmapDataRegion : this.heatmapDataVpu,
  );

  // ---- Collection expand ----
  readonly expandedCollection = signal<string | null>(null);
  toggleCollection(name: string) {
    this.expandedCollection.update(v => v === name ? null : name);
  }

  readonly collectionFeedbackTypes: Record<string, { category: FeedbackCategory; count: number; pct: number; sentiment: 'positive' | 'negative' }[]> = {
    'Board Paper Library': [
      { category: 'Incorrect Sources',  count: 28, pct: 49, sentiment: 'negative' },
      { category: 'Irrelevant Response',count: 17, pct: 30, sentiment: 'negative' },
      { category: 'Other Feedback',     count:  8, pct: 14, sentiment: 'positive' },
      { category: 'Unclear Answer',     count:  4, pct:  7, sentiment: 'negative' },
    ],
    'Publications': [
      { category: 'Incorrect Sources',  count: 19, pct: 51, sentiment: 'negative' },
      { category: 'Other Feedback',     count: 11, pct: 30, sentiment: 'positive' },
      { category: 'Irrelevant Response',count:  5, pct: 14, sentiment: 'negative' },
      { category: 'Unclear Answer',     count:  2, pct:  5, sentiment: 'negative' },
    ],
    'AFNR': [
      { category: 'Other Feedback',     count: 12, pct: 55, sentiment: 'positive' },
      { category: 'Incorrect Sources',  count:  6, pct: 27, sentiment: 'negative' },
      { category: 'Irrelevant Response',count:  3, pct: 14, sentiment: 'negative' },
      { category: 'Unclear Answer',     count:  1, pct:  5, sentiment: 'negative' },
    ],
  };

  /** Map intensity 0..1 to a CSS color along light yellow → red. */
  heatColor(v: number): string {
    // Threshold below which we use a near-transparent yellow.
    if (v < 0.15) return '#FEF3C7';
    if (v < 0.35) return '#FDE68A';
    if (v < 0.55) return '#FCD34D';
    if (v < 0.75) return '#F59E0B';
    return '#DC2626';
  }

  // ── Collection Feedback Detail Drawer ─────────────────────────────────────
  private static readonly FB_DRAWER_MIN = 380;
  private static readonly FB_DRAWER_MAX = 0.90;

  readonly selectedFbCollection = signal<FlaggedCollection | null>(null);
  readonly fbDrawerOpen = computed(() => this.selectedFbCollection() !== null);
  readonly fbDrawerTab = signal<'overview' | 'records'>('overview');
  readonly fbDrawerWidth = signal(600);
  readonly expandedRecordId = signal<number | null>(null);

  // Feedback Records filters
  readonly fbRecordsTypeFilter      = signal<string>('all');
  readonly fbRecordsSentimentFilter = signal<string>('all');
  readonly fbRecordsSearch          = signal('');

  openFbDrawer(c: FlaggedCollection) {
    this.fbDrawerTab.set('overview');
    this.fbRecordsTypeFilter.set('all');
    this.fbRecordsSentimentFilter.set('all');
    this.fbRecordsSearch.set('');
    this.expandedRecordId.set(null);
    this.selectedFbCollection.set(c);
  }
  closeFbDrawer() { this.selectedFbCollection.set(null); this.fbDrawerRecord.set(null); }

  filterByDriver(cat: FeedbackCategory) {
    this.fbRecordsTypeFilter.set(cat);
    this.fbDrawerTab.set('records');
  }

  viewTopIssueRecords() {
    const top = this.fbDrawerTopIssue();
    if (top) this.filterByDriver(top.category);
  }

  openCollectionDetailFromFeedback(name: string) {
    this.router.navigate(['/collections'], { queryParams: { open: name } });
  }

  onFbResizerMouseDown(e: MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = this.fbDrawerWidth();
    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      const max = Math.round(window.innerWidth * Feedback.FB_DRAWER_MAX);
      this.fbDrawerWidth.set(Math.min(max, Math.max(Feedback.FB_DRAWER_MIN, startW + delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // Domain badge mapping
  private readonly COLLECTION_DOMAIN: Record<string, string> = {
    'AFNR Document Library':      'Sector Knowledge',
    'AFNR – East Asia':           'Sector Knowledge',
    'AFNR – South Asia':          'Sector Knowledge',
    'AFNR – Central & West Asia': 'Sector Knowledge',
    'Policy Architecture':        'Policies & Governance',
    'Board Paper Library':        'Policies & Governance',
    'SEC-IAU Guidelines':         'Policies & Governance',
    'SEC-IAU Final Documents':    'Policies & Governance',
    'Travel Concur':              'Corporate Services',
    'CSD Guidelines & Manuals':   'Corporate Services',
    'Branding Toolkit':           'Corporate Services',
    'ITD Sharepoint':             'Corporate Services',
    'SovOps M1-3':                'Operations & Projects',
    'SovOps M4-6':                'Operations & Projects',
    'TORs (Consultants)':         'Operations & Projects',
    'Country Fact Sheets':        'Operations & Projects',
    'AskHR KB Articles':          'Support Services',
    'AskIT KB Articles':          'Support Services',
  };

  domainSlug(domain: string): string {
    return domain.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  readonly fbDrawerDomain = computed(() => {
    const c = this.selectedFbCollection();
    return c ? (this.COLLECTION_DOMAIN[c.title] ?? '') : '';
  });

  readonly fbDrawerDrivers = computed(() => {
    const c = this.selectedFbCollection();
    return c ? (this.collectionFeedbackTypes[c.title] ?? []) : [];
  });

  readonly fbDrawerTopIssue = computed(() =>
    this.fbDrawerDrivers().find(d => d.sentiment === 'negative') ?? null
  );

  // Per-collection feedback trend (5 months: Apr–Aug)
  readonly fbTrendMonths = ['Apr', 'May', 'Jun', 'Jul', 'Aug'];
  private readonly collectionTrendData: Record<string, { pos: number; neg: number }[]> = {
    'Board Paper Library': [
      { pos: 18, neg: 12 }, { pos: 22, neg: 16 }, { pos: 28, neg: 14 }, { pos: 34, neg: 18 }, { pos: 25, neg: 15 },
    ],
    'SovOps M1-3': [
      { pos: 22, neg: 8 }, { pos: 26, neg: 10 }, { pos: 30, neg: 9 }, { pos: 28, neg: 11 }, { pos: 15, neg: 9 },
    ],
    'AskHR KB Articles': [
      { pos: 24, neg: 5 }, { pos: 28, neg: 6 }, { pos: 32, neg: 5 }, { pos: 30, neg: 6 }, { pos: 12, neg: 8 },
    ],
    'Policy Architecture': [
      { pos: 21, neg: 7 }, { pos: 25, neg: 8 }, { pos: 28, neg: 7 }, { pos: 26, neg: 8 }, { pos: 12, neg: 6 },
    ],
    'SovOps M4-6': [
      { pos: 18, neg: 7 }, { pos: 22, neg: 8 }, { pos: 28, neg: 9 }, { pos: 25, neg: 7 }, { pos: 12, neg: 6 },
    ],
    'AskIT KB Articles': [
      { pos: 20, neg: 5 }, { pos: 24, neg: 6 }, { pos: 28, neg: 5 }, { pos: 22, neg: 6 }, { pos: 12, neg: 6 },
    ],
    'AFNR Document Library': [
      { pos: 14, neg: 4 }, { pos: 18, neg: 5 }, { pos: 20, neg: 5 }, { pos: 16, neg: 5 }, { pos: 8, neg: 3 },
    ],
    'Travel Concur': [
      { pos: 14, neg: 3 }, { pos: 17, neg: 3 }, { pos: 20, neg: 2 }, { pos: 16, neg: 3 }, { pos: 7, neg: 4 },
    ],
    'CSD Guidelines & Manuals': [
      { pos: 11, neg: 4 }, { pos: 13, neg: 4 }, { pos: 16, neg: 3 }, { pos: 12, neg: 4 }, { pos: 6, neg: 3 },
    ],
    'TORs (Consultants)': [
      { pos: 9, neg: 4 }, { pos: 11, neg: 5 }, { pos: 14, neg: 4 }, { pos: 10, neg: 4 }, { pos: 4, neg: 3 },
    ],
    'SEC-IAU Guidelines': [
      { pos: 8, neg: 3 }, { pos: 10, neg: 4 }, { pos: 13, neg: 3 }, { pos: 10, neg: 3 }, { pos: 5, neg: 3 },
    ],
    'Country Fact Sheets': [
      { pos: 8, neg: 3 }, { pos: 10, neg: 3 }, { pos: 12, neg: 3 }, { pos: 10, neg: 3 }, { pos: 4, neg: 2 },
    ],
    'AFNR – East Asia': [
      { pos: 7, neg: 2 }, { pos: 9, neg: 2 }, { pos: 12, neg: 2 }, { pos: 10, neg: 2 }, { pos: 5, neg: 3 },
    ],
    'AFNR – South Asia': [
      { pos: 6, neg: 2 }, { pos: 8, neg: 3 }, { pos: 10, neg: 2 }, { pos: 8, neg: 3 }, { pos: 2, neg: 2 },
    ],
    'Branding Toolkit': [
      { pos: 7, neg: 1 }, { pos: 8, neg: 1 }, { pos: 10, neg: 1 }, { pos: 9, neg: 1 }, { pos: 2, neg: 2 },
    ],
    'SEC-IAU Final Documents': [
      { pos: 5, neg: 3 }, { pos: 6, neg: 3 }, { pos: 8, neg: 2 }, { pos: 5, neg: 2 }, { pos: 2, neg: 2 },
    ],
    'AFNR – Central & West Asia': [
      { pos: 5, neg: 2 }, { pos: 6, neg: 2 }, { pos: 8, neg: 1 }, { pos: 6, neg: 2 }, { pos: 1, neg: 1 },
    ],
    'ITD Sharepoint': [
      { pos: 4, neg: 2 }, { pos: 5, neg: 2 }, { pos: 6, neg: 2 }, { pos: 4, neg: 1 }, { pos: 1, neg: 1 },
    ],
  };

  readonly fbTrendChartW = 300;
  readonly fbTrendChartH = 80;
  readonly fbTrendPadL = 8;
  readonly fbTrendPadR = 8;
  readonly fbTrendPadT = 8;
  readonly fbTrendPadB = 20;

  readonly fbDrawerTrendBars = computed(() => {
    const c = this.selectedFbCollection();
    if (!c) return [];
    const pts = this.collectionTrendData[c.title] ?? [];
    const maxVal = Math.max(...pts.map(p => p.pos + p.neg), 1);
    const usableW = this.fbTrendChartW - this.fbTrendPadL - this.fbTrendPadR;
    const usableH = this.fbTrendChartH - this.fbTrendPadT - this.fbTrendPadB;
    const slotW = usableW / pts.length;
    const barW = Math.max(10, slotW * 0.55);
    const bottom = this.fbTrendPadT + usableH;
    return pts.map((pt, i) => {
      const cx = this.fbTrendPadL + slotW * i + slotW / 2;
      const totalH = Math.max(2, ((pt.pos + pt.neg) / maxVal) * usableH);
      const posH = Math.max(1, (pt.pos / (pt.pos + pt.neg)) * totalH);
      const negH = Math.max(1, totalH - posH);
      return {
        label: this.fbTrendMonths[i], pos: pt.pos, neg: pt.neg,
        x: cx - barW / 2, negY: bottom - totalH, posY: bottom - posH,
        posH, negH, width: barW, cx, labelY: this.fbTrendChartH - 4,
      };
    });
  });

  readonly fbDrawerTrendDelta = computed(() => {
    const c = this.selectedFbCollection();
    if (!c) return null;
    const pts = this.collectionTrendData[c.title];
    if (!pts || pts.length < 2) return null;
    const mid = Math.floor(pts.length / 2);
    const older = pts.slice(0, mid).reduce((s, p) => s + p.neg, 0) || 1;
    const newer = pts.slice(mid).reduce((s, p) => s + p.neg, 0);
    const pct = Math.round(((newer - older) / older) * 100);
    return { pct: Math.abs(pct), improving: pct <= 0 };
  });

  readonly fbTrendHoveredIdx = signal<number | null>(null);

  readonly fbTrendTooltip = computed(() => {
    const idx = this.fbTrendHoveredIdx();
    if (idx === null) return null;
    const bars = this.fbDrawerTrendBars();
    const bar = bars[idx];
    if (!bar) return null;
    const tooltipW = 110;
    const tooltipH = 54;
    const rawX = bar.cx - tooltipW / 2;
    const x = Math.min(this.fbTrendChartW - tooltipW - 2, Math.max(2, rawX));
    const y = Math.max(2, bar.negY - tooltipH - 6);
    return { x, y, tooltipW, tooltipH, bar };
  });

  // Per-collection feedback records
  readonly collectionRecords: Record<string, FeedbackRecord[]> = {
    'Board Paper Library': [
      { id: 101, userName: 'Staff G', promptText: 'List all board papers published in Q2 2026',
        responseExcerpt: 'I found references to several board papers from Q2 2026, however the full list may be incomplete...',
        fullResponse: 'I found references to several board papers from Q2 2026, however the full list may be incomplete. The Board Paper Library collection indexes papers up to early 2026, and some April–June 2026 documents may not yet be available in the searchable repository.',
        sentiment: 'negative', feedbackCategory: 'Irrelevant Response',
        feedbackNote: 'I needed a structured list — the response described limitations instead.',
        userRole: 'Executive Assistant', department: 'DOCK', timestamp: '2026-08-05 15:10', date: 'Aug 5, 2026' },
      { id: 102, userName: 'Staff K', promptText: 'What board resolutions were passed at the last Board meeting?',
        responseExcerpt: 'The most recent Board resolutions available in this collection are from March 2026...',
        fullResponse: 'The most recent Board resolutions available in this collection are from March 2026. The April and May 2026 meeting records have not yet been indexed.',
        sentiment: 'negative', feedbackCategory: 'Incorrect Sources',
        feedbackNote: 'Missing the June resolutions completely.',
        userRole: 'Senior Advisor', department: 'OSEC', timestamp: '2026-08-07 09:22', date: 'Aug 7, 2026' },
      { id: 103, userName: 'Staff L', promptText: 'Find the Board paper on ADB\'s Climate Action Plan 2030',
        responseExcerpt: 'I located Board Paper 2024-123 which covers ADB\'s Climate Action Plan...',
        fullResponse: 'I located Board Paper 2024-123 which covers ADB\'s Climate Action Plan 2030, presented at the 2024 Annual Meeting.',
        sentiment: 'positive', feedbackCategory: 'Other Feedback',
        feedbackNote: 'Very helpful — exactly what I needed.',
        userRole: 'Climate Specialist', department: 'CCSD', timestamp: '2026-08-06 11:45', date: 'Aug 6, 2026' },
      { id: 104, userName: 'Staff M', promptText: 'What are the disclosure policies for Board papers?',
        responseExcerpt: 'Board papers are disclosed in accordance with ADB\'s Public Communications Policy...',
        fullResponse: 'Board papers are disclosed in accordance with ADB\'s Public Communications Policy (2011, as amended). Most Board papers are disclosed after 120 days from the Board meeting date unless classified.',
        sentiment: 'negative', feedbackCategory: 'Unclear Answer',
        feedbackNote: 'The response was too generic — I needed specific exceptions.',
        userRole: 'Legal Officer', department: 'OGC', timestamp: '2026-08-04 14:33', date: 'Aug 4, 2026' },
      { id: 105, userName: 'Staff N', promptText: 'Search for board papers related to private sector cofinancing',
        responseExcerpt: 'I found 12 board papers referencing private sector cofinancing between 2022–2025...',
        fullResponse: 'I found 12 board papers referencing private sector cofinancing between 2022–2025. The most relevant are BP2023-045 and BP2024-087.',
        sentiment: 'positive', feedbackCategory: 'Other Feedback',
        userRole: 'Investment Officer', department: 'PSOD', timestamp: '2026-08-03 10:20', date: 'Aug 3, 2026' },
      { id: 106, userName: 'Staff O', promptText: 'What is the process for submitting a board paper?',
        responseExcerpt: 'Board papers must be submitted through the Board Secretariat at least 6 weeks...',
        fullResponse: 'Board papers must be submitted at least 6 weeks before the intended Board meeting. However, this was recently changed to 8 weeks.',
        sentiment: 'negative', feedbackCategory: 'Incorrect Sources',
        feedbackNote: 'The 6-week timeline is outdated — it changed to 8 weeks.',
        userRole: 'Division Director', department: 'SARD', timestamp: '2026-08-02 16:05', date: 'Aug 2, 2026' },
    ],
    'Publications': [
      { id: 201, userName: 'Staff P', promptText: 'What are ADB\'s recent publications on climate finance?',
        responseExcerpt: 'ADB has published several recent reports on climate finance including...',
        fullResponse: 'ADB has published several recent reports including the Climate Change Finance Tracking Report 2025, the Green Bond Report 2025, and the Climate Resilience Assessment Framework.',
        sentiment: 'positive', feedbackCategory: 'Other Feedback',
        feedbackNote: 'Excellent — covered exactly what I needed.',
        userRole: 'Climate Finance Analyst', department: 'CCSD', timestamp: '2026-08-06 13:10', date: 'Aug 6, 2026' },
      { id: 202, userName: 'Staff Q', promptText: 'Find the latest ADB Annual Report with full financial statements',
        responseExcerpt: 'The 2024 ADB Annual Report is available and includes audited financial statements...',
        fullResponse: 'The 2024 ADB Annual Report is available but only the summary version is indexed — the full financial statements appendix may not be searchable here.',
        sentiment: 'negative', feedbackCategory: 'Incorrect Sources',
        feedbackNote: 'The financial appendix was not included in the response.',
        userRole: 'Treasury Analyst', department: 'CTLO', timestamp: '2026-08-05 09:45', date: 'Aug 5, 2026' },
      { id: 203, userName: 'Staff R', promptText: 'What publications cover ADB\'s work on gender equality?',
        responseExcerpt: 'I found 8 publications covering gender equality including the Gender Equality Results...',
        fullResponse: 'I found 8 publications covering gender equality including the Gender Equality Results Framework, Women in Infrastructure report (2024), and the Gender Action Plan.',
        sentiment: 'positive', feedbackCategory: 'Other Feedback',
        userRole: 'Gender Specialist', department: 'SDSC', timestamp: '2026-08-04 11:20', date: 'Aug 4, 2026' },
      { id: 204, userName: 'Staff S', promptText: 'Are there publications on urban resilience in Southeast Asia?',
        responseExcerpt: 'I found 3 relevant publications on urban resilience in Southeast Asia...',
        fullResponse: 'I found 3 relevant publications but these are working papers from 2021–2022. The 2025 urban resilience report may be missing.',
        sentiment: 'negative', feedbackCategory: 'Irrelevant Response',
        feedbackNote: 'Outdated publications — the 2025 urban resilience report was missing.',
        userRole: 'Urban Development Specialist', department: 'SERD', timestamp: '2026-08-03 14:50', date: 'Aug 3, 2026' },
      { id: 205, userName: 'Staff T', promptText: 'Summarise the ADB Outlook 2026 key projections',
        responseExcerpt: 'The ADB Asian Development Outlook 2026 projects GDP growth of 4.6% for developing Asia...',
        fullResponse: 'The ADB Asian Development Outlook 2026 projects GDP growth of 4.6% for developing Asia, down from 4.9% in 2025. Inflation is expected to ease to 2.8%.',
        sentiment: 'positive', feedbackCategory: 'Other Feedback',
        userRole: 'Economist', department: 'ERCD', timestamp: '2026-08-02 10:15', date: 'Aug 2, 2026' },
    ],
    'AFNR': [
      { id: 301, userName: 'Staff B', promptText: 'Summarise the key findings from the latest AFNR sector assessment',
        responseExcerpt: 'The assessment highlights three priority areas: food security, sustainable water use...',
        fullResponse: 'The assessment highlights three priority areas: food security, sustainable water use, and rural infrastructure. However, the response drew from a 2024 publication and did not reflect the 2026 update.',
        sentiment: 'negative', feedbackCategory: 'Incorrect Sources',
        feedbackNote: 'The source used was outdated — the 2026 assessment was published in March.',
        userRole: 'Economist', department: 'ERCD', timestamp: '2026-08-08 10:32', date: 'Aug 8, 2026' },
      { id: 302, userName: 'Staff U', promptText: 'What are ADB\'s AFNR priorities for Southeast Asia?',
        responseExcerpt: 'ADB\'s AFNR priorities for Southeast Asia focus on food system transformation...',
        fullResponse: 'ADB\'s AFNR priorities for Southeast Asia focus on food system transformation, sustainable aquaculture, and climate-resilient agriculture.',
        sentiment: 'positive', feedbackCategory: 'Other Feedback',
        userRole: 'Agriculture Specialist', department: 'SERD', timestamp: '2026-08-07 13:30', date: 'Aug 7, 2026' },
      { id: 303, userName: 'Staff V', promptText: 'Find AFNR project TOR templates for South Asia',
        responseExcerpt: 'I found 4 TOR templates used in AFNR projects in South Asia...',
        fullResponse: 'I found 4 TOR templates covering irrigation systems, rural market infrastructure, crop resilience studies, and smallholder finance advisory.',
        sentiment: 'positive', feedbackCategory: 'Other Feedback',
        userRole: 'Project Officer', department: 'SARD', timestamp: '2026-08-06 09:15', date: 'Aug 6, 2026' },
      { id: 304, userName: 'Staff W', promptText: 'What financing instruments are used in AFNR projects?',
        responseExcerpt: 'AFNR projects typically use sovereign loans, technical assistance, and blended finance...',
        fullResponse: 'AFNR projects typically use sovereign loans, technical assistance, and blended finance. However, the AFNR collection does not appear to include financial structuring guidance documents.',
        sentiment: 'negative', feedbackCategory: 'Unclear Answer',
        feedbackNote: 'Could not give specific instrument data by subsector.',
        userRole: 'Finance Specialist', department: 'CTL', timestamp: '2026-08-04 15:40', date: 'Aug 4, 2026' },
    ],
  };

  readonly fbDrawerFilteredRecords = computed(() => {
    const c = this.selectedFbCollection();
    if (!c) return [];
    const records = this.collectionRecords[c.title] ?? [];
    const type      = this.fbRecordsTypeFilter();
    const sentiment = this.fbRecordsSentimentFilter();
    const search    = this.fbRecordsSearch().toLowerCase();
    return records.filter(r => {
      if (type !== 'all' && r.feedbackCategory !== type) return false;
      if (sentiment !== 'all' && r.sentiment !== sentiment) return false;
      if (search && !r.promptText.toLowerCase().includes(search) && !r.responseExcerpt.toLowerCase().includes(search)) return false;
      return true;
    });
  });

  toggleRecord(id: number) {
    this.expandedRecordId.update(v => v === id ? null : id);
  }

  readonly fbDrawerRecord = signal<FeedbackRecord | null>(null);

  openFbDrawerRecord(rec: FeedbackRecord) {
    this.fbDrawerRecord.set(rec);
  }
}
