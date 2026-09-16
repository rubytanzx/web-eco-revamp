import { Component, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TablerIconComponent } from '@tabler/icons-angular';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';

type AiOpsTab = 'activity' | 'quality' | 'agents';
type ActivityMetric = 'interactions' | 'users' | 'tokens' | 'cost';

interface CapabilityRow {
  capability: string;
  interactions: number;
  users: number;
  success: number;
  p95Latency: string;
  costPer1K: string;
  trend: string;
}

interface FailureBreakdownItem {
  type: string;
  count: number;
  pct: number;
}

interface LatencyRow {
  capability: string;
  p50: string;
  p95: string;
  target: string;
  overTarget: boolean;
}

interface RecentRun {
  name: string;
  ts: string;
  status: string;
  duration: string;
  spans: number;
  cost: string;
}

interface KnowledgeSource {
  name: string;
  assets: number;
  retrievalRate: number;
  queries: number;
  quality: string;
  lastIndexed: string;
  status: string;
}

interface AgentRow {
  name: string;
  purpose: string;
  status: string;
  runs: number;
  success: number;
  lastRun: string;
  cost: string;
}

@Component({
  selector: 'app-ai-ops',
  imports: [DecimalPipe, TablerIconComponent, DateRangeFilter],
  templateUrl: './ai-ops.html',
  styleUrl: './ai-ops.css',
})
export class AiOps {
  readonly activeTab = signal<AiOpsTab>('activity');
  readonly activityMetric = signal<ActivityMetric>('interactions');
  readonly expandedRun = signal<number | null>(null);

  // ===== Activity signals =====
  readonly activitySignals = [
    { label: 'AI Interactions',          value: '127.4K', sub: '41% vs prior period', alert: false, dir: 'up'   },
    { label: 'Users assisted',           value: '48.2K',  sub: '38% vs prior period', alert: false, dir: 'up'   },
    { label: 'AI-assisted success',      value: '71%',    sub: '3pp vs prior period',  alert: false, dir: 'up'   },
    { label: 'AI cost / 1K interactions',value: '$0.84',  sub: '16% vs prior period',  alert: false, dir: 'down' },
  ];

  readonly activityMetricTabs: { id: ActivityMetric; label: string }[] = [
    { id: 'interactions', label: 'Interactions' },
    { id: 'users',        label: 'Users' },
    { id: 'tokens',       label: 'Tokens' },
    { id: 'cost',         label: 'Cost' },
  ];

  readonly capabilityRows: CapabilityRow[] = [
    { capability: 'ADB Intelligence (General Q&A)', interactions: 84210, users: 31840, success: 74, p95Latency: '3.8s', costPer1K: '$1.12', trend: '+48%' },
    { capability: 'AI Search',                       interactions: 29180, users: 12840, success: 81, p95Latency: '1.2s', costPer1K: '$0.28', trend: '+31%' },
    { capability: 'Project Summarisation',           interactions: 8940,  users: 3210,  success: 68, p95Latency: '4.1s', costPer1K: '$1.84', trend: '+22%' },
    { capability: 'Content Automation',              interactions: 5070,  users: 480,   success: 71, p95Latency: '6.2s', costPer1K: '$2.40', trend: '+15%' },
  ];

  // SVG chart — 90 days with axes and hover
  readonly actW   = 1200;
  readonly actH   = 240;
  readonly actPadL = 52;
  readonly actPadR = 14;
  readonly actPadT = 16;
  readonly actPadB = 36;
  readonly actBottom = this.actH - this.actPadB;

