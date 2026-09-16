import { AfterViewInit, Component, computed, ElementRef, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';
import { IntentTreemap } from '../shared/intent-treemap/intent-treemap';
import { PvChart } from '../shared/pv-chart/pv-chart';
import { TablerIconComponent } from '@tabler/icons-angular';

type SearchAiTab = 'search' | 'discovery' | 'sources';

interface TopQueryRow {
  query: string;
  sessions: number;
  success: number;
  zeroResult: boolean;
  trending: boolean;
}

interface ZeroResultCategory {
  label: string;
  count: number;
  pct: number;
}

interface AiChannelRow {
  channel: string;
  mentions: number;
  citedPages: number;
  share: number;
  trend: string;
}

interface ReadinessRow {
  area: string;
  retrievable: number;
  citationRate: number;
  structured: 'Good' | 'Mixed' | 'Poor';
  freshness: 'Good' | 'Mixed' | 'Poor';
  issue: string;
}

interface SourcesRow {
  page: string;
  url: string;
  citations: number;
  share: number;
  trend: string;
  aiVisible: boolean;
}

interface LosingVisibilityRow {
  page: string;
  decline: string;
  reason: string;
}

@Component({
  selector: 'app-search-ai',
  imports: [DateRangeFilter, DecimalPipe, IntentTreemap, PvChart, TablerIconComponent],
  templateUrl: './search-ai.html',
  styleUrl: './search-ai.css',
})
export class SearchAi implements AfterViewInit {
  private readonly _el = inject(ElementRef);
  readonly activeTab = signal<SearchAiTab>('search');

  // ── Search trend chart ────────────────────────────────────────────

  readonly srW    = signal(900);
  readonly srH    = 220;
  readonly srPadL = 46;
  readonly srPadR = 14;
  readonly srPadT = 18;
  readonly srPadB = 44;
  readonly srBottom = this.srH - this.srPadB;

  private readonly srRaw = [
    { period: 'W1',  value: 61 }, { period: 'W2',  value: 62 },
    { period: 'W3',  value: 64 }, { period: 'W4',  value: 63 },
    { period: 'W5',  value: 65 }, { period: 'W6',  value: 64 },
    { period: 'W7',  value: 66 }, { period: 'W8',  value: 67 },
    { period: 'W9',  value: 66 }, { period: 'W10', value: 68 },
    { period: 'W11', value: 67 }, { period: 'W12', value: 68 },
  ];

  private readonly srYMin = 58;
  private readonly srYMax = 72;
  private readonly srPlotW = computed(() => this.srW() - this.srPadL - this.srPadR);
  private readonly srPlotH = this.srH - this.srPadT - this.srPadB;

  private srX = (i: number) => this.srPadL + (i / (this.srRaw.length - 1)) * this.srPlotW();
  private srY = (v: number) => this.srPadT + (1 - (v - this.srYMin) / (this.srYMax - this.srYMin)) * this.srPlotH;

  private srBezier(pts: { x: number; y: number }[]): string {
    return pts.map((p, i) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const prev = pts[i - 1];
      const cpX  = ((prev.x + p.x) / 2).toFixed(1);
      return `C ${cpX} ${prev.y.toFixed(1)}, ${cpX} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }).join(' ');
  }

  readonly srYTicks = [60, 64, 68, 72].map(v => ({
    label: `${v}%`,
    y: this.srY(v),
  }));

  readonly srTrendPts = computed(() => this.srRaw.map((d, i) => ({
    x: this.srX(i), y: this.srY(d.value),
    period: d.period, value: d.value,
    pct: i === 0 ? null : +(d.value - this.srRaw[i - 1].value).toFixed(1),
  })));

  readonly srLinePath = computed(() => this.srBezier(this.srTrendPts()));
  readonly srAreaPath = computed(() => {
    const pts = this.srTrendPts();
    return `${this.srLinePath()} L ${pts[pts.length - 1].x.toFixed(1)} ${this.srBottom} L ${pts[0].x.toFixed(1)} ${this.srBottom} Z`;
  });

  readonly hoveredSrIdx = signal<number | null>(null);
  readonly hoveredSrPt  = computed(() => {
    const i = this.hoveredSrIdx();
    return i !== null ? (this.srTrendPts()[i] ?? null) : null;
  });

  readonly hoveredSrPctPositive = computed(() => (this.hoveredSrPt()?.pct ?? 0) >= 0);
  readonly hoveredSrPctLabel    = computed(() => {
    const pt = this.hoveredSrPt();
    if (!pt || pt.pct === null) return '';
    return `${pt.pct >= 0 ? '+' : ''}${pt.pct}pp vs prev week`;
  });

  onSrMouseMove(e: MouseEvent) {
    const rect   = (e.currentTarget as SVGElement).getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * this.srW();
    let nearest = 0, minDist = Infinity;
    this.srTrendPts().forEach((pt, i) => {
      const d = Math.abs(pt.x - mouseX);
      if (d < minDist) { minDist = d; nearest = i; }
    });
    this.hoveredSrIdx.set(nearest);
  }

  onSrMouseLeave() { this.hoveredSrIdx.set(null); }

  srTooltipX(): number {
    const pt = this.hoveredSrPt();
    if (!pt) return 0;
    return Math.min(Math.max(pt.x + 12, this.srPadL), this.srW() - 160 - this.srPadR);
  }
  srTooltipY(): number {
    return Math.max((this.hoveredSrPt()?.y ?? 0) - 68, this.srPadT);
  }

  ngAfterViewInit() {
    const card = this._el.nativeElement.querySelector('.sr-chart-host');
    if (!card) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w > 0) this.srW.set(Math.round(w));
    });
    ro.observe(card);
  }

  // Legacy aliases kept for zero-result breakdown (still used in template)
  readonly yTicks  = computed(() => [] as never[]);
  readonly xTicks  = computed(() => [] as never[]);
  readonly chartPoints = computed(() => [] as never[]);
  readonly linePath    = computed(() => '');
  readonly areaPath    = computed(() => '');
  readonly chartW = 0; readonly chartH = 0;
  readonly padL = 0; readonly padR = 0; readonly padT = 0; readonly padB = 0;

  readonly topQueryRows: TopQueryRow[] = [
    { query: 'ADB projects Philippines 2025', sessions: 4218, success: 84, zeroResult: false, trending: true  },
    { query: 'climate finance grants',         sessions: 3841, success: 71, zeroResult: false, trending: true  },
    { query: 'ADB annual report 2024',         sessions: 3210, success: 96, zeroResult: false, trending: false },
    { query: 'procurement notices India',      sessions: 2840, success: 52, zeroResult: false, trending: false },
    { query: 'country partnership strategy',   sessions: 2614, success: 79, zeroResult: false, trending: false },
    { query: 'green bond ADB 2025',            sessions: 2480, success: 88, zeroResult: false, trending: true  },
    { query: 'technical assistance grant',     sessions: 1980, success: 43, zeroResult: false, trending: false },
    { query: 'ADB staff vacancy',              sessions: 1740, success: 67, zeroResult: false, trending: false },
    { query: 'Myanmar infrastructure project', sessions: 1280, success: 0,  zeroResult: true,  trending: false },
    { query: 'ASEAN carbon market ADB',        sessions: 1190, success: 0,  zeroResult: true,  trending: false },
    { query: 'Pacific disbursement 2026',      sessions: 980,  success: 0,  zeroResult: true,  trending: false },
    { query: 'knowledge management ADB',       sessions: 840,  success: 58, zeroResult: false, trending: false },
  ];

  readonly zeroResultCategories: ZeroResultCategory[] = [
    { label: 'Procurement / tenders', count: 2841, pct: 38 },
    { label: 'Projects (specific)',   count: 1980, pct: 26 },
    { label: 'Careers / vacancies',   count: 1240, pct: 17 },
    { label: 'Country data',          count: 840,  pct: 11 },
    { label: 'Funding / grants',      count: 540,  pct: 7  },
  ];

  successColor(success: number, zeroResult: boolean): string {
    if (zeroResult) return '#ef4444';
    if (success >= 75) return '#16a34a';
    if (success >= 55) return '#fb923c';
    return '#ef4444';
  }

  // ── Discovery tab ─────────────────────────────────────────────────

  readonly aiChannelRows: AiChannelRow[] = [
    { channel: 'Google AI Overview / Gemini', mentions: 553, citedPages: 223, share: 49.3, trend: '+12%' },
    { channel: 'ChatGPT',                     mentions: 167, citedPages: 84,  share: 14.9, trend: '+8%'  },
    { channel: 'Microsoft Copilot',           mentions: 223, citedPages: 91,  share: 19.9, trend: '+21%' },
    { channel: 'Perplexity',                  mentions: 179, citedPages: 68,  share: 16.0, trend: '+6%'  },
  ];

  readonly readinessRows: ReadinessRow[] = [
    { area: 'Projects',          retrievable: 91, citationRate: 72, structured: 'Good',  freshness: 'Good',  issue: '—'               },
    { area: 'Publications',      retrievable: 84, citationRate: 61, structured: 'Good',  freshness: 'Good',  issue: '—'               },
    { area: 'Countries',         retrievable: 71, citationRate: 43, structured: 'Mixed', freshness: 'Mixed', issue: 'Schema'          },
    { area: 'Data & Statistics', retrievable: 68, citationRate: 38, structured: 'Mixed', freshness: 'Good',  issue: 'Discoverability' },
    { area: 'Procurement',       retrievable: 54, citationRate: 28, structured: 'Mixed', freshness: 'Good',  issue: 'Discoverability' },
    { area: 'News & Events',     retrievable: 88, citationRate: 54, structured: 'Good',  freshness: 'Good',  issue: '—'               },
    { area: 'Careers',           retrievable: 62, citationRate: 31, structured: 'Poor',  freshness: 'Good',  issue: 'Schema'          },
  ];

  readinessBadge(val: 'Good' | 'Mixed' | 'Poor'): string {
    return val === 'Good' ? 'badge badge--good' :
           val === 'Mixed' ? 'badge badge--low' : 'badge badge--high';
  }

  pctColor(pct: number): string {
    if (pct >= 75) return '#16a34a';
    if (pct >= 55) return '#fb923c';
    return '#ef4444';
  }

  maxShare = computed(() =>
    Math.max(...this.aiChannelRows.map(r => r.share))
  );

  shareBarPct(share: number): number {
    return Math.round((share / this.maxShare()) * 100);
  }

  // ── Sources tab ───────────────────────────────────────────────────

  readonly sourcesRows: SourcesRow[] = [
    { page: 'Projects database',      url: 'adb.org/projects',       citations: 8420, share: 24.1, trend: '+14%', aiVisible: true  },
    { page: 'Publications library',   url: 'adb.org/publications',   citations: 6180, share: 17.7, trend: '+9%',  aiVisible: true  },
    { page: 'ADB Annual Report 2025', url: 'adb.org/annual-report',  citations: 4810, share: 13.8, trend: '+28%', aiVisible: true  },
    { page: 'Country profiles',       url: 'adb.org/countries',      citations: 3940, share: 11.3, trend: '+5%',  aiVisible: true  },
    { page: 'Climate Change FAQ',     url: 'adb.org/climate',        citations: 2180, share: 6.2,  trend: '-4%',  aiVisible: true  },
    { page: 'Procurement guidelines', url: 'adb.org/procurement',    citations: 1840, share: 5.3,  trend: '+41%', aiVisible: true  },
    { page: 'About ADB',              url: 'adb.org/about',          citations: 1620, share: 4.6,  trend: '+2%',  aiVisible: true  },
    { page: 'Funding mechanisms',     url: 'adb.org/funding',        citations: 980,  share: 2.8,  trend: '-8%',  aiVisible: false },
    { page: 'Myanmar projects',       url: 'adb.org/countries/myanmar', citations: 820, share: 2.3, trend: '-19%', aiVisible: false },
    { page: 'ASEAN cooperation',      url: 'adb.org/asean',          citations: 610,  share: 1.7,  trend: '-12%', aiVisible: false },
  ];

  readonly losingVisibility: LosingVisibilityRow[] = [
    { page: 'Myanmar projects hub',        decline: '-19% citations', reason: 'Content freshness'  },
    { page: 'ASEAN Cooperation page',      decline: '-12% citations', reason: 'Schema gaps'        },
    { page: 'Climate Finance 2021 report', decline: '-8% citations',  reason: 'Stale content'      },
    { page: 'Funding mechanisms overview', decline: '-8% citations',  reason: 'Discoverability'    },
  ];
}
