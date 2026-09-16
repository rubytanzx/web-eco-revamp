import { Component, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TablerIconComponent } from '@tabler/icons-angular';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';

type PlatformTab = 'health' | 'apis' | 'cost' | 'properties';

interface Incident {
  id: string;
  severity: string;
  title: string;
  service: string;
  started: string;
  duration: string;
  status: string;
}

interface ServiceHealthRow {
  service: string;
  status: string;
  availability: number;
  p95: string;
  incidents: number;
}

interface EndpointRow {
  name: string;
  type: string;
  traffic: string;
  errorRate: number;
  p95: string;
  freshness: string;
  status: string;
}

interface CostBreakdownItem {
  category: string;
  amount: number;
  pct: number;
  trend: string;
}

interface PropertyRow {
  property: string;
  type: string;
  sessions: string;
  status: 'healthy' | 'slow' | 'ssl-exp' | 'new' | 'down';
  lastChecked: string;
}

@Component({
  selector: 'app-platform',
  imports: [DecimalPipe, TablerIconComponent, DateRangeFilter],
  templateUrl: './platform.html',
  styleUrl: './platform.css',
})
export class Platform {
  readonly activeTab = signal<PlatformTab>('properties');

  // ===== Health signals =====
  readonly healthSignals = [
    { label: 'Platform uptime (30d)', value: '99.87%', sub: 'across all properties',    alert: false },
    { label: 'P1 incidents (30d)',    value: '1',       sub: 'active — INC-0041',         alert: true  },
    { label: 'P2 incidents (30d)',    value: '2',       sub: 'resolved this period',      alert: false },
    { label: 'Avg MTTR',             value: '4h 12m',  sub: 'mean time to resolve',      alert: false },
  ];

  readonly incidents: Incident[] = [
    { id: 'INC-0041', severity: 'high',   title: 'Aquia CMS elevated response times',    service: 'CMS (Aquia)',    started: '30 min ago', duration: 'Ongoing',  status: 'investigating' },
    { id: 'INC-0039', severity: 'medium', title: 'Search API P95 latency spike',         service: 'Search API',     started: '3d ago',     duration: '4h 20m',   status: 'resolved' },
    { id: 'INC-0038', severity: 'medium', title: 'New Relic alert — log ingestion lag',  service: 'New Relic',      started: '5d ago',     duration: '1h 45m',   status: 'resolved' },
    { id: 'INC-0035', severity: 'low',    title: 'Country feed stale >24h',              service: 'Content Feeds',  started: '8d ago',     duration: '6h 12m',   status: 'resolved' },
  ];

  readonly serviceHealth: ServiceHealthRow[] = [
    { service: 'Aquia CMS',            status: 'warn', availability: 99.94, p95: '0.4s',  incidents: 1 },
    { service: 'Cloudflare CDN',       status: 'up',   availability: 100.0, p95: '0.1s',  incidents: 0 },
    { service: 'Search API',           status: 'up',   availability: 99.92, p95: '1.1s',  incidents: 0 },
    { service: 'New Relic monitoring', status: 'up',   availability: 99.99, p95: '—',      incidents: 0 },
    { service: 'Azure AD SSO',         status: 'up',   availability: 100.0, p95: '0.3s',  incidents: 0 },
    { service: 'Google Analytics 4',   status: 'up',   availability: 99.96, p95: '—',      incidents: 0 },
    { service: 'AI Inference (Azure)', status: 'up',   availability: 99.92, p95: '3.8s',  incidents: 0 },
  ];

  readonly uptimeHistory: boolean[] = [
    true, true, true, true, true, true, true, true, true, true,
    true, true, true, true, true, true, true, true, true, true,
    false, true, true, true, true, true, true, true, true, true,
  ];

  statusDotClass(status: string): string {
    if (status === 'up')   return 'status-dot status-dot--up';
    if (status === 'warn') return 'status-dot status-dot--warn';
    return 'status-dot status-dot--down';
  }

  severityBadgeClass(severity: string): string {
    if (severity === 'high')   return 'badge badge--high';
    if (severity === 'medium') return 'badge badge--medium';
    return 'badge badge--low';
  }

