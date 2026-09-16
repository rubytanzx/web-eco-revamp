import { UpperCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  ElementRef, OnDestroy, ViewChild, computed, effect,
  inject, input, output, signal, untracked,
} from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { PdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';

export interface ChartSeries { name: string; color: string; values: number[]; }
export interface ChartCitation { label: string; text: string; type: 'live' | 'doc'; url?: string; pdfUrl?: string; }
export interface ChartConfig {
  title: string; subtitle: string; yUnit: string;
  years: number[]; series: ChartSeries[];
  contentBlocks?: { heading?: string; body: string }[];
  citations?: ChartCitation[];
}

interface ChartPt { x: number; y: number; v: number; }
interface ChartPath { name: string; color: string; lineD: string; areaD: string; pts: ChartPt[]; }
interface ChartGridLine { y: number; v: number; isZero: boolean; }
interface ComputedChart {
  paths: ChartPath[]; gridLines: ChartGridLine[];
  xLabels: { x: number; label: string }[]; yLabels: { x: number; y: number; label: string }[];
  xCoords: number[]; tipH: number;
  svgW: number; svgH: number; pad: { top: number; right: number; bottom: number; left: number };
}

function buildChartData(config: ChartConfig, svgW = 540, svgH = 195): ComputedChart {
  const pad = { top: 16, right: 16, bottom: 32, left: 44 };
  const iW = svgW - pad.left - pad.right;
  const iH = svgH - pad.top - pad.bottom;
  const n = config.years.length;
  const allVals = config.series.flatMap(s => s.values);
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const rawRange = rawMax - rawMin;
  const step = rawRange < 4 ? 1 : rawRange < 10 ? 2 : rawRange < 40 ? 5 : rawRange < 200 ? 20 : rawRange < 800 ? 50 : 100;
  const yMin = Math.floor(rawMin / step) * step - step;
  const yMax = Math.ceil(rawMax / step) * step + step;
  const yRange = yMax - yMin;
  const xOf = (i: number) => pad.left + (i / Math.max(1, n - 1)) * iW;
  const yOf = (v: number) => pad.top + (1 - (v - yMin) / yRange) * iH;
  const gridLines: ChartGridLine[] = [];
  for (let v = yMin; v <= yMax + 0.001; v += step) {
    const y = yOf(v);
    if (y >= pad.top - 2 && y <= svgH - pad.bottom + 2)
      gridLines.push({ y, v, isZero: Math.abs(v) < 0.001 });
  }
  const paths: ChartPath[] = config.series.map(s => {
    const pts = s.values.map((v, i) => ({ x: xOf(i), y: yOf(v), v }));
    const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('');
    const areaD = `${lineD}L${xOf(n - 1).toFixed(1)},${yOf(yMin).toFixed(1)}L${xOf(0).toFixed(1)},${yOf(yMin).toFixed(1)}Z`;
    return { name: s.name, color: s.color, lineD, areaD, pts };
  });
  const xLabels = config.years.map((yr, i) => ({ x: xOf(i), label: i % 3 === 0 ? String(yr) : '' }));
  const yLabels = gridLines.map(g => ({ x: pad.left - 6, y: g.y + 4, label: String(g.v) }));
  const xCoords = config.years.map((_, i) => xOf(i));
  const tipH = 14 + config.series.length * 16 + 12;
  return { paths, gridLines, xLabels, yLabels, xCoords, tipH, svgW, svgH, pad };
}

export interface ProjectWidget {
  projectNumber: string;
  title: string;
  status: string;
  country: string;
  sector: string;
  url: string;
  description?: string;
}

export interface ProjectDetail {
  projectNumber: string;
  title: string;
  status: string;
  date: string;
  geographicScope: string[];
  overview: string;
  keyActivities: string[];
  expectedOutcomes: string[];
  analysisSummary: string;
  analysisStats: { label: string; value: string }[];
  keyFacts: { label: string; value: string }[];
  photo?: string;
  relatedDocs: { label: string; url: string }[];
}

const PROJECT_DETAILS: Record<string, ProjectDetail> = {
  '48413-002': {
    projectNumber: '48413-002',
    title: 'Myanmar National Electrification Project (NEP)',
    status: 'Active',
    date: 'Mar 2022',
    geographicScope: ['Myanmar', 'Southeast Asia', 'Nationwide'],
    overview: 'Expanding electricity access to 1.5M rural households via solar mini-grids and grid extension in 55 townships.',
    keyActivities: [
      'Deploy solar mini-grid systems across 55 townships',
      'Grid extension to reach remote communities',
      'Smart metering and household connections',
      'Capacity building for local utilities',
      'Gender-inclusive employment in energy sector',
    ],
    expectedOutcomes: [
      '1.5 million rural households with electricity access',
      'CO₂ emissions reduced vs diesel baseline',
      '500+ solar mini-grids installed and operational',
      'Women comprising ≥30% of energy workforce',
    ],
    analysisSummary: "This energy intervention aligns with ADB's Strategy 2030 operational priorities on quality infrastructure, rural development, and climate resilience. With a $180M commitment, it addresses critical infrastructure gaps in Myanmar's energy sector. The project's geographic focus—covering Southeast Asia, Nationwide—positions it to generate significant spillover effects across connected economic zones. Economic multiplier effects are estimated at 1.8–2.4× the direct investment value through improved productivity, reduced costs, and employment generation. Gender and social inclusion mainstreaming is embedded across all output areas.",
    analysisStats: [
      { label: 'Strategy 2030 Alignment', value: 'High — Operational Priorities 1, 3, 6' },
      { label: 'SDG Mapping', value: 'SDG 7, 11' },
      { label: 'Economic Multiplier', value: '1.8–2.4×' },
      { label: 'Climate Co-Benefits', value: 'Mitigation + Adaptation' },
    ],
    keyFacts: [
      { label: 'Borrower', value: 'Republic of the Union of Myanmar' },
      { label: 'Executing Agency', value: 'Ministry of Electricity & Energy' },
      { label: 'Loan Type', value: 'ADF Concessional Loan' },
      { label: 'Approval Date', value: 'Mar 2022' },
      { label: 'Expected Closing', value: 'Dec 2028' },
    ],
    photo: '/adb-home/search/674261-role-insurance-financing-climate-risk.jpg',
    relatedDocs: [
      { label: 'Project Data Sheet', url: 'https://www.adb.org/projects/48413-002/main' },
      { label: 'Initial Poverty & Social Analysis', url: 'https://www.adb.org/projects/48413-002/main' },
      { label: 'Environmental Assessment Summary', url: 'https://www.adb.org/projects/48413-002/main' },
      { label: 'Project Administration Manual', url: 'https://www.adb.org/projects/48413-002/main' },
    ],
  },
};

export type ChatMsg =
  | { id: number; type: 'user'; text: string }
  | { id: number; type: 'thinking' }
  | { id: number; type: 'ai'; text: string; projects?: ProjectWidget[]; artifactProject?: string; chartConfig?: ChartConfig };

const AI_RESPONSES: Array<{ text: string; projects?: ProjectWidget[] }> = [
  { text: `ADB has committed $100 billion in climate financing from 2019 to 2030. Projects span renewable energy, resilient infrastructure, clean transport, and nature-based solutions across 68 member countries. Priority areas include Pacific island nations facing sea-level rise and coal-dependent economies undergoing just energy transitions.` },
  { text: `ADB's Climate Change Action Plan 2023–2030 targets 50% of all new financing toward climate adaptation in the most vulnerable countries, and scales up private-sector co-financing through guarantees and blended finance. ADB co-leads the Climate Investment Funds alongside other multilateral development banks.` },
  { text: `For deeper research, explore the ADB Projects database for country-level breakdowns and the Climate Finance publications section for reporting frameworks. You can also contact ADB's climate change team directly via adb.org/contacts.` },
];

const MYANMAR_AI_RESPONSES: Array<{ text: string; projects?: ProjectWidget[]; autoOpenProject?: string; chartConfig?: ChartConfig }> = [
  {
    text: `ADB currently has 4 active projects in Myanmar across transport, water and sanitation, health, and financial inclusion — with a combined commitment of approximately $680 million. Here are the key active projects:`,
    projects: [
      { projectNumber: '46390-001', title: 'Rural Roads Improvement Project', status: 'Active', country: 'Myanmar', sector: 'Transport', url: 'https://www.adb.org/projects/46390-001/main' },
      { projectNumber: '52107-001', title: 'Water Supply and Sanitation Development in Dry Zone', status: 'Active', country: 'Myanmar', sector: 'Water & Urban', url: 'https://www.adb.org/projects/52107-001/main' },
      { projectNumber: '51353-001', title: 'Financial Inclusion Program', status: 'Active', country: 'Myanmar', sector: 'Finance', url: 'https://www.adb.org/projects/51353-001/main' },
      { projectNumber: '46390-002', title: 'Rural Primary Health Care and Sanitation Improvement', status: 'Active', country: 'Myanmar', sector: 'Health', url: 'https://www.adb.org/projects/46390-002/main' },
      { projectNumber: '48413-002', title: 'Myanmar National Electrification Project (NEP)', status: 'Active', country: 'Myanmar', sector: 'Energy', url: 'https://www.adb.org/projects/48413-002/main' },
    ],
  },
  {
    text: `The Myanmar National Electrification Project (NEP) is one of ADB's flagship energy investments in Myanmar, supporting the government's goal of achieving universal electricity access. The project finances grid extension to rural and peri-urban households, off-grid solar home systems for remote communities, and strengthening of the national power utility's operational and financial capacity. As of 2024, the project has connected over 1.2 million households to electricity — directly improving quality of life, enabling economic activity, and reducing reliance on kerosene and diesel.`,
    autoOpenProject: '48413-002',
  },
  {
    text: `Myanmar's rural electrification rate has climbed from approximately 16% in 2010 to an estimated 65% in 2024 — a fourfold increase driven by grid extension, solar home systems, and mini-grid deployments.`,
    chartConfig: {
      title: 'Electricity Access Rate — Myanmar',
      subtitle: 'National vs. rural population with access to electricity, 2010–2024',
      yUnit: '%',
      years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      series: [
        { name: 'National', color: '#007DB7', values: [28,30,33,35,38,40,43,47,51,56,59,62,65,68,72] },
        { name: 'Rural',    color: '#8DC63F', values: [16,17,19,21,24,27,30,34,38,42,44,47,52,58,65] },
      ],
      contentBlocks: [
        { heading: 'Overview', body: 'Myanmar\'s national electrification rate rose from 28% in 2010 to 72% in 2024, while rural access grew even faster — from 16% to 65% — reflecting the outsized impact of off-grid and mini-grid programmes in underserved communities.' },
        { heading: 'Rural gap', body: 'The rural–urban access gap narrowed from over 40 percentage points in 2010 to under 8 points by 2024, one of the fastest closures in Southeast Asia. Solar home systems and mini-grids were pivotal in reaching the final mile.' },
        { heading: 'NEP impact', body: 'The National Electrification Project, approved in 2022, accelerated the pace further. Targeted townships saw access jump by an average of 12 percentage points per year — roughly triple the pre-project rate.' },
      ],
      citations: [
        { label: 'ADB Project Database', text: 'Project monitoring and evaluation data for Myanmar NEP (48413-002), ADB Operations Portal.', type: 'live', url: 'https://www.adb.org/projects/48413-002/main' },
        { label: 'Asian Development Outlook', text: 'Asian Development Outlook April 2024 — ADB flagship economic publication covering growth, inflation and energy transition across Asia.', type: 'doc', url: 'https://www.adb.org/publications/asian-development-outlook-april-2024', pdfUrl: '/ado-april-2024.pdf' },
      ],
    },
  },
  {
    text: `ADB's annual energy commitments across Southeast Asia have grown substantially, with Vietnam and Indonesia consistently receiving the largest allocations. Myanmar's pipeline peaked with the NEP's $180M approval in 2022.`,
    chartConfig: {
      title: 'ADB Energy Commitments — Southeast Asia',
      subtitle: 'Annual loan and grant approvals for energy sector projects ($M), 2015–2024',
      yUnit: '$M',
      years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      series: [
        { name: 'Vietnam',     color: '#007DB7', values: [210,180,350,420,280,150,200,310,380,290] },
        { name: 'Indonesia',   color: '#E87722', values: [180,240,320,190,380,220,310,260,350,400] },
        { name: 'Philippines', color: '#8DC63F', values: [120,90,160,200,150,280,180,320,290,240] },
        { name: 'Myanmar',     color: '#8B2FC9', values: [0,0,45,80,120,0,0,180,35,20] },
      ],
      contentBlocks: [
        { heading: 'Overview', body: 'ADB energy sector commitments across Southeast Asia have grown from roughly $510M in 2015 to over $950M in 2024, reflecting the bank\'s accelerating clean energy mandate under Strategy 2030.' },
        { heading: 'Vietnam & Indonesia', body: 'Vietnam and Indonesia dominate the regional pipeline, attracting $290M and $400M respectively in 2024 through grid modernisation, renewable energy, and energy efficiency programmes.' },
        { heading: 'Myanmar', body: 'Myanmar\'s commitment peaked at $180M in 2022 with the NEP approval. Subsequent years reflect smaller technical assistance and capacity-building grants pending a stabilised operating environment.' },
      ],
      citations: [
        { label: 'Asian Development Outlook', text: 'Asian Development Outlook April 2024 — ADB flagship economic publication covering growth, inflation and energy transition across Asia.', type: 'doc', url: 'https://www.adb.org/publications/asian-development-outlook-april-2024', pdfUrl: '/ado-april-2024.pdf' },
        { label: 'ADB Project Database', text: 'Live project data for energy sector approvals, ADB Operations Portal.', type: 'live', url: 'https://www.adb.org/projects' },
      ],
    },
  },
  {
    text: `Township-level monitoring data shows a stark divergence between electrified and non-electrified communities. By 2024, household income indices in electrified townships reached 198 — nearly double the 2010 baseline — versus just 129 in non-electrified areas.`,
    chartConfig: {
      title: 'Household Income Index — Electrified vs Non-Electrified Townships',
      subtitle: 'Index: 2010 = 100. Myanmar township-level monitoring data, 2010–2024.',
      yUnit: 'idx',
      years: [2010,2012,2014,2016,2018,2020,2022,2024],
      series: [
        { name: 'Electrified',     color: '#007DB7', values: [100,108,118,131,148,153,174,198] },
        { name: 'Non-electrified', color: '#E87722', values: [100,104,109,114,119,120,124,129] },
      ],
      contentBlocks: [
        { heading: 'Overview', body: 'Electrified townships in Myanmar have seen household income grow at roughly 4.8% per year on a real basis since 2010 — nearly four times the 1.5% average seen in non-electrified communities over the same period.' },
        { heading: 'Economic drivers', body: 'Extended operating hours for small businesses, cold-chain storage enabling food and agriculture commerce, and improved access to digital financial services are the three primary income-growth channels identified in ADB impact assessments.' },
        { heading: 'Caveat', body: 'Income indices are derived from household survey proxies (expenditure, asset ownership) across 120 sampled townships. Values are indicative estimates and should be interpreted alongside qualitative community-level evidence.' },
      ],
      citations: [
        { label: 'ADB Impact Evaluation', text: 'Mid-term review and impact assessment, Myanmar National Electrification Project (48413-002), ADB 2024.', type: 'doc', url: 'https://www.adb.org/projects/48413-002/main' },
        { label: 'MNPED Survey Data', text: 'Myanmar National Planning & Economic Development household income and expenditure survey, 2010–2024.', type: 'live', url: 'https://www.adb.org/projects/48413-002/main' },
      ],
    },
  },
  { text: `This is a prototype interface. In the full system I would query ADB's live knowledge base to give you a precise answer. Please refer to the initial summary above or visit adb.org for comprehensive information.` },
];

const GUARDRAIL: { text: string } = { text: `This is a prototype interface. In the full system I would query ADB's live knowledge base to give you a precise answer. Please refer to the initial summary above or visit adb.org for comprehensive information.` };

const RELATED = [
  `What is ADB's $100 billion climate finance target?`,
  `How does ADB support Pacific island nations on climate?`,
  `What blended finance instruments does ADB use?`,
];

const MYANMAR_RELATED = [
  `Tell me more about Myanmar National Electrification Project (NEP)`,
  `What pipeline projects does ADB have planned for Myanmar?`,
  `How does ADB support financial inclusion in Myanmar?`,
];

const MYANMAR_DATA_PROMPTS = [
  `How has electricity access in rural Myanmar changed since 2010?`,
  `Compare ADB energy investment across Southeast Asia`,
  `What's the economic impact of electrification on household income?`,
];

@Component({
  selector: 'app-ai-chat-panel',
  standalone: true,
  imports: [UpperCasePipe, PdfViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ai-chat-panel.component.html',
  styleUrl: './ai-chat-panel.component.scss',
})
export class AiChatPanelComponent implements OnDestroy {
  query          = input<string>('');
  open           = input<boolean>(false);
  seedText       = input<string>('');
  relatedQueries = input<string[]>([]);
  close = output<void>();

  private cdr       = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  selectedProject = signal<ProjectDetail | null>(null);
  detailLoading   = signal(false);
  chatWidth       = signal(480);
  resizing        = signal(false);
  aiVisible       = signal(false);
  relatedLoaded   = signal(false);
  elapsed         = signal(0);
  phaseIdx        = signal(0);
  loaderCollapsed = signal(false);
  messages          = signal<ChatMsg[]>([]);
  promptText        = signal('');
  promptFocused     = signal(false);
  showDataExplorer  = signal(false);
  hoverIdx          = signal<number | null>(null);
  hoverMsgId        = signal<number | null>(null);
  sourcesOpen       = signal<Record<number, boolean>>({});
  pdfPane           = signal<ChartCitation | null>(null);
  thumbs            = signal<Record<string, 'up' | 'down' | null>>({});
  copiedKey         = signal<string | null>(null);
  readonly dataPrompts = MYANMAR_DATA_PROMPTS;

  readonly phases  = ['Thinking', 'Searching knowledge base', 'Preparing results'];
  readonly thoughts = [
    'Parsing query intent and identifying key concepts...',
    'Scanning ADB knowledge base for relevant entries...',
    'Ranking results by relevance and recency...',
  ];

  isMyanmarCtx   = computed(() => this.query().toLowerCase().includes('myanmar'));
  aiSeed         = computed(() => this.seedText() || (this.isMyanmarCtx() ? MYANMAR_AI_RESPONSES[0].text : AI_RESPONSES[0].text));
  aiSeedProjects = computed(() => this.isMyanmarCtx() && !this.seedText() ? (MYANMAR_AI_RESPONSES[0].projects ?? []) : []);
  activeRelated  = computed(() => this.relatedQueries().length ? this.relatedQueries() : (this.isMyanmarCtx() ? MYANMAR_RELATED : RELATED));

  currentPhase  = computed(() => this.phases[this.phaseIdx() % this.phases.length]);
  currentThought = computed(() => this.thoughts[this.phaseIdx() % this.thoughts.length]);
  canSubmit     = computed(() => this.promptText().trim().length > 0);

  private scriptIdx = 1;
  private timerInterval?: ReturnType<typeof setInterval>;
  private phaseInterval?: ReturnType<typeof setInterval>;
  private aiTimer?: ReturnType<typeof setTimeout>;
  private relatedTimer?: ReturnType<typeof setTimeout>;
  private followUpTimers: ReturnType<typeof setTimeout>[] = [];

  @ViewChild('thread') threadRef!: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (isOpen) untracked(() => this.startSession());
    });
  }

  startSession() {
    this.clearAllTimers();
    this.aiVisible.set(false);
    this.relatedLoaded.set(false);
    this.elapsed.set(0);
    this.phaseIdx.set(0);
    this.loaderCollapsed.set(false);
    this.messages.set([]);
    this.promptText.set('');
    this.showDataExplorer.set(false);
    this.sourcesOpen.set({});
    this.pdfPane.set(null);
    this.scriptIdx = 1;

    this.timerInterval = setInterval(() => {
      this.elapsed.update(v => v + 1);
      this.cdr.markForCheck();
    }, 1000);

    this.phaseInterval = setInterval(() => {
      if (this.phaseIdx() < this.phases.length - 1) {
        this.phaseIdx.update(i => i + 1);
        this.cdr.markForCheck();
      } else {
        clearInterval(this.phaseInterval);
      }
    }, 1500);

    this.aiTimer = setTimeout(() => {
      clearInterval(this.timerInterval);
      clearInterval(this.phaseInterval);
      this.aiVisible.set(true);
      this.cdr.markForCheck();
    }, 4000);

    this.relatedTimer = setTimeout(() => {
      this.relatedLoaded.set(true);
      this.cdr.markForCheck();
      this.scrollToBottom();
    }, 4500);
  }

  sendFollowUp(text?: string) {
    const t = (text ?? this.promptText()).trim();
    if (!t) return;
    this.promptText.set('');
    this.showDataExplorer.set(false);

    const uid = Date.now();
    this.messages.update(msgs => [
      ...msgs,
      { id: uid,     type: 'user' as const, text: t },
      { id: uid + 1, type: 'thinking' as const },
    ]);
    this.cdr.markForCheck();
    this.scrollToBottom();

    const delay = 900 + Math.random() * 400;
    const t1 = setTimeout(() => {
      const pool = this.isMyanmarCtx() ? MYANMAR_AI_RESPONSES : AI_RESPONSES;
      const entry = this.scriptIdx < pool.length ? pool[this.scriptIdx++] : GUARDRAIL;

      const autoOpen   = (entry as any).autoOpenProject as string | undefined;
      const chartCfg   = (entry as any).chartConfig as ChartConfig | undefined;
      this.messages.update(msgs =>
        msgs.map(m => m.id === uid + 1
          ? { id: uid + 1, type: 'ai' as const, text: entry.text, projects: (entry as any).projects, artifactProject: autoOpen, chartConfig: chartCfg }
          : m
        )
      );
      if (autoOpen) {
        const detail = PROJECT_DETAILS[autoOpen];
        if (detail) this.openDetailWithLoading(detail);
        this.showDataExplorer.set(true);
      }
      this.cdr.markForCheck();
      this.scrollToLastResponse();
    }, delay);
    this.followUpTimers.push(t1);
  }

  onPromptKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (this.canSubmit()) this.sendFollowUp();
    }
  }

  onClose() {
    this.selectedProject.set(null);
    this.pdfPane.set(null);
    this.close.emit();
  }

  onProjectClick(e: Event, projectNumber: string) {
    const detail = PROJECT_DETAILS[projectNumber];
    if (detail) {
      e.preventDefault();
      this.openDetailWithLoading(detail);
    }
  }

  private chatScrollPos = 0;

  private openDetailWithLoading(detail: ProjectDetail) {
    this.chatScrollPos = this.threadRef?.nativeElement?.scrollTop ?? 0;
    this.chatWidth.set(Math.floor(window.innerWidth / 2));
    this.selectedProject.set(detail);
    this.detailLoading.set(true);
    this.cdr.markForCheck();
    setTimeout(() => {
      this.detailLoading.set(false);
      this.cdr.markForCheck();
    }, 1400);
  }

  onResizerMouseDown(e: MouseEvent) {
    e.preventDefault();
    const startX     = e.clientX;
    const startWidth = this.chatWidth();
    this.resizing.set(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (me: MouseEvent) => {
      const newWidth = Math.min(window.innerWidth - 420, Math.max(280, startWidth + me.clientX - startX));
      this.chatWidth.set(newWidth);
      this.cdr.markForCheck();
    };
    const onUp = () => {
      this.resizing.set(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  closeDetail() {
    this.selectedProject.set(null);
    setTimeout(() => {
      const el = this.threadRef?.nativeElement;
      if (el) el.scrollTop = this.chatScrollPos;
    }, 0);
  }

  isUser(m: ChatMsg): m is { id: number; type: 'user'; text: string } { return m.type === 'user'; }
  isThinking(m: ChatMsg): m is { id: number; type: 'thinking' }        { return m.type === 'thinking'; }
  isAI(m: ChatMsg): m is { id: number; type: 'ai'; text: string; projects?: ProjectWidget[]; artifactProject?: string; chartConfig?: ChartConfig } { return m.type === 'ai'; }

  buildChart(config: ChartConfig): ComputedChart { return buildChartData(config); }

  safePdfUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  renderAiText(text: string, citations?: ChartCitation[]): SafeHtml {
    let html = `<p style="margin:0;font-size:14px;line-height:1.65;color:#1a1a2e;white-space:pre-line">${text}`;
    if (citations?.length) {
      const extra = citations.length - 1;
      html += ` <span class="acp__cite-chip" data-action="toggle-sources" style="display:inline-flex;align-items:center;cursor:pointer;background:#EBF5FB;border:1px solid #BDD9EA;border-radius:20px;padding:2px 9px;font-size:10px;color:#007DB7;margin-left:5px;vertical-align:middle;white-space:nowrap;user-select:none">${citations[0].label}${extra > 0 ? ` +${extra}` : ''}</span>`;
    }
    html += `</p>`;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  handleCiteClick(e: MouseEvent, msgId: number) {
    const target = e.target as HTMLElement;
    if (target.dataset['action'] === 'toggle-sources') this.toggleSources(msgId);
  }

  openSource(citation: ChartCitation) {
    if (citation.pdfUrl) {
      this.chatScrollPos = this.threadRef?.nativeElement?.scrollTop ?? 0;
      this.chatWidth.set(Math.floor(window.innerWidth / 2));
      this.selectedProject.set(null);
      this.pdfPane.set(this.pdfPane()?.label === citation.label ? null : citation);
      this.cdr.markForCheck();
    } else if (citation.url) {
      window.open(citation.url, '_blank', 'noopener');
    }
  }

  closePdfPane() {
    this.pdfPane.set(null);
    setTimeout(() => {
      const el = this.threadRef?.nativeElement;
      if (el) el.scrollTop = this.chatScrollPos;
    }, 0);
  }

  onChartHover(e: MouseEvent, chart: ComputedChart, msgId: number) {
    const svgEl = (e.currentTarget as SVGRectElement).closest('svg')!;
    const rect = svgEl.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) * (chart.svgW / rect.width);
    const closest = chart.xCoords.reduce((best, cx, i) =>
      Math.abs(cx - svgX) < Math.abs(chart.xCoords[best] - svgX) ? i : best, 0);
    this.hoverIdx.set(closest);
    this.hoverMsgId.set(msgId);
    this.cdr.markForCheck();
  }

  onChartLeave() {
    this.hoverIdx.set(null);
    this.hoverMsgId.set(null);
    this.cdr.markForCheck();
  }

  formatChartVal(v: number, unit: string): string {
    if (unit === '$M') return `$${v.toFixed(0)}M`;
    if (unit === '%')  return `${v.toFixed(1)}%`;
    return v.toFixed(0);
  }

  toggleSources(msgId: number) {
    this.sourcesOpen.update(map => ({ ...map, [msgId]: !map[msgId] }));
    this.cdr.markForCheck();
  }

  sourcesOpenFor(msgId: number): boolean {
    return this.sourcesOpen()[msgId] ?? false;
  }

  getThumb(key: string): 'up' | 'down' | null { return this.thumbs()[key] ?? null; }

  setThumb(key: string, dir: 'up' | 'down') {
    this.thumbs.update(s => ({ ...s, [key]: s[key] === dir ? null : dir }));
    this.cdr.markForCheck();
  }

  async copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.copiedKey.set(key);
      this.cdr.markForCheck();
      setTimeout(() => { this.copiedKey.set(null); this.cdr.markForCheck(); }, 2000);
    } catch {}
  }

  onViewSummary(e: Event, projectNumber: string) {
    e.stopPropagation();
    const detail = PROJECT_DETAILS[projectNumber];
    if (!detail) return;

    const uid = Date.now();
    this.messages.update(msgs => [
      ...msgs,
      { id: uid,     type: 'user'    as const, text: `View project summary: ${detail.title}` },
      { id: uid + 1, type: 'thinking' as const },
    ]);
    this.cdr.markForCheck();
    this.scrollToBottom();
    this.openDetailWithLoading(detail);

    const t = setTimeout(() => {
      this.messages.update(msgs =>
        msgs.map(m => m.id === uid + 1
          ? { id: uid + 1, type: 'ai' as const, text: `Here's the AI-generated project summary for ${detail.title}. You can reopen it anytime using the card below.`, artifactProject: projectNumber }
          : m
        )
      );
      if (this.isMyanmarCtx()) {
        if (this.scriptIdx <= 1) this.scriptIdx = 2;
        this.showDataExplorer.set(true);
      }
      this.cdr.markForCheck();
      this.scrollToLastResponse();
    }, 900);
    this.followUpTimers.push(t);
  }

  projectTitle(projectNumber: string): string {
    return PROJECT_DETAILS[projectNumber]?.title ?? projectNumber;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      'Active': 'active', 'Proposed': 'proposed', 'Approved': 'approved',
      'Closed': 'closed', 'Archived': 'archived', 'Dropped / Terminated': 'dropped',
    };
    return map[status] ?? 'closed';
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.threadRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 40);
  }

  private scrollToLastResponse() {
    setTimeout(() => {
      const el = this.threadRef?.nativeElement;
      if (!el) return;
      const msgs = el.querySelectorAll<HTMLElement>('.acp__msg--ai');
      const last = msgs[msgs.length - 1];
      if (last) el.scrollTop = last.offsetTop - 12;
    }, 40);
  }

  private clearAllTimers() {
    clearInterval(this.timerInterval);
    clearInterval(this.phaseInterval);
    clearTimeout(this.aiTimer);
    clearTimeout(this.relatedTimer);
    this.followUpTimers.forEach(t => clearTimeout(t));
    this.followUpTimers = [];
  }

  ngOnDestroy() { this.clearAllTimers(); }
}
