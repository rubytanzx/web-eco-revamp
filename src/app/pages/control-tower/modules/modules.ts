import { Component, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TablerIconComponent } from '@tabler/icons-angular';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';

interface SvcRow {
  name: string; module: string; clicks: number; users: number; change: number; last: string;
}
interface ModRow {
  name: string; clicks: number; users: number; trend: number;
}

@Component({
  selector: 'app-modules',
  imports: [TablerIconComponent, DateRangeFilter, DecimalPipe],
  templateUrl: './modules.html',
  styleUrl: './modules.css',
})
export class Modules {
  // ---- Chart constants ----
  readonly trendW = 1200;
  readonly trendH = 210;
  readonly padL   = 46;
  readonly padR   = 14;
  readonly padT   = 18;
  readonly padB   = 44;

  private readonly weekLabels = ['May 23', 'Jun 6', 'Jun 20', 'Jul 4', 'Jul 18', 'Aug 1', 'Aug 8', 'Aug 15'];

  // ---- Static data ----
  private readonly services: SvcRow[] = [
    { name: 'eServe',                             module: 'Quick Access',       clicks: 5821, users: 1120, change:  26, last: '2026-07-07' },
    { name: 'Self Service',                       module: 'Quick Access',       clicks: 4103, users:  980, change:  18, last: '2026-07-07' },
    { name: 'AskHR',                              module: 'Quick Access',       clicks: 2890, users:  860, change:  13, last: '2026-07-06' },
    { name: 'Concur',                             module: 'Quick Access',       clicks: 2204, users:  640, change: -10, last: '2026-07-04' },
    { name: 'Board Paper Library',                module: 'Quick Access',       clicks: 1802, users:  590, change:   8, last: '2026-07-05' },
    { name: 'MyAccess',                           module: 'Quick Access',       clicks: 1351, users:  410, change:  -6, last: '2026-07-01' },
    { name: 'AskIT',                              module: 'Quick Access',       clicks:  901, users:  355, change:   4, last: '2026-06-30' },
    { name: 'Management Approval System',         module: 'Quick Access',       clicks:  676, users:  230, change:   3, last: '2026-05-10' },
    { name: 'Risk Explorer',                      module: 'Quick Access',       clicks:  412, users:  140, change:  -4, last: '2026-06-28' },
    { name: 'UN eRegistration',                   module: 'Quick Access',       clicks:   12, users:    8, change:   0, last: '2026-04-02' },
    { name: 'Development Data Partnership',       module: 'Quick Access',       clicks:    9, users:    6, change:   0, last: '2026-03-18' },
    { name: 'FCAS/SIDS DataViz',                  module: 'Quick Access',       clicks:    6, users:    4, change:   0, last: '2026-02-27' },
    { name: 'CTL Withdrawal Application',         module: 'Quick Access',       clicks:    3, users:    2, change:   0, last: '2026-01-30' },
    { name: 'For You',                            module: 'News',               clicks: 1210, users:  520, change:   5, last: '2026-07-06' },
    { name: 'Latest News',                        module: 'News',               clicks:  860, users:  390, change:   2, last: '2026-07-02' },
    { name: 'Announcements',                      module: 'News',               clicks:  530, users:  240, change:   1, last: '2026-06-20' },
    { name: 'Learning & Development',             module: 'Learning',           clicks:  980, users:  410, change:   9, last: '2026-07-05' },
    { name: 'Excellerate Learning',               module: 'Learning',           clicks:  640, users:  310, change:  -2, last: '2026-06-29' },
    { name: 'ADB Spotlight',                      module: 'ADB Spotlight',      clicks:  600, users:  265, change:  -2, last: '2026-06-27' },
    { name: 'Events',                             module: 'Events',             clicks:  599, users:  255, change:   1, last: '2026-07-01' },
    { name: 'Managerial International Staff',     module: 'Career',             clicks:  280, users:  130, change:   6, last: '2026-07-03' },
    { name: 'Technical Local Staff (HQ)',         module: 'Career',             clicks:  210, users:   98, change:   3, last: '2026-07-02' },
    { name: 'Technical Local Staff (Field Offices)', module: 'Career',          clicks:  175, users:   82, change:   2, last: '2026-06-28' },
    { name: 'Short-Term Assignment (STA)',        module: 'Career',             clicks:  120, users:   55, change:   1, last: '2026-06-20' },
    { name: 'External Assignments',               module: 'Career',             clicks:   75, users:   34, change:  -1, last: '2026-06-10' },
    { name: 'ADB Institute (ADBI)',               module: 'Career',             clicks:   41, users:   18, change:   0, last: '2026-05-30' },
    { name: 'All Company',                        module: 'Active Discussions', clicks:  340, users:  150, change:   4, last: '2026-07-04' },
    { name: 'Generative AI',                      module: 'Active Discussions', clicks:  180, users:   80, change:   5, last: '2026-07-06' },
    { name: 'Everyday Cyber',                     module: 'Active Discussions', clicks:  110, users:   50, change:  -1, last: '2026-06-18' },
  ];

