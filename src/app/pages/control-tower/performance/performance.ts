import { Component, computed, signal } from '@angular/core';
import { REGION_GROUPS, VPU_GROUPS } from '../shared/hier-filter/hier-filter-catalog';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';

interface CollectionPerf {
  name: string;
  ms: number;
  pct: number;
  overSla?: boolean;
}

interface TokenBucket {
  label: string;
  pct: number;
  color: string;
}

interface NoAnswerCategory {
  name: string;
  count: number;
}

interface SearchStat {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}

type PerfTab = 'ai' | 'search' | 'ai-usage';

@Component({
  selector: 'app-performance',
  imports: [DateRangeFilter],
  templateUrl: './performance.html',
  styleUrl: './performance.css',
})
export class Performance {
  // ---- Hierarchical filter catalogs ----
  readonly regionGroups = REGION_GROUPS;
  readonly vpuGroups    = VPU_GROUPS;

  readonly activeTab = signal<PerfTab>('ai');

  // ---- Row 1: KPI cards ----
  readonly kpiResponseTime   = { value: '4.5s',   delta: '+0.5s',   deltaGood: false, sub: 'avg. response time this period' };
  readonly kpiNoAnswerRate   = { value: '78.4%',  delta: '+4.2pp',  deltaGood: false, sub: '1,445 unanswered prompts this period' };
  readonly kpiRetrievalSucc  = { value: '68.1%',  delta: '-1.8pp',  deltaGood: false, sub: 'prompts that returned results' };
  readonly kpiErrorRate      = { value: '46.1%',  delta: '+3.2pp',  deltaGood: false, sub: 'prompts resulting in a system error' };

  // ---- Response Time Trend per Collection (SVG multi-line chart) ----
  readonly chartW = 600;
  readonly chartH = 180;
  readonly padL   = 44;
  readonly padR   = 16;
  readonly padT   = 16;
  readonly padB   = 32;
  readonly yMax   = 5.0;

  readonly weeks      = ['Jun 20', 'Jun 27', 'Jul 4', 'Jul 11', 'Jul 18', 'Jul 25', 'Aug 1', 'Aug 8'];
  readonly yGridLines = [1.0, 2.0, 3.0, 4.0];

  // Per-collection response time series (ending near table values)
  private readonly seriesSectoral   = [1.2, 1.4, 1.3, 1.5, 1.7, 1.8, 1.6, 1.9];
  private readonly seriesOnboarding = [1.8, 2.2, 2.4, 2.8, 2.9, 3.1, 3.3, 3.5];
  private readonly seriesHR         = [2.2, 2.3, 2.4, 2.3, 2.6, 2.7, 2.5, 2.86];

  private toX(i: number): number {
    const plotW = this.chartW - this.padL - this.padR;
    return this.padL + (i / (this.weeks.length - 1)) * plotW;
  }

  private toY(v: number): number {
    const plotH = this.chartH - this.padT - this.padB;
    return this.padT + (1 - v / this.yMax) * plotH;
  }

  /** Catmull-Rom smooth bezier path through the points. */
  private smoothPath(values: number[]): string {
    const pts = values.map((v, i) => ({ x: this.toX(i), y: this.toY(v) }));
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

  readonly sectoralPath   = computed(() => this.smoothPath(this.seriesSectoral));
  readonly onboardingPath = computed(() => this.smoothPath(this.seriesOnboarding));
  readonly hrPath         = computed(() => this.smoothPath(this.seriesHR));

  readonly xTicks = computed(() =>
    this.weeks.map((w, i) => ({ label: w, x: this.toX(i) })),
  );

  readonly yTicks = computed(() =>
    this.yGridLines.map(v => ({ label: v.toFixed(1), y: this.toY(v) })),
  );

  /** Pre-computed Y position of the 3.0s SLA target line. */
  readonly targetY = computed(() => this.toY(3.0));

  readonly sectoralDots   = computed(() => this.seriesSectoral.map((v, i)   => ({ x: this.toX(i), y: this.toY(v), v })));
  readonly onboardingDots = computed(() => this.seriesOnboarding.map((v, i) => ({ x: this.toX(i), y: this.toY(v), v })));
  readonly hrDots         = computed(() => this.seriesHR.map((v, i)         => ({ x: this.toX(i), y: this.toY(v), v })));

  readonly hoveredIndex = signal<number | null>(null);

  readonly tooltipData = computed(() => {
    const i = this.hoveredIndex();
    if (i === null) return null;
    const x = this.toX(i);
    const plotH = this.chartH - this.padT - this.padB;
    return {
      week: this.weeks[i],
      x,
      lineY1: this.padT,
      lineY2: this.padT + plotH,
      items: [
        { label: 'Sectoral Priorities', color: '#22d3ee', val: this.seriesSectoral[i],   y: this.toY(this.seriesSectoral[i]) },
        { label: 'HR Policies 2024',    color: '#a855f7', val: this.seriesHR[i],          y: this.toY(this.seriesHR[i]) },
        { label: 'Onboarding Docs',     color: '#ef4444', val: this.seriesOnboarding[i],  y: this.toY(this.seriesOnboarding[i]) },
      ],
      boxX: Math.min(x + 10, this.chartW - this.padR - 130),
      boxY: this.padT + 4,
    };
  });

  // ---- Row 2 right: Response Time by Collection ----
  readonly collections: CollectionPerf[] = [
    { name: 'Sectoral Priorities',     ms: 1.9,  pct: 32 },
    { name: 'Travel & Expense Policy', ms: 2.3,  pct: 38 },
    { name: 'Admin Procedures',        ms: 2.54, pct: 42 },
    { name: 'HR Policies 2024',        ms: 2.86, pct: 48 },
    { name: 'Finance Guidelines',      ms: 3.1,  pct: 52, overSla: true },
    { name: 'Onboarding Docs',         ms: 3.5,  pct: 58, overSla: true },
  ];

  // ---- Row 3 panel 1: Token Usage ----
  readonly tokenUsage = {
    avg:   '4,571 tokens',
    delta: '+3%',
    sub:   'avg token usage per query',
  };

  readonly tokenBuckets: TokenBucket[] = [
    { label: '<500',   pct: 18, color: '#2c8aff' },
    { label: '500–1k', pct: 34, color: '#a855f7' },
    { label: '1k–2k',  pct: 35, color: '#22d3ee' },
    { label: '>2k',    pct: 13, color: '#f59e0b' },
  ];

  // ---- Row 3 panel 2: No Answer Events ----
  readonly noAnswerTotal = 1445;

  readonly noAnswerCategories: NoAnswerCategory[] = [
    { name: 'Insufficient Context', count: 620 },
    { name: 'Out of Scope Query',   count: 452 },
    { name: 'Ambiguous Intent',     count: 258 },
    { name: 'Collection Gap',       count: 115 },
  ];

  noAnswerPct(count: number): number {
    return Math.round((count / this.noAnswerTotal) * 100);
  }

  // ---- Row 3 panel 3: Search Performance ----
  readonly searchStats: SearchStat[] = [
    { label: 'Search Query Volume',            value: '2,046',  delta: '-2%',     positive: false },
    { label: 'Zero-Result Search Rate',        value: '89.2%',  delta: '+12.1pp', positive: false },
    { label: 'Search-to-AI Prompt Conversion', value: '999',    delta: '+11%',    positive: true  },
  ];

}
