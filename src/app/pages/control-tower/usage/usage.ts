import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TablerIconComponent } from '@tabler/icons-angular';
import { REGION_GROUPS, VPU_GROUPS } from '../shared/hier-filter/hier-filter-catalog';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';

type UsageTab = 'intent' | 'modules';
type KptTab   = 'knowledge' | 'people' | 'unclassified';

interface TreemapTopic {
  id: string;
  name: string;
  pct: number;
  count: number;
  color: string;
  trending?: boolean;
}

interface TopService {
  rank: number;
  name: string;
  clicks: number;
  pct: number;
  uniqueUsers?: number;
  module: string;
  trend: 'up' | 'down' | 'stable';
  trending?: boolean;
}

interface StarredService { name: string; stars: number; }

interface EngagementRow {
  service: string;
  module: string;
  lastAccessed: string;
  status: 'active' | 'low' | 'stale';
}

interface FrequentModule {
  name: string;
  clicks: number;
  pct: number;
}

interface ServiceByUniqueUsers {
  rank: number;
  name: string;
  uniqueUsers: number;
  pct: number;
}

interface ServiceBreakdown {
  name: string;
  sharePct: number;
  color: string;
}

interface TopicDrilldownRow {
  prompt: string;
  response: string;
  user: string;
  dept: string;
  date: string;
  feedback: 'positive' | 'negative' | null;
}

@Component({
  selector: 'app-usage',
  imports: [DecimalPipe, TablerIconComponent, DateRangeFilter],
  templateUrl: './usage.html',
  styleUrl: './usage.css',
})
export class Usage {
  readonly regionGroups = REGION_GROUPS;
  readonly vpuGroups    = VPU_GROUPS;

  readonly activeTab = signal<UsageTab>('intent');

