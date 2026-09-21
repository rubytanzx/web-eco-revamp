import { Component, computed, inject, signal } from '@angular/core';
import { TablerIconComponent } from '@tabler/icons-angular';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';
import { PvChart } from '../shared/pv-chart/pv-chart';
import { IntentTreemap } from '../shared/intent-treemap/intent-treemap';
import { DrawerStateService } from '../shared/drawer-state.service';

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

  private readonly drawerState = inject(DrawerStateService);

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
    this.drawerState.isOpen.set(id !== null);
  }

  closeTopicDrawer() {
    this.selectedTopic.set(null);
    this.drawerState.isOpen.set(false);
  }

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
    'country-pages': 'Country Pages',      'proj-ops':  'Project Operations',
    publications:    'Publications & Research', 'news-events': 'News & Events',
    sectors:         'Sectors & Themes',   climate:     'Climate & Environment',
    private:         'Private Sector',     jobs:        'Jobs & Procurement',
    'other-c':       'Other',
    energy:          'Energy & Power',     transport:   'Transport',
    water:           'Water & Sanitation', agriculture: 'Agriculture',
    finance:         'Finance',            urban:       'Urban Dev.',
    health:          'Health',             education:   'Education',
    digital:         'Digital',
    'web-pages':     'Web Pages',          pdf:         'Publications (PDF)',
    'data-stats':    'Data / Statistics',  'news-releases': 'News Releases',
    'proj-profiles': 'Project Profiles',   events:      'Events',
    microsites:      'Microsites',         'other-ct':  'Other',
  };

  readonly selectedTopicLabel = computed(() => {
    const id = this.selectedTopic();
    return id ? (this.topicNames[id] ?? id) : null;
  });

  private readonly allDrilldowns: Record<string, DrilldownRow[]> = {
    'country-pages': [
      { prompt: 'Where can I find the country partnership strategy for the Philippines?', response: 'The Philippines Country Partnership Strategy 2023–2028 is available on adb.org/countries/philippines/strategy.', user: 'Maria Santos', dept: 'SERD', date: '2026-08-08' },
      { prompt: 'What is included in the country operations business plan for Bangladesh?', response: 'The Bangladesh COBP outlines a three-year indicative lending pipeline and technical assistance program aligned with country priorities.', user: 'James Reyes', dept: 'SARD', date: '2026-08-07' },
      { prompt: 'What is the total ADB lending to Indonesia in 2025?', response: 'ADB approved $2.8 billion in loans and grants to Indonesia in 2025, covering energy, transport, and social sectors.', user: 'Priya Nair', dept: 'SERD', date: '2026-08-06' },
      { prompt: 'Show me the country profile for Vietnam on ADB.org', response: 'The Vietnam country profile on adb.org/countries/viet-nam includes economic data, active projects, and the latest partnership strategy.', user: 'David Lim', dept: 'EARD', date: '2026-08-05' },
    ],
    'proj-ops': [
      { prompt: 'What is the loan status for ADB project P51134 in Sri Lanka?', response: 'Project P51134 (Sri Lanka Urban Water Supply) is in implementation. Disbursement is at 42% as of June 2026.', user: 'Ana Cruz', dept: 'SARD', date: '2026-08-08' },
      { prompt: 'Where can I find project completion reports for Bangladesh transport projects?', response: 'Project Completion Reports for Bangladesh transport are listed under adb.org/countries/bangladesh/projects filtered by sector.', user: 'Raj Patel', dept: 'SARD', date: '2026-08-07' },
      { prompt: 'Show disbursement data for ADB loans to Pacific islands in 2025', response: 'Pacific disbursements in 2025 totalled $620 million, with Papua New Guinea and Fiji accounting for the largest shares.', user: 'Sofia Lee', dept: 'PARD', date: '2026-08-06' },
      { prompt: 'List active ADB projects in Cambodia', response: 'ADB has 18 active projects in Cambodia covering energy, roads, water, and agriculture with a total portfolio of $1.4 billion.', user: 'Kevin Tan', dept: 'SERD', date: '2026-08-05' },
    ],
    publications: [
      { prompt: 'Where can I download the latest Asian Development Outlook?', response: 'The Asian Development Outlook 2026 is available at adb.org/outlook. The April edition projects 4.9% GDP growth for developing Asia.', user: 'Aisha Malik', dept: 'ERCD', date: '2026-08-08' },
      { prompt: 'Find working papers on digital finance in Southeast Asia', response: 'Several working papers on digital finance are available in the ADB Publications library, including WP-678 on mobile payment adoption.', user: 'Chen Wei', dept: 'ERCD', date: '2026-08-07' },
      { prompt: 'Is the ADB Annual Report 2025 available for download?', response: 'The ADB Annual Report 2025 is available at adb.org/annual-report as a full PDF and interactive online version.', user: 'Laura Gomez', dept: 'BPGE', date: '2026-08-06' },
      { prompt: 'What research reports has ERCD published on poverty trends in Asia?', response: 'ERCD\'s recent poverty research includes reports on multidimensional poverty, rural income gaps, and post-pandemic recovery across DMCs.', user: 'Omar Hassan', dept: 'ERCD', date: '2026-08-05' },
    ],
    'news-events': [
      { prompt: 'When is the next ADB Board of Directors meeting scheduled?', response: 'The next ADB Board of Directors meeting is scheduled for October 14, 2026. Agenda items are posted on adb.org/board.', user: 'Nina Park', dept: 'BPGE', date: '2026-08-08' },
      { prompt: 'Find the press release on ADB\'s green bond issuance in 2026', response: 'ADB issued a $1.5 billion green bond in March 2026. The press release is at adb.org/news/adb-issues-green-bond-2026.', user: 'Maria Santos', dept: 'ERCD', date: '2026-08-07' },
      { prompt: 'Is ADB participating in COP31 events?', response: 'ADB will host a pavilion at COP31 in Brazil focusing on climate finance, just energy transition, and nature-based solutions.', user: 'James Reyes', dept: 'CCSA', date: '2026-08-06' },
      { prompt: 'What press releases were issued about the ADB Annual Meeting 2026?', response: 'Fourteen press releases covered the 2026 Annual Meeting, including outcomes on climate finance and new DMC lending commitments.', user: 'Priya Nair', dept: 'BPGE', date: '2026-08-05' },
    ],
    sectors: [
      { prompt: 'What is ADB\'s gender strategy and how is it implemented?', response: 'ADB\'s Gender Equality and Social Inclusion operational plan requires gender action plans for all loan projects and tracks GAP compliance.', user: 'David Lim', dept: 'CCSA', date: '2026-08-08' },
      { prompt: 'Describe ADB\'s approach to digital development', response: 'ADB\'s digital operational plan promotes digital connectivity, e-government, fintech access, and digital skills across DMCs.', user: 'Ana Cruz', dept: 'SDCC', date: '2026-08-07' },
      { prompt: 'How does ADB support regional cooperation in South Asia?', response: 'ADB leads the South Asia Subregional Economic Cooperation (SASEC) program, linking Bangladesh, Bhutan, India, Maldives, Myanmar, Nepal, and Sri Lanka.', user: 'Raj Patel', dept: 'SARD', date: '2026-08-06' },
      { prompt: 'What governance projects is ADB financing?', response: 'ADB finances governance reforms including revenue management, public financial management, anti-corruption frameworks, and civil service modernisation.', user: 'Sofia Lee', dept: 'SDCC', date: '2026-08-05' },
    ],
    climate: [
      { prompt: 'What is ADB\'s climate finance target for 2030?', response: 'ADB has committed to mobilising $100 billion in cumulative climate finance by 2030, covering both mitigation and adaptation investments.', user: 'Kevin Tan', dept: 'CCSA', date: '2026-08-08' },
      { prompt: 'What projects are funded under the Climate Change Fund?', response: 'The ADB Climate Change Fund has co-financed over 80 projects in clean energy, coastal resilience, and sustainable water management.', user: 'Aisha Malik', dept: 'CCSA', date: '2026-08-07' },
      { prompt: 'What is the Energy Transition Mechanism and how does it work?', response: 'The ETM accelerates coal plant retirement by blending ADB loans, grants, and private finance to replace coal with renewables.', user: 'Chen Wei', dept: 'SDCC', date: '2026-08-06' },
      { prompt: 'Does ADB have projects on nature-based solutions?', response: 'ADB finances nature-based solutions including mangrove restoration, urban green infrastructure, and watershed management across Asia and the Pacific.', user: 'Laura Gomez', dept: 'CCSA', date: '2026-08-05' },
    ],
    private: [
      { prompt: 'What private sector operations does ADB run through PSOD?', response: 'ADB\'s Private Sector Operations Department provides direct loans, equity investments, and guarantees to private companies in DMCs without sovereign guarantee.', user: 'Omar Hassan', dept: 'PSOD', date: '2026-08-08' },
      { prompt: 'Tell me about ADB Ventures and how to apply for funding', response: 'ADB Ventures is an early-stage equity fund backing technology startups tackling climate and development challenges. Apply at ventures.adb.org.', user: 'Nina Park', dept: 'PSOD', date: '2026-08-07' },
      { prompt: 'What cofinancing arrangements does ADB have with development partners?', response: 'ADB has cofinancing partnerships with over 40 bilateral and multilateral partners, mobilising additional resources through parallel and co-loans.', user: 'Maria Santos', dept: 'PSOD', date: '2026-08-06' },
      { prompt: 'What guarantees does ADB offer to private investors?', response: 'ADB offers political risk guarantees and partial credit guarantees to mobilise private investment in infrastructure, energy, and finance sectors.', user: 'James Reyes', dept: 'PSOD', date: '2026-08-05' },
    ],
    jobs: [
      { prompt: 'How do I find ADB consultant vacancies on adb.org?', response: 'Consultant opportunities are listed at adb.org/work-with-us/consultants. Register on the ADB Consultant Management System to receive notifications.', user: 'Priya Nair', dept: 'BPGE', date: '2026-08-08' },
      { prompt: 'Where can I find ADB\'s procurement guidelines for borrowers?', response: 'ADB Procurement Policy (2017) and Procurement Regulations for ADB Borrowers are at adb.org/site/business-opportunities/procurement.', user: 'David Lim', dept: 'SDCC', date: '2026-08-07' },
      { prompt: 'How do I register as a vendor with ADB?', response: 'Vendors can register through the ADB vendor portal. The process requires company profile submission, tax documentation, and compliance certification.', user: 'Ana Cruz', dept: 'BPGE', date: '2026-08-06' },
      { prompt: 'Where are ADB contract awards announced?', response: 'Contract award notices are published at adb.org/work-with-us/procurement/contract-awards and updated monthly.', user: 'Raj Patel', dept: 'SDCC', date: '2026-08-05' },
    ],
    'other-c': [
      { prompt: 'What financial inclusion initiatives does ADB support?', response: 'ADB supports financial inclusion through microfinance loans, digital payment infrastructure, and women-focused savings programs across the Pacific and South Asia.', user: 'Sofia Lee', dept: 'PARD', date: '2026-08-08' },
      { prompt: 'Where can I find ADB member country fact sheets?', response: 'Fact sheets for all 68 ADB member countries are at adb.org/who-we-are/members, including voting power, capital subscriptions, and country summaries.', user: 'Kevin Tan', dept: 'BPGE', date: '2026-08-07' },
      { prompt: 'List ADB resident missions and their locations', response: 'ADB has over 30 resident missions and representative offices across Asia and the Pacific. A full list is at adb.org/about/offices.', user: 'Aisha Malik', dept: 'SERD', date: '2026-08-06' },
      { prompt: 'How does ADB\'s accountability mechanism work?', response: 'The ADB Accountability Mechanism allows project-affected people to file complaints about ADB-financed projects through problem-solving and compliance review tracks.', user: 'Chen Wei', dept: 'ERCD', date: '2026-08-05' },
    ],
    energy: [
      { prompt: 'What is the Energy Transition Mechanism status in the Philippines?', response: 'The Philippines ETM pilot, launched with ADB in 2022, is advancing coal plant retirement through a blended finance structure. Details at adb.org/etm.', user: 'Laura Gomez', dept: 'SERD', date: '2026-08-08' },
      { prompt: 'Find ADB solar energy projects in Bangladesh', response: 'ADB has financed three solar projects in Bangladesh totalling 380 MW, including the Dhaka Solar Power project and Rural Solar Electrification Initiative.', user: 'Omar Hassan', dept: 'SARD', date: '2026-08-07' },
      { prompt: 'What is ADB\'s total renewable energy financing in 2025?', response: 'ADB approved $4.2 billion in renewable energy financing in 2025, covering solar, wind, geothermal, and hydropower projects across DMCs.', user: 'Nina Park', dept: 'SDCC', date: '2026-08-06' },
      { prompt: 'How does ADB support energy access in remote Pacific islands?', response: 'ADB\'s Pacific Renewable Energy Program supports solar minigrids and battery storage in remote island communities across Fiji, Vanuatu, and Solomon Islands.', user: 'Maria Santos', dept: 'PARD', date: '2026-08-05' },
    ],
    transport: [
      { prompt: 'What road safety initiatives is ADB financing in Asia?', response: 'ADB\'s road safety program supports engineering improvements, enforcement capacity, and public awareness campaigns across 12 DMCs through the Road Safety Trust Fund.', user: 'James Reyes', dept: 'SERD', date: '2026-08-08' },
      { prompt: 'What are the Greater Mekong Subregion transport corridors?', response: 'The GMS has nine economic corridors linking China, Myanmar, Thailand, Lao PDR, Cambodia, and Vietnam with roads, bridges, and border crossing upgrades.', user: 'Priya Nair', dept: 'SERD', date: '2026-08-07' },
      { prompt: 'Does ADB finance urban mobility projects?', response: 'ADB finances bus rapid transit, metro systems, cycling infrastructure, and non-motorised transport in cities including Hanoi, Manila, and Dhaka.', user: 'David Lim', dept: 'SARD', date: '2026-08-06' },
      { prompt: 'What railway modernisation projects is ADB funding?', response: 'ADB is funding railway modernisation in Bangladesh, Uzbekistan, and the Philippines, covering track upgrades and rolling stock procurement.', user: 'Ana Cruz', dept: 'CWRD', date: '2026-08-05' },
    ],
    water: [
      { prompt: 'What is ADB\'s water security strategy?', response: 'ADB\'s Water Security Operational Plan prioritises safe drinking water, water productivity, and integrated water resources management across DMCs.', user: 'Raj Patel', dept: 'SDCC', date: '2026-08-08' },
      { prompt: 'Find ADB WASH projects in Pacific island countries', response: 'ADB has active WASH projects in Kiribati, Samoa, and Tonga improving sanitation, hygiene behaviour change, and water supply reliability.', user: 'Sofia Lee', dept: 'PARD', date: '2026-08-07' },
      { prompt: 'Does ADB finance sewage treatment plants in South Asia?', response: 'ADB finances wastewater treatment in Bangladesh, India, and Sri Lanka through urban sector loans, including the Dhaka sanitation and Chennai wastewater projects.', user: 'Kevin Tan', dept: 'SARD', date: '2026-08-06' },
      { prompt: 'What rural water supply programs does ADB support in Cambodia?', response: 'ADB\'s rural water supply projects in Cambodia have provided piped water access to over 500,000 households in underserved provinces.', user: 'Aisha Malik', dept: 'SERD', date: '2026-08-05' },
    ],
    agriculture: [
      { prompt: 'What is ADB\'s approach to food security financing?', response: 'ADB\'s food security programs support value chain development, irrigation modernisation, and input access in agriculture-dependent DMCs.', user: 'Chen Wei', dept: 'SERD', date: '2026-08-08' },
      { prompt: 'Find ADB projects on rice value chains in Southeast Asia', response: 'ADB has financed rice value chain projects in Cambodia, Lao PDR, and Myanmar covering seed systems, post-harvest infrastructure, and market linkages.', user: 'Laura Gomez', dept: 'SERD', date: '2026-08-07' },
      { prompt: 'How does ADB support climate-smart agriculture?', response: 'ADB promotes climate-smart agriculture through drought-tolerant seed varieties, water-efficient irrigation, and farmer training on adaptive practices.', user: 'Omar Hassan', dept: 'CCSA', date: '2026-08-06' },
      { prompt: 'What agriculture modernisation loans has ADB approved for the Philippines?', response: 'ADB approved a $400 million agriculture modernisation loan to the Philippines in 2025 covering irrigation, value chains, and digital agri extension.', user: 'Nina Park', dept: 'SERD', date: '2026-08-05' },
    ],
    finance: [
      { prompt: 'How does ADB\'s Trade Finance Program work?', response: 'The ADB Trade Finance Program issues guarantees and loans to banks in DMCs to support trade transactions. It has facilitated over $70 billion since 2004.', user: 'Maria Santos', dept: 'PSOD', date: '2026-08-08' },
      { prompt: 'What SME finance programs does ADB offer?', response: 'ADB supports SME finance through credit lines to local banks, guarantee facilities, and technical assistance for credit scoring and digital lending platforms.', user: 'James Reyes', dept: 'PSOD', date: '2026-08-07' },
      { prompt: 'Does ADB support capital market development?', response: 'ADB leads the ASEAN+3 Bond Market Initiative and finances capital market reforms including bond issuance frameworks, clearing systems, and investor capacity.', user: 'Priya Nair', dept: 'ERCD', date: '2026-08-06' },
      { prompt: 'What financial sector reform projects has ADB funded in Central Asia?', response: 'ADB has supported financial sector reforms in Kazakhstan, Kyrgyz Republic, and Tajikistan covering banking supervision, payment systems, and microfinance.', user: 'David Lim', dept: 'CWRD', date: '2026-08-05' },
    ],
    urban: [
      { prompt: 'What urban development projects is ADB financing in India?', response: 'ADB is financing urban projects in Rajasthan, Karnataka, and Tamil Nadu covering water supply, sanitation, urban roads, and smart city infrastructure.', user: 'Ana Cruz', dept: 'SARD', date: '2026-08-08' },
      { prompt: 'What is the Cities Development Initiative for Asia?', response: 'The Cities Development Initiative for Asia (CDIA) helps secondary cities develop investment plans and access climate-smart infrastructure financing.', user: 'Raj Patel', dept: 'SDCC', date: '2026-08-07' },
      { prompt: 'Does ADB finance affordable housing?', response: 'ADB finances affordable housing through sovereign loans and private sector operations in countries including Papua New Guinea, Fiji, and Indonesia.', user: 'Sofia Lee', dept: 'PARD', date: '2026-08-06' },
      { prompt: 'What does ADB do to build urban resilience?', response: 'ADB\'s urban resilience work covers flood risk management, heat-resilient infrastructure, climate-proofed drainage, and disaster risk finance in Asian cities.', user: 'Kevin Tan', dept: 'CCSA', date: '2026-08-05' },
    ],
    health: [
      { prompt: 'What is ADB\'s health sector operational plan?', response: 'ADB\'s health operational plan supports universal health coverage, health financing reform, and disease prevention across DMCs in Asia and the Pacific.', user: 'Aisha Malik', dept: 'SARD', date: '2026-08-08' },
      { prompt: 'What has ADB done on pandemic preparedness?', response: 'ADB established a $20 billion COVID-19 response package, supported vaccine procurement, and is developing a regional health security framework for future pandemics.', user: 'Chen Wei', dept: 'SDCC', date: '2026-08-07' },
      { prompt: 'How does ADB support universal health coverage?', response: 'ADB finances UHC through health insurance scheme development, primary care strengthening, and human resource planning in Southeast and Central Asia.', user: 'Laura Gomez', dept: 'SERD', date: '2026-08-06' },
      { prompt: 'Find ADB health system strengthening projects in the Pacific', response: 'ADB has health system projects in Papua New Guinea, Solomon Islands, and Timor-Leste covering infrastructure, medical supplies, and health workforce training.', user: 'Omar Hassan', dept: 'PARD', date: '2026-08-05' },
    ],
    education: [
      { prompt: 'What education projects is ADB funding in Central Asia?', response: 'ADB is funding education projects in the Kyrgyz Republic, Tajikistan, and Uzbekistan covering curriculum reform, textbook supply, and school rehabilitation.', user: 'Nina Park', dept: 'CWRD', date: '2026-08-08' },
      { prompt: 'Find information on ADB\'s TVET programs', response: 'ADB supports TVET in Indonesia, Philippines, and Bangladesh through curriculum modernisation, industry partnerships, and trainer development programs.', user: 'Maria Santos', dept: 'SERD', date: '2026-08-07' },
      { prompt: 'Does ADB finance school infrastructure?', response: 'ADB finances school construction and rehabilitation in Pacific island countries, Cambodia, and Myanmar to improve learning environments and disaster resilience.', user: 'James Reyes', dept: 'PARD', date: '2026-08-06' },
      { prompt: 'What is the Skills for Inclusive Growth program?', response: 'Skills for Inclusive Growth is an ADB regional technical assistance program supporting DMCs to improve skills systems and employment outcomes for youth.', user: 'Priya Nair', dept: 'SARD', date: '2026-08-05' },
    ],
    digital: [
      { prompt: 'What is ADB\'s digital economy strategy?', response: 'ADB\'s Digital Agenda 2030 supports connectivity, digital government, fintech access, data governance, and digital skills across member countries.', user: 'David Lim', dept: 'SDCC', date: '2026-08-08' },
      { prompt: 'Find ADB fintech projects in Southeast Asia', response: 'ADB has fintech projects in Cambodia, Indonesia, and Philippines covering digital payment infrastructure, regulatory sandboxes, and financial data standards.', user: 'Ana Cruz', dept: 'SERD', date: '2026-08-07' },
      { prompt: 'What e-government projects is ADB financing?', response: 'ADB finances e-government in Armenia, Georgia, Uzbekistan, and Pacific states through digital public service platforms, digital ID, and GovTech capacity building.', user: 'Raj Patel', dept: 'CWRD', date: '2026-08-06' },
      { prompt: 'What is the Digital Infrastructure Trust Fund?', response: 'The ADB Digital Infrastructure Trust Fund provides grant financing for connectivity infrastructure and digital economy capacity in LDCs and Pacific DMCs.', user: 'Sofia Lee', dept: 'SDCC', date: '2026-08-05' },
    ],
    'web-pages': [
      { prompt: 'Where is the country partnership strategy page for Pakistan?', response: 'The Pakistan country partnership strategy page is at adb.org/countries/pakistan/strategy and includes the current CPS, results framework, and annual updates.', user: 'Kevin Tan', dept: 'CWRD', date: '2026-08-08' },
      { prompt: 'Find the ADB climate finance page', response: 'ADB\'s climate finance overview is at adb.org/results/climate-change. It shows cumulative finance, sector breakdown, and links to major climate programs.', user: 'Aisha Malik', dept: 'CCSA', date: '2026-08-07' },
      { prompt: 'Is there a Pacific Operations page on ADB.org?', response: 'The Pacific Operations portal is at adb.org/countries/pacific and covers all Pacific DMCs with country pages, project lists, and regional program information.', user: 'Chen Wei', dept: 'PARD', date: '2026-08-06' },
      { prompt: 'Where is the accountability mechanism page on ADB.org?', response: 'The Accountability Mechanism page is at adb.org/accountability-mechanism and explains the complaints process, eligibility criteria, and past cases.', user: 'Laura Gomez', dept: 'ERCD', date: '2026-08-05' },
    ],
    pdf: [
      { prompt: 'Where can I download the Asian Development Outlook 2026 PDF?', response: 'The ADO 2026 PDF is at adb.org/outlook/pdf. The main report covers macroeconomic forecasts and thematic chapters for developing Asia.', user: 'Omar Hassan', dept: 'ERCD', date: '2026-08-08' },
      { prompt: 'Download the ADB Annual Report 2025 PDF', response: 'The ADB Annual Report 2025 PDF is at adb.org/annual-report-2025/pdf. It includes financial statements, results highlights, and the President\'s message.', user: 'Nina Park', dept: 'BPGE', date: '2026-08-07' },
      { prompt: 'Find a PDF working paper on remittances and poverty in Pacific islands', response: 'Working Paper WP-712 on remittances and poverty in Pacific islands is available in the ADB Publications database at adb.org/publications.', user: 'Maria Santos', dept: 'ERCD', date: '2026-08-06' },
      { prompt: 'Is the ADB poverty analysis for Cambodia available as a PDF?', response: 'The Cambodia poverty analysis report (2024) is available for download at adb.org/countries/cambodia/poverty as an 88-page PDF.', user: 'James Reyes', dept: 'SERD', date: '2026-08-05' },
    ],
    'data-stats': [
      { prompt: 'What are ADB\'s GDP growth forecasts for the Philippines in 2026?', response: 'ADB forecasts 6.2% GDP growth for the Philippines in 2026, driven by domestic consumption, public infrastructure, and services sector recovery.', user: 'Priya Nair', dept: 'ERCD', date: '2026-08-08' },
      { prompt: 'Where can I find the Key Indicators for Asia and the Pacific publication?', response: 'Key Indicators 2025 is at adb.org/publications/key-indicators-asia-pacific-2025 and covers 49 DMCs with economic, social, and environmental statistics.', user: 'David Lim', dept: 'ERCD', date: '2026-08-07' },
      { prompt: 'Show ADB disbursement data by country for 2025', response: 'ADB disbursed $18.6 billion in 2025. Country-level disbursement data is in the Annual Report Appendix and the ADB Data Library at data.adb.org.', user: 'Ana Cruz', dept: 'BPGE', date: '2026-08-06' },
      { prompt: 'What are the poverty headcount ratios for ADB member countries?', response: 'Poverty headcount data at national and regional levels is in the Key Indicators publication and the ADB Data Library at data.adb.org.', user: 'Raj Patel', dept: 'ERCD', date: '2026-08-05' },
    ],
    'news-releases': [
      { prompt: 'Find the press release on ADB\'s 2030 climate finance commitment', response: 'The press release on ADB\'s $100 billion climate finance commitment is at adb.org/news/adb-commits-100-billion-climate-finance-2030.', user: 'Sofia Lee', dept: 'CCSA', date: '2026-08-08' },
      { prompt: 'Is there a press release about ADB\'s debt restructuring support for Sri Lanka?', response: 'ADB\'s press release on Sri Lanka debt restructuring support is in the news archive, published January 2026, announcing $1.3 billion in budget support.', user: 'Kevin Tan', dept: 'SARD', date: '2026-08-07' },
      { prompt: 'Find the announcement for the ADB gender equity fund', response: 'The Women\'s Livelihood Bond and Gender Equity Fund announcement is in the ADB news archive under Finance and Private Sector categories.', user: 'Aisha Malik', dept: 'PSOD', date: '2026-08-06' },
      { prompt: 'Where are press releases from the 2026 ADB Governors Meeting?', response: 'Press releases from the 59th Annual Meeting of the Board of Governors are archived at adb.org/news/annual-meeting-2026.', user: 'Chen Wei', dept: 'BPGE', date: '2026-08-05' },
    ],
    'proj-profiles': [
      { prompt: 'Find the project profile for loan 3940-PHI', response: 'Loan 3940-PHI (Metro Manila Flood Management) project profile is at adb.org/projects/51367-001/main with project scope, financing, and implementation updates.', user: 'Laura Gomez', dept: 'SERD', date: '2026-08-08' },
      { prompt: 'Show me the project profile for the Dhaka urban transport project', response: 'The Dhaka Urban Transport Project profile is at adb.org/projects/49094-001/main, covering a $300 million loan approved in 2022.', user: 'Omar Hassan', dept: 'SARD', date: '2026-08-07' },
      { prompt: 'List all ADB project profiles for water projects in the Pacific', response: 'Pacific water project profiles are filterable at adb.org/projects using the Pacific region and water sector filters. Currently 14 active projects are listed.', user: 'Nina Park', dept: 'PARD', date: '2026-08-06' },
      { prompt: 'What project details are available for the Maldives port modernisation project?', response: 'The Maldives Port Modernisation project profile (Loan 4012-MLD) includes project scope, environmental safeguards, and disbursement schedule at adb.org/projects.', user: 'Maria Santos', dept: 'SARD', date: '2026-08-05' },
    ],
    events: [
      { prompt: 'When is the ADB Annual Meeting 2027 and where will it be held?', response: 'The 60th ADB Annual Meeting will be held in Seoul, Republic of Korea in May 2027. Registration details will be at adb.org/annual-meeting.', user: 'James Reyes', dept: 'BPGE', date: '2026-08-08' },
      { prompt: 'Where can I access recordings from ADB webinars on climate finance?', response: 'Recordings of ADB climate finance webinars are at adb.org/events under the Knowledge Events filter, including the Just Energy Transition webinar series.', user: 'Priya Nair', dept: 'CCSA', date: '2026-08-07' },
      { prompt: 'Is there an upcoming co-financing workshop I can register for?', response: 'ADB\'s Co-financing Workshop is scheduled for November 2026 in Manila. Registration is available at adb.org/events/cofinancing-workshop-2026.', user: 'David Lim', dept: 'PSOD', date: '2026-08-06' },
      { prompt: 'Where do I register for ADB training programs on project management?', response: 'ADB Institute training programs on project management are at adb.org/adbi/events. Upcoming courses include Results-Based Project Management in October 2026.', user: 'Ana Cruz', dept: 'ERCD', date: '2026-08-05' },
    ],
    microsites: [
      { prompt: 'How do I access the ADB Careers portal?', response: 'The ADB Careers portal is at careers.adb.org. It lists staff and ADB Resident Mission vacancies with application instructions and eligibility criteria.', user: 'Raj Patel', dept: 'BPGE', date: '2026-08-08' },
      { prompt: 'Where is the ADB Data Library?', response: 'The ADB Data Library is at data.adb.org and provides open-access datasets on DMC economies, including poverty, environment, and governance indicators.', user: 'Sofia Lee', dept: 'ERCD', date: '2026-08-07' },
      { prompt: 'Where can I access the ADB Evaluation Hub?', response: 'The ADB Evaluation Hub is at evaluationhub.adb.org and hosts all Independent Evaluation Department reports, ratings, and thematic evaluations.', user: 'Kevin Tan', dept: 'ERCD', date: '2026-08-06' },
      { prompt: 'Is there a Pacific Operations microsite on ADB.org?', response: 'The Pacific Operations portal at adb.org/countries/pacific functions as a microsite with country dashboards, project maps, and regional program summaries.', user: 'Aisha Malik', dept: 'PARD', date: '2026-08-05' },
    ],
    'other-ct': [
      { prompt: 'Where can I access ADB\'s multimedia library?', response: 'ADB\'s multimedia library is at multimedia.adb.org, offering photos, videos, and infographics for use under ADB\'s terms of use.', user: 'Chen Wei', dept: 'BPGE', date: '2026-08-08' },
      { prompt: 'Does ADB have historical archives available online?', response: 'ADB\'s historical documents, including early board minutes and project archives, are available through the ADB Library at lib.adb.org.', user: 'Laura Gomez', dept: 'ERCD', date: '2026-08-07' },
      { prompt: 'Find ADB photo galleries for recent country missions', response: 'Recent country mission photo galleries are posted on ADB\'s Flickr account and linked from the multimedia library at multimedia.adb.org.', user: 'Omar Hassan', dept: 'SERD', date: '2026-08-06' },
      { prompt: 'Is there an ADB store where I can order publications?', response: 'ADB publications can be ordered at adb.org/publications/ordering. Select publications are also available through regional book distributors.', user: 'Nina Park', dept: 'BPGE', date: '2026-08-05' },
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
