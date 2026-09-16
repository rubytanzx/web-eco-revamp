import { Component, computed, signal } from '@angular/core';
import { TablerIconComponent } from '@tabler/icons-angular';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';
import { PvChart } from '../shared/pv-chart/pv-chart';
import { IntentTreemap } from '../shared/intent-treemap/intent-treemap';

type IntentTab = 'ai-search' | 'keyword-search';

interface PageKpi { title: string; value: string; sub?: string; }

interface DrilldownRow {
  prompt: string;
  response: string;
  user: string;
  dept: string;
  date: string;
}

interface ZeroResultRow {
  keyword: string;
  date: string;
}

@Component({
  selector: 'app-intent',
  imports: [DateRangeFilter, TablerIconComponent, PvChart, IntentTreemap],
  templateUrl: './intent.html',
  styleUrl: './intent.css',
})
export class Intent {

  readonly activeTab = signal<IntentTab>('ai-search');

  readonly pageKpis: PageKpi[] = [
    { title: 'Total Prompts',       value: '9,608', sub: 'Total prompts submitted in this period' },
    { title: 'Knowledge Prompts',   value: '3,635', sub: 'LLM-classified under Knowledge topics' },
    { title: 'People Prompts',      value: '4,513', sub: 'LLM-classified under People topics' },
    { title: 'Unclassified Intent', value: '653',   sub: 'Prompts where intent could not be classified' },
  ];

  readonly selectedTopic  = signal<string | null>(null);
  readonly drawerWidth    = signal(640);
  readonly drawerDeptFilter = signal<string>('all');

  private static readonly DRAWER_MIN = 360;
  private static readonly DRAWER_MAX = 0.90;

  readonly topicDrawerOpen = computed(() => this.selectedTopic() !== null);

  onTopicClicked(id: string | null) {
    this.selectedTopic.set(id);
    this.drawerDeptFilter.set('all');
  }

  closeTopicDrawer() { this.selectedTopic.set(null); }