  // ===== APIs signals =====
  readonly apisSignals = [
    { label: 'API calls / day',      value: '252K',  sub: 'across all endpoints',   alert: false },
    { label: 'Endpoints monitored',  value: '9',     sub: '1 with active errors',   alert: true  },
    { label: 'Avg error rate',       value: '0.4%',  sub: '0.2pp this period',    alert: false, dir: 'down' },
    { label: 'Avg P95 latency',      value: '175ms', sub: 'across endpoints',       alert: false },
  ];

  readonly endpointRows: EndpointRow[] = [
    { name: 'KIDB SDMX API',          type: 'REST',   traffic: '42.1K req/d', errorRate: 0.2, p95: '0.9s', freshness: '1h',  status: 'up'   },
    { name: 'Open Data Library',       type: 'REST',   traffic: '28.4K req/d', errorRate: 0.3, p95: '1.1s', freshness: '2h',  status: 'up'   },
    { name: 'Search Stacks',           type: 'REST',   traffic: '61.8K req/d', errorRate: 1.2, p95: '1.8s', freshness: '1h',  status: 'warn' },
    { name: 'Akamai CDN API',          type: 'CDN',    traffic: '1.2M req/d',  errorRate: 0.0, p95: '0.1s', freshness: 'N/A', status: 'up'   },
    { name: 'New Relic Metrics',       type: 'Stream', traffic: '284K ev/d',   errorRate: 0.1, p95: '0.4s', freshness: '30m', status: 'up'   },
    { name: 'Acquia Content API',      type: 'REST',   traffic: '19.2K req/d', errorRate: 0.4, p95: '0.5s', freshness: '4h',  status: 'up'   },
    { name: 'Google Analytics 4',      type: 'REST',   traffic: '84K ev/d',    errorRate: 0.0, p95: '—',    freshness: '24h', status: 'up'   },
    { name: 'Google Search Console',   type: 'REST',   traffic: '—',           errorRate: 0.0, p95: '—',    freshness: '48h', status: 'warn' },
    { name: 'Azure AD SSO',            type: 'REST',   traffic: '22.4K req/d', errorRate: 0.0, p95: '0.3s', freshness: 'N/A', status: 'up'   },
  ];

  endpointStatusDotClass(status: string): string {
    return status === 'up' ? 'status-dot status-dot--up' : 'status-dot status-dot--warn';
  }

  isFreshnessStal(freshness: string): boolean {
    // flag if numeric hours > 24
    if (freshness === 'N/A' || freshness === '—') return false;
    const match = freshness.match(/^(\d+)h/);
    if (match) return parseInt(match[1], 10) > 24;
    return false;
  }

  // ===== Properties =====
  readonly propertySignals = [
    { label: 'Active properties', value: '23', sub: '+2 vs prior 30d',     alert: false },
    { label: 'Main domain',       value: '1',  sub: 'adb.org',             alert: false },
    { label: 'Country sites',     value: '8',  sub: 'sub-domains',         alert: false },
    { label: 'Microsites',        value: '11', sub: 'applications',        alert: false },
    { label: 'API endpoints',     value: '3',  sub: 'KIDB + Open Data',    alert: false },
  ];

  readonly propertyBreakdown = [
    { label: 'Active & healthy', pct: 20, colorClass: 'inline-bar-fill--green' },
    { label: 'Needs attention',  pct: 2,  colorClass: 'inline-bar-fill--warn' },
    { label: 'Incident open',    pct: 1,  colorClass: 'inline-bar-fill--red' },
  ];

