import { UpperCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  ElementRef, OnDestroy, ViewChild, computed, effect,
  inject, input, output, signal, untracked,
} from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { PdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';

type ContactSuggestion = {
  keyword: string;
  contacts: Array<{
    name: string;
    title: string;
    dept: string;
    email: string;
    skills: string[];
    photo: string;
  }>;
};


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
  linkDomain?: string;
  tags?: string[];
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
  pointOfContact?: { name: string; title: string; email: string; photo?: string };
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
    photo: '/adb-home/search/vid-thumb-philippines-wind-farm_6.jpg',
    relatedDocs: [
      { label: 'Project Data Sheet', url: 'https://www.adb.org/projects/48413-002/main' },
      { label: 'Initial Poverty & Social Analysis', url: 'https://www.adb.org/projects/48413-002/main' },
      { label: 'Environmental Assessment Summary', url: 'https://www.adb.org/projects/48413-002/main' },
      { label: 'Project Administration Manual', url: 'https://www.adb.org/projects/48413-002/main' },
    ],
  },
  '1011-NEP': {
    projectNumber: '1011-NEP',
    title: 'Seventh Power Project',
    status: 'Closed',
    date: '11 Jan 1990',
    geographicScope: ['Nepal', 'South Asia', 'Nationwide'],
    overview: 'A $65.8 million investment to rehabilitate electricity distribution networks in five major urban centres — Hetauda, Birgunj, Butwal, Bhairahawa, and Dharan — and extend rural electrification to previously unelectrified communities across the country. The project connected almost 1,000 load centres and delivered electricity to more than 200,000 new customers, making it one of the largest rural electrification initiatives in Nepal at the time.',
    keyActivities: [
      'Rehabilitate distribution networks in five major towns: Hetauda, Birgunj, Butwal, Bhairahawa, and Dharan',
      'Extend subtransmission and distribution networks to six unelectrified rural areas',
      'Install 2,500 km of high-voltage and 2,300 km of low-voltage distribution lines',
      'Construct concrete pole factory with daily capacity of 58 prestressed poles',
      'Institutional capacity building and training for Nepal Electricity Authority (NEA)',
    ],
    expectedOutcomes: [
      'More than 200,000 new rural customers connected to electricity',
      '2,500 km high-voltage and 2,300 km low-voltage distribution lines installed',
      'Quality and reliability of power supply improved across five major urban centres',
      'EIRR of 24.6% (urban component) and 19.2% (rural component) achieved at completion',
      '185 MVA of transformer capacity added to the distribution network',
    ],
    analysisSummary: "Rated overall successful by ADB's Operations Evaluation Department. The urban rehabilitation component achieved an EIRR of 24.6%, exceeding the appraisal estimate of 22.2%. The rural electrification EIRR reached 19.2% — significantly above the appraisal estimate of 13.5% — driven by a 2.4× increase in new connections versus target. Actual project cost of $65.8M exceeded the appraisal estimate of $56M due to scope expansion and construction of the concrete pole factory. The project established the foundation for NEA's long-term distribution network and remains a landmark in Nepal's electrification history.",
    analysisStats: [
      { label: 'Evaluation Rating', value: 'Successful' },
      { label: 'Urban EIRR', value: '24.6% (est. 22.2%)' },
      { label: 'Rural EIRR', value: '19.2% (est. 13.5%)' },
      { label: 'SDG Mapping', value: 'SDG 7, 11' },
    ],
    keyFacts: [
      { label: 'Borrower', value: 'Kingdom of Nepal' },
      { label: 'Executing Agency', value: 'Nepal Electricity Authority' },
      { label: 'Loan Amount', value: '$51M (ADF Special Funds)' },
      { label: 'Total Project Cost', value: '$65.8M' },
      { label: 'Approval Date', value: '11 Jan 1990' },
      { label: 'Loan Closing', value: '9 Aug 1999' },
    ],
    relatedDocs: [
      { label: 'Project Performance Audit Report', url: 'https://www.adb.org/documents/seventh-power-project-nepal-loan-1011-nepsf' },
      { label: 'Project Data Sheet', url: 'https://www.adb.org/documents/seventh-power-project-nepal-loan-1011-nepsf' },
    ],
    pointOfContact: { name: 'Anita Sharma', title: 'Senior Energy Specialist', email: 'asharma@adb.org', photo: 'https://api.dicebear.com/9.x/lorelei/svg?seed=AnitaSharma&backgroundColor=b6e3f4' },
  },
};