  onResizerMouseDown(e: MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = this.drawerWidth();
    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      const max   = Math.round(window.innerWidth * Intent.DRAWER_MAX);
      this.drawerWidth.set(Math.min(max, Math.max(Intent.DRAWER_MIN, startW + delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private readonly topicNames: Record<string, string> = {
    news:       'News & Events',
    acro:       'Acronyms',
    gen:        'General Queries',
    sect:       'ADB Sectoral Priorities',
    admin:      'Admin & Employee Support',
    orginfo:    'Organisational Information',
    proj:       'Projects & Initiatives',
    reg:        'Regional Queries',
    tmpl:       'Templates & Documents',
    pol:        'Policies & Guidelines',
    contact:    'Contact Information',
    orgchart:   'Organisational Chart',
    roles:      'Roles & Expertise',
    'no-answer':'No Answer',
    ambig:      'Ambiguous Prompt',
    absent:     'Absent Data',
    'ai-fail':  'AI Failure',
  };

  readonly selectedTopicLabel = computed(() => {
    const id = this.selectedTopic();
    return id ? (this.topicNames[id] ?? id) : null;
  });

  private readonly allDrilldowns: Record<string, DrilldownRow[]> = {
    news: [
      { prompt: 'What are the latest updates from the ADB Annual Meeting?',    response: 'The ADB Annual Meeting highlighted three priorities: climate finance, digital infrastructure, and food security.',   user: 'Maria Santos',  dept: 'ERCD', date: '2026-08-08' },
      { prompt: 'Summarise the press release on the new urban climate fund',   response: 'ADB launched a $2B urban climate fund targeting heat resilience and flood mitigation in Asian cities.',             user: 'James Reyes',   dept: 'DOCK', date: '2026-08-07' },
      { prompt: 'What events are scheduled for ADB Week 2026?',                response: 'ADB Week 2026 runs May 4–7 in Milan. Key sessions include private capital mobilisation and green bond roundtables.',  user: 'Priya Nair',    dept: 'BPGE', date: '2026-08-06' },
      { prompt: 'Find the news article about SERD infrastructure financing',   response: 'No article matching SERD infrastructure financing was found in the current news collection.',                        user: 'David Lim',     dept: 'SERD', date: '2026-08-05' },
    ],
    acro: [
      { prompt: 'What does BTOR stand for?',                                   response: 'BTOR stands for Back-to-Office Report — a brief filed by staff after field missions.',                              user: 'Ana Cruz',       dept: 'PPP',  date: '2026-08-08' },
      { prompt: 'Define CAPE in the context of ADB operations',                response: 'CAPE is the Country Assistance Program Evaluation — ADB\'s independent review of country-level lending.',            user: 'Raj Patel',      dept: 'ERCD', date: '2026-08-07' },
      { prompt: 'What is the difference between TA and PBG?',                  response: 'TA (Technical Assistance) funds advisory activities. PBG (Project Brief Generator) is an AI tool.',                 user: 'Sofia Lee',      dept: 'CTLO', date: '2026-08-07' },
      { prompt: 'What does DMF stand for and how is it used?',                 response: 'DMF stands for Design and Monitoring Framework — used to define project outputs, outcomes, and indicators.',          user: 'Kevin Tan',      dept: 'SDNC', date: '2026-08-06' },
    ],
    gen: [
      { prompt: 'How many staff does ADB employ globally?',                    response: 'ADB employs approximately 3,400 staff across its headquarters in Manila and 30+ resident missions.',                user: 'Aisha Malik',    dept: 'ERCD', date: '2026-08-08' },
      { prompt: 'What is ADB\'s current poverty reduction target?',             response: 'ADB Strategy 2030 aims to support 100M people out of poverty by 2030 across developing member countries.',          user: 'Chen Wei',       dept: 'CCSA', date: '2026-08-07' },
      { prompt: 'Describe the ADB Strategy 2030 key pillars',                  response: 'Strategy 2030 has seven operational priorities: poverty, gender, climate, resilience, governance, digital, and regional cooperation.', user: 'Laura Gomez', dept: 'SARD', date: '2026-08-06' },
    ],
    sect: [
      { prompt: 'What are ADB\'s priority sectors in South Asia?',              response: 'ADB\'s priority sectors in SARD are transport, energy, urban development, and social protection.',                 user: 'David Lim',      dept: 'SARD', date: '2026-08-08' },
      { prompt: 'Summarise the energy sector operational plan',                response: 'The Energy Operational Plan 2019–2030 targets universal access, clean energy transition, and efficiency.',           user: 'Nina Park',      dept: 'SERD', date: '2026-08-07' },
      { prompt: 'Find financing opportunities under the climate fund window',  response: 'The Climate Change Fund offers grants and loans under three windows: mitigation, adaptation, and resilience.',       user: 'Omar Hassan',    dept: 'CWRD', date: '2026-08-06' },
      { prompt: 'What is ADB\'s approach to private sector development?',       response: 'ADB engages the private sector through direct lending, guarantees, and equity investments via PSOD.',               user: 'Sofia Lee',      dept: 'PSOD', date: '2026-08-05' },
    ],
    admin: [
      { prompt: 'How do I apply for annual leave in the HR portal?',           response: 'Log in to HR Self-Service, navigate to Leave Management, and submit an Annual Leave application with dates.',        user: 'Priya Nair',     dept: 'BPGE', date: '2026-08-08' },
      { prompt: 'What is the process for submitting a travel claim?',          response: 'Travel claims are submitted via the Finance portal within 10 working days of return. Attach all receipts.',           user: 'Maria Santos',   dept: 'SERD', date: '2026-08-07' },
      { prompt: 'Where do I find the ADB staff handbook?',                     response: 'The ADB Staff Handbook is available on the intranet under HR > Policies & Procedures.',                              user: 'Ana Cruz',        dept: 'PPP',  date: '2026-08-06' },
    ],
    contact: [
      { prompt: 'Who is the director of SERD?',                                response: 'The Director General of SERD is based at ADB HQ. Contact details are in the ADB Staff Directory.',                  user: 'James Reyes',    dept: 'SERD', date: '2026-08-08' },
      { prompt: 'Find the email for the HR helpdesk',                          response: 'The HR helpdesk can be reached at hr@adb.org or through the HR Self-Service portal.',                                user: 'Laura Gomez',    dept: 'BPGE', date: '2026-08-07' },
      { prompt: 'Who handles procurement queries in CWRD?',                    response: 'Procurement queries for CWRD operations are handled by the CWRD procurement focal point in Almaty.',                 user: 'Omar Hassan',    dept: 'CWRD', date: '2026-08-06' },
      { prompt: 'Get me the contact for the ITD service desk',                 response: 'The ITD service desk can be reached at itd-helpdesk@adb.org or via the IT Support portal.',                          user: 'Kevin Tan',      dept: 'CTLO', date: '2026-08-05' },
    ],
    orgchart: [
      { prompt: 'Show the reporting structure under the Vice President (O)',   response: 'VP (O) oversees SARD, SERD, CWRD, EARD, PARD, and their associated portfolio divisions.',                           user: 'Priya Nair',     dept: 'BPGE', date: '2026-08-08' },
      { prompt: 'Who reports to the Director General of ERCD?',                response: 'The DG of ERCD has four division directors and a deputy DG reporting to them.',                                     user: 'David Lim',      dept: 'ERCD', date: '2026-08-07' },
      { prompt: 'List all division chiefs in ITD',                            response: 'ITD has three division chiefs overseeing IT operations, business solutions, and cybersecurity respectively.',         user: 'Raj Patel',      dept: 'ITD',  date: '2026-08-05' },
    ],
    roles: [
      { prompt: 'Who is the climate finance focal point in SERD?',             response: 'The climate finance focal point in SERD is a Senior Energy Specialist based in Manila HQ.',                         user: 'Nina Park',      dept: 'SERD', date: '2026-08-08' },
      { prompt: 'Find staff with procurement expertise in CWRD',               response: 'CWRD has two procurement specialists — one in Manila and one in the Almaty Resident Mission.',                       user: 'Omar Hassan',    dept: 'CWRD', date: '2026-08-07' },
      { prompt: 'Who covers M&E roles in ERCD?',                              response: 'ERCD has three M&E specialists covering project evaluation, results monitoring, and portfolio review.',               user: 'Kevin Tan',      dept: 'ERCD', date: '2026-08-06' },
      { prompt: 'List staff in CCSA with gender and social development roles', response: 'CCSA has five gender specialists supporting operational departments across regions.',                                user: 'Aisha Malik',    dept: 'CCSA', date: '2026-08-05' },
    ],
    orginfo: [
      { prompt: 'What departments fall under the Vice President for Knowledge?',  response: 'The VP Knowledge oversees ERCD, CCSA, IED, and the Sustainable Development and Climate Change department.',  user: 'Laura Gomez',  dept: 'ERCD', date: '2026-08-08' },
      { prompt: 'Which division handles procurement policy across ADB?',           response: 'Procurement policy is owned by PPFD, which sets standards and provides oversight across all operational departments.',  user: 'Omar Hassan',  dept: 'PPFD', date: '2026-08-07' },
      { prompt: 'What is the structure of the Central and West Asia Department?',  response: 'CWRD has three regional divisions (East, West, Central), a portfolio unit, and a resident mission network across 10 countries.', user: 'Aisha Malik', dept: 'CWRD', date: '2026-08-06' },
      { prompt: 'How is the Independent Evaluation Department structured?',        response: 'IED reports directly to the Board. It has a Director General and three evaluation divisions covering operations, thematic, and country-level assessments.', user: 'Kevin Tan', dept: 'IED', date: '2026-08-05' },
    ],
    proj: [
      { prompt: 'What is the status of the Greater Mekong Subregion railway project?', response: 'The GMS railway connectivity project is in pre-feasibility stage. ADB has committed $2.4M for the initial TA component.',  user: 'Nina Park',   dept: 'SERD', date: '2026-08-08' },
      { prompt: 'Find ADB projects related to climate adaptation in Bangladesh',        response: 'ADB has three active adaptation projects in Bangladesh: coastal resilience, delta flood management, and urban heat island mitigation.', user: 'David Lim',   dept: 'SARD', date: '2026-08-07' },
      { prompt: 'What is the Pacific Urban Development Initiative?',                    response: 'PUDI is a $180M ADB initiative supporting sustainable urban infrastructure across 8 Pacific DMCs through grants and concessional loans.', user: 'James Reyes', dept: 'PARD', date: '2026-08-06' },
      { prompt: 'List ongoing technical assistance projects in ERCD',                   response: 'ERCD currently has 14 active TA projects focused on economic research, regional cooperation, and knowledge dissemination.', user: 'Priya Nair',  dept: 'ERCD', date: '2026-08-05' },
    ],
    ambig: [
      { prompt: 'What about the update from last week?',                       response: 'Unable to classify — no prior context to determine which update is being referenced.',                              user: 'Maria Santos',   dept: 'SERD', date: '2026-08-08' },
      { prompt: 'Can you check the status?',                                   response: 'Unable to classify — "status" is ambiguous without specifying a project, document, or process.',                    user: 'James Reyes',    dept: 'BPGE', date: '2026-08-07' },
      { prompt: 'Is it still the same as before?',                            response: 'Unable to classify — no reference object identified in this query.',                                                 user: 'Sofia Lee',      dept: 'CTLO', date: '2026-08-06' },
      { prompt: 'What did they say about that report?',                        response: 'Unable to classify — ambiguous pronoun and unspecified report reference.',                                           user: 'Chen Wei',       dept: 'ERCD', date: '2026-08-05' },
    ],
  };

  readonly topicDrilldownRows = computed(() => {
    const id = this.selectedTopic();
    if (!id) return [];
    return this.allDrilldowns[id] ?? [];
  });

  readonly drawerDepts = computed(() =>
    [...new Set(this.topicDrilldownRows().map(r => r.dept))].sort()
  );

  readonly filteredDrilldownRows = computed(() => {
    const dept = this.drawerDeptFilter();
    const rows = this.topicDrilldownRows();
    return dept === 'all' ? rows : rows.filter(r => r.dept === dept);
  });

  // ---- Keyword Search: Zero Results by Content Type ----
  readonly zeroResultByType: { type: string; rate: number }[] = [
    { type: 'All',      rate: 89 },
    { type: 'Files',    rate: 94 },
    { type: 'Sites',    rate: 78 },
    { type: 'People',   rate: 62 },
    { type: 'News',     rate: 91 },
    { type: 'Messages', rate: 81 },
    { type: 'Images',   rate: 85 },
    { type: 'Videos',   rate: 97 },
    { type: 'Links',    rate: 87 },
  ];

  private readonly zeroResultRows: Record<string, ZeroResultRow[]> = {
    'All': [
      { keyword: 'travel reimbursement form 2027',     date: '8 Aug 2026' },
      { keyword: 'ADB annual results 2026',            date: '7 Aug 2026' },
      { keyword: 'new employee orientation video',     date: '7 Aug 2026' },
      { keyword: 'benefits enrollment portal link',    date: '6 Aug 2026' },
      { keyword: 'org chart 2026 PNG',                 date: '5 Aug 2026' },
      { keyword: 'Yamamoto Kenji contact',             date: '5 Aug 2026' },
      { keyword: 'remote work guidelines Q3',          date: '4 Aug 2026' },
      { keyword: 'IT service desk portal',             date: '4 Aug 2026' },
      { keyword: 'climate finance announcement July',  date: '3 Aug 2026' },
      { keyword: 'payroll advisory Q3 2026',           date: '2 Aug 2026' },
    ],
    'Files': [
      { keyword: 'travel reimbursement form 2027',     date: '8 Aug 2026' },
      { keyword: 'HR policy amendment Q3',             date: '8 Aug 2026' },
      { keyword: 'staff welfare circular July',        date: '7 Aug 2026' },
      { keyword: 'remote work guidelines Q3',          date: '6 Aug 2026' },
      { keyword: 'procurement checklist template',     date: '6 Aug 2026' },
      { keyword: 'project completion report format',   date: '5 Aug 2026' },
      { keyword: 'tax clearance certificate 2026',     date: '4 Aug 2026' },
      { keyword: 'staff competency framework PDF',     date: '3 Aug 2026' },
    ],
    'Sites': [
      { keyword: 'ADB intranet procurement portal',   date: '8 Aug 2026' },
      { keyword: 'staff directory update page',       date: '7 Aug 2026' },
      { keyword: 'learning hub login',                date: '7 Aug 2026' },
      { keyword: 'IT service desk portal',            date: '6 Aug 2026' },
      { keyword: 'HR self-service site',              date: '5 Aug 2026' },
      { keyword: 'travel booking system',             date: '4 Aug 2026' },
    ],
    'People': [
      { keyword: 'Yamamoto Kenji',                    date: '8 Aug 2026' },
      { keyword: 'Maria Santos procurement',          date: '7 Aug 2026' },
      { keyword: 'IT helpdesk lead contact',          date: '6 Aug 2026' },
      { keyword: 'VPF finance controller',            date: '5 Aug 2026' },
      { keyword: 'HR business partner BPMSD',         date: '4 Aug 2026' },
    ],
    'News': [
      { keyword: 'ADB annual results 2026',           date: '8 Aug 2026' },
      { keyword: 'Manila office renovation update',   date: '7 Aug 2026' },
      { keyword: 'climate finance announcement July', date: '7 Aug 2026' },
      { keyword: 'staff town hall recording Aug',     date: '6 Aug 2026' },
      { keyword: 'ADB strategy 2030 launch',          date: '5 Aug 2026' },
      { keyword: 'regional cooperation summit recap', date: '4 Aug 2026' },
    ],
    'Messages': [
      { keyword: 'onboarding checklist reminder',     date: '8 Aug 2026' },
      { keyword: 'IT maintenance notice Aug 5',       date: '6 Aug 2026' },
      { keyword: 'payroll advisory Q3 2026',          date: '5 Aug 2026' },
      { keyword: 'townhall follow-up action items',   date: '4 Aug 2026' },
      { keyword: 'data privacy training reminder',    date: '3 Aug 2026' },
    ],
    'Images': [
      { keyword: 'ADB logo PNG transparent',         date: '8 Aug 2026' },
      { keyword: 'org chart 2026',                   date: '7 Aug 2026' },
      { keyword: 'country flag Philippines HD',      date: '6 Aug 2026' },
      { keyword: 'event banner template ADB',        date: '5 Aug 2026' },
      { keyword: 'staff photo ID background',        date: '4 Aug 2026' },
    ],
    'Videos': [
      { keyword: 'new employee orientation video',    date: '8 Aug 2026' },
      { keyword: 'ADB strategy 2030 presentation',   date: '7 Aug 2026' },
      { keyword: 'compliance training module 3',     date: '7 Aug 2026' },
      { keyword: 'townhall recording July 2026',     date: '6 Aug 2026' },
      { keyword: 'security awareness training',      date: '5 Aug 2026' },
    ],
    'Links': [
      { keyword: 'benefits enrollment portal',       date: '8 Aug 2026' },
      { keyword: 'travel booking system link',       date: '7 Aug 2026' },
      { keyword: 'learning management system',       date: '6 Aug 2026' },
      { keyword: 'payslip access portal',            date: '5 Aug 2026' },
      { keyword: 'VPN setup instructions',           date: '4 Aug 2026' },
    ],
  };

  readonly zrDrawerOpen  = signal(false);
  readonly zrDrawerType  = signal<string>('');

  readonly zrDrawerRows = computed<ZeroResultRow[]>(() => {
    const t = this.zrDrawerType();
    return this.zeroResultRows[t] ?? [];
  });

  openZrDrawer(type: string): void {
    this.zrDrawerType.set(type);
    this.zrDrawerOpen.set(true);
  }

  closeZrDrawer(): void {
    this.zrDrawerOpen.set(false);
  }
}
