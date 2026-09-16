import { Component, ElementRef, AfterViewInit, OnDestroy, computed, effect, inject, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TablerIconComponent } from '@tabler/icons-angular';
import { REGION_GROUPS, VPU_GROUPS } from '../shared/hier-filter/hier-filter-catalog';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';
import { toSlug } from '../shared/slug';

type SegmentId = 'focused' | 'power' | 'onetime' | 'low';
type Period = '30d' | '60d' | '90d';
type KptDomain = 'knowledge' | 'people' | 'tasks';
type KptTab = KptDomain;
type Workspace = 'adb' | 'psod';
type MapMode = 'region' | 'country';

interface SegPromptCategory { label: string; pct: number; prompts: number; }
interface SegVpuRow         { code: string; pct: number; growth: number; }
interface SegUsage          { name: string; usage: number; }

interface KpiMetric { value: string; label?: string; delta?: string; }
interface OverviewKpi { title: string; metrics: KpiMetric[]; sub?: string; }

interface Vpu { code: string; name: string; color: string; }
interface VpuStats extends Vpu {
  conversations: number;
  promptsPerSession: number;
  activeUsers: number;
  segment: SegmentId;
  topPromptCategory: string;
  topCollection: string;
}
interface SegmentRollup {
  segment: SegmentId;
  label: string;
  vpus: VpuStats[];
  total: number;
}

interface Segment {
  id: SegmentId;
  name: string;
  pct: number;
  users: string;
}

interface FunnelStage {
  label: string;
  desc: string;
  users: number;
  pct: number;
  color: string;
}

interface KptSegment {
  domain: KptDomain;
  color: string;
  label: string;
  pct: number;
  sub: string;
  bottom: string;
}

interface VpuRow {
  name: string;
  visits: number;
}

interface CountryRow {
  name: string;
  queries: number;
}

interface RoleRow {
  role: string;
  time: number;
  visitors: number;
}

interface AtTrendPt {
  period: string; pct: number; prevPct: number;
  x: number; y: number; prevY: number;
}

interface DeptAdoptionRow {
  code: string; name: string;
  activeUsers: number; eligibleStaff: number; adoptionPct: number;
  vsPrev: string; vsPrevPositive: boolean; userGrowth: number;
}

interface NrtBar {
  month: string; newUsers: number; returning: number; total: number;
}

interface Persona {
  title: string;
  unit: string;
  avgConv: number;
  avgPrompts: number;
  primaryAgent: string;
  workflows: string[];
  exampleQuery: string;
  insight: string;
}

interface ScatterDot {
  id: string;
  positions: Record<Period, { x: number; y: number }>;
  persona: Persona;
}