  constructor() {
    inject(ActivatedRoute).queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        const tab = params.get('tab') as UsageTab;
        if (tab === 'intent' || tab === 'modules') this.activeTab.set(tab);
      });
  }

  // ===== Intent tab =====
  readonly intentKpis = [
    { title: 'Total Prompts',           value: '9,608', sub: 'Total prompts submitted in this period' },
    { title: 'Knowledge Prompts',       value: '3,635', sub: 'LLM-classified under Knowledge topics' },
    { title: 'People Prompts',          value: '4,513', sub: 'LLM-classified under People topics' },
    { title: 'Unclassified Intent',     value: '653',   sub: 'Prompts where intent could not be classified' },
  ];

  readonly kptTabDefs = [
    { id: 'knowledge'    as KptTab, label: 'Knowledge' },
    { id: 'people'       as KptTab, label: 'People' },
    { id: 'unclassified' as KptTab, label: 'Unclassified' },
  ];
  readonly kptTab = signal<KptTab>('knowledge');

  private readonly knowledgeByVolume: TreemapTopic[][] = [
    [
      { id: 'news',  name: 'News & Events',            pct: 21, count: 765, color: '#2c8aff' },
      { id: 'acro',  name: 'Acronyms',                 pct: 20, count: 709, color: '#a855f7' },
      { id: 'gen',   name: 'General Queries',          pct: 19, count: 689, color: '#5d6b7e' },
    ],
    [
      { id: 'sect',  name: 'ADB Sectoral Priorities',  pct: 19, count: 681, color: '#22d3ee', trending: true },
      { id: 'admin', name: 'Admin & Employee Support', pct: 12, count: 432, color: '#14b8a6' },
      { id: 'reg',   name: 'Regional Queries',         pct: 3,  count: 120, color: '#ec4899' },
      { id: 'tmpl',  name: 'Templates & Documents',    pct: 2,  count: 82,  color: '#f59e0b' },
      { id: 'pol',   name: 'Policies & Guidelines',    pct: 2,  count: 75,  color: '#34d399' },
    ],
  ];
  private readonly peopleByVolume: TreemapTopic[][] = [
    [{ id: 'contact',  name: 'Contact Information',   pct: 57, count: 579, color: '#a855f7' }],
    [
      { id: 'orgchart', name: 'Organisational Chart', pct: 22, count: 226, color: '#c4b5fd' },
      { id: 'roles',    name: 'Roles & Expertise',    pct: 22, count: 224, color: '#22d3ee' },
    ],
  ];
  private readonly unclassifiedByVolume: TreemapTopic[][] = [
    [
      { id: 'ambig', name: 'Ambiguous Query', pct: 36, count: 235, color: '#94a3b8' },
      { id: 'vague', name: 'Too Vague',       pct: 27, count: 176, color: '#78716c' },
    ],
    [
      { id: 'oos',   name: 'Out of Scope',    pct: 23, count: 150, color: '#b45309' },
      { id: 'mixed', name: 'Mixed Intent',    pct: 14, count: 92,  color: '#7c3aed' },
    ],
  ];

  readonly activeTreemap = computed(() => {
    const tab = this.kptTab();
    if (tab === 'knowledge') return this.knowledgeByVolume;
    if (tab === 'people')    return this.peopleByVolume;
    return this.unclassifiedByVolume;
  });

  readonly rowFlex = (row: TreemapTopic[]) => row.reduce((s, t) => s + t.pct, 0);

  // ===== Modules tab =====
  readonly totalModuleClicks      = { value: '14,391', delta: '+2%',  sub: 'across all intranet modules' };
  readonly uniqueServicesAccessed = { value: '6',                      sub: 'of 12 available services' };
  readonly mostUsedModule         = { value: 'People Finder',          sub: '28% of module clicks' };
  readonly zeroClickServices      = { value: '3',                      sub: 'services with no clicks this period' };

  readonly topServices: TopService[] = [
    { rank: 1, name: 'IT Helpdesk Ticket',   clicks: 1506, pct: 29, uniqueUsers: undefined, module: 'IT Support', trend: 'down' },
    { rank: 2, name: 'Policy Search',        clicks: 1411, pct: 27, uniqueUsers: 785,       module: 'Knowledge',  trend: 'stable' },
    { rank: 3, name: 'Expense Claim',        clicks:  683, pct: 13, uniqueUsers: 613,       module: 'Finance',    trend: 'stable' },
    { rank: 4, name: 'Org Chart Lookup',     clicks:  583, pct: 11, uniqueUsers: 773,       module: 'People',     trend: 'up', trending: true },
    { rank: 5, name: 'Travel Booking',       clicks:  528, pct: 10, uniqueUsers: 82,        module: 'Travel',     trend: 'up' },
    { rank: 6, name: 'Meeting Room Booking', clicks:  458, pct:  9, uniqueUsers: 575,       module: 'Admin',      trend: 'stable' },
  ];

  readonly frequentlyUsedModules: FrequentModule[] = [
    { name: 'People Finder',           clicks: 4023, pct: 28 },
    { name: 'SharePoint Search',       clicks: 3365, pct: 23 },
    { name: 'HR Self-Service',         clicks: 3184, pct: 22 },
    { name: 'Quick Links',             clicks: 1831, pct: 13 },
    { name: 'M&E Portal',              clicks: 1428, pct: 10 },
    { name: 'Enterprise AI Assistant', clicks:  560, pct:  4 },
  ];

  readonly topServicesByUniqueUsers: ServiceByUniqueUsers[] = [
    { rank: 1, name: 'Meeting Room Booking', uniqueUsers: 1579, pct: 100 },
    { rank: 2, name: 'Payslip Download',     uniqueUsers: 1312, pct:  83 },
    { rank: 3, name: 'Expense Claim',        uniqueUsers: 1193, pct:  76 },
    { rank: 4, name: 'Travel Booking',       uniqueUsers:  978, pct:  62 },
    { rank: 5, name: 'Org Chart Lookup',     uniqueUsers:  188, pct:  12 },
    { rank: 6, name: 'Policy Search',        uniqueUsers:   59, pct:   4 },
  ];

  readonly servicesBreakdown: ServiceBreakdown[] = [
    { name: 'Org Chart Lookup',     sharePct: 26.3, color: '#a855f7' },
    { name: 'Leave Application',    sharePct: 25.0, color: '#22d3ee' },
    { name: 'IT Helpdesk Ticket',   sharePct: 25.0, color: '#2c8aff' },
    { name: 'Meeting Room Booking', sharePct: 23.8, color: '#14b8a6' },
    { name: 'Expense Claim',        sharePct: 12.2, color: '#f59e0b' },
    { name: 'Travel Booking',       sharePct:  6.9, color: '#ec4899' },
  ];

  readonly starredServices: StarredService[] = [
    { name: 'Meeting Room Booking', stars: 211 },
    { name: 'Org Chart Lookup',     stars: 125 },
    { name: 'Expense Claim',        stars: 100 },
    { name: 'Leave Application',    stars:  46 },
    { name: 'IT Helpdesk Ticket',   stars:  40 },
  ];

  readonly lowActivityServices: string[] = [
    'Payslip Download (0 clicks)',
    'Meeting Room Booking (0 clicks)',
    'IT Helpdesk Ticket (2 clicks)',
  ];

  readonly servicesRankMode = signal<'clicks' | 'unique'>('clicks');

  readonly rankedTopServices = computed(() => {
    if (this.servicesRankMode() === 'unique') {
      return [...this.topServices]
        .filter(s => s.uniqueUsers !== undefined)
        .sort((a, b) => (b.uniqueUsers ?? 0) - (a.uniqueUsers ?? 0));
    }
    return this.topServices;
  });

  readonly needsAttentionRows: { service: string; clicks: number; lastEngaged: string }[] = [
    { service: 'Payslip Download',     clicks: 0, lastEngaged: '47 days ago' },
    { service: 'Meeting Room Booking', clicks: 0, lastEngaged: '38 days ago' },
    { service: 'IT Helpdesk Ticket',   clicks: 2, lastEngaged: '21 days ago' },
  ];

  readonly moduleSummary: { module: string; clicks: number; topService: string }[] = [
    { module: 'IT Support', clicks: 2840, topService: 'IT Helpdesk' },
    { module: 'Knowledge',  clicks: 2391, topService: 'Policy Search' },
    { module: 'Finance',    clicks: 1208, topService: 'Expense Claim' },
    { module: 'People',     clicks:  941, topService: 'Org Chart Lookup' },
  ];

  readonly chartW = 900;
  readonly chartH = 200;
  readonly padL   = 48;
  readonly padR   = 20;
  readonly padT   = 16;
  readonly padB   = 30;

  private readonly weekLabels  = ['Jun 20', 'Jun 27', 'Jul 4', 'Jul 11', 'Jul 18', 'Jul 25', 'Aug 1', 'Aug 8'];
  private readonly yMax        = 200;
  private readonly gridValues  = [0, 50, 100, 150, 200];
  private readonly series1     = [139, 162, 145, 157, 192, 157, 127, 102];
  private readonly series2     = [158, 141, 120, 111, 121, 143, 143, 125];
  private readonly series3     = [ 50,  48,  43,  32,  37,  39,  34,  39];

  private toX(i: number): number {
    return this.padL + (i / (this.weekLabels.length - 1)) * (this.chartW - this.padL - this.padR);
  }
  private toY(v: number): number {
    return this.padT + (1 - v / this.yMax) * (this.chartH - this.padT - this.padB);
  }
  private smoothPath(values: number[]): string {
    const pts = values.map((v, i) => ({ x: this.toX(i), y: this.toY(v) }));
    if (!pts.length) return '';
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

  readonly line1Path = computed(() => this.smoothPath(this.series1));
  readonly line2Path = computed(() => this.smoothPath(this.series2));
  readonly line3Path = computed(() => this.smoothPath(this.series3));
  readonly xTicks    = computed(() => this.weekLabels.map((label, i) => ({ label, x: this.toX(i) })));
  readonly yTicks    = computed(() => this.gridValues.map(v => ({ label: v, y: this.toY(v) })));

  readonly engagementRows: EngagementRow[] = [
    { service: 'IT Helpdesk Ticket',   module: 'IT Support', lastAccessed: '2026-08-08', status: 'active' },
    { service: 'Policy Search',        module: 'Knowledge',  lastAccessed: '2026-08-08', status: 'active' },
    { service: 'Expense Claim',        module: 'Finance',    lastAccessed: '2026-08-07', status: 'active' },
    { service: 'Org Chart Lookup',     module: 'People',     lastAccessed: '2026-08-06', status: 'active' },
    { service: 'Travel Booking',       module: 'Travel',     lastAccessed: '2026-08-05', status: 'active' },
    { service: 'Meeting Room Booking', module: 'Admin',      lastAccessed: '2026-07-31', status: 'low' },
    { service: 'Payslip Download',     module: 'HR',         lastAccessed: '2026-07-15', status: 'stale' },
  ];

  // ===== Intent tab – topic drilldown =====
  readonly selectedTopic = signal<string | null>(null);

  selectTopic(id: string) {
    this.selectedTopic.update(cur => (cur === id ? null : id));
  }

  readonly topicDrawerOpen = computed(() => this.selectedTopic() !== null);

  closeTopicDrawer() { this.selectedTopic.set(null); }

  readonly selectedTopicLabel = computed(() => {
    if (!this.selectedTopic()) return null;
    const all = [
      ...this.knowledgeByVolume.flat(),
      ...this.peopleByVolume.flat(),
      ...this.unclassifiedByVolume.flat(),
    ];
    return all.find(t => t.id === this.selectedTopic())?.name ?? null;
  });

  private readonly allDrilldowns: Record<string, TopicDrilldownRow[]> = {
    news: [
      { prompt: 'What are the latest updates from the ADB Annual Meeting?',     response: 'The ADB Annual Meeting highlighted three priorities: climate finance, digital infrastructure, and food security.',  user: 'Project Officer',   dept: 'ERCD', date: '2026-08-08', feedback: 'positive' },
      { prompt: 'Summarise the press release on the new urban climate fund',    response: 'ADB launched a $2B urban climate fund targeting heat resilience and flood mitigation in Asian cities.',            user: 'Communications',    dept: 'DOCK', date: '2026-08-07', feedback: 'positive' },
      { prompt: 'What events are scheduled for ADB Week 2026?',                 response: 'ADB Week 2026 runs May 4–7 in Milan. Key sessions include private capital mobilisation and green bond roundtables.', user: 'Admin Officer',     dept: 'BPGE', date: '2026-08-06', feedback: null },
      { prompt: 'Find the news article about SERD infrastructure financing',    response: 'No article matching SERD infrastructure financing was found in the current news collection.',                       user: 'Economist',         dept: 'SERD', date: '2026-08-05', feedback: 'negative' },
    ],
    acro: [
      { prompt: 'What does BTOR stand for?',                                    response: 'BTOR stands for Back-to-Office Report — a brief filed by staff after field missions.',                             user: 'Consultant',        dept: 'PPP',  date: '2026-08-08', feedback: 'positive' },
      { prompt: 'Define CAPE in the context of ADB operations',                 response: 'CAPE is the Country Assistance Program Evaluation — ADB\'s independent review of country-level lending.',           user: 'Project Analyst',   dept: 'ERCD', date: '2026-08-07', feedback: 'positive' },
      { prompt: 'What is the difference between TA and PBG?',                   response: 'TA (Technical Assistance) funds advisory or capacity-building activities. PBG (Project Brief Generator) is an AI tool.', user: 'Finance Officer',   dept: 'CTLO', date: '2026-08-07', feedback: null },
      { prompt: 'What does DMF stand for and how is it used?',                  response: 'DMF stands for Design and Monitoring Framework — used to define project outputs, outcomes, and indicators.',         user: 'M&E Specialist',    dept: 'SDNC', date: '2026-08-06', feedback: 'positive' },
    ],
    gen: [
      { prompt: 'How many staff does ADB employ globally?',                     response: 'ADB employs approximately 3,400 staff across its headquarters in Manila and 30+ resident missions.',               user: 'Researcher',        dept: 'ERCD', date: '2026-08-08', feedback: 'positive' },
      { prompt: 'What is ADB\'s current poverty reduction target?',              response: 'ADB Strategy 2030 aims to support 100M people out of poverty by 2030 across its developing member countries.',     user: 'Policy Analyst',    dept: 'CCSA', date: '2026-08-07', feedback: null },
      { prompt: 'Describe the ADB Strategy 2030 key pillars',                   response: 'Strategy 2030 has seven operational priorities: addressing poverty, gender, climate, resilience, governance, digital development, and regional cooperation.', user: 'Project Officer', dept: 'SARD', date: '2026-08-06', feedback: 'positive' },
    ],
    sect: [
      { prompt: 'What are ADB\'s priority sectors in South Asia?',               response: 'ADB\'s priority sectors in SARD are transport, energy, urban development, and social protection.',                user: 'Economist',         dept: 'SARD', date: '2026-08-08', feedback: 'positive' },
      { prompt: 'Summarise the energy sector operational plan',                 response: 'The Energy Operational Plan 2019–2030 targets universal access, clean energy transition, and energy efficiency.',   user: 'Energy Specialist', dept: 'SERD', date: '2026-08-07', feedback: 'positive' },
      { prompt: 'Find financing opportunities under the climate fund window',   response: 'The Climate Change Fund offers grants and loans under three windows: mitigation, adaptation, and resilience.',      user: 'Project Officer',   dept: 'CWRD', date: '2026-08-06', feedback: null },
      { prompt: 'What is ADB\'s approach to private sector development?',        response: 'ADB engages the private sector through direct lending, guarantees, and equity investments via PSOD.',              user: 'Finance Analyst',   dept: 'PSOD', date: '2026-08-05', feedback: 'negative' },
    ],
    contact: [
      { prompt: 'Who is the director of SERD?',                                 response: 'The Director General of SERD is based at ADB HQ. Contact details are available in the ADB Staff Directory.',       user: 'Admin Officer',     dept: 'SERD', date: '2026-08-08', feedback: 'positive' },
      { prompt: 'Find the email for the HR helpdesk',                           response: 'The HR helpdesk can be reached at hr@adb.org or through the HR Self-Service portal.',                               user: 'Project Officer',   dept: 'BPGE', date: '2026-08-07', feedback: 'positive' },
      { prompt: 'Who handles procurement queries in CWRD?',                     response: 'Procurement queries for CWRD operations are handled by the CWRD procurement focal point in Almaty.',                user: 'Procurement Spec.', dept: 'CWRD', date: '2026-08-06', feedback: null },
    ],
    orgchart: [
      { prompt: 'Show the reporting structure under the Vice President (O)',    response: 'VP (O) oversees SARD, SERD, CWRD, EARD, PARD, and their associated portfolio divisions.',                            user: 'Admin Officer',     dept: 'BPGE', date: '2026-08-08', feedback: 'positive' },
      { prompt: 'Who reports to the Director General of ERCD?',                 response: 'The DG of ERCD has four division directors and a deputy DG reporting to them.',                                      user: 'Economist',         dept: 'ERCD', date: '2026-08-07', feedback: null },
      { prompt: 'List all division chiefs in ITD',                             response: 'ITD has three division chiefs overseeing IT operations, business solutions, and cybersecurity respectively.',          user: 'IT Specialist',     dept: 'ITD',  date: '2026-08-05', feedback: 'negative' },
    ],
    roles: [
      { prompt: 'Who is the climate finance focal point in SERD?',              response: 'The climate finance focal point in SERD is a Senior Energy Specialist based in Manila HQ.',                          user: 'Project Officer',   dept: 'SERD', date: '2026-08-08', feedback: 'positive' },
      { prompt: 'Find staff with procurement expertise in CWRD',                response: 'CWRD has two procurement specialists — one in Manila and one in the Almaty Resident Mission.',                        user: 'Procurement Spec.', dept: 'CWRD', date: '2026-08-07', feedback: 'positive' },
      { prompt: 'Who covers M&E roles in ERCD?',                               response: 'ERCD has three M&E specialists covering project evaluation, results monitoring, and portfolio review.',                user: 'M&E Specialist',    dept: 'ERCD', date: '2026-08-06', feedback: null },
      { prompt: 'List staff in CCSA with gender and social development roles',  response: 'CCSA has five gender and social development specialists supporting operational departments across regions.',           user: 'Gender Specialist', dept: 'CCSA', date: '2026-08-05', feedback: 'positive' },
    ],
    ambig: [
      { prompt: 'What about the update from last week?',                        response: 'Unable to classify — no prior context to determine which update is being referenced.',                               user: 'Project Officer',   dept: 'SERD', date: '2026-08-08', feedback: 'negative' },
      { prompt: 'Can you check the status?',                                    response: 'Unable to classify — "status" is ambiguous without specifying a project, document, or process.',                     user: 'Admin Officer',     dept: 'BPGE', date: '2026-08-07', feedback: 'negative' },
      { prompt: 'Is it still the same as before?',                             response: 'Unable to classify — no reference object identified in this query.',                                                  user: 'Finance Officer',   dept: 'CTLO', date: '2026-08-06', feedback: 'negative' },
      { prompt: 'What did they say about that report?',                         response: 'Unable to classify — ambiguous pronoun "they" and unspecified report reference.',                                     user: 'Economist',         dept: 'ERCD', date: '2026-08-05', feedback: 'negative' },
    ],
    vague: [
      { prompt: 'Find the document',                                            response: 'Unable to classify — query is too vague; please specify a document name, topic, or department.',                     user: 'Consultant',        dept: 'PPP',  date: '2026-08-08', feedback: 'negative' },
      { prompt: 'Show me something about Asia',                                 response: 'Unable to classify — query lacks sufficient specificity to route to a knowledge domain.',                             user: 'Project Analyst',   dept: 'SARD', date: '2026-08-07', feedback: 'negative' },
      { prompt: 'Help',                                                         response: 'Unable to classify — single-word prompt with no intent context.',                                                    user: 'Admin Officer',     dept: 'DOCK', date: '2026-08-06', feedback: 'negative' },
      { prompt: 'Give me information',                                          response: 'Unable to classify — no subject, domain, or goal specified in this prompt.',                                         user: 'M&E Officer',       dept: 'IED',  date: '2026-08-05', feedback: 'negative' },
    ],
    oos: [
      { prompt: 'What is the current stock price of Apple?',                    response: 'Out of scope — this system is limited to ADB operational content and staff services.',                              user: 'Finance Analyst',   dept: 'CTLO', date: '2026-08-08', feedback: 'negative' },
      { prompt: 'Write me a personal cover letter for a job outside ADB',      response: 'Out of scope — personal external job applications are not within the supported use cases.',                           user: 'Project Officer',   dept: 'BPGE', date: '2026-08-07', feedback: 'negative' },
      { prompt: 'Translate this text to Tagalog',                              response: 'Out of scope — language translation services are not currently supported by this system.',                            user: 'Admin Officer',     dept: 'SERD', date: '2026-08-06', feedback: null },
      { prompt: 'What are the best restaurants near ADB Manila?',              response: 'Out of scope — local dining recommendations are outside this system\'s operational knowledge base.',                  user: 'Consultant',        dept: 'ERCD', date: '2026-08-05', feedback: 'negative' },
    ],
    mixed: [
      { prompt: 'Who is the climate focal point and what are their published policies?', response: 'Multiple intents detected (contact lookup + policy retrieval) — please split into separate queries.', user: 'Economist',         dept: 'SARD', date: '2026-08-08', feedback: null },
      { prompt: 'Find staff in CWRD and summarise the last procurement guidelines', response: 'Multiple intents detected (people search + document summary) — please submit as two separate queries.',   user: 'Procurement Spec.', dept: 'CWRD', date: '2026-08-07', feedback: null },
      { prompt: 'What are ADB\'s priorities and who runs each department?',     response: 'Multiple intents detected (strategy knowledge + org chart lookup) — please refine to a single intent.',        user: 'Policy Analyst',    dept: 'CCSA', date: '2026-08-06', feedback: null },
    ],
  };

  readonly topicDrilldownRows = computed(() => {
    const id = this.selectedTopic();
    if (!id) return [];
    return this.allDrilldowns[id] ?? [];
  });
}
