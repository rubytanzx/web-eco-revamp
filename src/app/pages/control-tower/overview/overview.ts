import { Component, signal, computed } from '@angular/core';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';
import { TablerIconComponent } from '@tabler/icons-angular';

type TrendKey = 'audience' | 'search' | 'ai';

@Component({
  selector: 'app-overview',
  imports: [DateRangeFilter, TablerIconComponent],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview {

  readonly today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  readonly signals = [
    { label: 'Page views',      value: '4.8M',  sub: '8% vs last month',  trendClass: 'trend--pos', alert: false, icon: 'trending-up' },
    { label: 'Active users',    value: '284K',  sub: '12% vs last month', trendClass: 'trend--pos', alert: false, icon: 'users' },
    { label: 'Content actions', value: '82.4K', sub: '18% vs last month', trendClass: 'trend--pos', alert: false, icon: 'chart-bar' },
    { label: 'Search success',  value: '68%',   sub: '3pts this month',   trendClass: 'trend--neg', alert: false, icon: 'search' },
  ];

  readonly TREND_LABELS = ['Audience', 'Search', 'AI Interactions'];
  readonly TREND_KEYS = ['audience', 'search', 'ai'] as const;

  trendMetric = signal<TrendKey>('audience');

  private readonly PAD_T = 8;
  private readonly PAD_B = 8;
  private readonly SVG_H = 150;
  private readonly SVG_W = 1200;

  private bezier(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1], curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return d;
  }

  private getRaw(key: TrendKey): number[] {
    const cfgs: Record<TrendKey, { base: number; drift: number; amp: number; seed: number }> = {
      audience: { base: 255, drift: 30,  amp: 38,  seed: 1.1 },
      search:   { base: 61,  drift: 4,   amp: 9,   seed: 2.3 },
      ai:       { base: 880, drift: 150, amp: 280, seed: 0.7 },
    };
    const { base, drift, amp, seed } = cfgs[key];
    return Array.from({ length: 90 }, (_, i) => {
      const t = i / 89;
      const trend = base + t * drift;
      // Two slow incommensurate waves — organic but smooth
      const w1 = amp * 0.70 * Math.sin(2 * Math.PI * i / 31 + seed);
      const w2 = amp * 0.25 * Math.sin(2 * Math.PI * i / 19 + seed * 1.9);
      return trend + w1 + w2;
    });
  }

  trendData = computed(() => {
    const raw = this.getRaw(this.trendMetric());
    const min = Math.min(...raw);
    const max = Math.max(...raw);
    const plotH = this.SVG_H - this.PAD_T - this.PAD_B;
    const range = max - min || 1;
    return raw.map((v, i) => ({
      x: (i / 89) * this.SVG_W,
      y: this.PAD_T + (1 - (v - min) / range) * plotH,
    }));
  });

  trendLinePath = computed(() => this.bezier(this.trendData()));

  trendAreaPath = computed(() => {
    const pts = this.trendData();
    if (!pts.length) return '';
    const line = this.bezier(pts);
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L ${last.x} ${this.SVG_H} L ${first.x} ${this.SVG_H} Z`;
  });

  trendCurrent = computed(() => {
    const raw = this.getRaw(this.trendMetric());
    const val = raw[raw.length - 1];
    const key = this.trendMetric();
    if (key === 'audience') return `${Math.round(val)}K`;
    if (key === 'ai') return Math.round(val).toLocaleString();
    return `${Math.round(val)}%`;
  });

  trendDelta = computed(() => {
    const raw = this.getRaw(this.trendMetric());
    const diff = raw[raw.length - 1] - raw[0];
    const key = this.trendMetric();
    const sign = diff >= 0 ? '+' : '';
    if (key === 'audience') return `${sign}${Math.round(diff)}K`;
    if (key === 'ai') return `${sign}${Math.round(diff)}`;
    return `${sign}${diff.toFixed(1)}pp`;
  });

  trendDeltaClass = computed(() => {
    const raw = this.getRaw(this.trendMetric());
    const diff = raw[raw.length - 1] - raw[0];
    return diff >= 0 ? 'trend trend--pos' : 'trend trend--neg';
  });

  trendUnit = computed(() => {
    const key = this.trendMetric();
    if (key === 'audience') return 'unique visitors';
    if (key === 'ai') return 'interactions';
    return 'success rate';
  });

  // ── Chart axes & hover ──────────────────────────────────────────────────

  yTicks = computed(() => {
    const raw = this.getRaw(this.trendMetric());
    const dataMin = Math.min(...raw);
    const dataMax = Math.max(...raw);
    const range = dataMax - dataMin || 1;
    const key = this.trendMetric();
    const plotH = this.SVG_H - this.PAD_T - this.PAD_B;
    const rawStep = range / 3;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
    const niceStep = Math.ceil(rawStep / magnitude) * magnitude;
    const niceMin = Math.floor(dataMin / niceStep) * niceStep;
    const ticks: { label: string; svgY: number }[] = [];
    for (let i = 0; i <= 5; i++) {
      const v = niceMin + i * niceStep;
      if (v < dataMin - niceStep * 0.1 || v > dataMax + niceStep * 0.1) continue;
      const svgY = this.PAD_T + (1 - (v - dataMin) / range) * plotH;
      let label: string;
      if (key === 'audience') label = `${Math.round(v)}K`;
      else if (key === 'ai') label = v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${Math.round(v)}`;
      else label = `${Math.round(v)}%`;
      ticks.push({ label, svgY });
    }
    return ticks;
  });

  xTicks = computed(() => {
    const today = new Date();
    const ticks: { label: string; leftPct: number }[] = [];
    for (let i = 0; i <= 89; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (89 - i));
      if (i === 0 || d.getDate() === 1 || i === 89) {
        const label = (i === 0 || i === 89)
          ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : d.toLocaleDateString('en-US', { month: 'short' });
        ticks.push({ label, leftPct: (i / 89) * 100 });
      }
    }
    return ticks;
  });

  hoverIdx = signal<number | null>(null);

  hoverPoint = computed(() => {
    const idx = this.hoverIdx();
    if (idx === null) return null;
    const pts = this.trendData();
    const raw = this.getRaw(this.trendMetric());
    const key = this.trendMetric();
    const pt = pts[idx];
    let label: string;
    if (key === 'audience') label = `${Math.round(raw[idx])}K visitors`;
    else if (key === 'ai') label = `${Math.round(raw[idx]).toLocaleString()} interactions`;
    else label = `${Math.round(raw[idx])}% success`;
    const today = new Date();
    const d = new Date(today);
    d.setDate(d.getDate() - (89 - idx));
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { svgX: pt.x, svgY: pt.y, xPct: (idx / 89) * 100, topPct: (pt.y / this.SVG_H) * 100, label, dateStr };
  });

  onChartMove(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const xRel = (e.clientX - rect.left) / rect.width;
    this.hoverIdx.set(Math.max(0, Math.min(89, Math.round(xRel * 89))));
  }

  onChartLeave(): void { this.hoverIdx.set(null); }

  readonly attentionItems = [
    { severity: 'high',   title: 'Zero-result search rate up 41% this week',        area: 'Search & AI',   metric: '12.4% zero-result',     time: '2 hrs ago'  },
    { severity: 'high',   title: '64 high-value pages have poor AI retrievability',  area: 'Content',       metric: '64 pages',              time: '1 day ago'  },
    { severity: 'high',   title: '1 P1 incident active — Aquia CMS latency',         area: 'Platform',      metric: 'INC-0041 open',         time: '30 min ago' },
    { severity: 'medium', title: 'Expired/stale content above threshold — 11%',      area: 'Content',       metric: '1,630 pages',           time: '3 days ago' },
    { severity: 'medium', title: 'Journey completion rate low at 14%',               area: 'Audience',      metric: '14% completion',        time: '1 week ago' },
    { severity: 'medium', title: 'AI/API cost up 18% MoM — tracking above budget',  area: 'Platform',      metric: '$6.1K this month',      time: '1 day ago'  },
    { severity: 'low',    title: '1 SSL certificate expiring in <30 days',           area: 'Platform',      metric: 'cloudflare.com cert',   time: '4 days ago' },
  ];

  readonly insights = [
    { dir: 'up',   text: '"Procurement guidelines" searches up 44%',      tag: 'Search'       },
    { dir: 'up',   text: 'Country data pages gaining AI visibility',       tag: 'AI Discovery' },
    { dir: 'up',   text: 'New returning users from South Asia +18%',       tag: 'Audience'     },
    { dir: 'down', text: '"Climate finance" publication downloads declining', tag: 'Content'    },
    { dir: 'down', text: 'User feedback for AI search: negative rate up',  tag: 'AI Ops'       },
    { dir: 'up',   text: 'AI-assisted journey success rate improving',     tag: 'AI Ops'       },
  ];

}
