import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TablerIconComponent } from '@tabler/icons-angular';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';

type CurationStatus = 'Curated' | 'Pending Review' | 'In Progress' | 'Auto-Ingested';
type RegSortKey = 'name' | 'domain' | 'status' | 'lastUpdated' | 'utilization' | 'queries';
type SortDir = 'asc' | 'desc';
type SourceUtilSegment = 'cited' | 'referenced' | 'not-retrieved';

interface FileRow { name: string; type: string; size: string; lastAccessed: string; }

interface OverviewKpi { title: string; value: string; sub: string; tooltip?: string; }

interface HealthBreakdown { label: string; score: number; weight: number; }
interface DeptContrib    { vpu: string; name: string; resources: number; pct: number; lastAdded: string; }
interface FreshnessRow   { vpu: string; latestDoc: string; avgAgeDays: number; staleCount: number; }
interface TrendPoint     { label: string; value: number; }
interface SourceUtil     { cited: number; referenced: number; notRetrieved: number; totalFiles: number; }

interface CollectionFeedbackSummary {
  positivePct: number;
  vsPreiousPct: number;    // positive delta vs prev period
  totalCount: number;
  negativeCount: number;
  topIssue: string;
  topIssueCount: number;
}

interface CollectionDrawerData {
  description: string;
  fileCount: number;
  healthScore: number;
  healthGrade: string;
  healthBreakdown: HealthBreakdown[];
  trendPoints: TrendPoint[];
  sourceUtil: SourceUtil;
  deptContribs: DeptContrib[];
  contentFreshness: FreshnessRow[];
  feedback: CollectionFeedbackSummary;
}

interface RegistryRow {
  name: string;
  domain: string;
  status: CurationStatus;
  lastUpdated: string;
  lastUpdatedDisplay: string;
  utilization: number;
  queries: number;
}

@Component({
  selector: 'app-collections',
  imports: [TablerIconComponent, DateRangeFilter, DecimalPipe],
  templateUrl: './collections.html',
  styleUrl: './collections.css',
})
export class Collections {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor() {
    // Auto-open a collection drawer when navigated from Feedback
    effect(() => {
      const open = this.route.snapshot.queryParamMap.get('open');
      if (!open) return;
      const row = this.registryRows.find(r => r.name === open);
      if (row) this.openCollection(row);
    });
  }

  navigateToFeedback(collectionName: string) {
    this.router.navigate(['/feedback'], { queryParams: { collection: collectionName } });
  }
  readonly overviewKpis: OverviewKpi[] = [
    { title: 'Total Collections',         value: '18',  sub: 'collections in the knowledge base' },
    { title: 'Overall Utilization Rate',  value: '74%', sub: 'of collections used in at least one AI response', tooltip: 'Utilization Rate = share of collections retrieved in at least one AI-generated response during the selected period. Source: retrieval logs from the Navigator RAG pipeline.' },
    { title: 'Collections Active',        value: '14',  sub: 'of 18 collections with queries this period' },
    { title: 'Collections Not Retrieved', value: '4',   sub: 'collections never retrieved in any AI response' },
  ];

  readonly registryRows: RegistryRow[] = [
    // Sector Knowledge
    { name: 'AFNR Document Library',      domain: 'Sector Knowledge',      status: 'Curated',        lastUpdated: '2026-07-15', lastUpdatedDisplay: 'Jul 15, 2026', utilization: 74, queries: 6200 },
    { name: 'AFNR – East Asia',           domain: 'Sector Knowledge',      status: 'Curated',        lastUpdated: '2026-07-01', lastUpdatedDisplay: 'Jul 1, 2026',  utilization: 68, queries: 4100 },
    { name: 'AFNR – South Asia',          domain: 'Sector Knowledge',      status: 'In Progress',    lastUpdated: '2026-06-20', lastUpdatedDisplay: 'Jun 20, 2026', utilization: 65, queries: 3800 },
    { name: 'AFNR – Central & West Asia', domain: 'Sector Knowledge',      status: 'Pending Review', lastUpdated: '2026-06-10', lastUpdatedDisplay: 'Jun 10, 2026', utilization: 60, queries: 3200 },
    // Policies & Governance
    { name: 'Policy Architecture',        domain: 'Policies & Governance', status: 'Curated',        lastUpdated: '2026-07-07', lastUpdatedDisplay: 'Jul 7, 2026',  utilization: 82, queries: 7100 },
    { name: 'Board Paper Library',        domain: 'Policies & Governance', status: 'Curated',        lastUpdated: '2026-06-15', lastUpdatedDisplay: 'Jun 15, 2026', utilization: 79, queries: 5900 },
    { name: 'SEC-IAU Guidelines',         domain: 'Policies & Governance', status: 'Curated',        lastUpdated: '2026-06-01', lastUpdatedDisplay: 'Jun 1, 2026',  utilization: 71, queries: 4400 },
    { name: 'SEC-IAU Final Documents',    domain: 'Policies & Governance', status: 'Auto-Ingested',  lastUpdated: '2026-05-20', lastUpdatedDisplay: 'May 20, 2026', utilization: 63, queries: 3600 },
    // Corporate Services
    { name: 'Travel Concur',              domain: 'Corporate Services',    status: 'Curated',        lastUpdated: '2026-07-10', lastUpdatedDisplay: 'Jul 10, 2026', utilization: 85, queries: 5500 },
    { name: 'CSD Guidelines & Manuals',   domain: 'Corporate Services',    status: 'Curated',        lastUpdated: '2026-06-25', lastUpdatedDisplay: 'Jun 25, 2026', utilization: 78, queries: 4700 },
    { name: 'Branding Toolkit',           domain: 'Corporate Services',    status: 'Curated',        lastUpdated: '2026-06-05', lastUpdatedDisplay: 'Jun 5, 2026',  utilization: 72, queries: 2900 },
    { name: 'ITD Sharepoint',             domain: 'Corporate Services',    status: 'Auto-Ingested',  lastUpdated: '2026-05-15', lastUpdatedDisplay: 'May 15, 2026', utilization: 66, queries: 2400 },
    // Operations & Projects
    { name: 'SovOps M1-3',               domain: 'Operations & Projects', status: 'Curated',        lastUpdated: '2026-07-12', lastUpdatedDisplay: 'Jul 12, 2026', utilization: 88, queries: 8200 },
    { name: 'SovOps M4-6',               domain: 'Operations & Projects', status: 'Curated',        lastUpdated: '2026-07-05', lastUpdatedDisplay: 'Jul 5, 2026',  utilization: 84, queries: 7400 },
    { name: 'TORs (Consultants)',         domain: 'Operations & Projects', status: 'In Progress',    lastUpdated: '2026-06-18', lastUpdatedDisplay: 'Jun 18, 2026', utilization: 69, queries: 4900 },
    { name: 'Country Fact Sheets',        domain: 'Operations & Projects', status: 'Curated',        lastUpdated: '2026-05-30', lastUpdatedDisplay: 'May 30, 2026', utilization: 76, queries: 3700 },
    // Support Services
    { name: 'AskHR KB Articles',          domain: 'Support Services',      status: 'Curated',        lastUpdated: '2026-07-08', lastUpdatedDisplay: 'Jul 8, 2026',  utilization: 80, queries: 6800 },
    { name: 'AskIT KB Articles',          domain: 'Support Services',      status: 'Curated',        lastUpdated: '2026-07-02', lastUpdatedDisplay: 'Jul 2, 2026',  utilization: 77, queries: 5200 },
  ];

