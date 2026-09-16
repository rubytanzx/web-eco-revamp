import { Component, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';
import { TablerIconComponent } from '@tabler/icons-angular';

type ContentTab = 'performance' | 'health' | 'inventory' | 'knowledge';

interface ContentTypeRow {
  type: string;
  assets: number;
  actions: number;
  effectiveness: number;
  trend: string;
}

interface TopContentRow {
  title: string;
  type: string;
  actions: number;
  trend: string;
}

interface DecliningContentRow {
  title: string;
  type: string;
  actions: number;
  decline: string;
}

interface HealthBreakdownRow {
  issue: string;
  count: number;
  pct: number;
  severity: 'high' | 'medium' | 'low';
}

interface HealthRow {
  title: string;
  type: string;
  issue: string;
  traffic: string;
  aiVisibility: string;
  owner: string;
  updated: string;
  priority: 'high' | 'medium' | 'low';
}

interface InventoryRow {
  type: string;
  total: number;
  published: number;
  withOwner: number;
  withSchema: number;
  lastUpdated: string;
}

@Component({
  selector: 'app-content',
  imports: [DateRangeFilter, DecimalPipe, TablerIconComponent],
  templateUrl: './content.html',
  styleUrl: './content.css',
})
export class Content {
  readonly activeTab = signal<ContentTab>('performance');

  // ── Performance tab ──────────────────────────────────────────────

  readonly contentTypeRows: ContentTypeRow[] = [
    { type: 'Projects',          assets: 4218,  actions: 38420, effectiveness: 78, trend: '+3pp' },
    { type: 'Publications',      assets: 12841, actions: 29180, effectiveness: 62, trend: '-2pp' },
    { type: 'Countries',         assets: 68,    actions: 18340, effectiveness: 84, trend: '+5pp' },
    { type: 'Data & Statistics', assets: 1840,  actions: 12610, effectiveness: 71, trend: '+1pp' },
    { type: 'News & Events',     assets: 3210,  actions: 8920,  effectiveness: 55, trend: '-4pp' },
    { type: 'Procurement',       assets: 2140,  actions: 4830,  effectiveness: 48, trend: '-9pp' },
    { type: 'Careers',           assets: 890,   actions: 2340,  effectiveness: 53, trend: '+2pp' },
  ];

  readonly maxActions = computed(() =>
    Math.max(...this.contentTypeRows.map(r => r.actions))
  );

  actionBarPct(actions: number): number {
    return Math.round((actions / this.maxActions()) * 100);
  }

  readonly topContent: TopContentRow[] = [
    { title: 'Asian Development Bank Annual Report 2025',   type: 'Publication', actions: 4218, trend: '+28%' },
    { title: 'Philippines Country Overview',                 type: 'Country',     actions: 3841, trend: '+34%' },
    { title: 'ADB Climate Change Financing',                 type: 'Project',     actions: 2960, trend: '+12%' },
    { title: 'Asian Economic Integration Report 2025',       type: 'Publication', actions: 2714, trend: '+9%'  },
    { title: 'India Country Partnership Strategy 2024–28',   type: 'Country',     actions: 2481, trend: '+41%' },
    { title: 'Green Bond Framework 2025',                    type: 'Publication', actions: 2240, trend: '+18%' },
    { title: 'Pacific Private Sector Development Initiative',type: 'Project',     actions: 1980, trend: '+7%'  },
    { title: 'Key Indicators for Asia and the Pacific 2025', type: 'Publication', actions: 1841, trend: '-3%'  },
  ];

  readonly decliningContent: DecliningContentRow[] = [
    { title: 'Pacific Disaster Risk Fund (closed project)',      type: 'Project',     actions: 84,  decline: '-62%' },
    { title: 'ASEAN Infrastructure Fund Annual Report 2022',    type: 'Publication', actions: 120, decline: '-48%' },
    { title: 'Mongolia Country Partnership Strategy 2017',      type: 'Country',     actions: 98,  decline: '-41%' },
    { title: 'Strategy 2020 Midterm Review',                    type: 'Publication', actions: 64,  decline: '-38%' },
    { title: 'Renewable Energy for Remote Areas (completed)',   type: 'Project',     actions: 110, decline: '-35%' },
  ];

  // ── Health tab ───────────────────────────────────────────────────

  readonly healthBreakdown: HealthBreakdownRow[] = [
    { issue: 'Stale content (>12 months)',   count: 67, pct: 36, severity: 'high'   },
    { issue: 'Poor AI retrievability',        count: 52, pct: 28, severity: 'high'   },
    { issue: 'Incomplete metadata',           count: 28, pct: 15, severity: 'medium' },
    { issue: 'Missing owner assignment',      count: 19, pct: 10, severity: 'medium' },
    { issue: 'Broken outbound links',         count: 11, pct: 6,  severity: 'low'    },
    { issue: 'Schema / structured-data gaps', count: 7,  pct: 4,  severity: 'low'    },
  ];

  readonly healthRows: HealthRow[] = [
    { title: 'Cambodia Energy Sector Assessment',      type: 'Publication', issue: 'Stale',                traffic: 'High', aiVisibility: 'Poor', owner: 'SEOD', updated: 'Jan 2023', priority: 'high'   },
    { title: 'Digital Connectivity in the Pacific',    type: 'Project',     issue: 'Stale',                traffic: 'High', aiVisibility: 'Fair', owner: 'PARD', updated: 'Mar 2023', priority: 'high'   },
    { title: 'South Asia Urban Development Programme', type: 'Project',     issue: 'Poor AI retrievability',traffic: 'High', aiVisibility: 'Poor', owner: 'SARD', updated: 'Aug 2024', priority: 'high'   },
    { title: 'Sustainable Tourism Development',        type: 'Project',     issue: 'Poor AI retrievability',traffic: 'High', aiVisibility: 'Poor', owner: 'SEOD', updated: 'Oct 2024', priority: 'high'   },
    { title: 'Pacific Climate Change Programme',       type: 'Project',     issue: 'Incomplete metadata',  traffic: 'Med',  aiVisibility: 'Fair', owner: 'PARD', updated: 'Nov 2024', priority: 'medium' },
    { title: 'Public Financial Management Reform',     type: 'Publication', issue: 'Incomplete metadata',  traffic: 'Med',  aiVisibility: 'Fair', owner: 'COSO', updated: 'Sep 2024', priority: 'medium' },
    { title: 'Greater Mekong Road Development',        type: 'Project',     issue: 'Missing owner',        traffic: 'Med',  aiVisibility: 'Fair', owner: '—',    updated: 'Jul 2024', priority: 'medium' },
    { title: 'Bhutan Hydropower Sector Review',        type: 'Publication', issue: 'Broken links',         traffic: 'Low',  aiVisibility: 'Good', owner: 'SAOD', updated: 'Dec 2024', priority: 'low'    },
    { title: 'Private Equity Fund in Asia',            type: 'Project',     issue: 'Schema gaps',          traffic: 'Low',  aiVisibility: 'Poor', owner: 'PSOD', updated: 'Feb 2025', priority: 'low'    },
    { title: 'ASEAN Carbon Market Framework',          type: 'Publication', issue: 'Stale',                traffic: 'High', aiVisibility: 'Good', owner: 'OECC', updated: 'Oct 2022', priority: 'high'   },
  ];

  priorityBadgeClass(priority: 'high' | 'medium' | 'low'): string {
    return priority === 'high' ? 'badge badge--high' :
           priority === 'medium' ? 'badge badge--medium' : 'badge badge--low';
  }

  severityBadgeClass(severity: 'high' | 'medium' | 'low'): string {
    return this.priorityBadgeClass(severity);
  }

  // ── Inventory tab ────────────────────────────────────────────────

  readonly inventoryRows: InventoryRow[] = [
    { type: 'Projects',          total: 4218,  published: 98,  withOwner: 96,  withSchema: 82, lastUpdated: 'Today'  },
    { type: 'Publications',      total: 12841, published: 94,  withOwner: 81,  withSchema: 68, lastUpdated: 'Today'  },
    { type: 'Countries',         total: 68,    published: 100, withOwner: 100, withSchema: 91, lastUpdated: '2d ago' },
    { type: 'Data & Statistics', total: 1840,  published: 88,  withOwner: 72,  withSchema: 44, lastUpdated: 'Today'  },
    { type: 'News & Events',     total: 3210,  published: 86,  withOwner: 91,  withSchema: 38, lastUpdated: '1h ago' },
    { type: 'Procurement',       total: 2140,  published: 91,  withOwner: 88,  withSchema: 52, lastUpdated: '3h ago' },
    { type: 'Careers',           total: 890,   published: 78,  withOwner: 95,  withSchema: 71, lastUpdated: '1d ago' },
    { type: 'Pages / Web',       total: 1840,  published: 95,  withOwner: 62,  withSchema: 28, lastUpdated: '4h ago' },
  ];

  pctColor(pct: number): string {
    if (pct >= 90) return '#16a34a';
    if (pct >= 75) return '#22c55e';
    if (pct >= 55) return '#fb923c';
    return '#ef4444';
  }

  // ── Knowledge Sources tab ─────────────────────────────────────────

  readonly knowledgeSignals = [
    { label: 'Sources indexed',    value: '7',         sub: 'active',                  alert: false },
    { label: 'Retrieval coverage', value: '84%',       sub: 'of queries hit a source', alert: false },
    { label: 'Never retrieved',    value: '2 sources', sub: 'in last 30 days',         alert: true  },
    { label: 'Average freshness',  value: '14 days',   sub: 'since last index',        alert: false },
  ];

  readonly knowledgeSources = [
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
}