@Component({
  selector: 'app-users',
  imports: [TablerIconComponent, DateRangeFilter, DecimalPipe],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements AfterViewInit, OnDestroy {
  // ---- Workspace + filter bar state ----
  readonly workspace = signal<Workspace>('adb');
  setWorkspace(w: Workspace) { this.workspace.set(w); }

  private readonly dateFilter = viewChild(DateRangeFilter);
  readonly vsPrevLabel = computed(() => {
    const sel = this.dateFilter()?.selected();
    if (sel === 'last-month')    return 'vs prev. 1M';
    if (sel === 'last-2-months') return 'vs prev. 2M';
    if (sel === 'custom')        return 'vs prev. period';
    return 'vs prev. 3M';
  });

  // ---- Hierarchical filter catalogs (shared across pages) ----
  readonly regionGroups = REGION_GROUPS;
  readonly vpuGroups    = VPU_GROUPS;

  // ---- KPI cards (3 cards: Total Active Users | New vs Returning | Overall/Avg Adoption) ----
  readonly userKpis: OverviewKpi[] = [
    { title: 'Total Unique Active Users',          metrics: [{ value: '3,095', delta: '+12%' }], sub: 'of ~5,000 ADB staff' },
    { title: 'New vs Returning',                   metrics: [
      { value: '172',   label: 'new' },
      { value: '2,923', label: 'returning' },
    ] },
    { title: 'Overall Adoption Rate',              metrics: [{ value: '60%', delta: '+3.2pp' }], sub: 'across ADB' },
  ];

  // ---- Top Engaged Departments — covers Active Users by Dept + Adoption Rate by Dept ----
  readonly topEngagedVpus: { code: string; name: string; users: number; adoptionPct: number }[] = [
    { code: 'DOCK', name: 'Communications & Knowledge Management', users: 100, adoptionPct: 72 },
    { code: 'ITD',  name: 'Information Technology Department',     users:  92, adoptionPct: 68 },
    { code: 'ORM',  name: 'Office of Risk Management',            users:  86, adoptionPct: 61 },
  ];

  readonly highestGrowthVpus: { code: string; name: string; growthPct: number }[] = [
    { code: 'CWRD', name: 'Central and West Asia Department', growthPct: 32 },
    { code: 'SARD', name: 'South Asia Department',            growthPct: 22 },
    { code: 'EARD', name: 'East Asia Department',             growthPct: 18 },
  ];

  // ---- Department-driven scatter + segmentation ----
  readonly vpuScatterData = computed<VpuStats[]>(() => buildVpuStats(this.activePeriod()));

  readonly selectedVpu = signal<string | null>(null);
  readonly hoveredVpu  = signal<string | null>(null);

  readonly focusedVpu = computed<string | null>(
    () => this.hoveredVpu() ?? this.selectedVpu(),
  );

  readonly focusedVpuStats = computed<VpuStats | null>(() => {
    const code = this.focusedVpu();
    if (!code) return null;
    return this.vpuScatterData().find(v => v.code === code) ?? null;
  });

  readonly selectedVpuDot = computed(() => {
    const code = this.selectedVpu();
    if (!code) return null;
    return this.vpuDots().find(d => d.code === code) ?? null;
  });

  readonly hoveredVpuTooltip = computed<VpuStats | null>(() => {
    const code = this.hoveredVpu();
    if (!code) return null;
    return this.vpuScatterData().find(v => v.code === code) ?? null;
  });

  selectVpu(code: string) {
    this.selectedVpu.update(cur => (cur === code ? null : code));
  }

  slugFor(name: string): string { return toSlug(name); }

  segmentPct(part: number, total: number): number {
    return total === 0 ? 0 : Math.round((part / total) * 100);
  }

  // ============================================================
  // Segment drawer
  // ============================================================
  private readonly sanitizer = inject(DomSanitizer);

  readonly segDrawerSegment = signal<SegmentId | null>(null);
  readonly segDrawerOpen = computed(() => this.segDrawerSegment() !== null);
  readonly segDrawerTab = signal<KptTab>('knowledge');
  readonly segDrawerMapMode = signal<MapMode>('region');
  readonly segDrawerMapSelection = signal<{ name: string; users: number } | null>(null);

  readonly segDrawerData = computed(() => {
    const seg = this.segDrawerSegment();
    return seg ? SEGMENT_DRAWER_DATA[seg] : null;
  });

  readonly activeSegPromptCategories = computed(() => {
    const data = this.segDrawerData();
    return data ? data.promptCategories[this.segDrawerTab()] : [];
  });

  openSegDrawer(seg: SegmentId) {
    this.segDrawerSegment.set(seg);
    this.segDrawerTab.set('knowledge');
    this.segDrawerMapSelection.set(null);
  }
  closeSegDrawer() {
    this.segDrawerSegment.set(null);
    this.segDrawerMapSelection.set(null);
  }
  setSegDrawerMapMode(m: MapMode) {
    this.segDrawerMapMode.set(m);
    this.segDrawerMapSelection.set(null);
  }

  readonly segMapSvg = signal<SafeHtml | null>(null);
  readonly segMapHost = viewChild<ElementRef<HTMLElement>>('segMapHost');

  readonly segMapScale = signal(1);
  readonly segMapTx = signal(0);
  readonly segMapTy = signal(0);
  readonly segMapTransform = computed(
    () => `translate(${this.segMapTx()}px, ${this.segMapTy()}px) scale(${this.segMapScale()})`
  );
  readonly segIsPanning = signal(false);

  private static readonly SEG_MIN_ZOOM = 1;
  private static readonly SEG_MAX_ZOOM = 8;
  private segPanStart: { x: number; y: number; tx: number; ty: number } | null = null;
  private segPanMoved = false;

  constructor() {
    fetch('/world-map-coded.svg')
      .then(r => r.text())
      .then(svg => this.segMapSvg.set(this.sanitizer.bypassSecurityTrustHtml(svg)));

    effect(() => {
      const host = this.segMapHost()?.nativeElement;
      const seg = this.segDrawerSegment();
      this.segMapSvg();
      if (!host || !seg) return;
      setTimeout(() => this.tintSegMap(host, seg), 0);
    });

    effect(() => {
      const host = this.segMapHost()?.nativeElement;
      const s = this.segMapScale();
      const mode = this.segDrawerMapMode();
      this.segMapSvg();
      this.segDrawerSegment();
      if (!host) return;
      setTimeout(() => this.applySegLabelVisibility(host, s, mode), 0);
    });

    effect(() => {
      const open = this.segDrawerOpen();
      if (!open) return;
      this.segZoomToAdbRegion();
    });

  }

  private tintSegMap(host: HTMLElement, seg: SegmentId) {
    const svg = host.querySelector<SVGSVGElement>('svg');
    if (!svg) return;
    const intensityMap = SEGMENT_DRAWER_DATA[seg].mapIntensity;
    svg.querySelectorAll<SVGElement>('[id]').forEach(el => {
      const id = el.id?.toLowerCase();
      if (!id || id.startsWith('_') || id === 'world-map') return;
      const intensity = intensityMap[id] ?? 0;
      const region = ISO_TO_REGION_LITE[id] ?? '';
      const targets = el.tagName === 'g'
        ? el.querySelectorAll<SVGPathElement>('path')
        : [el as unknown as SVGPathElement];
      targets.forEach(p => {
        p.dataset['intensity'] = String(intensity);
        if (region) p.dataset['region'] = region;
        p.dataset['country'] = id;
      });
    });
    if (!svg.querySelector('g.labels')) this.buildSegCountryLabels(svg);
  }

  private buildSegCountryLabels(svg: SVGSVGElement) {
    const ns = 'http://www.w3.org/2000/svg';
    const group = document.createElementNS(ns, 'g');
    group.setAttribute('class', 'labels');
    group.setAttribute('pointer-events', 'none');
    svg.appendChild(group);

    const FONT_SIZE = 7;
    const AVG_CHAR_WIDTH = 0.58;
    svg.querySelectorAll<SVGGraphicsElement>('[id]').forEach(el => {
      const id = el.id?.toLowerCase();
      if (!id || id.startsWith('_') || id === 'world-map') return;
      if (el.tagName !== 'g' && el.tagName !== 'path') return;
      let bbox: DOMRect;
      try { bbox = el.getBBox(); } catch { return; }
      if (!bbox || bbox.width <= 0 || bbox.height <= 0) return;
      const name = COUNTRY_LABEL[id] ?? id.toUpperCase();
      const labelW = name.length * FONT_SIZE * AVG_CHAR_WIDTH;
      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', String(bbox.x + bbox.width / 2));
      text.setAttribute('y', String(bbox.y + bbox.height / 2));
      text.setAttribute('class', 'country-label');
      text.dataset['country'] = id;
      text.dataset['bboxw'] = String(bbox.width);
      text.dataset['labelw'] = String(labelW);
      text.textContent = name;
      group.appendChild(text);
    });
  }

  private applySegLabelVisibility(host: HTMLElement, s: number, mode: MapMode) {
    host.querySelectorAll<SVGTextElement>('text.country-label').forEach(t => {
      if (mode === 'region') { t.style.display = 'none'; return; }
      const cw = Number(t.dataset['bboxw'] ?? '0');
      const lw = Number(t.dataset['labelw'] ?? '0');
      t.style.display = cw * s >= lw * 0.9 ? '' : 'none';
    });
  }

  onSegMapClick(event: MouseEvent) {
    if (this.segPanMoved) { this.segPanMoved = false; return; }
    const seg = this.segDrawerSegment();
    if (!seg) return;
    const target = event.target as Element | null;
    const path = target?.closest?.('path') as SVGPathElement | null;
    if (!path) { this.segDrawerMapSelection.set(null); return; }
    const data = SEGMENT_DRAWER_DATA[seg];
    if (this.segDrawerMapMode() === 'region') {
      const region = path.dataset['region'];
      if (!region) { this.segDrawerMapSelection.set(null); return; }
      const label = REGION_LABEL[region] ?? region.toUpperCase();
      const users = data.regionUsers[region] ?? 0;
      this.segDrawerMapSelection.set({ name: label, users });
    } else {
      const code = path.dataset['country'];
      if (!code) { this.segDrawerMapSelection.set(null); return; }
      const label = COUNTRY_LABEL[code] ?? code.toUpperCase();
      const users = data.countryUsers[code] ?? 0;
      this.segDrawerMapSelection.set({ name: label, users });
    }
  }

  onSegMapWheel(event: WheelEvent) {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
    this.segMapScale.update(s =>
      Math.min(Users.SEG_MAX_ZOOM, Math.max(Users.SEG_MIN_ZOOM, s * factor)),
    );
  }

  onSegPanStart(event: MouseEvent) {
    if (event.button !== 0) return;
    this.segPanStart = { x: event.clientX, y: event.clientY, tx: this.segMapTx(), ty: this.segMapTy() };
    this.segPanMoved = false;
    this.segIsPanning.set(true);
  }

  onSegPanMove(event: MouseEvent) {
    if (!this.segPanStart) return;
    const dx = event.clientX - this.segPanStart.x;
    const dy = event.clientY - this.segPanStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this.segPanMoved = true;
    this.segMapTx.set(this.segPanStart.tx + dx);
    this.segMapTy.set(this.segPanStart.ty + dy);
  }

  onSegPanEnd() {
    this.segPanStart = null;
    this.segIsPanning.set(false);
  }

  segZoomIn()    { this.segMapScale.update(s => Math.min(Users.SEG_MAX_ZOOM, s * 1.25)); }
  segZoomOut()   { this.segMapScale.update(s => Math.max(Users.SEG_MIN_ZOOM, s / 1.25)); }
  segResetView() { this.segZoomToAdbRegion(); }

  private segZoomToAdbRegion() {
    const host = this.segMapHost()?.nativeElement;
    if (!host) return;
    const W = host.clientWidth;
    const H = host.clientHeight;
    if (!W || !H) { requestAnimationFrame(() => this.segZoomToAdbRegion()); return; }
    const lon = 110, lat = 22;
    const nx = (2.412 * (lon + 180) - 31.1 - 30.767) / 784.077;
    const ny = (3.208 * (90 - lat) + 246.1 - 241.591) / 458.627;
    const svgAspect = 784.077 / 458.627;
    const Wc = W / H > svgAspect ? H * svgAspect : W;
    const Hc = W / H > svgAspect ? H : W / svgAspect;
    const s = 1.85;
    this.segMapScale.set(s);
    this.segMapTx.set(s * Wc * (0.5 - nx));
    this.segMapTy.set(s * Hc * (0.5 - ny));
  }

  readonly segmentRollup = computed<SegmentRollup[]>(() => {
    const order: SegmentId[] = ['power', 'focused', 'onetime', 'low'];
    const data = this.vpuScatterData();
    return order.map(seg => {
      const vpus = data
        .filter(v => v.segment === seg)
        .sort((a, b) => b.activeUsers - a.activeUsers);
      const total = vpus.reduce((s, v) => s + v.activeUsers, 0);
      return { segment: seg, label: SEGMENT_LABEL[seg], vpus, total };
    });
  });

  readonly maxSegmentTotal = computed(
    () => Math.max(...this.segmentRollup().map(s => s.total), 1),
  );

  readonly breakdownInsight = 'Power and focused usage is concentrated across regional and sector '
    + 'departments. These groups show deeper exploration patterns, higher prompt density, and stronger '
    + 'return behavior, suggesting the platform is most valuable where teams need multi-source synthesis, '
    + 'project lessons, and expert discovery.';

  readonly vpuDots = computed(() => {
    const xMin = this.padL;
    const xMax = this.padL + this.plotW;
    const yMin = this.padT;
    const yMax = this.padT + this.plotH;
    return this.vpuScatterData().map(v => {
      const r = 3 + ((v.activeUsers - 20) / 280) * 3.5;
      const cx = Math.min(xMax - r, Math.max(xMin + r, this.toSvgX(v.conversations)));
      const cy = Math.min(yMax - r, Math.max(yMin + r, this.toSvgY(v.promptsPerSession)));
      return { ...v, cx, cy, r };
    });
  });

  // ---- Six summary cards ----
  readonly uniqueActiveUsers = {
    value: '3,095',
    sub: 'ADB staff · unique visitors',
    delta: '+12%',
    bottom: 'Jan – May 2026',
  };

  readonly adoptionRate = {
    pct: 60,
    delta: '+3.2pp WoW',
    target: 'Progress to 60% target · Dec 2026',
    status: 'On Track',
    denom: 'of ~5,000 ADB staff',
  };

  readonly newVsReturning = {
    returning: 2923,
    newCount: 172,
    retention: '83.88%',
    bottom: '2,923 of 3,095 users returned',
  };

  readonly avgViews = {
    value: '3',
    delta: '+0.4',
    target: 'target >5 per user per month',
    bottom: 'views per user · Jan – May 2026',
  };

  readonly actionTakingUsers = {
    value: '62%',
    delta: '+6pp',
    sub: 'of users acted on a result',
    bottom: 'copied · saved · downloaded · liked',
  };

  // ---- Workflow Domain Split (KPT segmentation) ----
  readonly kptSegmentation: KptSegment[] = [
    {
      domain: 'knowledge', color: '#00C48C', label: 'Knowledge Seekers', pct: 49,
      sub: 'of active users primarily browsing lessons, collections, country context',
      bottom: '~1,517 users · Knowledge-domain queries dominant',
    },
    {
      domain: 'people', color: '#8B6FE8', label: 'Expertise Connectors', pct: 14,
      sub: 'of active users primarily using Sherlock and expert profiles',
      bottom: '~433 users · Sherlock · Expert Twin interactions',
    },
    {
      domain: 'tasks', color: '#38BDF8', label: 'Task Executors', pct: 37,
      sub: 'of active users primarily using Project Brief Generator, Grumpy Reviewer, Translate',
      bottom: '~1,145 users · Project Brief Generator dominant · 1,242 unique visitors',
    },
  ];

  // ---- Adoption Journey Funnel ----
  readonly funnelStages: FunnelStage[] = [
    { label: 'Discovery',            desc: 'First visit · awareness',          users:  172, pct:  6, color: '#a855f7' },
    { label: 'Exploration',          desc: '2–5 sessions · evaluating',        users:  891, pct: 29, color: '#fb923c' },
    { label: 'Repeat Usage',         desc: 'Returning within 30 days',         users: 2923, pct: 94, color: '#6366f1' },
    { label: 'Workflow Integration', desc: 'Task completion · embedded use',   users: 1242, pct: 40, color: '#6366f1' },
    { label: 'Dependency',           desc: 'Daily use · multiple agents',      users:  340, pct: 11, color: '#14b8a6' },
  ];

  // ---- Lower panels ----
  readonly vpuRows: VpuRow[] = [
    { name: 'DOCK',  visits: 100 },
    { name: 'ITD',   visits:  92 },
    { name: 'ORM',   visits:  86 },
    { name: 'PSOD',  visits:  79 },
    { name: 'ERDI',  visits:  74 },
    { name: 'SARD',  visits:  64 },
    { name: 'CWRD',  visits:  55 },
    { name: 'EARD',  visits:  32 },
    { name: 'SERD',  visits:  31 },
    { name: 'PARD',  visits:  29 },
  ];
  readonly maxVpuVisits = 100;

  readonly coHq = {
    hqPct: 62,
    coPct: 38,
    hqUsers: '~1,919',
    coUsers: '~1,176',
  };

  readonly topCountries: CountryRow[] = [
    { name: 'Philippines', queries: 9669 },
    { name: 'India',       queries: 4100 },
    { name: 'Indonesia',   queries:  820 },
    { name: 'Bangladesh',  queries:  729 },
    { name: 'Vietnam',     queries:  612 },
    { name: 'Pakistan',    queries:  540 },
    { name: 'Kazakhstan',  queries:  487 },
  ];

  readonly topRoles: RoleRow[] = [
    { role: 'Infrastructure Specialist',                  time: 32.3, visitors: 1 },
    { role: 'Portfolio Officer',                          time: 23.5, visitors: 1 },
    { role: 'Economics Officer',                          time: 19.0, visitors: 2 },
    { role: 'Senior Knowledge Management Officer',        time: 17.2, visitors: 6 },
    { role: 'Communications Officer',                     time: 15.8, visitors: 1 },
    { role: 'Consultant',                                 time: 15.7, visitors: 13 },
    { role: 'Publishing Officer',                         time: 14.6, visitors: 1 },
    { role: 'Senior IT Officer Business Analysis',        time: 14.3, visitors: 1 },
    { role: 'IT Officer Business Solutions',              time: 14.2, visitors: 24 },
    { role: 'Senior Environmental Specialist',            time: 13.5, visitors: 1 },
  ];
  readonly maxRoleTime = 32.3;

  // ---- Segments (for legend + segment-level summary) ----
  readonly segments: Segment[] = [
    { id: 'focused', name: 'Focused Users',       pct: 22, users: '1,265 Users' },
    { id: 'power',   name: 'Power Users',          pct: 4,  users: '230 Users'   },
    { id: 'onetime', name: 'One-Time Users',       pct: 45, users: '2,588 Users' },
    { id: 'low',     name: 'Low Engagement Users', pct: 26, users: '333 Users'   },
  ];

  readonly selectedSegment = signal<SegmentId | null>(null);
  readonly selectedDot     = signal<string | null>(null);

  selectSegment(id: SegmentId) {
    this.selectedSegment.update(cur => cur === id ? null : id);
    this.selectedDot.set(null);
  }

  selectDot(id: string) {
    this.selectedDot.update(cur => cur === id ? null : id);
    this.selectedSegment.set(null);
  }

  readonly currentSegment = computed(() =>
    this.segments.find(s => s.id === this.selectedSegment()) ?? null,
  );

  readonly selectedDotSegment = computed((): SegmentId | null => {
    const id = this.selectedDot();
    if (!id) return null;
    return this.currentDots().find(d => d.id === id)?.seg ?? null;
  });

  readonly currentPersona = computed((): Persona | null => {
    const id = this.selectedDot();
    if (!id) return null;
    return this.scatterDots.find(d => d.id === id)?.persona ?? null;
  });

  private readonly summaries: Record<SegmentId, string> = {
    focused:
      'Focused Users return regularly with short, purposeful sessions. They typically run 2–4 prompts ' +
      'per visit and rely on saved drafts and bookmarks. Action rate is well above average. ' +
      'Growth opportunity: surface advanced workflows to convert them into Power Users.',
    power:
      "Power Users drive the long tail of activity — high conversation count and high prompt intensity. " +
      "They span multiple agents in a single session and provide the bulk of qualitative feedback. " +
      "They are the platform's best signal for what to build next.",
    onetime:
      'One-Time Users visited once and did not return. Common patterns: ambiguous query intent, ' +
      'no result clicked, no follow-up prompt. Priority: clearer onboarding and targeted re-engagement.',
    low:
      'Low Engagement Users opened sessions but ran few prompts and rarely acted on results. ' +
      'Consider curated starting points and example queries from their unit to convert exploration into task-oriented use.',
  };

  readonly currentSummary = computed(() => {
    const id = this.selectedSegment();
    return id ? this.summaries[id] : null;
  });

  // ---- Scatter plot ----
  readonly periods: Period[] = ['30d', '60d', '90d'];
  readonly activePeriod = signal<Period>('30d');
  readonly hoveredDot   = signal<string | null>(null);

  readonly svgW = 420; readonly svgH = 280;
  readonly padL = 52;  readonly padT = 16;
  readonly padR = 16;  readonly padB = 40;
  readonly plotW = 352; readonly plotH = 224;

  toSvgX(x: number) { return this.padL + (x / 20) * this.plotW; }
  toSvgY(y: number) { return this.padT + this.plotH - (y / 20) * this.plotH; }

  segOf(x: number, y: number): SegmentId {
    if (x >= 10 && y >= 10) return 'power';
    if (x <  10 && y >= 10) return 'focused';
    if (x <  10 && y <  10) return 'onetime';
    return 'low';
  }

  segColor(s: SegmentId): string {
    return ({ power:'#14b8a6', focused:'#6366f1', onetime:'#a855f7', low:'#fb923c' })[s];
  }

  segLabel(s: SegmentId): string {
    return ({ power:'Power Users', focused:'Focused Users', onetime:'One-Time Users', low:'Low Engagement' })[s];
  }

  readonly scatterDots: ScatterDot[] = [
    {
      id: 'p1',
      positions: { '30d': {x:16,y:17}, '60d': {x:15,y:16}, '90d': {x:14,y:15} },
      persona: {
        title: 'Task Team Leader (TTL)',
        unit: 'Infrastructure & Operations · CWRD',
        avgConv: 16, avgPrompts: 17, primaryAgent: 'Project Brief Generator',
        workflows: ['Project Brief drafting & revision', 'Country economic context', 'Policy framework lookup'],
        exampleQuery: 'Draft a Project Brief for a regional connectivity project in Central Asia with a $50M envelope',
        insight: 'High-volume, high-intensity user. Runs multi-step sessions spanning project brief drafting, economic background, and compliance checks in a single sitting. Highest action rate on the platform.',
      },
    },
    {
      id: 'p2',
      positions: { '30d': {x:18,y:13}, '60d': {x:17,y:12}, '90d': {x:16,y:12} },
      persona: {
        title: 'Senior Macro Economist',
        unit: 'Economic Research & Development Impact (ERDI)',
        avgConv: 18, avgPrompts: 13, primaryAgent: 'Sherlock',
        workflows: ['Cross-country GDP comparisons', 'Inflation & labour market analysis', 'Synthesis across ADB flagship reports'],
        exampleQuery: 'Compare GDP growth trajectories in Central Asia post-2022 with ADB economic outlooks',
        insight: 'Research-driven power user who chains multiple analytical prompts per session. Frequently cites and exports findings directly to policy notes and briefs.',
      },
    },
    {
      id: 'fp1',
      positions: { '30d': {x:13,y:15}, '60d': {x:9,y:14}, '90d': {x:6,y:13} },
      persona: {
        title: 'Investment Officer (PSOD)',
        unit: 'Private Sector Operations · PSOD',
        avgConv: 13, avgPrompts: 15, primaryAgent: 'Lessons Learned Explorer',
        workflows: ['Private sector market analysis', 'ADB PSOD portfolio performance review', 'Deal context & comparables'],
        exampleQuery: 'What are lessons from ADB private sector investments in infrastructure over the past 5 years?',
        insight: 'Rapidly increasing usage as it proves value for deal diligence and lessons. Projected to enter the Power User quadrant in the next cycle.',
      },
    },
    {
      id: 'fp2',
      positions: { '30d': {x:12,y:12}, '60d': {x:8,y:11}, '90d': {x:5,y:10} },
      persona: {
        title: 'Climate & Infrastructure Specialist',
        unit: 'Climate Change & Sustainable Development · CCSD',
        avgConv: 12, avgPrompts: 12, primaryAgent: 'MultiAgent Synthesis',
        workflows: ['Climate finance flow analysis', 'Energy transition strategy', 'Resilient infrastructure benchmarks'],
        exampleQuery: 'Summarise best practices for coal transition financing in Central Asia',
        insight: 'Usage growing in line with the expanded climate mandate. Multi-agent synthesis is the primary draw — sessions increasingly span multiple knowledge domains.',
      },
    },
    {
      id: 'f1',
      positions: { '30d': {x:5,y:16}, '60d': {x:4,y:15}, '90d': {x:4,y:14} },
      persona: {
        title: 'Research Analyst',
        unit: 'Economic Research & Development Impact (ERDI) · Global',
        avgConv: 5, avgPrompts: 16, primaryAgent: 'Sherlock',
        workflows: ['Deep literature search', 'Citation coverage review', 'Poverty & welfare data synthesis'],
        exampleQuery: 'Find peer-reviewed sources on the impact of social protection on labour supply in developing Asia',
        insight: 'Low-frequency but very high-intensity sessions. Runs 10–20 prompts per sitting focused on evidence synthesis, typically for ADB flagship report chapters.',
      },
    },
    {
      id: 'f2',
      positions: { '30d': {x:7,y:14}, '60d': {x:6,y:13}, '90d': {x:6,y:12} },
      persona: {
        title: 'Portfolio Officer',
        unit: 'Portfolio, Results & Quality Control (PFMD)',
        avgConv: 7, avgPrompts: 14, primaryAgent: 'Sherlock',
        workflows: ['Portfolio performance queries', 'Project risk flagging', 'Operational policy lookup'],
        exampleQuery: 'Which active projects in SERD have overdue project completion reports and what are common risk themes?',
        insight: 'Focused sessions oriented around specific portfolio tasks. Action rate is very high — most queries end with a document export or decision note.',
      },
    },
    {
      id: 'f3',
      positions: { '30d': {x:3,y:18}, '60d': {x:3,y:17}, '90d': {x:3,y:16} },
      persona: {
        title: 'Country Economist',
        unit: 'Economics & Finance · South Asia (SARD)',
        avgConv: 3, avgPrompts: 18, primaryAgent: 'Sherlock',
        workflows: ['Country macro deep-dives', 'Poverty data comparisons', 'Country Partnership Strategy background research'],
        exampleQuery: 'Pull the latest poverty headcount data for Bangladesh and compare with South Asian regional averages',
        insight: 'Highest prompt-per-session ratio on the platform. Runs marathon research sessions anchored to Country Partnership Strategy and sector assessment deliverables.',
      },
    },
    {
      id: 'f4',
      positions: { '30d': {x:8,y:12}, '60d': {x:7,y:11}, '90d': {x:7,y:11} },
      persona: {
        title: 'Practice Manager',
        unit: 'Human Development Sectors · SARD',
        avgConv: 8, avgPrompts: 12, primaryAgent: 'MultiAgent Synthesis',
        workflows: ['Cross-sector synthesis', 'Team performance overview', 'Strategic planning inputs'],
        exampleQuery: 'Synthesise findings across social development and education lending in South Asia for the past 3 years',
        insight: 'Uses the platform primarily for synthesis tasks ahead of management reviews. Sessions are purposeful and time-boxed; rarely re-runs a query.',
      },
    },
    {
      id: 'of1',
      positions: { '30d': {x:4,y:11}, '60d': {x:4,y:7}, '90d': {x:3,y:3} },
      persona: {
        title: 'Operations Officer',
        unit: 'Country Operations · CWRD',
        avgConv: 4, avgPrompts: 11, primaryAgent: 'Project Brief Generator',
        workflows: ['Operational guidance lookup', 'Fiduciary compliance checks', 'Project preparation support'],
        exampleQuery: 'What are the operational requirements for a community-based rural development project under ADB procedures?',
        insight: 'Recent convert from one-time visitor. Started using the platform for fiduciary queries and is now exploring project brief drafting. Engagement growing steadily — watch for transition into the Focused segment.',
      },
    },
    {
      id: 'of2',
      positions: { '30d': {x:6,y:10}, '60d': {x:5,y:6}, '90d': {x:5,y:2} },
      persona: {
        title: 'Young Professional (YP) / Junior Economist',
        unit: 'Economic Research & Development Impact · Global',
        avgConv: 6, avgPrompts: 10, primaryAgent: 'Sherlock',
        workflows: ['Background research for senior staff', 'Data table construction', 'Literature review support'],
        exampleQuery: 'Summarise ADB Asian Development Outlook findings for Indonesia, Philippines, and Vietnam in 2024',
        insight: 'Building platform habits through repeated use for research briefs. Strong candidate for the Focused User segment — targeted prompts from their unit would accelerate progression.',
      },
    },
    {
      id: 'o1',
      positions: { '30d': {x:2,y:3}, '60d': {x:2,y:3}, '90d': {x:2,y:3} },
      persona: {
        title: 'Administrative Assistant',
        unit: 'Country Office · Philippines',
        avgConv: 2, avgPrompts: 3, primaryAgent: 'Sherlock',
        workflows: ['General document lookup', 'Meeting preparation'],
        exampleQuery: 'Where can I find the standard consulting contract template?',
        insight: 'Single-session user who arrived via a team referral for a specific document lookup. The platform is not aligned to core daily workflows for this role.',
      },
    },
    {
      id: 'o2',
      positions: { '30d': {x:4,y:2}, '60d': {x:4,y:2}, '90d': {x:4,y:2} },
      persona: {
        title: 'HR Officer',
        unit: 'Human Resources · Manila HQ',
        avgConv: 4, avgPrompts: 2, primaryAgent: 'Sherlock',
        workflows: ['Staff policy lookup'],
        exampleQuery: 'What is the parental leave policy for locally hired staff?',
        insight: 'Used the platform once for an HR policy question that could have been resolved via the staff portal. Platform not well-suited to this persona\'s core workflows.',
      },
    },
    {
      id: 'o3',
      positions: { '30d': {x:1,y:5}, '60d': {x:1,y:5}, '90d': {x:1,y:5} },
      persona: {
        title: 'Procurement Officer',
        unit: 'Procurement, Portfolio & Financial Management · ORM',
        avgConv: 1, avgPrompts: 5, primaryAgent: 'Sherlock',
        workflows: ['Procurement regulation lookup'],
        exampleQuery: 'Summarise ADB procurement requirements for consulting firms',
        insight: 'High prompt count for a single session — engaged once, deeply, but did not return. Possible value fit for policy lookups if re-engaged with targeted content.',
      },
    },
    {
      id: 'o4',
      positions: { '30d': {x:6,y:4}, '60d': {x:6,y:4}, '90d': {x:6,y:4} },
      persona: {
        title: 'Finance Officer',
        unit: 'Budget & Management Systems · BPMSD',
        avgConv: 6, avgPrompts: 4, primaryAgent: 'Sherlock',
        workflows: ['Budget policy lookup', 'Expense guideline queries'],
        exampleQuery: 'What are the allowable expenses for mission travel under ADB Admin Manual rules?',
        insight: "One-time user for an administrative finance query. The platform's value proposition for routine finance questions remains unclear without a dedicated finance knowledge collection.",
      },
    },
    {
      id: 'o5',
      positions: { '30d': {x:3,y:7}, '60d': {x:3,y:7}, '90d': {x:3,y:7} },
      persona: {
        title: 'Communications Officer',
        unit: 'External Relations · DOCK',
        avgConv: 3, avgPrompts: 7, primaryAgent: 'Sherlock',
        workflows: ['Press release background research', 'Project results storytelling'],
        exampleQuery: 'Find key results from ADB infrastructure projects in Indonesia for a press release',
        insight: 'Used the platform for content research with moderate prompt depth. Did not return — outputs likely required significant editing to meet communications standards.',
      },
    },
    {
      id: 'o6',
      positions: { '30d': {x:7,y:6}, '60d': {x:7,y:6}, '90d': {x:7,y:6} },
      persona: {
        title: 'IT Support Specialist',
        unit: 'Information Technology Department · ITD',
        avgConv: 7, avgPrompts: 6, primaryAgent: 'Sherlock',
        workflows: ['Internal documentation search'],
        exampleQuery: 'What is the data classification policy for sharing operational documents externally?',
        insight: 'Single exploratory visit for an internal IT policy query. The platform is not the right fit for IT-specific or infrastructure documentation needs.',
      },
    },
    {
      id: 'o7',
      positions: { '30d': {x:2,y:8}, '60d': {x:2,y:8}, '90d': {x:2,y:8} },
      persona: {
        title: 'Short-Term Consultant (STC)',
        unit: 'Governance · SERD',
        avgConv: 2, avgPrompts: 8, primaryAgent: 'Lessons Learned Explorer',
        workflows: ['Project lessons lookup', 'Rapid background research'],
        exampleQuery: 'What are lessons from public financial management reforms in Southeast Asia?',
        insight: 'Engaged deeply for a specific assignment. High prompt depth for a one-time user — likely found value but engagement ended with the contract.',
      },
    },
    {
      id: 'o8',
      positions: { '30d': {x:5,y:5}, '60d': {x:5,y:5}, '90d': {x:5,y:5} },
      persona: {
        title: 'Junior Professional Officer (JPO)',
        unit: 'Agriculture, Food, Nature & Rural Development · CWRD',
        avgConv: 5, avgPrompts: 5, primaryAgent: 'Sherlock',
        workflows: ['Sector background reading', 'Early career exploration'],
        exampleQuery: 'Give me an overview of ADB agricultural projects in Central Asia',
        insight: 'Initial exploration visit. Promising re-engagement candidate — targeted onboarding with sector-specific prompts would likely convert this persona to a Focused User.',
      },
    },
    {
      id: 'l1',
      positions: { '30d': {x:13,y:5}, '60d': {x:12,y:4}, '90d': {x:12,y:4} },
      persona: {
        title: 'Country Manager',
        unit: 'Country Management · Philippines',
        avgConv: 13, avgPrompts: 5, primaryAgent: 'Sherlock',
        workflows: ['High-level country overview', 'Portfolio status checks'],
        exampleQuery: 'What is the current status of our active portfolio in the Philippines?',
        insight: 'Logs in frequently but delegates deep research to team members. Sessions are brief check-ins rather than substantive queries — high frequency, low depth.',
      },
    },
    {
      id: 'l2',
      positions: { '30d': {x:16,y:7}, '60d': {x:15,y:6}, '90d': {x:14,y:6} },
      persona: {
        title: 'Regional Coordinator',
        unit: 'Operations · South Asia (SARD)',
        avgConv: 16, avgPrompts: 7, primaryAgent: 'Sherlock',
        workflows: ['Cross-country coordination queries', 'Meeting preparation'],
        exampleQuery: 'List active projects across SARD with flagged implementation issues',
        insight: 'High login frequency, low prompt depth. Uses the platform as a quick reference tool rather than an analytical platform. A structured dashboard view would serve this persona better.',
      },
    },
    {
      id: 'l3',
      positions: { '30d': {x:12,y:3}, '60d': {x:11,y:3}, '90d': {x:11,y:3} },
      persona: {
        title: 'Operations Analyst',
        unit: 'Country Operations · SERD',
        avgConv: 12, avgPrompts: 3, primaryAgent: 'Sherlock',
        workflows: ['Operational reporting', 'Routine compliance checks'],
        exampleQuery: 'What reporting is required for a $200M sector loan in the SERD region?',
        insight: 'Frequent but shallow engagement driven by routine operational queries. Consider whether structured templates would serve this workflow better than open-ended AI queries.',
      },
    },
    {
      id: 'l4',
      positions: { '30d': {x:18,y:5}, '60d': {x:17,y:4}, '90d': {x:17,y:4} },
      persona: {
        title: 'Sector Unit Assistant',
        unit: 'Energy Sector · CWRD',
        avgConv: 18, avgPrompts: 5, primaryAgent: 'Sherlock',
        workflows: ['Document filing support', 'Quick document retrieval'],
        exampleQuery: 'Find the latest energy sector strategy document for Central Asia',
        insight: 'Very high session count but consistently shallow queries dominated by administrative tasks. Evaluate whether the platform is the appropriate tool for this workflow.',
      },
    },
  ];

  readonly currentDots = computed(() => {
    const period = this.activePeriod();
    return this.scatterDots.map(d => {
      const pos = d.positions[period];
      const seg = this.segOf(pos.x, pos.y);
      return {
        id: d.id,
        cx: this.toSvgX(pos.x),
        cy: this.toSvgY(pos.y),
        seg,
        color: this.segColor(seg),
        personaTitle: d.persona.title,
      };
    });
  });

  readonly prevPeriod = computed((): Period | null => {
    const p = this.activePeriod();
    return p === '30d' ? '60d' : p === '60d' ? '90d' : null;
  });

  readonly trailLines = computed(() => {
    const pp  = this.prevPeriod();
    const cur = this.activePeriod();
    if (!pp) return [];
    return this.scatterDots
      .map(d => {
        const from = d.positions[pp];
        const to   = d.positions[cur];
        if (Math.abs(from.x - to.x) < 1 && Math.abs(from.y - to.y) < 1) return null;
        return {
          id:      d.id + '-trail',
          x1:      this.toSvgX(from.x), y1: this.toSvgY(from.y),
          x2:      this.toSvgX(to.x),   y2: this.toSvgY(to.y),
          ghostCx: this.toSvgX(from.x),
          ghostCy: this.toSvgY(from.y),
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);
  });

  readonly hoveredDotData = computed(() => {
    const id = this.hoveredDot();
    if (!id) return null;
    return this.currentDots().find(d => d.id === id) ?? null;
  });

  arcStroke(pct: number): { dash: string } {
    const C = 2 * Math.PI * 42;
    return { dash: `${(pct / 100) * C} ${C}` };
  }

  // ---- Adoption Rate by Location ----
  readonly adoptionByLocation: { location: string; adoptionPct: number; users: number; prompts: number }[] = [
    { location: 'HQ (Manila)',   adoptionPct: 64, users: 1919, prompts: 12418 },
    { location: 'Philippines',   adoptionPct: 45, users:  427, prompts:  2834 },
    { location: 'India',         adoptionPct: 41, users:  188, prompts:  1352 },
    { location: 'Pakistan',      adoptionPct: 35, users:   95, prompts:   584 },
    { location: 'Indonesia',     adoptionPct: 32, users:   82, prompts:   471 },
    { location: 'Sri Lanka',     adoptionPct: 29, users:   54, prompts:   295 },
  ];

  // ---- Power Users (top 10% by prompt volume) ----
  readonly powerUsers: { rank: number; userId: string; role: string; dept: string; prompts: number; sessions: number }[] = [
    { rank: 1, userId: 'Staff 001', role: 'Economist',              dept: 'ERCD', prompts: 127, sessions: 41 },
    { rank: 2, userId: 'Staff 002', role: 'Project Officer',        dept: 'SARD', prompts: 118, sessions: 38 },
    { rank: 3, userId: 'Staff 003', role: 'Senior Specialist',      dept: 'DOCK', prompts: 109, sessions: 35 },
    { rank: 4, userId: 'Staff 004', role: 'Finance Analyst',        dept: 'CTLO', prompts: 104, sessions: 33 },
    { rank: 5, userId: 'Staff 005', role: 'M&E Specialist',         dept: 'SDNC', prompts:  98, sessions: 31 },
    { rank: 6, userId: 'Staff 006', role: 'Operations Analyst',     dept: 'CWRD', prompts:  91, sessions: 29 },
    { rank: 7, userId: 'Staff 007', role: 'IT Officer',             dept: 'ITD',  prompts:  87, sessions: 28 },
    { rank: 8, userId: 'Staff 008', role: 'Procurement Officer',    dept: 'PPFD', prompts:  83, sessions: 26 },
    { rank: 9, userId: 'Staff 009', role: 'Climate Specialist',     dept: 'SERD', prompts:  79, sessions: 25 },
    { rank: 10, userId: 'Staff 010', role: 'Communications Officer', dept: 'DOCK', prompts:  74, sessions: 23 },
  ];

  // ---- MoM Growth by Department (all departments) ----
  readonly vpuMomGrowth: { code: string; name: string; growthPct: number; activeUsers: number }[] = [
    { code: 'CCSA', name: 'Climate Change Solutions',         growthPct: 80, activeUsers: 45 },
    { code: 'ERCD', name: 'Economic Research',                growthPct: 60, activeUsers: 74 },
    { code: 'BPGE', name: 'Budget & Planning',                growthPct: 40, activeUsers: 38 },
    { code: 'PPP',  name: 'Public-Private Partnerships',      growthPct: 30, activeUsers: 31 },
    { code: 'SDNC', name: 'Sustainable Dev. & Climate Change',growthPct: 17, activeUsers: 55 },
    { code: 'CTLO', name: 'Controller',                       growthPct:  5, activeUsers: 42 },
    { code: 'DOCK', name: 'Communications & Knowledge Mgmt.', growthPct:  3, activeUsers: 100 },
    { code: 'ITD',  name: 'Information Technology Dept.',     growthPct:  2, activeUsers: 92 },
    { code: 'SARD', name: 'South Asia Department',            growthPct: 22, activeUsers: 64 },
    { code: 'CWRD', name: 'Central and West Asia Dept.',      growthPct: 32, activeUsers: 55 },
  ];

  // ---- Expanded Department Adoption table (10 rows, 6 columns) ----
  readonly deptAdoptionRows: DeptAdoptionRow[] = [
    { code: 'DOCK',   name: 'Communications & Knowledge Mgmt.', activeUsers: 100,  eligibleStaff: 139,  adoptionPct: 72, vsPrev: '+3pp', vsPrevPositive: true,  userGrowth:  12 },
    { code: 'ITD',    name: 'Information Technology Dept.',      activeUsers:  92,  eligibleStaff: 135,  adoptionPct: 68, vsPrev: '+2pp', vsPrevPositive: true,  userGrowth:   9 },
    { code: 'ORM',    name: 'Office of Risk Management',         activeUsers:  86,  eligibleStaff: 141,  adoptionPct: 61, vsPrev: '-1pp', vsPrevPositive: false, userGrowth:  -3 },
    { code: 'CCSA',   name: 'Climate Change Solutions',          activeUsers:  45,  eligibleStaff:  89,  adoptionPct: 51, vsPrev: '+6pp', vsPrevPositive: true,  userGrowth:  15 },
    { code: 'ERCD',   name: 'Economic Research',                 activeUsers:  74,  eligibleStaff: 158,  adoptionPct: 47, vsPrev: '+4pp', vsPrevPositive: true,  userGrowth:  18 },
    { code: 'BPGE',   name: 'Budget & Planning',                 activeUsers:  38,  eligibleStaff:  92,  adoptionPct: 41, vsPrev: '+1pp', vsPrevPositive: true,  userGrowth:   4 },
    { code: 'PPP',    name: 'Public-Private Partnerships',       activeUsers:  31,  eligibleStaff:  83,  adoptionPct: 37, vsPrev: '0pp',  vsPrevPositive: true,  userGrowth:   0 },
    { code: 'SDNC',   name: 'Sustainable Dev. & Climate',        activeUsers:  55,  eligibleStaff: 172,  adoptionPct: 32, vsPrev: '-2pp', vsPrevPositive: false, userGrowth:  -6 },
    { code: 'CTLO',   name: 'Controller',                        activeUsers:  42,  eligibleStaff: 148,  adoptionPct: 28, vsPrev: '+3pp', vsPrevPositive: true,  userGrowth:   8 },
    { code: 'SERD',   name: 'Southeast Asia Regional Dept.',     activeUsers:  36,  eligibleStaff: 132,  adoptionPct: 27, vsPrev: '+2pp', vsPrevPositive: true,  userGrowth:   5 },
    { code: 'OGC',    name: 'Office of the General Counsel',     activeUsers:  28,  eligibleStaff: 107,  adoptionPct: 26, vsPrev: '-1pp', vsPrevPositive: false, userGrowth:  -2 },
    { code: 'SARD',   name: 'South Asia Regional Dept.',         activeUsers:  33,  eligibleStaff: 130,  adoptionPct: 25, vsPrev: '+1pp', vsPrevPositive: true,  userGrowth:   3 },
    { code: 'SPD',    name: 'Strategy & Policy Dept.',           activeUsers:  19,  eligibleStaff:  78,  adoptionPct: 24, vsPrev: '0pp',  vsPrevPositive: true,  userGrowth:   0 },
    { code: 'IED',    name: 'Independent Evaluation Dept.',      activeUsers:  14,  eligibleStaff:  62,  adoptionPct: 23, vsPrev: '+2pp', vsPrevPositive: true,  userGrowth:   2 },
    { code: 'OSEC',   name: 'Office of the Secretary',           activeUsers:  11,  eligibleStaff:  50,  adoptionPct: 22, vsPrev: '-1pp', vsPrevPositive: false, userGrowth:  -1 },
    { code: 'Others', name: 'All other departments',             activeUsers: 2532, eligibleStaff: 2843, adoptionPct: 24, vsPrev: '+5pp', vsPrevPositive: true,  userGrowth: 308 },
  ];

  // ---- Department Adoption view toggle ----
  readonly deptView = signal<'table' | 'bar'>('table');

  // ---- All-departments modal ----
  deptModalOpen  = signal(false);
  deptModalSearch = signal('');

  readonly allDeptRows: DeptAdoptionRow[] = [
    { code: 'DOCK',  name: 'Communications & Knowledge Mgmt.',   activeUsers: 100, eligibleStaff: 139, adoptionPct: 72, vsPrev: '+3pp', vsPrevPositive: true,  userGrowth:  12 },
    { code: 'ITD',   name: 'Information Technology Dept.',        activeUsers:  92, eligibleStaff: 135, adoptionPct: 68, vsPrev: '+2pp', vsPrevPositive: true,  userGrowth:   9 },
    { code: 'ORM',   name: 'Office of Risk Management',           activeUsers:  86, eligibleStaff: 141, adoptionPct: 61, vsPrev: '-1pp', vsPrevPositive: false, userGrowth:  -3 },
    { code: 'CCSA',  name: 'Climate Change Solutions',            activeUsers:  45, eligibleStaff:  89, adoptionPct: 51, vsPrev: '+6pp', vsPrevPositive: true,  userGrowth:  15 },
    { code: 'ERCD',  name: 'Economic Research',                   activeUsers:  74, eligibleStaff: 158, adoptionPct: 47, vsPrev: '+4pp', vsPrevPositive: true,  userGrowth:  18 },
    { code: 'BPGE',  name: 'Budget & Planning',                   activeUsers:  38, eligibleStaff:  92, adoptionPct: 41, vsPrev: '+1pp', vsPrevPositive: true,  userGrowth:   4 },
    { code: 'PFMD',  name: 'Portfolio, Results & Quality Control',activeUsers:  29, eligibleStaff:  83, adoptionPct: 35, vsPrev: '+2pp', vsPrevPositive: true,  userGrowth:   5 },
    { code: 'PPP',   name: 'Public-Private Partnerships',         activeUsers:  31, eligibleStaff:  83, adoptionPct: 37, vsPrev: '0pp',  vsPrevPositive: true,  userGrowth:   0 },
    { code: 'PSOD',  name: 'Private Sector Operations',           activeUsers:  35, eligibleStaff: 127, adoptionPct: 28, vsPrev: '+1pp', vsPrevPositive: true,  userGrowth:   3 },
    { code: 'SARD',  name: 'South Asia Dept.',                    activeUsers:  63, eligibleStaff: 224, adoptionPct: 28, vsPrev: '+1pp', vsPrevPositive: true,  userGrowth:   8 },
    { code: 'SERD',  name: 'Southeast Asia Dept.',                activeUsers:  57, eligibleStaff: 201, adoptionPct: 28, vsPrev: '+3pp', vsPrevPositive: true,  userGrowth:   7 },
    { code: 'OSEC',  name: 'Office of the Secretary',             activeUsers:  18, eligibleStaff:  64, adoptionPct: 28, vsPrev: '0pp',  vsPrevPositive: true,  userGrowth:   1 },
    { code: 'SDNC',  name: 'Sustainable Dev. & Climate',          activeUsers:  55, eligibleStaff: 172, adoptionPct: 32, vsPrev: '-2pp', vsPrevPositive: false, userGrowth:  -6 },
    { code: 'CWRD',  name: 'Central & West Asia Dept.',           activeUsers:  48, eligibleStaff: 195, adoptionPct: 25, vsPrev: '+2pp', vsPrevPositive: true,  userGrowth:   6 },
    { code: 'IED',   name: 'Independent Evaluation Dept.',        activeUsers:  14, eligibleStaff:  52, adoptionPct: 27, vsPrev: '-1pp', vsPrevPositive: false, userGrowth:  -1 },
    { code: 'EARD',  name: 'East Asia Dept.',                     activeUsers:  41, eligibleStaff: 168, adoptionPct: 24, vsPrev: '+1pp', vsPrevPositive: true,  userGrowth:   4 },
    { code: 'CTLO',  name: 'Controller',                          activeUsers:  42, eligibleStaff: 148, adoptionPct: 28, vsPrev: '+3pp', vsPrevPositive: true,  userGrowth:   8 },
    { code: 'ADBI',  name: 'ADB Institute',                       activeUsers:  11, eligibleStaff:  43, adoptionPct: 26, vsPrev: '+1pp', vsPrevPositive: true,  userGrowth:   1 },
    { code: 'PARD',  name: 'Pacific Dept.',                       activeUsers:  22, eligibleStaff:  98, adoptionPct: 22, vsPrev: '-1pp', vsPrevPositive: false, userGrowth:  -2 },
  ].sort((a, b) => b.adoptionPct - a.adoptionPct);

  readonly filteredDeptRows = computed(() => {
    const q = this.deptModalSearch().trim().toLowerCase();
    if (!q) return this.allDeptRows;
    return this.allDeptRows.filter(d =>
      d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)
    );
  });

  // ---- Responsive font-size for SVG axis labels ----
  readonly atSvgEl  = viewChild<ElementRef<SVGElement>>('atSvgEl');
  readonly nrtSvgEl = viewChild<ElementRef<SVGElement>>('nrtSvgEl');

  private readonly atRenderedW  = signal(640);
  private readonly nrtRenderedW = signal(360);
  private atRo?: ResizeObserver;
  private nrtRo?: ResizeObserver;

  readonly atFontSize  = computed(() => Math.round((14 * 640  / this.atRenderedW())  * 10) / 10);
  readonly nrtFontSize = computed(() => Math.round((14 * 360  / this.nrtRenderedW()) * 10) / 10);

  ngAfterViewInit(): void {
    const atEl  = this.atSvgEl()?.nativeElement;
    const nrtEl = this.nrtSvgEl()?.nativeElement;
    if (atEl) {
      this.atRo = new ResizeObserver(e => { const w = e[0].contentRect.width; if (w > 0) this.atRenderedW.set(w); });
      this.atRo.observe(atEl);
    }
    if (nrtEl) {
      this.nrtRo = new ResizeObserver(e => { const w = e[0].contentRect.width; if (w > 0) this.nrtRenderedW.set(w); });
      this.nrtRo.observe(nrtEl);
    }
  }

  ngOnDestroy(): void {
    this.atRo?.disconnect();
    this.nrtRo?.disconnect();
  }

  // ---- Adoption Rate Over Time SVG chart (teal #00C48C) ----
  private readonly atRawTrend: { period: string; pct: number; prevPct: number }[] = [
    { period: 'May 2',  pct: 52, prevPct: 48 },
    { period: 'May 9',  pct: 53, prevPct: 49 },
    { period: 'May 16', pct: 54, prevPct: 50 },
    { period: 'May 23', pct: 53, prevPct: 50 },
    { period: 'May 30', pct: 55, prevPct: 51 },
    { period: 'Jun 6',  pct: 56, prevPct: 51 },
    { period: 'Jun 13', pct: 55, prevPct: 52 },
    { period: 'Jun 20', pct: 57, prevPct: 52 },
    { period: 'Jun 27', pct: 57, prevPct: 53 },
    { period: 'Jul 4',  pct: 58, prevPct: 53 },
    { period: 'Jul 11', pct: 57, prevPct: 54 },
    { period: 'Jul 18', pct: 59, prevPct: 54 },
    { period: 'Jul 25', pct: 59, prevPct: 55 },
    { period: 'Aug 1',  pct: 60, prevPct: 55 },
    { period: 'Aug 8',  pct: 60, prevPct: 57 },
  ];

  readonly atSvgW   = 640;
  readonly atSvgH   = 240;
  readonly atPadT   = 16;
  readonly atPadB   = 44;
  readonly atPadL   = 44;
  readonly atPadR   = 12;
  readonly atBottom = this.atSvgH - this.atPadB;
  readonly atYMax   = 80;

  private atX(i: number): number {
    return this.atPadL + (i / (this.atRawTrend.length - 1)) * (this.atSvgW - this.atPadL - this.atPadR);
  }
  private atY(pct: number): number {
    return this.atPadT + (1 - pct / this.atYMax) * (this.atSvgH - this.atPadT - this.atPadB);
  }

  readonly atTrendPts: AtTrendPt[] = this.atRawTrend.map((p, i) => ({
    ...p,
    x:     this.atX(i),
    y:     this.atY(p.pct),
    prevY: this.atY(p.prevPct),
  }));

  private atBezierPath(pts: { x: number; y: number }[]): string {
    return pts.map((p, i) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const prev = pts[i - 1];
      const cpX  = ((prev.x + p.x) / 2).toFixed(1);
      return `C ${cpX} ${prev.y.toFixed(1)}, ${cpX} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }).join(' ');
  }

  readonly atLinePath: string     = this.atBezierPath(this.atTrendPts);
  readonly atPrevLinePath: string = this.atBezierPath(this.atTrendPts.map(p => ({ x: p.x, y: p.prevY })));

  readonly atAreaPath: string = (() => {
    const last  = this.atTrendPts[this.atTrendPts.length - 1];
    const first = this.atTrendPts[0];
    return `${this.atLinePath} L ${last.x.toFixed(1)} ${this.atBottom} L ${first.x.toFixed(1)} ${this.atBottom} Z`;
  })();

  readonly atTargetY: number = this.atY(70);

  readonly atYTicks: { label: string; y: number }[] = [0, 20, 40, 60, 80].map(v => ({
    label: `${v}%`,
    y: this.atY(v),
  }));

  readonly atXLabels: { label: string; x: number }[] = [
    { label: 'May', x: this.atX(0)  },
    { label: 'Jun', x: this.atX(5)  },
    { label: 'Jul', x: this.atX(9)  },
    { label: 'Aug', x: this.atX(13) },
  ];

  readonly hoveredAtIdx = signal<number | null>(null);

  readonly hoveredAtPt = computed((): AtTrendPt | null => {
    const idx = this.hoveredAtIdx();
    return idx !== null ? (this.atTrendPts[idx] ?? null) : null;
  });

  readonly atTooltipX = computed((): number => {
    const pt = this.hoveredAtPt();
    if (!pt) return 0;
    const tipW = 110;
    return Math.min(Math.max(pt.x + 12, this.atPadL), this.atSvgW - tipW - this.atPadR);
  });

  readonly atTooltipY = computed((): number => {
    const pt = this.hoveredAtPt();
    if (!pt) return 0;
    return Math.max(pt.y - 54, this.atPadT);
  });

  onAtMouseMove(event: MouseEvent) {
    const svg    = event.currentTarget as SVGSVGElement;
    const rect   = svg.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * this.atSvgW;
    let closestIdx = 0;
    let minDist    = Infinity;
    this.atTrendPts.forEach((p, i) => {
      const d = Math.abs(p.x - mouseX);
      if (d < minDist) { minDist = d; closestIdx = i; }
    });
    this.hoveredAtIdx.set(closestIdx);
  }

  onAtMouseLeave() { this.hoveredAtIdx.set(null); }

  // ---- New vs Returning stacked bar chart ----
  readonly nrtBars: NrtBar[] = [
    { month: 'May', newUsers:  820, returning: 1280, total: 2100 },
    { month: 'Jun', newUsers: 1050, returning: 1820, total: 2870 },
    { month: 'Jul', newUsers:  580, returning: 2200, total: 2780 },
    { month: 'Aug', newUsers:  172, returning: 2923, total: 3095 },
  ];

  readonly nrtMax  = Math.max(...this.nrtBars.map(b => b.total));
  readonly nrtSvgW = 360;
  readonly nrtSvgH = 210;
  readonly nrtPadB = 26;
  readonly nrtBarW = 50;

  readonly nrtBarsComputed = this.nrtBars.map((b, i) => {
    const slotW  = this.nrtSvgW / this.nrtBars.length;
    const cx     = slotW * i + slotW / 2;
    const chartH = this.nrtSvgH - this.nrtPadB;
    const totalH = (b.total     / this.nrtMax) * chartH;
    const retH   = (b.returning / this.nrtMax) * chartH;
    const newH   = (b.newUsers  / this.nrtMax) * chartH;
    return {
      ...b, cx,
      barX: cx - this.nrtBarW / 2,
      retH, newH, totalH,
      retY: this.nrtSvgH - this.nrtPadB - retH,
      newY: this.nrtSvgH - this.nrtPadB - totalH,
      labelY: this.nrtSvgH - 4,
    };
  });
}

// =============================================================================
// ADB Department catalogue + deterministic mock data for the scatter + segmentation panel.
// =============================================================================
const SEGMENT_LABEL: Record<SegmentId, string> = {
  power:   'Power Users',
  focused: 'Focused Users',
  onetime: 'One-Time Users',
  low:     'Low Engagement Users',
};

const VPUS: Vpu[] = [
  // Regional Departments
  { code: 'CWRD',  name: 'Central and West Asia Department',               color: '#F97316' },
  { code: 'SARD',  name: 'South Asia Department',                          color: '#EAB308' },
  { code: 'EARD',  name: 'East Asia Department',                           color: '#84CC16' },
  { code: 'SERD',  name: 'Southeast Asia Department',                      color: '#14B8A6' },
  { code: 'PARD',  name: 'Pacific Department',                             color: '#06B6D4' },
  // Sectors & Thematic
  { code: 'CCSD',  name: 'Climate Change & Sustainable Development Dept',  color: '#EC4899' },
  { code: 'SD1',   name: 'Sectors Department 1',                           color: '#A855F7' },
  { code: 'SD2',   name: 'Sectors Department 2',                           color: '#65A30D' },
  { code: 'SD3',   name: 'Sectors Department 3',                           color: '#059669' },
  // Private Sector & Investment
  { code: 'PSOD',  name: 'Private Sector Operations Department',           color: '#0EA5E9' },
  // Corporate & Knowledge
  { code: 'DOCK',  name: 'Communications & Knowledge Management',          color: '#3B82F6' },
  { code: 'ITD',   name: 'Information Technology Department',              color: '#F59E0B' },
  { code: 'ORM',   name: 'Office of Risk Management',                      color: '#16A34A' },
  { code: 'ERDI',  name: 'Economic Research & Development Impact Dept',    color: '#6366F1' },
  { code: 'BPMSD', name: 'Budget, People & Management Systems Dept',       color: '#7C3AED' },
  { code: 'PFMD',  name: 'Portfolio, Results & Quality Control Dept',      color: '#F43F5E' },
  { code: 'CTL',   name: 'Controller\'s Department',                       color: '#DC2626' },
  { code: 'OSEC',  name: 'Office of the Secretary',                        color: '#CA8A04' },
  { code: 'IED',   name: 'Independent Evaluation Department',              color: '#8B5CF6' },
  { code: 'ADBI',  name: 'ADB Institute',                                  color: '#D946EF' },
];

const PROMPT_CATEGORIES = [
  'Infrastructure Financing', 'Climate & Resilience', 'Project Brief Generation',
  'Regional Cooperation', 'Expert Discovery',
];
const COLLECTIONS = [
  'Board Paper Library', 'Publications', 'AFNR',
  'Operation Manuals & Staff Instruction', 'eOperations Library',
];

function pseudo(code: string, offset: number, lo: number, hi: number): number {
  let h = offset;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) | 0;
  const r = ((Math.sin(h) * 10000) % 1 + 1) % 1;
  return lo + r * (hi - lo);
}

const PERIOD_OFFSET: Record<Period, number> = { '30d': 0, '60d': 11, '90d': 23 };
const PERIOD_USER_MULT: Record<Period, number> = { '30d': 1, '60d': 1.2, '90d': 1.4 };

function buildVpuStats(period: Period): VpuStats[] {
  const po = PERIOD_OFFSET[period];
  return VPUS.map(v => {
    const baseConv = pseudo(v.code, 1, 3, 20);
    const basePps  = pseudo(v.code, 2, 3, 18);
    const baseUsers = pseudo(v.code, 3, 20, 300);

    const conv = Math.max(0, Math.min(20, Math.round(baseConv + pseudo(v.code, 10 + po, -1.2, 1.2))));
    const pps  = Math.max(0, Math.min(20, Math.round(basePps  + pseudo(v.code, 11 + po, -1.0, 1.0))));
    const users = Math.max(20, Math.round(baseUsers * PERIOD_USER_MULT[period]));

    const segment: SegmentId =
      conv >= 10 && pps >= 10 ? 'power'   :
      conv <  10 && pps >= 10 ? 'focused' :
      conv <  10 && pps <  10 ? 'onetime' : 'low';
    const topPromptCategory = PROMPT_CATEGORIES[Math.floor(pseudo(v.code, 4, 0, PROMPT_CATEGORIES.length))];
    const topCollection     = COLLECTIONS[Math.floor(pseudo(v.code, 5, 0, COLLECTIONS.length))];
    return { ...v, conversations: conv, promptsPerSession: pps, activeUsers: users, segment, topPromptCategory, topCollection };
  });
}

// =============================================================================
// Segment drawer mock data — keyed by SegmentId.
// =============================================================================

interface SegmentDrawerData {
  label: string;
  stats: { value: string; label: string }[];
  vpuBreakdown: SegVpuRow[];
  promptCategories: Record<KptTab, SegPromptCategory[]>;
  collections: SegUsage[];
  agents: SegUsage[];
  mapIntensity: Record<string, number>;
  regionUsers: Record<string, number>;
  countryUsers: Record<string, number>;
}

const SEGMENT_DRAWER_DATA: Record<SegmentId, SegmentDrawerData> = {
  power: {
    label: 'Power Users',
    stats: [
      { value: '2.1K', label: 'Total No. of Users' },
      { value: '78%',  label: 'Avg Conversations' },
      { value: '84%',  label: 'Avg Prompts/Session' },
      { value: '3',    label: 'Repeat Usage Rate' },
      { value: '78%',  label: 'Exploration Depth' },
      { value: '5',    label: 'Avg No. of Sessions/Week' },
    ],
    vpuBreakdown: [
      { code: 'DOCK',  pct: 24, growth: 18 },
      { code: 'CWRD',  pct: 17, growth:  9 },
      { code: 'ERDI',  pct: 11, growth: 22 },
    ],
    promptCategories: {
      knowledge: [
        { label: 'Infrastructure Financing',              pct: 39, prompts: 198 },
        { label: 'Climate Adaptation & Resilience',       pct: 24, prompts: 122 },
        { label: 'Regional Cooperation',                  pct: 22, prompts: 112 },
        { label: 'Urban Resilience',                      pct:  9, prompts:  46 },
        { label: 'Disaster Preparedness',                 pct:  6, prompts:  30 },
      ],
      people: [
        { label: 'Peer Reviewer Discovery',   pct: 38, prompts: 78 },
        { label: 'Country Specialists',       pct: 26, prompts: 53 },
        { label: 'Sector Specialists',        pct: 18, prompts: 36 },
        { label: 'Mission Team Contacts',     pct: 10, prompts: 21 },
        { label: 'Cross-Dept Collaborators',  pct:  8, prompts: 16 },
      ],
      tasks: [
        { label: 'Project Brief Generation',         pct: 54, prompts: 28 },
        { label: 'Project Concept Notes',            pct: 22, prompts: 16 },
        { label: 'Procurement Specifications',       pct: 10, prompts: 11 },
        { label: 'Synthesis Briefs',                 pct:  8, prompts:  7 },
        { label: 'Slide Deck Outlines',              pct:  6, prompts:  5 },
      ],
    },
    collections: [
      { name: 'Board Paper Library',                usage: 24 },
      { name: 'Publications',                       usage: 18 },
      { name: 'eOperations Library',                usage: 14 },
      { name: 'AFNR',                               usage: 11 },
    ],
    agents: [
      { name: 'Sherlock',                   usage: 24 },
      { name: 'Lessons Learned Explorer',   usage: 18 },
      { name: 'Project Brief Generator',    usage: 14 },
      { name: 'ADB Translate',              usage: 11 },
    ],
    mapIntensity: {
      in: 6, bd: 5, pk: 4, ph: 5, id: 6,
      vn: 4, kz: 4, uz: 4, cn: 4, pg: 3,
    },
    regionUsers:  { cwrd: 120, sard: 200, eard: 60, serd: 130, pard: 40, nmem: 80 },
    countryUsers: { in: 92, bd: 36, pk: 28, ph: 44, id: 30, vn: 20, kz: 20, uz: 14, cn: 28, pg: 14 },
  },

  focused: {
    label: 'Focused Users',
    stats: [
      { value: '1.4K', label: 'Total No. of Users' },
      { value: '52%',  label: 'Avg Conversations' },
      { value: '76%',  label: 'Avg Prompts/Session' },
      { value: '2',    label: 'Repeat Usage Rate' },
      { value: '64%',  label: 'Exploration Depth' },
      { value: '3',    label: 'Avg No. of Sessions/Week' },
    ],
    vpuBreakdown: [
      { code: 'ITD',  pct: 22, growth: 14 },
      { code: 'PSOD', pct: 16, growth:  8 },
      { code: 'ORM',  pct: 12, growth: 12 },
    ],
    promptCategories: {
      knowledge: [
        { label: 'Project Lessons Review',       pct: 48, prompts: 26 },
        { label: 'Country Economic Briefings',   pct: 22, prompts: 18 },
        { label: 'Sector Diagnostics',           pct: 12, prompts: 12 },
        { label: 'Policy Note Drafting',         pct: 10, prompts:  9 },
        { label: 'Working Paper Summaries',      pct:  8, prompts:  7 },
      ],
      people: [
        { label: 'Expert Profile Lookup',        pct: 50, prompts: 22 },
        { label: 'TTL Discovery',                pct: 24, prompts: 15 },
        { label: 'Specialist Identification',    pct: 14, prompts: 10 },
        { label: 'Cross-Region Matches',         pct:  7, prompts:  6 },
        { label: 'Cross-Dept Matches',           pct:  5, prompts:  4 },
      ],
      tasks: [
        { label: 'Project Brief Concept Notes',  pct: 46, prompts: 24 },
        { label: 'Mission Briefs',               pct: 24, prompts: 14 },
        { label: 'Synthesis Decks',              pct: 16, prompts: 10 },
        { label: 'Concept Reviews',              pct:  8, prompts:  6 },
        { label: 'Donor Pitch Drafts',           pct:  6, prompts:  4 },
      ],
    },
    collections: [
      { name: 'Operation Manuals & Staff Instruction', usage: 22 },
      { name: 'eOperations Library',                   usage: 18 },
      { name: 'AFNR',                                  usage: 14 },
      { name: 'Navigator FAQs',                        usage:  9 },
    ],
    agents: [
      { name: 'Sherlock',                  usage: 30 },
      { name: 'Lessons Learned Explorer',  usage: 22 },
      { name: 'Project Brief Generator',   usage: 12 },
      { name: 'ADB Translate',             usage:  6 },
    ],
    mapIntensity: {
      in: 5, bd: 4, pk: 4, ph: 4, id: 5,
      vn: 3, kz: 4, uz: 3, cn: 4, pg: 3,
    },
    regionUsers:  { cwrd: 80, sard: 140, eard: 50, serd: 100, pard: 28, nmem: 60 },
    countryUsers: { in: 60, bd: 26, pk: 20, ph: 32, id: 22, vn: 14, kz: 14, uz: 10, cn: 20, pg: 8 },
  },

  onetime: {
    label: 'One-Time Users',
    stats: [
      { value: '2.6K', label: 'Total No. of Users' },
      { value: '24%',  label: 'Avg Conversations' },
      { value: '32%',  label: 'Avg Prompts/Session' },
      { value: '1',    label: 'Repeat Usage Rate' },
      { value: '28%',  label: 'Exploration Depth' },
      { value: '1',    label: 'Avg No. of Sessions/Week' },
    ],
    vpuBreakdown: [
      { code: 'EARD', pct: 18, growth:  6 },
      { code: 'SERD', pct: 14, growth:  4 },
      { code: 'PARD', pct:  9, growth:  3 },
    ],
    promptCategories: {
      knowledge: [
        { label: 'Quick Country Facts',          pct: 56, prompts: 22 },
        { label: 'One-off Sector Lookups',       pct: 22, prompts: 11 },
        { label: 'Definition Queries',           pct: 10, prompts:  6 },
        { label: 'Statistic Snapshots',          pct:  7, prompts:  4 },
        { label: 'Acronym Resolution',           pct:  5, prompts:  3 },
      ],
      people: [
        { label: 'Single Expert Lookups',        pct: 60, prompts: 18 },
        { label: 'TTL Contact Search',           pct: 22, prompts:  9 },
        { label: 'Org-chart Queries',            pct: 10, prompts:  5 },
        { label: 'Country Manager Lookup',       pct:  5, prompts:  3 },
        { label: 'Past-team Recall',             pct:  3, prompts:  2 },
      ],
      tasks: [
        { label: 'One-off Project Brief Draft',  pct: 50, prompts: 14 },
        { label: 'Single Translation',           pct: 24, prompts:  8 },
        { label: 'Quick Summary',                pct: 14, prompts:  5 },
        { label: 'Single Slide',                 pct:  8, prompts:  3 },
        { label: 'Email Draft',                  pct:  4, prompts:  2 },
      ],
    },
    collections: [
      { name: 'Publications',            usage: 18 },
      { name: 'Board Paper Library',     usage: 16 },
      { name: 'AFNR',                   usage: 12 },
      { name: 'Navigator FAQs',          usage:  8 },
    ],
    agents: [
      { name: 'Sherlock',                usage: 20 },
      { name: 'ADB Translate',           usage: 18 },
      { name: 'Project Brief Generator', usage: 10 },
      { name: 'Grumpy Reviewer',         usage:  6 },
    ],
    mapIntensity: {
      au: 3, jp: 2, us: 3, gb: 3, fr: 3, de: 3,
      in: 4, id: 3, ph: 3,
    },
    regionUsers:  { cwrd: 30, sard: 60, eard: 22, serd: 40, pard: 12, nmem: 50 },
    countryUsers: { au: 22, jp: 18, us: 56, gb: 38, fr: 26, de: 30, in: 35, id: 20, ph: 18 },
  },

  low: {
    label: 'Low Engagement Users',
    stats: [
      { value: '1.9K', label: 'Total No. of Users' },
      { value: '34%',  label: 'Avg Conversations' },
      { value: '28%',  label: 'Avg Prompts/Session' },
      { value: '1',    label: 'Repeat Usage Rate' },
      { value: '18%',  label: 'Exploration Depth' },
      { value: '1',    label: 'Avg No. of Sessions/Week' },
    ],
    vpuBreakdown: [
      { code: 'ERDI',  pct: 21, growth:  5 },
      { code: 'BPMSD', pct: 14, growth:  3 },
      { code: 'CCSD',  pct: 12, growth:  2 },
    ],
    promptCategories: {
      knowledge: [
        { label: 'Single-Page Lookups',          pct: 52, prompts: 18 },
        { label: 'Indicator Definitions',        pct: 22, prompts:  9 },
        { label: 'Country Snapshot',             pct: 14, prompts:  6 },
        { label: 'Sector Acronyms',              pct:  8, prompts:  4 },
        { label: 'Glossary Hits',                pct:  4, prompts:  3 },
      ],
      people: [
        { label: 'Manager Lookup',               pct: 58, prompts: 16 },
        { label: 'Org-chart Browse',             pct: 22, prompts:  8 },
        { label: 'Vacated Team Recall',          pct: 10, prompts:  4 },
        { label: 'Past Contact',                 pct:  6, prompts:  3 },
        { label: 'Unit Lookups',                 pct:  4, prompts:  2 },
      ],
      tasks: [
        { label: 'Quick Translation',            pct: 60, prompts: 18 },
        { label: 'Snippet Summary',              pct: 22, prompts:  8 },
        { label: 'Single Project Brief Page',    pct: 10, prompts:  5 },
        { label: 'Email Draft',                  pct:  5, prompts:  2 },
        { label: 'Acronym Decode',               pct:  3, prompts:  1 },
      ],
    },
    collections: [
      { name: 'Navigator FAQs',                  usage: 22 },
      { name: 'AFNR',                           usage: 18 },
      { name: 'Publications',                   usage: 14 },
      { name: 'eOperations Library',             usage: 10 },
    ],
    agents: [
      { name: 'ADB Translate',           usage: 32 },
      { name: 'Sherlock',                usage: 18 },
      { name: 'Project Brief Generator', usage:  8 },
      { name: 'Lessons Learned Explorer',usage:  6 },
    ],
    mapIntensity: {
      au: 2, jp: 1, us: 2, gb: 2, fr: 1, de: 1,
      in: 2, id: 1, ph: 1,
    },
    regionUsers:  { cwrd: 20, sard: 40, eard: 16, serd: 28, pard: 8, nmem: 40 },
    countryUsers: { au: 14, jp: 10, us: 22, gb: 14, fr: 10, de: 12, in: 22, id: 12 },
  },
};

// Compact ISO → ADB region lookup for map tinting in the segment drawer.
const ISO_TO_REGION_LITE: Record<string, string> = {
  // SARD — South Asia
  in: 'sard', bd: 'sard', pk: 'sard', np: 'sard', lk: 'sard', bt: 'sard', mv: 'sard',
  // EARD — East Asia
  cn: 'eard', mn: 'eard', kr: 'eard',
  // SERD — Southeast Asia
  kh: 'serd', id: 'serd', la: 'serd', mm: 'serd', ph: 'serd', th: 'serd', tl: 'serd', vn: 'serd', my: 'serd',
  // PARD — Pacific
  fj: 'pard', pg: 'pard', sb: 'pard', vu: 'pard', ws: 'pard', to: 'pard', ki: 'pard', fm: 'pard', mh: 'pard',
  // CWRD — Central and West Asia
  af: 'cwrd', am: 'cwrd', az: 'cwrd', ge: 'cwrd', kz: 'cwrd', kg: 'cwrd', tj: 'cwrd', tm: 'cwrd', uz: 'cwrd',
  // Non-regional Members
  au: 'nmem', jp: 'nmem', us: 'nmem', gb: 'nmem', fr: 'nmem', de: 'nmem', ca: 'nmem',
  it: 'nmem', nl: 'nmem', se: 'nmem', ch: 'nmem', nz: 'nmem', no: 'nmem',
};

const REGION_LABEL: Record<string, string> = {
  cwrd: 'Central and West Asia (CWRD)',
  sard: 'South Asia (SARD)',
  eard: 'East Asia (EARD)',
  serd: 'Southeast Asia (SERD)',
  pard: 'Pacific (PARD)',
  nmem: 'Non-regional Members',
};

const COUNTRY_LABEL: Record<string, string> = {
  in: 'India',       bd: 'Bangladesh', pk: 'Pakistan',    np: 'Nepal',    lk: 'Sri Lanka',
  cn: 'China',       mn: 'Mongolia',   kr: 'South Korea',
  ph: 'Philippines', id: 'Indonesia',  vn: 'Vietnam',     th: 'Thailand', my: 'Malaysia',
  kh: 'Cambodia',    la: 'Laos',       mm: 'Myanmar',     tl: 'Timor-Leste',
  kz: 'Kazakhstan',  uz: 'Uzbekistan', kg: 'Kyrgyzstan',  tj: 'Tajikistan',
  af: 'Afghanistan', am: 'Armenia',    az: 'Azerbaijan',  ge: 'Georgia',  tm: 'Turkmenistan',
  fj: 'Fiji',        pg: 'Papua New Guinea', sb: 'Solomon Is.',
  au: 'Australia',   jp: 'Japan',      us: 'United States', gb: 'United Kingdom',
  de: 'Germany',     fr: 'France',     ca: 'Canada',
};