  private readonly actRawData = computed(() => {
    const metric = this.activityMetric();
    const N = 90;
    let base: number, amplitude: number, trend: number;
    if      (metric === 'interactions') { base = 1200;  amplitude = 400;  trend = 4;     }
    else if (metric === 'users')        { base = 480;   amplitude = 140;  trend = 1.5;   }
    else if (metric === 'tokens')       { base = 28000; amplitude = 8000; trend = 60;    }
    else                                { base = 1.0;   amplitude = 0.3;  trend = -0.005;}
    const vals: number[] = [];
    for (let i = 0; i < N; i++) {
      vals.push(Math.max(0, base + Math.sin(i * 0.18) * amplitude * 0.6 + Math.sin(i * 0.07) * amplitude * 0.4 + trend * i));
    }
    return vals;
  });

  private actFmtValue(v: number, metric: ActivityMetric): string {
    if (metric === 'interactions') return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${Math.round(v)}`;
    if (metric === 'users')        return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${Math.round(v)}`;
    if (metric === 'tokens')       return `${(v / 1000).toFixed(0)}K`;
    return `$${v.toFixed(2)}`;
  }

  readonly activityPts = computed(() => {
    const vals  = this.actRawData();
    const metric = this.activityMetric();
    const N = vals.length;
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const range = maxV - minV || 1;
    const plotW = this.actW - this.actPadL - this.actPadR;
    const plotH = this.actH - this.actPadT - this.actPadB;
    // x-axis: 90 days from Jun 18 to Sep 15 2026
    const startDate = new Date(2026, 5, 18);
    return vals.map((v, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const label = `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
      return {
        x: this.actPadL + (i / (N - 1)) * plotW,
        y: this.actPadT + (1 - (v - minV) / range) * plotH,
        value: v,
        label,
        fmtValue: this.actFmtValue(v, metric),
      };
    });
  });

  readonly actYTicks = computed(() => {
    const vals   = this.actRawData();
    const metric = this.activityMetric();
    const minV   = Math.min(...vals);
    const maxV   = Math.max(...vals);
    const range  = maxV - minV || 1;
    const plotH  = this.actH - this.actPadT - this.actPadB;
    const ticks  = 4;
    return Array.from({ length: ticks + 1 }, (_, i) => {
      const v = minV + (i / ticks) * range;
      return {
        y: this.actPadT + (1 - i / ticks) * plotH,
        label: this.actFmtValue(v, metric),
      };
    });
  });

  // X-axis: show label at start of each month
  readonly actXTicks = computed(() => {
    return this.activityPts()
      .filter(pt => pt.label.endsWith(' 1'))
      .map(pt => ({ x: pt.x, label: pt.label }));
  });

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

  readonly activityLinePath = computed(() => this.bezier(this.activityPts()));
  readonly activityAreaPath = computed(() => {
    const pts = this.activityPts();
    if (!pts.length) return '';
    return this.bezier(pts) + ` L ${pts[pts.length - 1].x} ${this.actBottom} L ${pts[0].x} ${this.actBottom} Z`;
  });

  readonly hoveredActIdx = signal<number | null>(null);
  readonly hoveredActPt  = computed(() => {
    const i = this.hoveredActIdx();
    return i !== null ? (this.activityPts()[i] ?? null) : null;
  });

  onActMouseMove(e: MouseEvent) {
    const rect   = (e.currentTarget as SVGElement).getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * this.actW;
    const pts    = this.activityPts();
    let nearest = 0, minDist = Infinity;
    pts.forEach((pt, i) => {
      const d = Math.abs(pt.x - mouseX);
      if (d < minDist) { minDist = d; nearest = i; }
    });
    this.hoveredActIdx.set(nearest);
  }
  onActMouseLeave() { this.hoveredActIdx.set(null); }

  actTooltipX(hp: { x: number }): number {
    return Math.min(Math.max(hp.x + 12, this.actPadL), this.actW - 160 - this.actPadR);
  }
  actTooltipY(hp: { y: number }): number {
    return Math.max(hp.y - 60, this.actPadT);
  }

  // ===== Quality signals =====
  readonly qualitySignals = [
    { label: 'Answer success',     value: '74%',  sub: '2pp vs prior period', alert: false, dir: 'up'   },
    { label: 'Retrieval success',  value: '88%',  sub: '1pp',                 alert: false, dir: 'up'   },
    { label: 'Error rate',         value: '3.2%', sub: '0.8pp',               alert: false, dir: 'down' },
    { label: 'P95 response time',  value: '3.8s', sub: '0.4s',                alert: true,  dir: 'up'   },
  ];

  readonly qualityWeeklyData = [68, 70, 71, 69, 72, 71, 73, 72, 74, 73, 74, 74];

  readonly qualityLinePts = computed(() => {
    const data = this.qualityWeeklyData;
    const W = 800, H = 120, padT = 12, padB = 12, padL = 0, padR = 0;
    const minV = Math.min(...data) - 2;
    const maxV = Math.max(...data) + 2;
    const range = maxV - minV;
    return data.map((v, i) => ({
      x: padL + (i / (data.length - 1)) * (W - padL - padR),
      y: padT + (1 - (v - minV) / range) * (H - padT - padB),
    }));
  });

  readonly qualityLinePath = computed(() => this.bezier(this.qualityLinePts()));
  readonly qualityAreaPath = computed(() => {
    const pts = this.qualityLinePts();
    if (!pts.length) return '';
    return this.bezier(pts) + ` L ${pts[pts.length - 1].x} 120 L ${pts[0].x} 120 Z`;
  });

  readonly failureBreakdown: FailureBreakdownItem[] = [
    { type: 'No-answer / could not find',   count: 1840, pct: 46 },
    { type: 'Incorrect source cited',        count: 920,  pct: 23 },
    { type: 'Outdated information',          count: 640,  pct: 16 },
    { type: 'Hallucinated facts',            count: 320,  pct: 8  },
    { type: 'Irrelevant response',           count: 280,  pct: 7  },
  ];

  readonly latencyRows: LatencyRow[] = [
    { capability: 'ADB Intelligence', p50: '2.1s', p95: '3.8s', target: '3.0s', overTarget: true  },
    { capability: 'AI Search',        p50: '0.6s', p95: '1.2s', target: '1.5s', overTarget: false },
    { capability: 'Summarisation',    p50: '2.4s', p95: '4.1s', target: '4.0s', overTarget: true  },
    { capability: 'Automation',       p50: '3.8s', p95: '6.2s', target: '6.0s', overTarget: true  },
  ];

  readonly recentRuns: RecentRun[] = [
    { name: 'ADB Intelligence',   ts: '09:42 AM', status: 'success', duration: '3.2s', spans: 4, cost: '$0.0012' },
    { name: 'AI Search',          ts: '09:41 AM', status: 'success', duration: '1.1s', spans: 2, cost: '$0.0003' },
    { name: 'ADB Intelligence',   ts: '09:38 AM', status: 'error',   duration: '8.4s', spans: 4, cost: '$0.0018' },
    { name: 'Summarisation',      ts: '09:35 AM', status: 'success', duration: '4.1s', spans: 6, cost: '$0.0024' },
    { name: 'ADB Intelligence',   ts: '09:32 AM', status: 'success', duration: '2.8s', spans: 4, cost: '$0.0011' },
    { name: 'AI Search',          ts: '09:28 AM', status: 'success', duration: '0.9s', spans: 2, cost: '$0.0003' },
    { name: 'ADB Intelligence',   ts: '09:24 AM', status: 'success', duration: '3.6s', spans: 4, cost: '$0.0014' },
    { name: 'Content Automation', ts: '09:18 AM', status: 'success', duration: '5.8s', spans: 8, cost: '$0.0029' },
  ];

  toggleRun(idx: number) {
    this.expandedRun.update(cur => (cur === idx ? null : idx));
  }

  // ===== Knowledge signals =====
  readonly knowledgeSignals = [
    { label: 'Sources indexed',        value: '7',         sub: 'active',                      alert: false },
    { label: 'Retrieval coverage',     value: '84%',       sub: 'of queries hit a source',     alert: false },
    { label: 'Never retrieved',        value: '2 sources', sub: 'in last 30 days',             alert: true  },
    { label: 'Average freshness',      value: '14 days',   sub: 'since last index',            alert: false },
  ];

  readonly knowledgeSources: KnowledgeSource[] = [
    { name: 'Project Database',         assets: 4218,  retrievalRate: 92, queries: 84210, quality: 'Good', lastIndexed: '1h ago',  status: 'active' },
    { name: 'Publications Repository',  assets: 12841, retrievalRate: 88, queries: 29180, quality: 'Good', lastIndexed: '4h ago',  status: 'active' },
    { name: 'Country Profiles',         assets: 68,    retrievalRate: 84, queries: 18340, quality: 'Good', lastIndexed: '12h ago', status: 'active' },
    { name: 'ADB Regulations & Policy', assets: 840,   retrievalRate: 76, queries: 8940,  quality: 'Fair', lastIndexed: '2d ago',  status: 'active' },
    { name: 'Procurement Guidelines',   assets: 2140,  retrievalRate: 64, queries: 5070,  quality: 'Fair', lastIndexed: '5d ago',  status: 'active' },
    { name: 'News & Media Archive',     assets: 3210,  retrievalRate: 12, queries: 840,   quality: 'Poor', lastIndexed: '18d ago', status: 'stale'  },
    { name: 'Climate Fund Database',    assets: 420,   retrievalRate: 8,  queries: 280,   quality: 'Poor', lastIndexed: '31d ago', status: 'stale'  },
  ];

  qualityBadgeClass(q: string): string {
    if (q === 'Good') return 'badge badge--good';
    if (q === 'Fair') return 'badge badge--medium';
    return 'badge badge--high';
  }

  sourceStatusClass(s: string): string {
    return s === 'active' ? 'status-dot status-dot--up' : 'status-dot status-dot--warn';
  }

  // ===== Agents signals =====
  readonly agentsSignals = [
    { label: 'Total agents',    value: '5',      sub: 'deployed',                alert: false },
    { label: 'Active',          value: '3',      sub: 'running normally',         alert: false },
    { label: 'Runs this month', value: '2,191',  sub: 'total executions',         alert: false },
    { label: 'Tokens used',     value: '227K',   sub: 'this month',               alert: false },
  ];

  readonly agentsRows: AgentRow[] = [
    { name: 'Content Freshness Monitor',   purpose: 'Flags stale/expired content for review',         status: 'healthy',  runs: 482,  success: 94,  lastRun: '5 min ago',  cost: '$2.18'  },
    { name: 'Zero-Result Search Alert',    purpose: 'Monitors for rising zero-result query clusters',  status: 'healthy',  runs: 744,  success: 88,  lastRun: '2 min ago',  cost: '$0.84'  },
    { name: 'Monthly Traffic Report',      purpose: 'Generates automated monthly analytics digest',    status: 'healthy',  runs: 1,    success: 100, lastRun: '4 days ago', cost: '$0.34'  },
    { name: 'API Error Rate Watcher',      purpose: 'Tracks endpoint error rates and pages on-call',  status: 'healthy',  runs: 960,  success: 97,  lastRun: '1 min ago',  cost: '$0.28'  },
    { name: 'GEO Retrievability Tracker',  purpose: 'Audits AI citation and retrievability scores',   status: 'degraded', runs: 4,    success: 75,  lastRun: '3 days ago', cost: '$0.52'  },
  ];

  agentStatusBadgeClass(status: string): string {
    if (status === 'healthy')  return 'badge badge--good';
    if (status === 'degraded') return 'badge badge--medium';
    if (status === 'failing')  return 'badge badge--high';
    return 'badge badge--low';
  }

  agentStatusDotClass(status: string): string {
    if (status === 'healthy')  return 'status-dot status-dot--up';
    if (status === 'degraded') return 'status-dot status-dot--warn';
    return 'status-dot status-dot--down';
  }
}