  readonly propertyRows: PropertyRow[] = [
    { property: 'adb.org',             type: 'Main domain',  sessions: '1.04M', status: 'healthy', lastChecked: '2 min ago'  },
    { property: 'development.asia',    type: 'Microsite',    sessions: '184K',  status: 'healthy', lastChecked: '2 min ago'  },
    { property: 'blogs.adb.org',       type: 'Microsite',    sessions: '98K',   status: 'healthy', lastChecked: '5 min ago'  },
    { property: 'adbi.adb.org',        type: 'Microsite',    sessions: '76K',   status: 'healthy', lastChecked: '5 min ago'  },
    { property: 'data.adb.org',        type: 'Open Data',    sessions: '52K',   status: 'healthy', lastChecked: '2 min ago'  },
    { property: 'evaluation.adb.org',  type: 'Microsite',    sessions: '34K',   status: 'slow',    lastChecked: '18 min ago' },
    { property: 'integrity.adb.org',   type: 'Microsite',    sessions: '18K',   status: 'ssl-exp', lastChecked: 'Now'        },
    { property: 'ventures.adb.org',    type: 'Microsite',    sessions: '9K',    status: 'new',     lastChecked: '2 min ago'  },
    { property: 'erdi.adb.org',        type: 'Application',  sessions: '6K',    status: 'new',     lastChecked: '2 min ago'  },
    { property: 'kidb.adb.org',        type: 'API',          sessions: '42K',   status: 'healthy', lastChecked: '1 min ago'  },
    { property: 'opendata.adb.org',    type: 'API',          sessions: '28K',   status: 'healthy', lastChecked: '1 min ago'  },
  ];

  propertyStatusLabel(status: PropertyRow['status']): string {
    const map: Record<PropertyRow['status'], string> = {
      'healthy': 'Healthy', 'slow': 'Slow', 'ssl-exp': 'SSL exp', 'new': 'New', 'down': 'Down',
    };
    return map[status];
  }

  propertyStatusDotClass(status: PropertyRow['status']): string {
    if (status === 'healthy') return 'status-dot status-dot--up';
    if (status === 'new')     return 'status-dot status-dot--new';
    if (status === 'down')    return 'status-dot status-dot--down';
    return 'status-dot status-dot--warn';
  }

  // ===== Cost signals =====
  readonly costSignals = [
    { label: 'Monthly platform cost',  value: '$34.6K',  sub: 'all infrastructure',          alert: false },
    { label: 'YTD spend',              value: '$231K',   sub: 'of $420K annual budget',       alert: false },
    { label: 'AI / API monthly cost',  value: '$6.1K',   sub: '18% vs last month',          alert: true,  dir: 'up' },
    { label: 'Budget utilisation',     value: '55%',     sub: '$231K of $420K used YTD',      alert: false },
  ];

  readonly costBreakdown: CostBreakdownItem[] = [
    { category: 'AI Inference',    amount: 6100,  pct: 18, trend: '+18%' },
    { category: 'CDN (Cloudflare)',amount: 8400,  pct: 24, trend: '+4%'  },
    { category: 'CMS (Aquia)',     amount: 12200, pct: 35, trend: '0%'   },
    { category: 'Monitoring',      amount: 4800,  pct: 14, trend: '+2%'  },
    { category: 'Search & APIs',   amount: 3100,  pct: 9,  trend: '+6%'  },
  ];

  // Monthly cost bar chart — 12 months
  private readonly monthlyCostValues = [28200, 29800, 31400, 30200, 31800, 32400, 33100, 32800, 33900, 34100, 34400, 34600];
  private readonly monthLabels = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

  readonly costBarData = computed(() => {
    const values = this.monthlyCostValues;
    const labels = this.monthLabels;
    const W = 800, H = 160, padT = 24, padB = 24, padL = 10, padR = 10;
    const maxV = Math.max(...values);
    const minV = Math.min(...values);
    // baseline slightly below min so differences are visible
    const floorV = Math.max(0, minV - (maxV - minV) * 0.5);
    const range = maxV - floorV;
    const n = values.length;
    const totalW = W - padL - padR;
    const barW = totalW / n - 6;
    const chartH = H - padT - padB;

    return values.map((v, i) => {
      const barH = ((v - floorV) / range) * chartH;
      const barY = padT + chartH - barH;
      const cx = padL + (i / n) * totalW + 2 + barW / 2;
      return {
        x: padL + (i / n) * totalW + 2,
        y: barY,
        h: barH,
        w: barW,
        label: labels[i],
        value: v,
        labelX: cx,
        labelY: H - 6,
        valueLabel: '$' + Math.round(v / 1000) + 'K',
        valueLabelY: barY - 5,
        cx,
        isCurrent: i === values.length - 1,
      };
    });
  });
}