  private readonly mods: ModRow[] = [
    { name: 'Quick Access',       clicks: 22215, users: 1840, trend:  2 },
    { name: 'News',               clicks:  3002, users:  960, trend:  1 },
    { name: 'Learning',           clicks:  2102, users:  710, trend: -1 },
    { name: 'Career',             clicks:   901, users:  420, trend:  0 },
    { name: 'Active Discussions', clicks:   601, users:  280, trend:  3 },
    { name: 'ADB Spotlight',      clicks:   600, users:  265, trend: -2 },
    { name: 'Events',             clicks:   599, users:  255, trend:  1 },
  ];

  readonly moduleNames = this.mods.map(m => m.name);

  // ---- Signals ----
  readonly selectedModule  = signal<string>('Quick Access');
  readonly selectedService = signal('__all__');
  readonly trendMetric     = signal<'clicks' | 'users'>('clicks');
  readonly topSvcMetric    = signal<'clicks' | 'users'>('clicks');
  readonly svcSearch       = signal('');
  readonly svcDdOpen       = signal(false);
  readonly svcDdSearch     = signal('');
  readonly currentPage     = signal(1);
  readonly pageSize        = 10;
  readonly hoveredTrendIdx = signal<number | null>(null);

  // ---- Module-scoped data ----
  readonly moduleServicesFiltered = computed(() =>
    this.services.filter(s => s.module === this.selectedModule())
  );

  readonly selectedModuleRow = computed(() =>
    this.mods.find(m => m.name === this.selectedModule()) ?? null
  );

  readonly selectedModuleClicks = computed(() =>
    this.moduleServicesFiltered().reduce((acc, s) => acc + s.clicks, 0)
  );

  readonly selectedModuleUsers = computed(() =>
    this.moduleServicesFiltered().reduce((acc, s) => acc + s.users, 0)
  );

  readonly selectedModuleServiceCount = computed(() =>
    this.moduleServicesFiltered().length
  );

  // ---- Top services (scoped to module) ----
  readonly topSvcRows = computed(() => {
    const metric = this.topSvcMetric();
    const rows   = this.moduleServicesFiltered();
    const total  = rows.reduce((acc, s) => acc + (metric === 'clicks' ? s.clicks : s.users), 0) || 1;
    return [...rows]
      .sort((a, b) => (metric === 'clicks' ? b.clicks - a.clicks : b.users - a.users))
      .slice(0, 8)
      .map(s => ({
        ...s,
        val:   metric === 'clicks' ? s.clicks : s.users,
        share: Math.round((metric === 'clicks' ? s.clicks : s.users) / total * 100),
      }));
  });

  // ---- Horizontal bar: Services in selected module ----
  readonly modBarW     = 560;
  readonly modBarH     = 340;
  readonly modBarPL    = 160;
  readonly modBarPR    = 58;
  readonly modBarPT    = 10;
  readonly modBarPB    = 10;
  readonly modBarPlotW = this.modBarW - this.modBarPL - this.modBarPR;

  readonly moduleServiceListRows = computed(() => {
    const sorted = [...this.moduleServicesFiltered()].sort((a, b) => b.clicks - a.clicks);
    const max = sorted[0]?.clicks || 1;
    return sorted.map(s => ({ name: s.name, clicks: s.clicks, pct: (s.clicks / max) * 100 }));
  });

  readonly moduleServiceBarRows = computed(() => {
    const sorted = [...this.moduleServicesFiltered()].sort((a, b) => b.clicks - a.clicks);
    const max    = sorted[0]?.clicks || 1;
    const nRows  = Math.max(sorted.length, 1);
    const slotH  = (this.modBarH - this.modBarPT - this.modBarPB) / nRows;
    const barH   = Math.min(16, slotH * 0.5);
    return sorted.map((s, i) => {
      const cy = this.modBarPT + i * slotH + slotH / 2;
      const bw = Math.max(4, (s.clicks / max) * this.modBarPlotW);
      return { name: s.name, clicks: s.clicks,
        barX: this.modBarPL, barY: cy - barH / 2, barW: bw, barH,
        labelY: cy + 4.5, valX: this.modBarPL + bw + 6 };
    });
  });