export type ChatMsg =
  | { id: number; type: 'user'; text: string }
  | { id: number; type: 'thinking' }
  | { id: number; type: 'ai'; text: string; projects?: ProjectWidget[]; artifactProject?: string; chartConfig?: ChartConfig; contactSuggestion?: ContactSuggestion };

const AI_RESPONSES: Array<{ text: string; projects?: ProjectWidget[] }> = [
  { text: `ADB has committed $100 billion in climate financing from 2019 to 2030. Projects span renewable energy, resilient infrastructure, clean transport, and nature-based solutions across 68 member countries. Priority areas include Pacific island nations facing sea-level rise and coal-dependent economies undergoing just energy transitions.` },
  { text: `ADB's Climate Change Action Plan 2023–2030 targets 50% of all new financing toward climate adaptation in the most vulnerable countries, and scales up private-sector co-financing through guarantees and blended finance. ADB co-leads the Climate Investment Funds alongside other multilateral development banks.` },
  { text: `For deeper research, explore the ADB Projects database for country-level breakdowns and the Climate Finance publications section for reporting frameworks. You can also contact ADB's climate change team directly via adb.org/contacts.` },
];

const MYANMAR_AI_RESPONSES: Array<{ text: string; projects?: ProjectWidget[]; autoOpenProject?: string; chartConfig?: ChartConfig }> = [
  {
    text: `ADB currently has 4 active projects in Myanmar across transport, water and sanitation, health, and financial inclusion — with a combined commitment of approximately $680 million. Here are the key active projects:`,
    projects: [
      { projectNumber: '46390-001', title: 'Rural Roads Improvement Project', status: 'Active', country: 'Myanmar', sector: 'Transport', url: 'https://www.adb.org/projects/46390-001/main', linkDomain: 'adb.org', tags: ['Connectivity', 'Rural development'] },
      { projectNumber: '52107-001', title: 'Water Supply and Sanitation Development in Dry Zone', status: 'Active', country: 'Myanmar', sector: 'Water & Urban', url: 'https://www.adb.org/projects/52107-001/main', linkDomain: 'data.adb.org', tags: ['WASH', 'Climate resilience'] },
      { projectNumber: '51353-001', title: 'Financial Inclusion Program', status: 'Active', country: 'Myanmar', sector: 'Finance', url: 'https://www.adb.org/projects/51353-001/main', linkDomain: 'development.asia', tags: ['SME finance', 'Gender inclusion'] },
      { projectNumber: '46390-002', title: 'Rural Primary Health Care and Sanitation Improvement', status: 'Active', country: 'Myanmar', sector: 'Health', url: 'https://www.adb.org/projects/46390-002/main', linkDomain: 'evaluation.adb.org', tags: ['Primary health', 'Sanitation'] },
      { projectNumber: '48413-002', title: 'Myanmar National Electrification Project (NEP)', status: 'Active', country: 'Myanmar', sector: 'Energy', url: 'https://www.adb.org/projects/48413-002/main', linkDomain: 'adbi.adb.org', tags: ['Rural electrification', 'Clean energy'] },
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

const NEPAL_CONTACTS: ContactSuggestion = {
  keyword: 'Nepal Energy',
  contacts: [
    { name: 'Anita Sharma', title: 'Senior Energy Specialist', dept: 'Nepal Resident Mission', email: 'asharma@adb.org', skills: ['Rural Electrification', 'Power Distribution', 'Energy Access'], photo: 'https://api.dicebear.com/9.x/lorelei/svg?seed=AnitaSharma&backgroundColor=b6e3f4' },
    { name: 'Rajesh Patel', title: 'Energy Portfolio Manager', dept: 'South Asia Dept', email: 'rpatel@adb.org', skills: ['Clean Energy', 'Project Evaluation', 'Country Strategy'], photo: 'https://api.dicebear.com/9.x/lorelei/svg?seed=RajeshPatel&backgroundColor=ffd5dc' },
    { name: 'Sarah Kim', title: 'Infrastructure Evaluation Specialist', dept: 'Independent Evaluation Dept', email: 'skim@adb.org', skills: ['Project Assessment', 'EIRR Analysis', 'Impact Evaluation'], photo: 'https://api.dicebear.com/9.x/lorelei/svg?seed=SarahKim&backgroundColor=c0aede' },
  ],
};

const NEPAL_AI_RESPONSES: Array<{ text: string; projects?: ProjectWidget[]; autoOpenProject?: string; suggestions?: string[]; chartConfig?: ChartConfig; contactSuggestion?: ContactSuggestion }> = [
  {
    text: `ADB has 6 active projects in Nepal across transport, water and sanitation, health, and financial inclusion — with a combined commitment of approximately $920 million. Here are the key active projects:`,
    projects: [
      { projectNumber: '46390-001', title: 'Rural Roads Improvement Project', status: 'Active', country: 'Nepal', sector: 'Transport', url: 'https://www.adb.org/projects/46390-001/main', linkDomain: 'adb.org', tags: ['Connectivity', 'Rural development'] },
      { projectNumber: '52107-001', title: 'Water Supply and Sanitation Development in Dry Zone', status: 'Active', country: 'Nepal', sector: 'Water & Urban', url: 'https://www.adb.org/projects/52107-001/main', linkDomain: 'data.adb.org', tags: ['WASH', 'Climate resilience'] },
      { projectNumber: '51353-001', title: 'Financial Inclusion Program', status: 'Active', country: 'Nepal', sector: 'Finance', url: 'https://www.adb.org/projects/51353-001/main', linkDomain: 'development.asia', tags: ['SME finance', 'Gender inclusion'] },
      { projectNumber: '46390-002', title: 'Rural Primary Health Care and Sanitation Improvement', status: 'Active', country: 'Nepal', sector: 'Health', url: 'https://www.adb.org/projects/46390-002/main', linkDomain: 'evaluation.adb.org', tags: ['Primary health', 'Sanitation'] },
      { projectNumber: '52322-001', title: 'Flood and Landslide Risk Reduction Project', status: 'Proposed', country: 'Nepal', sector: 'Water & Urban', url: 'https://www.adb.org/projects/52322-001/main', linkDomain: 'adbi.adb.org', tags: ['Disaster resilience', 'Climate adaptation'] },
      { projectNumber: '1011-NEP', title: 'Seventh Power Project', status: 'Closed', country: 'Nepal', sector: 'Energy', url: 'https://www.adb.org/documents/seventh-power-project-nepal-loan-1011-nepsf', linkDomain: 'evaluation.adb.org', description: 'A $65.8M investment rehabilitating urban distribution networks and connecting 200,000+ rural customers to electricity across Nepal.', tags: ['Rural electrification', 'Distribution'] },
    ],
    suggestions: [
      `Tell me more about the Rural Roads Improvement Project`,
      `What is ADB's total commitment in Nepal?`,
      `How does ADB support climate resilience in Nepal?`,
    ],
  },
  {
    text: `The Seventh Power Project (Loan 1011-NEP[SF]) is one of ADB's most significant early energy investments in Nepal — rehabilitating electricity distribution in five major towns and extending rural electrification across the country. Approved in January 1990 with a $51 million ADF Special Funds loan, the project connected over 200,000 new customers and installed 2,500 km of high-voltage and 2,300 km of low-voltage lines. ADB's Operations Evaluation Department rated it Successful, with an urban EIRR of 24.6% and rural EIRR of 19.2% — both exceeding appraisal estimates — making it a landmark in Nepal's electrification history.`,
    autoOpenProject: '1011-NEP',
    suggestions: [
      `How has electricity access in Nepal changed since 1990?`,
      `How does ADB support climate resilience in Nepal?`,
      `What pipeline projects are planned for Nepal?`,
    ],
    contactSuggestion: NEPAL_CONTACTS,
  },
  {
    text: `Nepal's electricity access rate has climbed from approximately 7% in 1990 — the year ADB's Seventh Power Project was approved — to 93% nationally and 78% in rural areas by 2024, one of the fastest electrification trajectories in South Asia.`,
    chartConfig: {
      title: 'Electricity Access Rate — Nepal',
      subtitle: 'National vs. rural population with access to electricity, 1990–2024',
      yUnit: '%',
      years: [1990,1995,2000,2005,2010,2015,2020,2024],
      series: [
        { name: 'National', color: '#007DB7', values: [7,12,18,30,42,65,85,93] },
        { name: 'Rural',    color: '#8DC63F', values: [3,6,10,18,28,50,68,78] },
      ],
      contentBlocks: [
        { heading: 'Overview', body: 'Nepal\'s national electrification rate surged from 7% in 1990 to 93% in 2024, while rural access grew from just 3% to 78% — one of the fastest electrification trajectories in South Asia, anchored by successive ADB energy investments.' },
        { heading: 'Seventh Power Project legacy', body: 'The Seventh Power Project (1990–1999) laid the distribution foundation — connecting 200,000+ new customers and establishing NEA\'s operational capacity. Its urban EIRR of 24.6% and rural EIRR of 19.2% both exceeded appraisal estimates, setting a model for subsequent projects.' },
        { heading: 'Path to universal access', body: 'Following the Seventh Power Project, successive ADB and government programmes extended the grid to hill and mountain communities. By 2024, Nepal\'s near-universal access ranks among the highest in the region for a landlocked least-developed country.' },
      ],
      citations: [
        { label: 'ADB Project Performance Audit Report', text: 'Performance Audit Report — Seventh Power Project, Nepal (Loan 1011-NEP[SF]), ADB Operations Evaluation Department, June 2004.', type: 'doc', url: 'https://www.adb.org/documents/seventh-power-project-nepal-loan-1011-nepsf', pdfUrl: '/seventh-power-project-nepal.pdf' },
        { label: 'ADB Project Database', text: 'Project monitoring and evaluation data, ADB Operations Portal.', type: 'live', url: 'https://www.adb.org/projects/1011-NEP/main' },
      ],
    },
    suggestions: [
      `How does ADB support climate resilience in Nepal?`,
      `What pipeline projects are planned for Nepal?`,
      `How does ADB measure project impact?`,
    ],
  },
  {
    text: `Nepal's rural road connectivity has expanded from 28% of rural communities with all-weather access in 2010 to an estimated 71% in 2024 — driven by ADB's transport investments and the Rural Roads Improvement Project.`,
    chartConfig: {
      title: 'Rural Road Connectivity — Nepal',
      subtitle: 'Percentage of rural communities with all-weather road access, 2010–2024',
      yUnit: '%',
      years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      series: [
        { name: 'Rural access',   color: '#007DB7', values: [28,31,34,36,39,43,47,51,54,58,61,63,66,69,71] },
        { name: 'ADB-funded roads', color: '#8DC63F', values: [5,7,9,12,15,18,22,27,32,37,41,45,50,55,59] },
      ],
      contentBlocks: [
        { heading: 'Overview', body: 'Nepal\'s rural road connectivity grew from 28% in 2010 to 71% in 2024, with ADB-funded roads making up a growing share of the all-weather network across hill and Terai regions.' },
        { heading: 'Rural Roads Project impact', body: 'The Rural Roads Improvement Project (46390-001), approved in 2022, upgraded 1,200 km of roads to all-weather standards, directly improving market access for over 2.4 million people in rural townships and reducing average travel times by up to 60%.' },
        { heading: 'Climate resilience', body: 'All upgraded roads incorporate flood-resistant design — improved drainage, slope stabilisation, and higher bridge decks — critical given Nepal\'s extreme vulnerability to monsoon flooding and landslides.' },
      ],
      citations: [
        { label: 'ADB Project Database', text: 'Project monitoring data for Rural Roads Improvement Project (46390-001), ADB Operations Portal.', type: 'live', url: 'https://www.adb.org/projects/46390-001/main' },
        { label: 'Asian Development Outlook', text: 'Asian Development Outlook April 2024 — ADB flagship economic publication covering growth and infrastructure across Asia.', type: 'doc', url: 'https://www.adb.org/publications/asian-development-outlook-april-2024', pdfUrl: '/ado-april-2024.pdf' },
      ],
    },
    suggestions: [
      `What is ADB's total transport investment in Nepal?`,
      `How does ADB support climate resilience in Nepal?`,
      `What pipeline projects are planned for Nepal?`,
    ],
  },
  { text: `This is a prototype interface. In the full system I would query ADB's live knowledge base to give you a precise answer. Please refer to the initial summary above or visit adb.org for comprehensive information.` },
];

const NEPAL_RELATED = [
  `Tell me more about Nepal's Seventh Power Project`,
  `What pipeline projects does ADB have planned for Nepal?`,
  `How does ADB support financial inclusion in Nepal?`,
];

const NEPAL_DATA_PROMPTS = [
  `How has road connectivity in rural Nepal changed since 2010?`,
  `What are the expected outcomes of the Rural Roads project?`,
  `How does ADB support climate resilience in Nepal?`,
];

const MYANMAR_DATA_PROMPTS = [
  `How has electricity access in rural Myanmar changed since 2010?`,
  `Compare ADB energy investment across Southeast Asia`,
  `What's the economic impact of electrification on household income?`,
];

// ── HIW (How to Work with ADB) scripted responses ─────────────────────────────

const HIW_CONTACT: ContactSuggestion = {
  keyword: 'ADB Financing Partnerships',
  contacts: [
    { name: 'Maria Santos', title: 'Senior Financing Partnerships Specialist', dept: 'Office of Cofinancing Operations', email: 'msantos@adb.org', skills: ['Trust Funds', 'Cofinancing', 'NGO Partnerships'], photo: 'https://api.dicebear.com/9.x/lorelei/svg?seed=MariaSantos&backgroundColor=b6e3f4' },
    { name: 'James Lim', title: 'Principal Investment Specialist', dept: 'Private Sector Operations Dept', email: 'jlim@adb.org', skills: ['Blended Finance', 'Private Capital', 'Guarantees'], photo: 'https://api.dicebear.com/9.x/lorelei/svg?seed=JamesLim&backgroundColor=c0aede' },
  ],
};

const HIW_FUNDING_WIDGETS: ProjectWidget[] = [
  {
    projectNumber: 'WFPF',
    title: 'Water Financing Partnership Facility',
    status: 'Active',
    country: 'Asia-Pacific',
    sector: 'Water',
    url: 'https://www.adb.org/what-we-do/funds/water-financing-partnership-facility',
    linkDomain: 'adb.org',
    description: 'Supports water security across Asia-Pacific — urban, rural, and transboundary. Grants available for capacity development and pilot projects.',
    tags: ['Trust Fund', 'Grants', 'Water'],
  },
  {
    projectNumber: 'ACliFF',
    title: 'Asia Pacific Climate Finance Fund',
    status: 'Active',
    country: 'Asia-Pacific',
    sector: 'Climate',
    url: 'https://www.adb.org/what-we-do/funds/asia-pacific-climate-finance-fund',
    linkDomain: 'adb.org',
    description: 'Blended finance instrument to mobilize private capital for climate-resilient infrastructure at concessional rates.',
    tags: ['Blended Finance', 'Climate', '$200M'],
  },
  {
    projectNumber: 'UCCRTF',
    title: 'Urban Climate Change Resilience Trust Fund',
    status: 'Active',
    country: 'Asia-Pacific',
    sector: 'Urban',
    url: 'https://www.adb.org/what-we-do/funds/urban-climate-change-resilience-trust-fund',
    linkDomain: 'adb.org',
    description: 'Focuses on climate adaptation for rapidly urbanizing cities — flood control, water supply, and sanitation for low-income populations.',
    tags: ['Trust Fund', 'Urban', 'Resilience'],
  },
  {
    projectNumber: 'JFPRAP',
    title: 'Japan Fund for Prosperous and Resilient Asia and the Pacific',
    status: 'Active',
    country: 'Asia-Pacific',
    sector: 'Multisector',
    url: 'https://www.adb.org/what-we-do/funds/japan-fund-for-prosperous-and-resilient-asia-and-the-pacific',
    linkDomain: 'adb.org',
    description: 'ADB\'s largest bilateral trust fund. Supports high-quality infrastructure, human capital, and resilience across all sectors.',
    tags: ['Trust Fund', 'Grants', '$500M+'],
  },
];

const HIW_AI_RESPONSES: Array<{ text: string; projects?: ProjectWidget[]; contactSuggestion?: ContactSuggestion; suggestions?: string[] }> = [
  {
    text: `Based on your intent, here are four ADB financing vehicles that could be a strong fit. Each offers different entry points depending on your sector, geography, and organisation type:`,
    projects: HIW_FUNDING_WIDGETS,
  },
  {
    text: `Each fund has its own eligibility criteria and application process. I've flagged two ADB specialists who can walk you through the best pathway for your organisation:`,
    contactSuggestion: HIW_CONTACT,
  },
  {
    text: `ADB typically co-finances with governments, MDBs, and qualified private entities. To move forward, you'd need a government counterpart or an ADB-registered executing agency. Would you like help identifying the right entry point for your organisation type?`,
    suggestions: [
      'What is an executing agency and how do I find one?',
      'Can NGOs apply for ADB trust funds directly?',
      'Show me projects in my sector and region',
    ],
  },
];

const HIW_RELATED = [
  'What types of organisations can access ADB funding?',
  'How long does an ADB project approval take?',
  'Show me active trust funds in Southeast Asia',
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
  query            = input<string>('');
  open             = input<boolean>(false);
  seedText         = input<string>('');
  seedProjects     = input<ProjectWidget[]>([]);
  relatedQueries   = input<string[]>([]);
  embedded         = input<boolean>(false);
  startCompleted   = input<boolean>(false);
  context          = input<string>('');
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

  selectionText   = signal('');
  selectionBtnTop = signal(0);
  selectionBtnLeft = signal(0);
  replyContext    = signal('');
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
  isNepalCtx     = computed(() => this.query().toLowerCase().includes('nepal'));
  isHiwCtx       = computed(() => this.context() === 'hiw');
  aiSeed         = computed(() => {
    if (this.seedText()) return this.seedText();
    if (this.isMyanmarCtx()) return MYANMAR_AI_RESPONSES[0].text;
    if (this.isNepalCtx())   return NEPAL_AI_RESPONSES[0].text;
    if (this.isHiwCtx())     return HIW_AI_RESPONSES[0].text;
    return AI_RESPONSES[0].text;
  });
  aiSeedProjects = computed(() => {
    if (this.seedProjects().length) return this.seedProjects();
    if (this.isMyanmarCtx()) return MYANMAR_AI_RESPONSES[0].projects ?? [];
    if (this.isNepalCtx())   return NEPAL_AI_RESPONSES[0].projects ?? [];
    if (this.isHiwCtx())     return HIW_AI_RESPONSES[0].projects ?? [];
    return [];
  });
  activeRelated  = computed(() => {
    if (this.relatedQueries().length) return this.relatedQueries();
    if (this.isMyanmarCtx()) return MYANMAR_RELATED;
    if (this.isNepalCtx())   return NEPAL_RELATED;
    if (this.isHiwCtx())     return HIW_RELATED;
    return RELATED;
  });

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
    // Full-screen mode: open signal triggers session
    effect(() => {
      const isOpen = this.open();
      const emb = this.embedded();
      if (isOpen && !emb) untracked(() => this.startSession());
    });
    // Embedded mode: query change triggers/restarts session
    effect(() => {
      const q = this.query();
      const emb = this.embedded();
      if (q && emb) untracked(() => this.startSession());
    });
  }

  startSession() {
    this.clearAllTimers();
    this.messages.set([]);
    this.promptText.set('');
    this.showDataExplorer.set(false);
    this.sourcesOpen.set({});
    this.pdfPane.set(null);
    this.scriptIdx = 1;
    this.loaderCollapsed.set(false);

    // When expanding from an already-answered mini chat, skip the loading animation
    if (this.startCompleted()) {
      this.aiVisible.set(true);
      this.relatedLoaded.set(true);
      this.elapsed.set(0);
      this.phaseIdx.set(0);
      this.cdr.markForCheck();
      return;
    }

    this.aiVisible.set(false);
    this.relatedLoaded.set(false);
    this.elapsed.set(0);
    this.phaseIdx.set(0);

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
    const ctx = this.replyContext();
    const raw = (text ?? this.promptText()).trim();
    if (!raw) return;
    const t = ctx ? `"${ctx}"\n\n${raw}` : raw;
    this.promptText.set('');
    this.replyContext.set('');
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
      const pool = this.isMyanmarCtx() ? MYANMAR_AI_RESPONSES : this.isNepalCtx() ? NEPAL_AI_RESPONSES : this.isHiwCtx() ? HIW_AI_RESPONSES : AI_RESPONSES;
      const entry = this.scriptIdx < pool.length ? pool[this.scriptIdx++] : GUARDRAIL;

      const autoOpen        = (entry as any).autoOpenProject as string | undefined;
      const chartCfg        = (entry as any).chartConfig as ChartConfig | undefined;
      const contactSuggest  = (entry as any).contactSuggestion as ContactSuggestion | undefined;
      this.messages.update(msgs =>
        msgs.map(m => m.id === uid + 1
          ? { id: uid + 1, type: 'ai' as const, text: entry.text, projects: (entry as any).projects, artifactProject: autoOpen, chartConfig: chartCfg, contactSuggestion: contactSuggest }
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
    this.clearSelection();
    setTimeout(() => {
      const el = this.threadRef?.nativeElement;
      if (el) el.scrollTop = this.chatScrollPos;
    }, 0);
  }

  onDetailMouseUp(e: MouseEvent) {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? '';
    if (!text || text.length < 10) { this.clearSelection(); return; }
    const range = sel!.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const pane = (e.currentTarget as HTMLElement).closest('.acp__detail') as HTMLElement;
    const paneRect = pane.getBoundingClientRect();
    this.selectionText.set(text);
    this.selectionBtnTop.set(rect.top - paneRect.top - 40);
    this.selectionBtnLeft.set(Math.min(rect.left - paneRect.left, paneRect.width - 180));
    this.cdr.markForCheck();
  }

  clearSelection() {
    this.selectionText.set('');
    this.cdr.markForCheck();
  }

  explainSelection() {
    const quoted = this.selectionText();
    this.clearSelection();
    window.getSelection()?.removeAllRanges();
    this.replyContext.set(quoted);
    this.cdr.markForCheck();
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('.acp__prompt-field');
      input?.focus();
    }, 50);
  }

  onPromptFocus() {
    this.promptFocused.set(true);
    if (window.innerWidth <= 768) {
      if (this.selectedProject()) this.closeDetail();
      else if (this.pdfPane()) this.closePdfPane();
    }
  }

  isUser(m: ChatMsg): m is { id: number; type: 'user'; text: string } { return m.type === 'user'; }
  isThinking(m: ChatMsg): m is { id: number; type: 'thinking' }        { return m.type === 'thinking'; }
  isAI(m: ChatMsg): m is { id: number; type: 'ai'; text: string; projects?: ProjectWidget[]; artifactProject?: string; artifactProjectTitle?: string; chartConfig?: ChartConfig; suggestions?: string[]; contactSuggestion?: ContactSuggestion } { return m.type === 'ai'; }

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

  onViewSummary(e: Event, p: ProjectWidget) {
    e.stopPropagation();
    const detail: ProjectDetail = PROJECT_DETAILS[p.projectNumber] ?? {
      projectNumber: p.projectNumber,
      title: p.title,
      status: p.status,
      date: '',
      geographicScope: [p.country],
      overview: p.description ?? `${p.title} is an ADB project in ${p.country} supporting development in the ${p.sector} sector.`,
      keyActivities: [],
      expectedOutcomes: [],
      analysisSummary: '',
      analysisStats: [],
      keyFacts: [
        { label: 'Country', value: p.country },
        { label: 'Sector', value: p.sector },
        { label: 'Project Number', value: p.projectNumber },
        { label: 'Status', value: p.status },
      ],
      relatedDocs: [{ label: 'Project Data Sheet', url: p.url }],
    };
    const projectNumber = p.projectNumber;

    const uid = Date.now();
    this.messages.update(msgs => [
      ...msgs,
      { id: uid,     type: 'user'    as const, text: `View project summary: ${detail.title}` },
      { id: uid + 1, type: 'thinking' as const },
    ]);
    this.cdr.markForCheck();
    this.scrollToBottom();
    this.openDetailWithLoading(detail);

    const nepalSuggestions = this.isNepalCtx() ? NEPAL_DATA_PROMPTS : undefined;

    const t = setTimeout(() => {
      this.messages.update(msgs =>
        msgs.map(m => m.id === uid + 1
          ? { id: uid + 1, type: 'ai' as const, text: `Here's the AI-generated project summary for ${detail.title}. You can reopen it anytime using the card below.`, artifactProject: projectNumber, artifactProjectTitle: detail.title, suggestions: nepalSuggestions }
          : m
        )
      );
      if (this.isMyanmarCtx()) {
        if (this.scriptIdx <= 1) this.scriptIdx = 2;
        this.showDataExplorer.set(true);
      }
      if (this.isNepalCtx()) {
        if (this.scriptIdx <= 2) this.scriptIdx = 3;
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