  readonly regSortKey = signal<RegSortKey>('queries');
  readonly regSortDir = signal<SortDir>('desc');

  readonly sortedRegistry = computed(() => {
    const key = this.regSortKey();
    const mul = this.regSortDir() === 'asc' ? 1 : -1;
    return [...this.registryRows].sort((a, b) => {
      const va = this.registryValue(a, key);
      const vb = this.registryValue(b, key);
      if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * mul;
      return ((va as number) - (vb as number)) * mul;
    });
  });

  private registryValue(r: RegistryRow, key: RegSortKey): string | number {
    switch (key) {
      case 'name':        return r.name;
      case 'domain':      return r.domain;
      case 'status':      return r.status;
      case 'lastUpdated': return new Date(r.lastUpdated).getTime();
      case 'utilization': return r.utilization;
      case 'queries':     return r.queries;
    }
  }

  domainSlug(domain: string): string {
    return domain.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  toggleRegSort(key: RegSortKey) {
    if (this.regSortKey() === key) {
      this.regSortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.regSortKey.set(key);
      this.regSortDir.set(key === 'name' ? 'asc' : 'desc');
    }
  }

  slugFor(name: string): string {
    return name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  formatNum(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return n.toLocaleString();
  }

  // ─── Collection Registry Drawer ───────────────────────────────────────────

  readonly collectionDetails: Record<string, CollectionDrawerData> = {
    'AFNR Document Library': {
      description: 'Agricultural, food, and natural resources knowledge base including TORs, templates, learning series, and webinars for AFNR sector operations across all regions.',
      fileCount: 420, healthScore: 80, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 78, weight: 30 },
        { label: 'Feedback Positivity', score: 82, weight: 25 },
        { label: 'Retrieval Rate',      score: 84, weight: 25 },
        { label: 'Content Freshness',   score: 76, weight: 20 },
      ],
      trendPoints: [{ label: 'Apr', value: 18 }, { label: 'May', value: 28 }, { label: 'Jun', value: 35 }, { label: 'Jul', value: 30 }, { label: 'Aug', value: 12 }],
      sourceUtil: { cited: 45, referenced: 30, notRetrieved: 25, totalFiles: 420 },
      deptContribs: [
        { vpu: 'SDCC', name: 'Sectors & Themes',   resources: 220, pct: 52, lastAdded: 'Jul 15, 2026' },
        { vpu: 'SD1',  name: 'Sectors Dept. 1',    resources: 120, pct: 29, lastAdded: 'May 20, 2026' },
        { vpu: 'SD2',  name: 'Sectors Dept. 2',    resources: 80,  pct: 19, lastAdded: 'Mar 10, 2026' },
      ],
      contentFreshness: [
        { vpu: 'SDCC', latestDoc: 'Jul 15, 2026', avgAgeDays: 33,  staleCount: 0 },
        { vpu: 'SD1',  latestDoc: 'May 20, 2026', avgAgeDays: 87,  staleCount: 2 },
        { vpu: 'SD2',  latestDoc: 'Mar 10, 2026', avgAgeDays: 157, staleCount: 6 },
      ],
      feedback: { positivePct: 82, vsPreiousPct:  4, totalCount:  98, negativeCount: 18, topIssue: 'Incorrect Sources',   topIssueCount:  6 },
    },
    'AFNR – East Asia': {
      description: 'Regional project reference documents for East Asia AFNR operations including project briefs, feasibility studies, and sector assessments.',
      fileCount: 185, healthScore: 74, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 70, weight: 30 },
        { label: 'Feedback Positivity', score: 75, weight: 25 },
        { label: 'Retrieval Rate',      score: 78, weight: 25 },
        { label: 'Content Freshness',   score: 72, weight: 20 },
      ],
      trendPoints: [{ label: 'Mar', value: 10 }, { label: 'Apr', value: 16 }, { label: 'May', value: 22 }, { label: 'Jun', value: 14 }, { label: 'Aug', value: 5 }],
      sourceUtil: { cited: 40, referenced: 32, notRetrieved: 28, totalFiles: 185 },
      deptContribs: [
        { vpu: 'EARD', name: 'East Asia Dept.',  resources: 130, pct: 70, lastAdded: 'Jul 1, 2026' },
        { vpu: 'SD1',  name: 'Sectors Dept. 1', resources: 55,  pct: 30, lastAdded: 'Apr 8, 2026' },
      ],
      contentFreshness: [
        { vpu: 'EARD', latestDoc: 'Jul 1, 2026',  avgAgeDays: 47,  staleCount: 1 },
        { vpu: 'SD1',  latestDoc: 'Apr 8, 2026',  avgAgeDays: 139, staleCount: 4 },
      ],
      feedback: { positivePct: 79, vsPreiousPct:  2, totalCount:  63, negativeCount: 13, topIssue: 'Irrelevant Response', topIssueCount:  4 },
    },
    'AFNR – South Asia': {
      description: 'Regional project reference documents for South Asia AFNR operations including project briefs, feasibility studies, and sector assessments.',
      fileCount: 172, healthScore: 71, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 68, weight: 30 },
        { label: 'Feedback Positivity', score: 72, weight: 25 },
        { label: 'Retrieval Rate',      score: 74, weight: 25 },
        { label: 'Content Freshness',   score: 70, weight: 20 },
      ],
      trendPoints: [{ label: 'Mar', value: 8 }, { label: 'Apr', value: 14 }, { label: 'May', value: 18 }, { label: 'Jun', value: 12 }, { label: 'Aug', value: 4 }],
      sourceUtil: { cited: 38, referenced: 34, notRetrieved: 28, totalFiles: 172 },
      deptContribs: [
        { vpu: 'SARD', name: 'South Asia Dept.', resources: 125, pct: 73, lastAdded: 'Jun 20, 2026' },
        { vpu: 'SD2',  name: 'Sectors Dept. 2', resources: 47,  pct: 27, lastAdded: 'Mar 25, 2026' },
      ],
      contentFreshness: [
        { vpu: 'SARD', latestDoc: 'Jun 20, 2026', avgAgeDays: 58,  staleCount: 1 },
        { vpu: 'SD2',  latestDoc: 'Mar 25, 2026', avgAgeDays: 153, staleCount: 5 },
      ],
      feedback: { positivePct: 75, vsPreiousPct: -1, totalCount:  48, negativeCount: 12, topIssue: 'Incorrect Sources',   topIssueCount:  5 },
    },
    'AFNR – Central & West Asia': {
      description: 'Regional project reference documents for Central and West Asia AFNR operations including project briefs, feasibility studies, and sector assessments.',
      fileCount: 160, healthScore: 67, healthGrade: 'Fair',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 63, weight: 30 },
        { label: 'Feedback Positivity', score: 68, weight: 25 },
        { label: 'Retrieval Rate',      score: 72, weight: 25 },
        { label: 'Content Freshness',   score: 64, weight: 20 },
      ],
      trendPoints: [{ label: 'Feb', value: 6 }, { label: 'Mar', value: 12 }, { label: 'Apr', value: 8 }, { label: 'May', value: 5 }, { label: 'Aug', value: 2 }],
      sourceUtil: { cited: 32, referenced: 35, notRetrieved: 33, totalFiles: 160 },
      deptContribs: [
        { vpu: 'CWRD', name: 'Central & West Asia Dept.', resources: 118, pct: 74, lastAdded: 'Jun 10, 2026' },
        { vpu: 'SD1',  name: 'Sectors Dept. 1',           resources: 42,  pct: 26, lastAdded: 'Feb 10, 2026' },
      ],
      contentFreshness: [
        { vpu: 'CWRD', latestDoc: 'Jun 10, 2026', avgAgeDays: 68,  staleCount: 2 },
        { vpu: 'SD1',  latestDoc: 'Feb 10, 2026', avgAgeDays: 186, staleCount: 7 },
      ],
      feedback: { positivePct: 68, vsPreiousPct:  3, totalCount:  42, negativeCount: 13, topIssue: 'Unclear Answer',       topIssueCount:  4 },
    },
    'Policy Architecture': {
      description: 'ADB policies, guidelines, administrative orders, and instructions governing institutional operations, decision-making frameworks, and staff conduct.',
      fileCount: 380, healthScore: 85, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 83, weight: 30 },
        { label: 'Feedback Positivity', score: 87, weight: 25 },
        { label: 'Retrieval Rate',      score: 88, weight: 25 },
        { label: 'Content Freshness',   score: 82, weight: 20 },
      ],
      trendPoints: [{ label: 'Apr', value: 22 }, { label: 'May', value: 30 }, { label: 'Jun', value: 38 }, { label: 'Jul', value: 28 }, { label: 'Aug', value: 10 }],
      sourceUtil: { cited: 52, referenced: 28, notRetrieved: 20, totalFiles: 380 },
      deptContribs: [
        { vpu: 'OGC',  name: 'Office of Gen. Counsel', resources: 210, pct: 55, lastAdded: 'Jul 7, 2026' },
        { vpu: 'SPD',  name: 'Strategy & Policy Dept.', resources: 120, pct: 32, lastAdded: 'Jun 10, 2026' },
        { vpu: 'OSEC', name: 'Office of the Secretary', resources: 50,  pct: 13, lastAdded: 'Apr 22, 2026' },
      ],
      contentFreshness: [
        { vpu: 'OGC',  latestDoc: 'Jul 7, 2026',  avgAgeDays: 40,  staleCount: 0 },
        { vpu: 'SPD',  latestDoc: 'Jun 10, 2026', avgAgeDays: 68,  staleCount: 1 },
        { vpu: 'OSEC', latestDoc: 'Apr 22, 2026', avgAgeDays: 116, staleCount: 3 },
      ],
      feedback: { positivePct: 87, vsPreiousPct:  5, totalCount: 215, negativeCount: 28, topIssue: 'Incorrect Sources',   topIssueCount: 10 },
    },
    'Board Paper Library': {
      description: 'Board documents dating back to 1966 including board papers, official records, resolutions, and governance documentation of the Board of Directors.',
      fileCount: 8240, healthScore: 79, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 76, weight: 30 },
        { label: 'Feedback Positivity', score: 80, weight: 25 },
        { label: 'Retrieval Rate',      score: 82, weight: 25 },
        { label: 'Content Freshness',   score: 77, weight: 20 },
      ],
      trendPoints: [{ label: 'Apr', value: 45 }, { label: 'May', value: 60 }, { label: 'Jun', value: 72 }, { label: 'Jul', value: 55 }, { label: 'Aug', value: 18 }],
      sourceUtil: { cited: 48, referenced: 29, notRetrieved: 23, totalFiles: 8240 },
      deptContribs: [
        { vpu: 'OSEC', name: 'Office of the Secretary', resources: 6200, pct: 75, lastAdded: 'Jun 15, 2026' },
        { vpu: 'OGC',  name: 'Office of Gen. Counsel',  resources: 1400, pct: 17, lastAdded: 'May 20, 2026' },
        { vpu: 'SPD',  name: 'Strategy & Policy Dept.', resources: 640,  pct: 8,  lastAdded: 'Mar 5, 2026' },
      ],
      contentFreshness: [
        { vpu: 'OSEC', latestDoc: 'Jun 15, 2026', avgAgeDays: 63,  staleCount: 0 },
        { vpu: 'OGC',  latestDoc: 'May 20, 2026', avgAgeDays: 89,  staleCount: 2 },
        { vpu: 'SPD',  latestDoc: 'Mar 5, 2026',  avgAgeDays: 173, staleCount: 8 },
      ],
      feedback: { positivePct: 69, vsPreiousPct: -2, totalCount: 184, negativeCount: 57, topIssue: 'Incorrect Sources',   topIssueCount: 28 },
    },
    'SEC-IAU Guidelines': {
      description: 'Board document preparation guidelines, disclosure standards, and institutional accountability framework procedures for ADB governance.',
      fileCount: 124, healthScore: 76, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 73, weight: 30 },
        { label: 'Feedback Positivity', score: 78, weight: 25 },
        { label: 'Retrieval Rate',      score: 80, weight: 25 },
        { label: 'Content Freshness',   score: 72, weight: 20 },
      ],
      trendPoints: [{ label: 'Mar', value: 12 }, { label: 'Apr', value: 18 }, { label: 'May', value: 24 }, { label: 'Jun', value: 16 }, { label: 'Aug', value: 6 }],
      sourceUtil: { cited: 44, referenced: 30, notRetrieved: 26, totalFiles: 124 },
      deptContribs: [
        { vpu: 'OSEC', name: 'Office of the Secretary', resources: 90, pct: 73, lastAdded: 'Jun 1, 2026' },
        { vpu: 'IAU',  name: 'Internal Audit Unit',     resources: 34, pct: 27, lastAdded: 'Apr 15, 2026' },
      ],
      contentFreshness: [
        { vpu: 'OSEC', latestDoc: 'Jun 1, 2026',  avgAgeDays: 77,  staleCount: 1 },
        { vpu: 'IAU',  latestDoc: 'Apr 15, 2026', avgAgeDays: 122, staleCount: 4 },
      ],
      feedback: { positivePct: 78, vsPreiousPct:  3, totalCount:  76, negativeCount: 17, topIssue: 'Incorrect Sources',   topIssueCount:  6 },
    },
    'SEC-IAU Final Documents': {
      description: 'Approved Board papers and official records including final decisions, resolutions, and institutional governance documents from the Board of Directors.',
      fileCount: 2150, healthScore: 68, healthGrade: 'Fair',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 65, weight: 30 },
        { label: 'Feedback Positivity', score: 70, weight: 25 },
        { label: 'Retrieval Rate',      score: 72, weight: 25 },
        { label: 'Content Freshness',   score: 64, weight: 20 },
      ],
      trendPoints: [{ label: 'Feb', value: 28 }, { label: 'Mar', value: 35 }, { label: 'Apr', value: 22 }, { label: 'May', value: 15 }, { label: 'Jun', value: 8 }],
      sourceUtil: { cited: 35, referenced: 33, notRetrieved: 32, totalFiles: 2150 },
      deptContribs: [
        { vpu: 'OSEC', name: 'Office of the Secretary', resources: 1800, pct: 84, lastAdded: 'May 20, 2026' },
        { vpu: 'IAU',  name: 'Internal Audit Unit',     resources: 350,  pct: 16, lastAdded: 'Feb 28, 2026' },
      ],
      contentFreshness: [
        { vpu: 'OSEC', latestDoc: 'May 20, 2026', avgAgeDays: 89,  staleCount: 3 },
        { vpu: 'IAU',  latestDoc: 'Feb 28, 2026', avgAgeDays: 168, staleCount: 10 },
      ],
      feedback: { positivePct: 70, vsPreiousPct:  1, totalCount:  89, negativeCount: 27, topIssue: 'Unclear Answer',       topIssueCount:  8 },
    },
    'Travel Concur': {
      description: 'Travel policies, approval workflows, expense claims, per diem rates by country, and Concur system guides for official mission travel.',
      fileCount: 95, healthScore: 88, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 86, weight: 30 },
        { label: 'Feedback Positivity', score: 90, weight: 25 },
        { label: 'Retrieval Rate',      score: 91, weight: 25 },
        { label: 'Content Freshness',   score: 84, weight: 20 },
      ],
      trendPoints: [{ label: 'Apr', value: 12 }, { label: 'May', value: 18 }, { label: 'Jun', value: 24 }, { label: 'Jul', value: 20 }, { label: 'Aug', value: 8 }],
      sourceUtil: { cited: 58, referenced: 25, notRetrieved: 17, totalFiles: 95 },
      deptContribs: [
        { vpu: 'BPBM', name: 'Budget & Management', resources: 72, pct: 76, lastAdded: 'Jul 10, 2026' },
        { vpu: 'CSD',  name: 'Corporate Services',  resources: 23, pct: 24, lastAdded: 'Jun 5, 2026' },
      ],
      contentFreshness: [
        { vpu: 'BPBM', latestDoc: 'Jul 10, 2026', avgAgeDays: 38, staleCount: 0 },
        { vpu: 'CSD',  latestDoc: 'Jun 5, 2026',  avgAgeDays: 73, staleCount: 1 },
      ],
      feedback: { positivePct: 92, vsPreiousPct:  6, totalCount: 143, negativeCount: 11, topIssue: 'Incorrect Sources',   topIssueCount:  4 },
    },
    'CSD Guidelines & Manuals': {
      description: 'Corporate services policies and procedures covering facilities management, administrative support, procurement of corporate goods, and institutional services.',
      fileCount: 212, healthScore: 80, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 77, weight: 30 },
        { label: 'Feedback Positivity', score: 82, weight: 25 },
        { label: 'Retrieval Rate',      score: 83, weight: 25 },
        { label: 'Content Freshness',   score: 78, weight: 20 },
      ],
      trendPoints: [{ label: 'Mar', value: 15 }, { label: 'Apr', value: 22 }, { label: 'May', value: 28 }, { label: 'Jun', value: 20 }, { label: 'Aug', value: 7 }],
      sourceUtil: { cited: 48, referenced: 30, notRetrieved: 22, totalFiles: 212 },
      deptContribs: [
        { vpu: 'CSD', name: 'Corporate Services Dept.', resources: 160, pct: 75, lastAdded: 'Jun 25, 2026' },
        { vpu: 'OAD', name: 'Office of Admin Services', resources: 52,  pct: 25, lastAdded: 'Mar 18, 2026' },
      ],
      contentFreshness: [
        { vpu: 'CSD', latestDoc: 'Jun 25, 2026', avgAgeDays: 53,  staleCount: 1 },
        { vpu: 'OAD', latestDoc: 'Mar 18, 2026', avgAgeDays: 150, staleCount: 5 },
      ],
      feedback: { positivePct: 84, vsPreiousPct:  3, totalCount: 118, negativeCount: 19, topIssue: 'Irrelevant Response', topIssueCount:  7 },
    },
    'Branding Toolkit': {
      description: 'Visual identity guidelines, document templates, signage standards, and brand assets for all ADB publications, digital assets, and communications.',
      fileCount: 145, healthScore: 83, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 80, weight: 30 },
        { label: 'Feedback Positivity', score: 86, weight: 25 },
        { label: 'Retrieval Rate',      score: 86, weight: 25 },
        { label: 'Content Freshness',   score: 79, weight: 20 },
      ],
      trendPoints: [{ label: 'Mar', value: 8 }, { label: 'Apr', value: 12 }, { label: 'May', value: 16 }, { label: 'Jun', value: 14 }, { label: 'Aug', value: 5 }],
      sourceUtil: { cited: 52, referenced: 28, notRetrieved: 20, totalFiles: 145 },
      deptContribs: [
        { vpu: 'DER', name: 'Dept. of External Relations', resources: 110, pct: 76, lastAdded: 'Jun 5, 2026' },
        { vpu: 'ITD', name: 'IT Department',                resources: 35,  pct: 24, lastAdded: 'Apr 20, 2026' },
      ],
      contentFreshness: [
        { vpu: 'DER', latestDoc: 'Jun 5, 2026',  avgAgeDays: 73,  staleCount: 0 },
        { vpu: 'ITD', latestDoc: 'Apr 20, 2026', avgAgeDays: 118, staleCount: 3 },
      ],
      feedback: { positivePct: 88, vsPreiousPct:  4, totalCount:  67, negativeCount:  8, topIssue: 'Unclear Answer',       topIssueCount:  3 },
    },
    'ITD Sharepoint': {
      description: 'IT services documentation, cybersecurity policies, digital tools guidance, and technology resources for ADB staff and approved contractors.',
      fileCount: 560, healthScore: 72, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 68, weight: 30 },
        { label: 'Feedback Positivity', score: 74, weight: 25 },
        { label: 'Retrieval Rate',      score: 76, weight: 25 },
        { label: 'Content Freshness',   score: 70, weight: 20 },
      ],
      trendPoints: [{ label: 'Feb', value: 20 }, { label: 'Mar', value: 28 }, { label: 'Apr', value: 18 }, { label: 'May', value: 12 }, { label: 'Jun', value: 8 }],
      sourceUtil: { cited: 38, referenced: 35, notRetrieved: 27, totalFiles: 560 },
      deptContribs: [
        { vpu: 'ITD',  name: 'IT Department',    resources: 450, pct: 80, lastAdded: 'May 15, 2026' },
        { vpu: 'BPBM', name: 'Budget & Mgmt.',   resources: 110, pct: 20, lastAdded: 'Jan 30, 2026' },
      ],
      contentFreshness: [
        { vpu: 'ITD',  latestDoc: 'May 15, 2026', avgAgeDays: 94,  staleCount: 4 },
        { vpu: 'BPBM', latestDoc: 'Jan 30, 2026', avgAgeDays: 197, staleCount: 12 },
      ],
      feedback: { positivePct: 74, vsPreiousPct:  2, totalCount:  95, negativeCount: 25, topIssue: 'Incorrect Sources',   topIssueCount:  9 },
    },
    'SovOps M1-3': {
      description: 'Project planning, preparation, and approval documentation covering the first three phases of the sovereign operations project lifecycle.',
      fileCount: 890, healthScore: 90, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 88, weight: 30 },
        { label: 'Feedback Positivity', score: 92, weight: 25 },
        { label: 'Retrieval Rate',      score: 93, weight: 25 },
        { label: 'Content Freshness',   score: 86, weight: 20 },
      ],
      trendPoints: [{ label: 'Apr', value: 35 }, { label: 'May', value: 48 }, { label: 'Jun', value: 60 }, { label: 'Jul', value: 52 }, { label: 'Aug', value: 18 }],
      sourceUtil: { cited: 62, referenced: 24, notRetrieved: 14, totalFiles: 890 },
      deptContribs: [
        { vpu: 'CWRD', name: 'Central & West Asia',  resources: 320, pct: 36, lastAdded: 'Jul 12, 2026' },
        { vpu: 'SARD', name: 'South Asia Dept.',     resources: 280, pct: 31, lastAdded: 'Jun 28, 2026' },
        { vpu: 'EARD', name: 'East Asia Dept.',      resources: 290, pct: 33, lastAdded: 'May 15, 2026' },
      ],
      contentFreshness: [
        { vpu: 'CWRD', latestDoc: 'Jul 12, 2026', avgAgeDays: 36, staleCount: 0 },
        { vpu: 'SARD', latestDoc: 'Jun 28, 2026', avgAgeDays: 50, staleCount: 0 },
        { vpu: 'EARD', latestDoc: 'May 15, 2026', avgAgeDays: 94, staleCount: 2 },
      ],
      feedback: { positivePct: 92, vsPreiousPct:  4, totalCount:  43, negativeCount:  4, topIssue: 'Incorrect Sources',   topIssueCount:  4 },
    },
    'SovOps M4-6': {
      description: 'Project implementation, financial management, and portfolio monitoring documentation for phases 4 through 6 of sovereign operations.',
      fileCount: 780, healthScore: 86, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 84, weight: 30 },
        { label: 'Feedback Positivity', score: 88, weight: 25 },
        { label: 'Retrieval Rate',      score: 90, weight: 25 },
        { label: 'Content Freshness',   score: 82, weight: 20 },
      ],
      trendPoints: [{ label: 'Apr', value: 30 }, { label: 'May', value: 42 }, { label: 'Jun', value: 55 }, { label: 'Jul', value: 45 }, { label: 'Aug', value: 15 }],
      sourceUtil: { cited: 56, referenced: 28, notRetrieved: 16, totalFiles: 780 },
      deptContribs: [
        { vpu: 'CWRD', name: 'Central & West Asia', resources: 280, pct: 36, lastAdded: 'Jul 5, 2026' },
        { vpu: 'SARD', name: 'South Asia Dept.',    resources: 240, pct: 31, lastAdded: 'Jun 20, 2026' },
        { vpu: 'EARD', name: 'East Asia Dept.',     resources: 260, pct: 33, lastAdded: 'May 8, 2026' },
      ],
      contentFreshness: [
        { vpu: 'CWRD', latestDoc: 'Jul 5, 2026',  avgAgeDays: 43,  staleCount: 0 },
        { vpu: 'SARD', latestDoc: 'Jun 20, 2026', avgAgeDays: 58,  staleCount: 1 },
        { vpu: 'EARD', latestDoc: 'May 8, 2026',  avgAgeDays: 100, staleCount: 2 },
      ],
      feedback: { positivePct: 88, vsPreiousPct:  3, totalCount:  55, negativeCount:  7, topIssue: 'Irrelevant Response', topIssueCount:  3 },
    },
    'TORs (Consultants)': {
      description: 'Terms of reference templates and completed TORs for individual and firm consultants across all departments, covering all project types and modalities.',
      fileCount: 340, healthScore: 73, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 70, weight: 30 },
        { label: 'Feedback Positivity', score: 75, weight: 25 },
        { label: 'Retrieval Rate',      score: 76, weight: 25 },
        { label: 'Content Freshness',   score: 70, weight: 20 },
      ],
      trendPoints: [{ label: 'Mar', value: 18 }, { label: 'Apr', value: 24 }, { label: 'May', value: 30 }, { label: 'Jun', value: 20 }, { label: 'Aug', value: 8 }],
      sourceUtil: { cited: 42, referenced: 32, notRetrieved: 26, totalFiles: 340 },
      deptContribs: [
        { vpu: 'CWRD', name: 'Central & West Asia', resources: 110, pct: 32, lastAdded: 'Jun 18, 2026' },
        { vpu: 'SARD', name: 'South Asia Dept.',    resources: 95,  pct: 28, lastAdded: 'May 22, 2026' },
        { vpu: 'EARD', name: 'East Asia Dept.',     resources: 135, pct: 40, lastAdded: 'Apr 10, 2026' },
      ],
      contentFreshness: [
        { vpu: 'CWRD', latestDoc: 'Jun 18, 2026', avgAgeDays: 60,  staleCount: 2 },
        { vpu: 'SARD', latestDoc: 'May 22, 2026', avgAgeDays: 87,  staleCount: 3 },
        { vpu: 'EARD', latestDoc: 'Apr 10, 2026', avgAgeDays: 128, staleCount: 5 },
      ],
      feedback: { positivePct: 75, vsPreiousPct:  2, totalCount:  82, negativeCount: 21, topIssue: 'Incorrect Sources',   topIssueCount:  8 },
    },
    'Country Fact Sheets': {
      description: 'ADB engagement and investment summaries by member country including portfolio statistics, sector priorities, and development context for all DMCs.',
      fileCount: 68, healthScore: 78, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 75, weight: 30 },
        { label: 'Feedback Positivity', score: 80, weight: 25 },
        { label: 'Retrieval Rate',      score: 82, weight: 25 },
        { label: 'Content Freshness',   score: 74, weight: 20 },
      ],
      trendPoints: [{ label: 'Jan', value: 6 }, { label: 'Feb', value: 8 }, { label: 'Mar', value: 10 }, { label: 'May', value: 12 }, { label: 'Jul', value: 5 }],
      sourceUtil: { cited: 46, referenced: 30, notRetrieved: 24, totalFiles: 68 },
      deptContribs: [
        { vpu: 'SPD', name: 'Strategy & Policy Dept.', resources: 48, pct: 71, lastAdded: 'May 30, 2026' },
        { vpu: 'DER', name: 'Dept. of External Rel.',  resources: 20, pct: 29, lastAdded: 'Mar 12, 2026' },
      ],
      contentFreshness: [
        { vpu: 'SPD', latestDoc: 'May 30, 2026', avgAgeDays: 79,  staleCount: 1 },
        { vpu: 'DER', latestDoc: 'Mar 12, 2026', avgAgeDays: 157, staleCount: 5 },
      ],
      feedback: { positivePct: 80, vsPreiousPct:  3, totalCount:  54, negativeCount: 11, topIssue: 'Unclear Answer',       topIssueCount:  4 },
    },
    'AskHR KB Articles': {
      description: 'HR self-service knowledge base articles covering staff benefits, leave policies, performance management, and employment procedures sourced from ServiceNow.',
      fileCount: 510, healthScore: 83, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 80, weight: 30 },
        { label: 'Feedback Positivity', score: 86, weight: 25 },
        { label: 'Retrieval Rate',      score: 85, weight: 25 },
        { label: 'Content Freshness',   score: 80, weight: 20 },
      ],
      trendPoints: [{ label: 'Apr', value: 28 }, { label: 'May', value: 38 }, { label: 'Jun', value: 48 }, { label: 'Jul', value: 40 }, { label: 'Aug', value: 14 }],
      sourceUtil: { cited: 54, referenced: 28, notRetrieved: 18, totalFiles: 510 },
      deptContribs: [
        { vpu: 'BPHR', name: 'Human Resources Dept.', resources: 420, pct: 82, lastAdded: 'Jul 8, 2026' },
        { vpu: 'OGC',  name: 'Office of Gen. Counsel', resources: 90,  pct: 18, lastAdded: 'May 20, 2026' },
      ],
      contentFreshness: [
        { vpu: 'BPHR', latestDoc: 'Jul 8, 2026',  avgAgeDays: 40, staleCount: 0 },
        { vpu: 'OGC',  latestDoc: 'May 20, 2026', avgAgeDays: 89, staleCount: 2 },
      ],
      feedback: { positivePct: 86, vsPreiousPct:  5, totalCount: 178, negativeCount: 25, topIssue: 'Incorrect Sources',   topIssueCount:  9 },
    },
    'AskIT KB Articles': {
      description: 'IT troubleshooting guides and how-to articles for common technical issues, software usage, digital workspace tools, and IT support procedures.',
      fileCount: 380, healthScore: 79, healthGrade: 'Good',
      healthBreakdown: [
        { label: 'Knowledge Coverage',  score: 76, weight: 30 },
        { label: 'Feedback Positivity', score: 82, weight: 25 },
        { label: 'Retrieval Rate',      score: 82, weight: 25 },
        { label: 'Content Freshness',   score: 76, weight: 20 },
      ],
      trendPoints: [{ label: 'Apr', value: 22 }, { label: 'May', value: 30 }, { label: 'Jun', value: 40 }, { label: 'Jul', value: 32 }, { label: 'Aug', value: 11 }],
      sourceUtil: { cited: 50, referenced: 29, notRetrieved: 21, totalFiles: 380 },
      deptContribs: [
        { vpu: 'ITD', name: 'IT Department',           resources: 350, pct: 92, lastAdded: 'Jul 2, 2026' },
        { vpu: 'OAD', name: 'Office of Admin Services', resources: 30,  pct: 8,  lastAdded: 'Apr 15, 2026' },
      ],
      contentFreshness: [
        { vpu: 'ITD', latestDoc: 'Jul 2, 2026',  avgAgeDays: 46,  staleCount: 0 },
        { vpu: 'OAD', latestDoc: 'Apr 15, 2026', avgAgeDays: 124, staleCount: 4 },
      ],
      feedback: { positivePct: 82, vsPreiousPct:  4, totalCount: 156, negativeCount: 28, topIssue: 'Unclear Answer',       topIssueCount: 10 },
    },
  };

  // Drawer state
  readonly selectedCollection = signal<RegistryRow | null>(null);
  readonly drawerOpen = computed(() => this.selectedCollection() !== null);
  drawerTab = signal<'overview' | 'contributions'>('overview');

  openCollection(r: RegistryRow) {
    this.drawerTab.set('overview');
    this.selectedDonutSeg.set(null);
    this.hoveredDonutSeg.set(null);
    this.selectedCollection.set(r);
  }
  closeCollection() {
    this.selectedCollection.set(null);
    this.selectedDonutSeg.set(null);
    this.hoveredDonutSeg.set(null);
  }

  // ── Drawer resize ──────────────────────────────────────────────────────────
  private static readonly DRAWER_MIN = 380;
  private static readonly DRAWER_MAX = 0.90; // fraction of viewport width
  readonly drawerWidth = signal(600);

  onResizerMouseDown(e: MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = this.drawerWidth();

    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      const max = Math.round(window.innerWidth * Collections.DRAWER_MAX);
      const next = Math.min(max, Math.max(Collections.DRAWER_MIN, startW + delta));
      this.drawerWidth.set(next);
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

  readonly drawerData = computed(() => {
    const r = this.selectedCollection();
    return r ? (this.collectionDetails[r.name] ?? null) : null;
  });

  // Trend summary footer
  readonly drawerTrendSummary = computed(() => {
    const d = this.drawerData();
    if (!d || d.trendPoints.length < 2) return null;
    const pts = d.trendPoints;
    const mid  = Math.floor(pts.length / 2);
    const older = pts.slice(0, mid).reduce((s, p) => s + p.value, 0) || 1;
    const newer = pts.slice(mid).reduce((s, p) => s + p.value, 0);
    const pct   = Math.round((newer - older) / older * 100);
    return { pct: Math.abs(pct), up: pct >= 0 };
  });

  // Legend file counts
  readonly drawerCitedFiles      = computed(() => { const d = this.drawerData(); return d ? Math.round(d.sourceUtil.cited       / 100 * d.fileCount) : 0; });
  readonly drawerReferencedFiles = computed(() => { const d = this.drawerData(); return d ? Math.round(d.sourceUtil.referenced   / 100 * d.fileCount) : 0; });
  readonly drawerNotRetrFiles    = computed(() => { const d = this.drawerData(); return d ? Math.round(d.sourceUtil.notRetrieved / 100 * d.fileCount) : 0; });

  // Donut SVG computation
  private static readonly DONUT_CIRC = 251.327;
  readonly donutCirc = Collections.DONUT_CIRC;
  readonly drawerDonutCited      = computed(() => { const d = this.drawerData(); return d ? (d.sourceUtil.cited / 100) * this.donutCirc : 0; });
  readonly drawerDonutReferenced = computed(() => { const d = this.drawerData(); return d ? (d.sourceUtil.referenced / 100) * this.donutCirc : 0; });
  readonly drawerDonutNotRetrieved = computed(() => { const d = this.drawerData(); return d ? (d.sourceUtil.notRetrieved / 100) * this.donutCirc : 0; });
  readonly drawerDonutOffsetRef = computed(() => -this.drawerDonutCited());
  readonly drawerDonutOffsetNot = computed(() => -(this.drawerDonutCited() + this.drawerDonutReferenced()));

  readonly drawerFeedback = computed(() => {
    const d = this.drawerData();
    return d?.feedback ?? null;
  });

  // Trend bar SVG computation
  readonly trendChartW = 240;
  readonly trendChartH = 100;
  private readonly trendPadL = 10;
  private readonly trendPadR = 10;
  private readonly trendPadT = 14;
  private readonly trendPadB = 22;

  readonly drawerTrendBars = computed(() => {
    const d = this.drawerData();
    if (!d) return [];
    const pts = d.trendPoints;
    const maxVal = Math.max(...pts.map(p => p.value), 1);
    const usableW = this.trendChartW - this.trendPadL - this.trendPadR;
    const usableH = this.trendChartH - this.trendPadT - this.trendPadB;
    const slotW = usableW / pts.length;
    const barW = Math.max(8, slotW * 0.55);
    const bottom = this.trendPadT + usableH;
    return pts.map((pt, i) => {
      const cx = this.trendPadL + slotW * i + slotW / 2;
      const barH = pt.value === 0 ? 0 : Math.max(4, (pt.value / maxVal) * usableH);
      return { label: pt.label, value: pt.value, x: cx - barW / 2, y: bottom - barH, width: barW, height: barH, cx, labelY: this.trendChartH - 4 };
    });
  });

  // ── Donut segment hover / click ───────────────────────────────────────────
  readonly hoveredDonutSeg  = signal<SourceUtilSegment | null>(null);
  readonly selectedDonutSeg = signal<SourceUtilSegment | null>(null);

  private static readonly SEG_LABELS: Record<SourceUtilSegment, string> = {
    'cited': 'Cited', 'referenced': 'Referenced', 'not-retrieved': 'Not Retrieved',
  };
  private static readonly SEG_COLORS: Record<SourceUtilSegment, string> = {
    'cited': '#34D399', 'referenced': '#0EA5E9', 'not-retrieved': '#F59E0B',
  };

  readonly donutTooltipData = computed(() => {
    const seg = this.hoveredDonutSeg();
    const d   = this.drawerData();
    if (!seg || !d) return null;
    const pct   = seg === 'cited' ? d.sourceUtil.cited : seg === 'referenced' ? d.sourceUtil.referenced : d.sourceUtil.notRetrieved;
    const files = Math.round(pct / 100 * d.fileCount);
    return { label: Collections.SEG_LABELS[seg], color: Collections.SEG_COLORS[seg], pct, files };
  });

  readonly segmentCenterPct = computed(() => {
    const seg = this.hoveredDonutSeg();
    const d   = this.drawerData();
    if (!seg || !d) return null;
    return seg === 'cited' ? d.sourceUtil.cited : seg === 'referenced' ? d.sourceUtil.referenced : d.sourceUtil.notRetrieved;
  });

  readonly segmentCenterLabel = computed(() => {
    const seg = this.hoveredDonutSeg();
    return seg ? Collections.SEG_LABELS[seg] : null;
  });

  readonly drawerSegmentLabel = computed(() => {
    const seg = this.selectedDonutSeg();
    return seg ? Collections.SEG_LABELS[seg] : '';
  });

  readonly drawerSegmentColor = computed(() => {
    const seg = this.selectedDonutSeg();
    return seg ? Collections.SEG_COLORS[seg] : '';
  });

  readonly drawerSegmentFileCount = computed(() => {
    const seg = this.selectedDonutSeg();
    const d   = this.drawerData();
    if (!seg || !d) return 0;
    const pct = seg === 'cited' ? d.sourceUtil.cited : seg === 'referenced' ? d.sourceUtil.referenced : d.sourceUtil.notRetrieved;
    return Math.round(pct / 100 * d.fileCount);
  });

  readonly drawerSegmentFiles = computed((): FileRow[] => {
    const seg = this.selectedDonutSeg();
    const d   = this.drawerData();
    const col = this.selectedCollection();
    if (!seg || !d || !col) return [];
    return this.generateFileRows(col.name, seg, d);
  });

  onSegmentHover(seg: SourceUtilSegment) { this.hoveredDonutSeg.set(seg); }
  onSegmentLeave() { this.hoveredDonutSeg.set(null); }
  onSegmentClick(seg: SourceUtilSegment) {
    this.selectedDonutSeg.set(seg);
    this.hoveredDonutSeg.set(null);
  }
  backFromSegment() { this.selectedDonutSeg.set(null); }

  private generateFileRows(collName: string, seg: SourceUtilSegment, dd: CollectionDrawerData): FileRow[] {
    let h = 0;
    for (const c of collName) h = ((h * 31 + c.charCodeAt(0)) >>> 0);

    const pct   = seg === 'cited' ? dd.sourceUtil.cited : seg === 'referenced' ? dd.sourceUtil.referenced : dd.sourceUtil.notRetrieved;
    const total = Math.round(pct / 100 * dd.fileCount);
    const n     = Math.min(total, 15);

    const exts   = ['pdf', 'docx', 'xlsx', 'pptx'];
    const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const base   = collName.replace(/[()–\-&]/g, '').replace(/\s+/g, '_');

    const templates = [
      (i: number) => `${base}_Document_${String(i + 1).padStart(3, '0')}`,
      (i: number) => `Guidelines_${base}_v${i + 1}`,
      (i: number) => `Report_Q${(i % 4) + 1}_2026_${base}`,
      (i: number) => `${base}_Procedure_${i + 1}`,
      (i: number) => `Template_${base}_Rev${i + 1}`,
      (i: number) => `${base}_Reference_${String(i + 1).padStart(2, '0')}`,
    ];

    return Array.from({ length: n }, (_, i) => {
      const r   = ((h * (i + 7) * 6364136 + 1442695040) >>> 0);
      const ext = exts[r % exts.length];
      const tmpl = templates[(r >> 3) % templates.length];
      const kb  = 50 + (r % 4950);
      const mon = months[(r >> 4) % months.length];
      const day = 1 + ((r >> 6) % 27);
      return {
        name:         `${tmpl(i)}.${ext}`,
        type:         ext.toUpperCase(),
        size:         kb >= 1000 ? `${(kb / 1000).toFixed(1)} MB` : `${kb} KB`,
        lastAccessed: `${mon} ${day}, 2026`,
      };
    });
  }
}