  // ---- Vertical bar: Trending services ----
  readonly topVBarW     = 560;
  readonly topVBarH     = 340;
  readonly topVBarPL    = 36;
  readonly topVBarPR    = 8;
  readonly topVBarPT    = 12;
  readonly topVBarPB    = 26;
  readonly topVBarPlotW = this.topVBarW - this.topVBarPL - this.topVBarPR;
  readonly topVBarPlotH = this.topVBarH - this.topVBarPT - this.topVBarPB;

  readonly topSvcChartMax = computed(() => {
    const max = this.topSvcRows()[0]?.val || 0;
    if (!max) return 1000;
    const step = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / step) * step;
  });

  readonly topSvcBarRows = computed(() => {
    const rows     = this.topSvcRows();
    const chartMax = this.topSvcChartMax();
    const n        = Math.max(rows.length, 1);
    const slotW    = this.topVBarPlotW / n;
    const barW     = slotW * 0.58;
    const baseline = this.topVBarPT + this.topVBarPlotH;
    return rows.map((s, i) => {
      const cx = this.topVBarPL + i * slotW + slotW / 2;
      const bh = Math.max(3, (s.val / chartMax) * this.topVBarPlotH);
      const ly = this.topVBarH - 6;
      return { ...s, cx, barX: cx - barW / 2, barY: baseline - bh, barW, barH: bh,
        lx: cx, ly, labelTransform: `rotate(-38,${cx.toFixed(1)},${ly})` };
    });
  });

  readonly topSvcYTicks = computed(() => {
    const chartMax = this.topSvcChartMax();
    return [0, 0.25, 0.5, 0.75, 1].map(f => {
      const v = Math.round(chartMax * f);
      return { label: v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`,
               y: this.topVBarPT + this.topVBarPlotH * (1 - f) };
    });
  });

  // ---- Service dropdown (scoped to module) ----
  readonly ddItems = computed((): { search: boolean; matches: SvcRow[]; allAz: SvcRow[] } => {
    const q     = this.svcDdSearch().toLowerCase().trim();
    const allAz = [...this.moduleServicesFiltered()].sort((a, b) => a.name.localeCompare(b.name));
    if (q) {
      const matches = allAz.filter(s => s.name.toLowerCase().includes(q));
      return { search: true, matches, allAz: [] };
    }
    return { search: false, matches: [], allAz };
  });

  // ---- Trend chart ----
  readonly trendVals = computed(() => this.trendDataFor(this.selectedService(), this.trendMetric()));

  readonly trendChartMax = computed(() => {
    const max = Math.max(...this.trendVals());
    return Math.ceil(max / 100) * 100 || 100;
  });

  readonly trendPts = computed(() => {
    const max = this.trendChartMax();
    return this.trendVals().map((v, i) => ({
      x: this.toTrendX(i), y: this.toTrendY(v, max), v, label: this.weekLabels[i],
    }));
  });

  readonly hoveredPt = computed(() => {
    const idx = this.hoveredTrendIdx();
    return idx !== null ? (this.trendPts()[idx] ?? null) : null;
  });

  readonly hoveredTooltipX = computed(() => {
    const pt = this.hoveredPt();
    if (!pt) return 0;
    return Math.min(Math.max(pt.x + 14, this.padL), this.trendW - 110 - this.padR);
  });

  readonly hoveredTooltipY = computed(() => {
    const pt = this.hoveredPt();
    if (!pt) return 0;
    return Math.max(pt.y - 54, this.padT);
  });

  readonly trendUnitLabel = computed(() => this.trendMetric() === 'clicks' ? 'clicks' : 'users');
  readonly trendLineColor = computed(() => this.selectedService() === '__all__' ? '#7c3aed' : '#2c8aff');
  readonly trendLinePath  = computed(() => this.bezierPath(this.trendPts()));

  readonly trendAreaPath = computed(() => {
    const pts = this.trendPts();
    if (!pts.length) return '';
    const bottomY  = this.toTrendY(0, this.trendChartMax());
    const linePath = this.trendLinePath();
    const lastPt   = pts[pts.length - 1];
    const firstPt  = pts[0];
    return `${linePath} L ${lastPt.x.toFixed(1)},${bottomY.toFixed(1)} L ${firstPt.x.toFixed(1)},${bottomY.toFixed(1)} Z`;
  });

  readonly trendXTicks = this.weekLabels.map((label, i) => ({ label, x: this.toTrendX(i) }));

  readonly trendYTicks = computed(() => {
    const max = this.trendChartMax();
    return Array.from({ length: 5 }, (_, i) => {
      const v     = Math.round((max * i) / 4);
      const label = v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`;
      return { label, y: this.toTrendY(v, max), v };
    });
  });

  // ---- Services table ----
  readonly filteredSvcRows = computed(() => {
    const search = this.svcSearch().toLowerCase();
    return this.moduleServicesFiltered().filter(s =>
      search === '' || s.name.toLowerCase().includes(search)
    );
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredSvcRows().length / this.pageSize))
  );

  readonly paginatedSvcRows = computed(() => {
    const page  = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return this.filteredSvcRows().slice(start, start + this.pageSize);
  });

  readonly pageRangeLabel = computed(() => {
    const total = this.filteredSvcRows().length;
    if (total === 0) return 'No results';
    const start = (this.currentPage() - 1) * this.pageSize + 1;
    const end   = Math.min(this.currentPage() * this.pageSize, total);
    return `${start}–${end} of ${total}`;
  });

  // ---- Methods ----
  onModuleChange(mod: string): void {
    this.selectedModule.set(mod);
    this.selectedService.set('__all__');
    this.currentPage.set(1);
    this.svcSearch.set('');
    this.svcDdOpen.set(false);
  }

  truncateLabel(name: string, max = 13): string {
    return name.length > max ? name.slice(0, max - 1) + '…' : name;
  }

  trendIcon(change: number): string {
    if (change > 0) return 'arrow-up-right';
    if (change < 0) return 'arrow-down-right';
    return 'minus';
  }

  trendColor(change: number): string {
    if (change > 0) return '#16a34a';
    if (change < 0) return '#dc2626';
    return 'var(--color-neutral-solid-40)';
  }

  statusFor(svc: SvcRow): 'active' | 'low' | 'stale' {
    const days = (new Date('2026-08-17').getTime() - new Date(svc.last).getTime()) / 86400000;
    if (svc.clicks <= 15) return 'low';
    if (days > 60) return 'stale';
    return 'active';
  }

  selectService(name: string): void {
    this.selectedService.set(name);
    this.svcDdOpen.set(false);
  }

  onTrendMouseMove(event: MouseEvent): void {
    const svg    = event.currentTarget as SVGSVGElement;
    const rect   = svg.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * this.trendW;
    let closestIdx = 0;
    let minDist    = Infinity;
    this.trendPts().forEach((p, i) => {
      const d = Math.abs(p.x - mouseX);
      if (d < minDist) { minDist = d; closestIdx = i; }
    });
    this.hoveredTrendIdx.set(closestIdx);
  }

  onTrendMouseLeave(): void { this.hoveredTrendIdx.set(null); }

  setSvcSearch(val: string): void {
    this.svcSearch.set(val);
    this.currentPage.set(1);
  }

  toggleSvcDd(): void {
    if (!this.svcDdOpen()) { this.svcDdSearch.set(''); }
    this.svcDdOpen.update(v => !v);
  }

  // ---- Private chart helpers ----
  private seedFromName(name: string): number {
    let h = 0;
    for (const c of name) {
      h = ((h * 31 + c.charCodeAt(0)) >>> 0);
    }
    return h;
  }

  private genTrend(finalValue: number, changePct: number, seed: number): number[] {
    const startValue = finalValue / (1 + changePct / 100);
    return Array.from({ length: 8 }, (_, i) => {
      if (i === 7) return finalValue;
      const base = startValue + (finalValue - startValue) * (i / 7);
      return Math.max(0, Math.round(base + Math.sin(seed * 0.001 + i * 1.3) * base * 0.04));
    });
  }

  private trendDataFor(name: string, metric: 'clicks' | 'users'): number[] {
    const moduleSvcs = this.moduleServicesFiltered();
    if (name === '__all__') {
      const totals = Array(8).fill(0) as number[];
      for (const svc of moduleSvcs) {
        const seed  = this.seedFromName(svc.name);
        const final = metric === 'clicks' ? svc.clicks : svc.users;
        const chg   = metric === 'clicks' ? svc.change : svc.change * 0.7;
        this.genTrend(final, chg, seed).forEach((v, i) => { totals[i] += v; });
      }
      return totals;
    }
    const svc = moduleSvcs.find(s => s.name === name);
    if (!svc) return Array(8).fill(0);
    const seed       = this.seedFromName(name);
    const finalValue = metric === 'clicks' ? svc.clicks : svc.users;
    const change     = metric === 'clicks' ? svc.change : svc.change * 0.7;
    return this.genTrend(finalValue, change, seed);
  }

  private toTrendX(i: number): number {
    const plotW = this.trendW - this.padL - this.padR;
    return this.padL + (i / (this.weekLabels.length - 1)) * plotW;
  }

  private toTrendY(v: number, max: number): number {
    const plotH = this.trendH - this.padT - this.padB;
    return this.padT + (1 - v / max) * plotH;
  }

  private bezierPath(pts: { x: number; y: number }[]): string {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const mx = (p1.x + p2.x) / 2;
      d += ` C ${mx.toFixed(1)},${p1.y.toFixed(1)} ${mx.toFixed(1)},${p2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }
}
