import { AfterViewInit, Component, computed, ElementRef, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';
import { IntentTreemap } from '../shared/intent-treemap/intent-treemap';
import { PvChart } from '../shared/pv-chart/pv-chart';
import { TablerIconComponent } from '@tabler/icons-angular';
import { DrawerStateService } from '../shared/drawer-state.service';

type SearchAiTab = 'search' | 'discovery' | 'sources';

interface DrilldownRow { prompt: string; response: string; dept: string; date: string; }

interface TopQueryRow {
  query: string;
  sessions: number;
  success: number;
  zeroResult: boolean;
  trending: boolean;
}

interface ZeroResultCategory {
  label: string;
  count: number;
  pct: number;
}

interface AiChannelRow {
  channel: string;
  mentions: number;
  citedPages: number;
  share: number;
  trend: string;
}

interface ReadinessRow {
  area: string;
  retrievable: number;
  citationRate: number;
  structured: 'Good' | 'Mixed' | 'Poor';
  freshness: 'Good' | 'Mixed' | 'Poor';
  issue: string;
}

interface SourcesRow {
  page: string;
  url: string;
  citations: number;
  share: number;
  trend: string;
  aiVisible: boolean;
}

interface LosingVisibilityRow {
  page: string;
  decline: string;
  reason: string;
}

@Component({
  selector: 'app-search-ai',
  imports: [DateRangeFilter, DecimalPipe, IntentTreemap, PvChart, TablerIconComponent],
  templateUrl: './search-ai.html',
  styleUrl: './search-ai.css',
})
export class SearchAi implements AfterViewInit {
  private readonly _el = inject(ElementRef);
  private readonly drawerState = inject(DrawerStateService);
  readonly activeTab = signal<SearchAiTab>('search');

  // ── Query intent treemap drawer ───────────────────────────────────
  readonly selectedTopic    = signal<string | null>(null);
  readonly drawerDeptFilter = signal<string>('all');
  readonly drawerWidth      = signal(640);
  private static readonly DRAWER_MIN = 360;
  private static readonly DRAWER_MAX = 0.90;

  readonly topicDrawerOpen = computed(() => this.selectedTopic() !== null);

  private readonly topicNames: Record<string, string> = {
    'country-pages': 'Country Pages', 'proj-ops': 'Project Operations',
    publications: 'Publications & Research', 'news-events': 'News & Events',
    sectors: 'Sectors & Themes', climate: 'Climate & Environment',
    private: 'Private Sector', jobs: 'Jobs & Procurement', 'other-c': 'Other',
    energy: 'Energy & Power', transport: 'Transport', water: 'Water & Sanitation',
    agriculture: 'Agriculture', finance: 'Finance', urban: 'Urban Dev.',
    health: 'Health', education: 'Education', digital: 'Digital',
    'web-pages': 'Web Pages', pdf: 'Publications (PDF)', 'data-stats': 'Data / Statistics',
    'news-releases': 'News Releases', 'proj-profiles': 'Project Profiles',
    events: 'Events', microsites: 'Microsites', 'other-ct': 'Other',
  };

  readonly selectedTopicLabel = computed(() => {
    const id = this.selectedTopic();
    return id ? (this.topicNames[id] ?? id) : null;
  });

  private readonly allDrilldowns: Record<string, DrilldownRow[]> = {
    'country-pages': [
      { prompt: 'Where can I find the country partnership strategy for the Philippines?', response: 'The Philippines Country Partnership Strategy 2023–2028 is available on adb.org/countries/philippines/strategy.', dept: 'SERD', date: '2026-08-08' },
      { prompt: 'What is included in the country operations business plan for Bangladesh?', response: 'The Bangladesh COBP outlines a three-year indicative lending pipeline and technical assistance program aligned with country priorities.', dept: 'SARD', date: '2026-08-07' },
      { prompt: 'What is the total ADB lending to Indonesia in 2025?', response: 'ADB approved $2.8 billion in loans and grants to Indonesia in 2025, covering energy, transport, and social sectors.', dept: 'SERD', date: '2026-08-06' },
      { prompt: 'Show me the country profile for Vietnam on ADB.org', response: 'The Vietnam country profile on adb.org/countries/viet-nam includes economic data, active projects, and the latest partnership strategy.', dept: 'EARD', date: '2026-08-05' },
    ],
    'proj-ops': [
      { prompt: 'What is the loan status for ADB project P51134 in Sri Lanka?', response: 'Project P51134 (Sri Lanka Urban Water Supply) is in implementation. Disbursement is at 42% as of June 2026.', dept: 'SARD', date: '2026-08-08' },
      { prompt: 'Where can I find project completion reports for Bangladesh transport projects?', response: 'Project Completion Reports for Bangladesh transport are listed under adb.org/countries/bangladesh/projects filtered by sector.', dept: 'SARD', date: '2026-08-07' },
      { prompt: 'Show disbursement data for ADB loans to Pacific islands in 2025', response: 'Pacific disbursements in 2025 totalled $620 million, with Papua New Guinea and Fiji accounting for the largest shares.', dept: 'PARD', date: '2026-08-06' },
      { prompt: 'List active ADB projects in Cambodia', response: 'ADB has 18 active projects in Cambodia covering energy, roads, water, and agriculture with a total portfolio of $1.4 billion.', dept: 'SERD', date: '2026-08-05' },
    ],
    publications: [
      { prompt: 'Where can I download the latest Asian Development Outlook?', response: 'The Asian Development Outlook 2026 is available at adb.org/outlook. The April edition projects 4.9% GDP growth for developing Asia.', dept: 'ERCD', date: '2026-08-08' },
      { prompt: 'Find working papers on digital finance in Southeast Asia', response: 'Several working papers on digital finance are available in the ADB Publications library, including WP-678 on mobile payment adoption.', dept: 'ERCD', date: '2026-08-07' },
      { prompt: 'Is the ADB Annual Report 2025 available for download?', response: 'The ADB Annual Report 2025 is available at adb.org/annual-report as a full PDF and interactive online version.', dept: 'BPGE', date: '2026-08-06' },
      { prompt: 'What research reports has ERCD published on poverty trends in Asia?', response: 'ERCD\'s recent poverty research includes reports on multidimensional poverty, rural income gaps, and post-pandemic recovery across DMCs.', dept: 'ERCD', date: '2026-08-05' },
    ],
    'news-events': [
      { prompt: 'When is the next ADB Board of Directors meeting scheduled?', response: 'The next ADB Board of Directors meeting is scheduled for October 14, 2026. Agenda items are posted on adb.org/board.', dept: 'BPGE', date: '2026-08-08' },
      { prompt: 'Find the press release on ADB\'s green bond issuance in 2026', response: 'ADB issued a $1.5 billion green bond in March 2026. The press release is at adb.org/news/adb-issues-green-bond-2026.', dept: 'ERCD', date: '2026-08-07' },
      { prompt: 'Is ADB participating in COP31 events?', response: 'ADB will host a pavilion at COP31 in Brazil focusing on climate finance, just energy transition, and nature-based solutions.', dept: 'CCSA', date: '2026-08-06' },
      { prompt: 'What press releases were issued about the ADB Annual Meeting 2026?', response: 'Fourteen press releases covered the 2026 Annual Meeting, including outcomes on climate finance and new DMC lending commitments.', dept: 'BPGE', date: '2026-08-05' },
    ],
    sectors: [
      { prompt: 'What is ADB\'s gender strategy and how is it implemented?', response: 'ADB\'s Gender Equality and Social Inclusion operational plan requires gender action plans for all loan projects and tracks GAP compliance.', dept: 'CCSA', date: '2026-08-08' },
      { prompt: 'Describe ADB\'s approach to digital development', response: 'ADB\'s digital operational plan promotes digital connectivity, e-government, fintech access, and digital skills across DMCs.', dept: 'SDCC', date: '2026-08-07' },
      { prompt: 'How does ADB support regional cooperation in South Asia?', response: 'ADB leads the South Asia Subregional Economic Cooperation (SASEC) program, linking Bangladesh, Bhutan, India, Maldives, Myanmar, Nepal, and Sri Lanka.', dept: 'SARD', date: '2026-08-06' },
      { prompt: 'What governance projects is ADB financing?', response: 'ADB finances governance reforms including revenue management, public financial management, anti-corruption frameworks, and civil service modernisation.', dept: 'SDCC', date: '2026-08-05' },
    ],
    climate: [
      { prompt: 'What is ADB\'s climate finance target for 2030?', response: 'ADB has committed to mobilising $100 billion in cumulative climate finance by 2030, covering both mitigation and adaptation investments.', dept: 'CCSA', date: '2026-08-08' },
      { prompt: 'What projects are funded under the Climate Change Fund?', response: 'The ADB Climate Change Fund has co-financed over 80 projects in clean energy, coastal resilience, and sustainable water management.', dept: 'CCSA', date: '2026-08-07' },
      { prompt: 'What is the Energy Transition Mechanism and how does it work?', response: 'The ETM accelerates coal plant retirement by blending ADB loans, grants, and private finance to replace coal with renewables.', dept: 'SDCC', date: '2026-08-06' },
      { prompt: 'Does ADB have projects on nature-based solutions?', response: 'ADB finances nature-based solutions including mangrove restoration, urban green infrastructure, and watershed management across Asia and the Pacific.', dept: 'CCSA', date: '2026-08-05' },
    ],
    private: [
      { prompt: 'What private sector operations does ADB run through PSOD?', response: 'ADB\'s Private Sector Operations Department provides direct loans, equity investments, and guarantees to private companies in DMCs without sovereign guarantee.', dept: 'PSOD', date: '2026-08-08' },
      { prompt: 'Tell me about ADB Ventures and how to apply for funding', response: 'ADB Ventures is an early-stage equity fund backing technology startups tackling climate and development challenges. Apply at ventures.adb.org.', dept: 'PSOD', date: '2026-08-07' },
      { prompt: 'What cofinancing arrangements does ADB have with development partners?', response: 'ADB has cofinancing partnerships with over 40 bilateral and multilateral partners, mobilising additional resources through parallel and co-loans.', dept: 'PSOD', date: '2026-08-06' },
      { prompt: 'What guarantees does ADB offer to private investors?', response: 'ADB offers political risk guarantees and partial credit guarantees to mobilise private investment in infrastructure, energy, and finance sectors.', dept: 'PSOD', date: '2026-08-05' },
    ],
    jobs: [
      { prompt: 'How do I find ADB consultant vacancies on adb.org?', response: 'Consultant opportunities are listed at adb.org/work-with-us/consultants. Register on the ADB Consultant Management System to receive notifications.', dept: 'BPGE', date: '2026-08-08' },
      { prompt: 'Where can I find ADB\'s procurement guidelines for borrowers?', response: 'ADB Procurement Policy (2017) and Procurement Regulations for ADB Borrowers are at adb.org/site/business-opportunities/procurement.', dept: 'SDCC', date: '2026-08-07' },
      { prompt: 'How do I register as a vendor with ADB?', response: 'Vendors can register through the ADB vendor portal. The process requires company profile submission, tax documentation, and compliance certification.', dept: 'BPGE', date: '2026-08-06' },
      { prompt: 'Where are ADB contract awards announced?', response: 'Contract award notices are published at adb.org/work-with-us/procurement/contract-awards and updated monthly.', dept: 'SDCC', date: '2026-08-05' },
    ],
    'other-c': [
      { prompt: 'What financial inclusion initiatives does ADB support?', response: 'ADB supports financial inclusion through microfinance loans, digital payment infrastructure, and women-focused savings programs across the Pacific and South Asia.', dept: 'PARD', date: '2026-08-08' },
      { prompt: 'Where can I find ADB member country fact sheets?', response: 'Fact sheets for all 68 ADB member countries are at adb.org/who-we-are/members, including voting power, capital subscriptions, and country summaries.', dept: 'BPGE', date: '2026-08-07' },
      { prompt: 'List ADB resident missions and their locations', response: 'ADB has over 30 resident missions and representative offices across Asia and the Pacific. A full list is at adb.org/about/offices.', dept: 'SERD', date: '2026-08-06' },
      { prompt: 'How does ADB\'s accountability mechanism work?', response: 'The ADB Accountability Mechanism allows project-affected people to file complaints about ADB-financed projects through problem-solving and compliance review tracks.', dept: 'ERCD', date: '2026-08-05' },
    ],
    energy: [
      { prompt: 'What is the Energy Transition Mechanism status in the Philippines?', response: 'The Philippines ETM pilot, launched with ADB in 2022, is advancing coal plant retirement through a blended finance structure. Details at adb.org/etm.', dept: 'SERD', date: '2026-08-08' },
      { prompt: 'Find ADB solar energy projects in Bangladesh', response: 'ADB has financed three solar projects in Bangladesh totalling 380 MW, including the Dhaka Solar Power project and Rural Solar Electrification Initiative.', dept: 'SARD', date: '2026-08-07' },
      { prompt: 'What is ADB\'s total renewable energy financing in 2025?', response: 'ADB approved $4.2 billion in renewable energy financing in 2025, covering solar, wind, geothermal, and hydropower projects across DMCs.', dept: 'SDCC', date: '2026-08-06' },
      { prompt: 'How does ADB support energy access in remote Pacific islands?', response: 'ADB\'s Pacific Renewable Energy Program supports solar minigrids and battery storage in remote island communities across Fiji, Vanuatu, and Solomon Islands.', dept: 'PARD', date: '2026-08-05' },
    ],
    transport: [
      { prompt: 'What road safety initiatives is ADB financing in Asia?', response: 'ADB\'s road safety program supports engineering improvements, enforcement capacity, and public awareness campaigns across 12 DMCs through the Road Safety Trust Fund.', dept: 'SERD', date: '2026-08-08' },
      { prompt: 'What are the Greater Mekong Subregion transport corridors?', response: 'The GMS has nine economic corridors linking China, Myanmar, Thailand, Lao PDR, Cambodia, and Vietnam with roads, bridges, and border crossing upgrades.', dept: 'SERD', date: '2026-08-07' },
      { prompt: 'Does ADB finance urban mobility projects?', response: 'ADB finances bus rapid transit, metro systems, cycling infrastructure, and non-motorised transport in cities including Hanoi, Manila, and Dhaka.', dept: 'SARD', date: '2026-08-06' },
      { prompt: 'What railway modernisation projects is ADB funding?', response: 'ADB is funding railway modernisation in Bangladesh, Uzbekistan, and the Philippines, covering track upgrades and rolling stock procurement.', dept: 'CWRD', date: '2026-08-05' },
    ],
    water: [
      { prompt: 'What is ADB\'s water security strategy?', response: 'ADB\'s Water Security Operational Plan prioritises safe drinking water, water productivity, and integrated water resources management across DMCs.', dept: 'SDCC', date: '2026-08-08' },
      { prompt: 'Find ADB WASH projects in Pacific island countries', response: 'ADB has active WASH projects in Kiribati, Samoa, and Tonga improving sanitation, hygiene behaviour change, and water supply reliability.', dept: 'PARD', date: '2026-08-07' },
      { prompt: 'Does ADB finance sewage treatment plants in South Asia?', response: 'ADB finances wastewater treatment in Bangladesh, India, and Sri Lanka through urban sector loans, including the Dhaka sanitation and Chennai wastewater projects.', dept: 'SARD', date: '2026-08-06' },
      { prompt: 'What rural water supply programs does ADB support in Cambodia?', response: 'ADB\'s rural water supply projects in Cambodia have provided piped water access to over 500,000 households in underserved provinces.', dept: 'SERD', date: '2026-08-05' },
    ],
    agriculture: [
      { prompt: 'What is ADB\'s approach to food security financing?', response: 'ADB\'s food security programs support value chain development, irrigation modernisation, and input access in agriculture-dependent DMCs.', dept: 'SERD', date: '2026-08-08' },
      { prompt: 'Find ADB projects on rice value chains in Southeast Asia', response: 'ADB has financed rice value chain projects in Cambodia, Lao PDR, and Myanmar covering seed systems, post-harvest infrastructure, and market linkages.', dept: 'SERD', date: '2026-08-07' },
      { prompt: 'How does ADB support climate-smart agriculture?', response: 'ADB promotes climate-smart agriculture through drought-tolerant seed varieties, water-efficient irrigation, and farmer training on adaptive practices.', dept: 'CCSA', date: '2026-08-06' },
      { prompt: 'What agriculture modernisation loans has ADB approved for the Philippines?', response: 'ADB approved a $400 million agriculture modernisation loan to the Philippines in 2025 covering irrigation, value chains, and digital agri extension.', dept: 'SERD', date: '2026-08-05' },
    ],
    finance: [
      { prompt: 'How does ADB\'s Trade Finance Program work?', response: 'The ADB Trade Finance Program issues guarantees and loans to banks in DMCs to support trade transactions. It has facilitated over $70 billion since 2004.', dept: 'PSOD', date: '2026-08-08' },
      { prompt: 'What SME finance programs does ADB offer?', response: 'ADB supports SME finance through credit lines to local banks, guarantee facilities, and technical assistance for credit scoring and digital lending platforms.', dept: 'PSOD', date: '2026-08-07' },
      { prompt: 'Does ADB support capital market development?', response: 'ADB leads the ASEAN+3 Bond Market Initiative and finances capital market reforms including bond issuance frameworks, clearing systems, and investor capacity.', dept: 'ERCD', date: '2026-08-06' },
      { prompt: 'What financial sector reform projects has ADB funded in Central Asia?', response: 'ADB has supported financial sector reforms in Kazakhstan, Kyrgyz Republic, and Tajikistan covering banking supervision, payment systems, and microfinance.', dept: 'CWRD', date: '2026-08-05' },
    ],
    urban: [
      { prompt: 'What urban development projects is ADB financing in India?', response: 'ADB is financing urban projects in Rajasthan, Karnataka, and Tamil Nadu covering water supply, sanitation, urban roads, and smart city infrastructure.', dept: 'SARD', date: '2026-08-08' },
      { prompt: 'What is the Cities Development Initiative for Asia?', response: 'The Cities Development Initiative for Asia (CDIA) helps secondary cities develop investment plans and access climate-smart infrastructure financing.', dept: 'SDCC', date: '2026-08-07' },
      { prompt: 'Does ADB finance affordable housing?', response: 'ADB finances affordable housing through sovereign loans and private sector operations in countries including Papua New Guinea, Fiji, and Indonesia.', dept: 'PARD', date: '2026-08-06' },
      { prompt: 'What does ADB do to build urban resilience?', response: 'ADB\'s urban resilience work covers flood risk management, heat-resilient infrastructure, climate-proofed drainage, and disaster risk finance in Asian cities.', dept: 'CCSA', date: '2026-08-05' },
    ],
    health: [
      { prompt: 'What is ADB\'s health sector operational plan?', response: 'ADB\'s health operational plan supports universal health coverage, health financing reform, and disease prevention across DMCs in Asia and the Pacific.', dept: 'SARD', date: '2026-08-08' },
      { prompt: 'What has ADB done on pandemic preparedness?', response: 'ADB established a $20 billion COVID-19 response package, supported vaccine procurement, and is developing a regional health security framework for future pandemics.', dept: 'SDCC', date: '2026-08-07' },
      { prompt: 'How does ADB support universal health coverage?', response: 'ADB finances UHC through health insurance scheme development, primary care strengthening, and human resource planning in Southeast and Central Asia.', dept: 'SERD', date: '2026-08-06' },
      { prompt: 'Find ADB health system strengthening projects in the Pacific', response: 'ADB has health system projects in Papua New Guinea, Solomon Islands, and Timor-Leste covering infrastructure, medical supplies, and health workforce training.', dept: 'PARD', date: '2026-08-05' },
    ],
    education: [
      { prompt: 'What education projects is ADB funding in Central Asia?', response: 'ADB is funding education projects in the Kyrgyz Republic, Tajikistan, and Uzbekistan covering curriculum reform, textbook supply, and school rehabilitation.', dept: 'CWRD', date: '2026-08-08' },
      { prompt: 'Find information on ADB\'s TVET programs', response: 'ADB supports TVET in Indonesia, Philippines, and Bangladesh through curriculum modernisation, industry partnerships, and trainer development programs.', dept: 'SERD', date: '2026-08-07' },
      { prompt: 'Does ADB finance school infrastructure?', response: 'ADB finances school construction and rehabilitation in Pacific island countries, Cambodia, and Myanmar to improve learning environments and disaster resilience.', dept: 'PARD', date: '2026-08-06' },
      { prompt: 'What is the Skills for Inclusive Growth program?', response: 'Skills for Inclusive Growth is an ADB regional technical assistance program supporting DMCs to improve skills systems and employment outcomes for youth.', dept: 'SARD', date: '2026-08-05' },
    ],
    digital: [
      { prompt: 'What is ADB\'s digital economy strategy?', response: 'ADB\'s Digital Agenda 2030 supports connectivity, digital government, fintech access, data governance, and digital skills across member countries.', dept: 'SDCC', date: '2026-08-08' },
      { prompt: 'Find ADB fintech projects in Southeast Asia', response: 'ADB has fintech projects in Cambodia, Indonesia, and Philippines covering digital payment infrastructure, regulatory sandboxes, and financial data standards.', dept: 'SERD', date: '2026-08-07' },
      { prompt: 'What e-government projects is ADB financing?', response: 'ADB finances e-government in Armenia, Georgia, Uzbekistan, and Pacific states through digital public service platforms, digital ID, and GovTech capacity building.', dept: 'CWRD', date: '2026-08-06' },
      { prompt: 'What is the Digital Infrastructure Trust Fund?', response: 'The ADB Digital Infrastructure Trust Fund provides grant financing for connectivity infrastructure and digital economy capacity in LDCs and Pacific DMCs.', dept: 'SDCC', date: '2026-08-05' },
    ],
    'web-pages': [
      { prompt: 'Where is the country partnership strategy page for Pakistan?', response: 'The Pakistan country partnership strategy page is at adb.org/countries/pakistan/strategy and includes the current CPS, results framework, and annual updates.', dept: 'CWRD', date: '2026-08-08' },
      { prompt: 'Find the ADB climate finance page', response: 'ADB\'s climate finance overview is at adb.org/results/climate-change. It shows cumulative finance, sector breakdown, and links to major climate programs.', dept: 'CCSA', date: '2026-08-07' },
      { prompt: 'Is there a Pacific Operations page on ADB.org?', response: 'The Pacific Operations portal is at adb.org/countries/pacific and covers all Pacific DMCs with country pages, project lists, and regional program information.', dept: 'PARD', date: '2026-08-06' },
      { prompt: 'Where is the accountability mechanism page on ADB.org?', response: 'The Accountability Mechanism page is at adb.org/accountability-mechanism and explains the complaints process, eligibility criteria, and past cases.', dept: 'ERCD', date: '2026-08-05' },
    ],
    pdf: [
      { prompt: 'Where can I download the Asian Development Outlook 2026 PDF?', response: 'The ADO 2026 PDF is at adb.org/outlook/pdf. The main report covers macroeconomic forecasts and thematic chapters for developing Asia.', dept: 'ERCD', date: '2026-08-08' },
      { prompt: 'Download the ADB Annual Report 2025 PDF', response: 'The ADB Annual Report 2025 PDF is at adb.org/annual-report-2025/pdf. It includes financial statements, results highlights, and the President\'s message.', dept: 'BPGE', date: '2026-08-07' },
      { prompt: 'Find a PDF working paper on remittances and poverty in Pacific islands', response: 'Working Paper WP-712 on remittances and poverty in Pacific islands is available in the ADB Publications database at adb.org/publications.', dept: 'ERCD', date: '2026-08-06' },
      { prompt: 'Is the ADB poverty analysis for Cambodia available as a PDF?', response: 'The Cambodia poverty analysis report (2024) is available for download at adb.org/countries/cambodia/poverty as an 88-page PDF.', dept: 'SERD', date: '2026-08-05' },
    ],
    'data-stats': [
      { prompt: 'What are ADB\'s GDP growth forecasts for the Philippines in 2026?', response: 'ADB forecasts 6.2% GDP growth for the Philippines in 2026, driven by domestic consumption, public infrastructure, and services sector recovery.', dept: 'ERCD', date: '2026-08-08' },
      { prompt: 'Where can I find the Key Indicators for Asia and the Pacific publication?', response: 'Key Indicators 2025 is at adb.org/publications/key-indicators-asia-pacific-2025 and covers 49 DMCs with economic, social, and environmental statistics.', dept: 'ERCD', date: '2026-08-07' },
      { prompt: 'Show ADB disbursement data by country for 2025', response: 'ADB disbursed $18.6 billion in 2025. Country-level disbursement data is in the Annual Report Appendix and the ADB Data Library at data.adb.org.', dept: 'BPGE', date: '2026-08-06' },
      { prompt: 'What are the poverty headcount ratios for ADB member countries?', response: 'Poverty headcount data at national and regional levels is in the Key Indicators publication and the ADB Data Library at data.adb.org.', dept: 'ERCD', date: '2026-08-05' },
    ],
    'news-releases': [
      { prompt: 'Find the press release on ADB\'s 2030 climate finance commitment', response: 'The press release on ADB\'s $100 billion climate finance commitment is at adb.org/news/adb-commits-100-billion-climate-finance-2030.', dept: 'CCSA', date: '2026-08-08' },
      { prompt: 'Is there a press release about ADB\'s debt restructuring support for Sri Lanka?', response: 'ADB\'s press release on Sri Lanka debt restructuring support is in the news archive, published January 2026, announcing $1.3 billion in budget support.', dept: 'SARD', date: '2026-08-07' },
      { prompt: 'Find the announcement for the ADB gender equity fund', response: 'The Women\'s Livelihood Bond and Gender Equity Fund announcement is in the ADB news archive under Finance and Private Sector categories.', dept: 'PSOD', date: '2026-08-06' },
      { prompt: 'Where are press releases from the 2026 ADB Governors Meeting?', response: 'Press releases from the 59th Annual Meeting of the Board of Governors are archived at adb.org/news/annual-meeting-2026.', dept: 'BPGE', date: '2026-08-05' },
    ],
    'proj-profiles': [
      { prompt: 'Find the project profile for loan 3940-PHI', response: 'Loan 3940-PHI (Metro Manila Flood Management) project profile is at adb.org/projects/51367-001/main with project scope, financing, and implementation updates.', dept: 'SERD', date: '2026-08-08' },
      { prompt: 'Show me the project profile for the Dhaka urban transport project', response: 'The Dhaka Urban Transport Project profile is at adb.org/projects/49094-001/main, covering a $300 million loan approved in 2022.', dept: 'SARD', date: '2026-08-07' },
      { prompt: 'List all ADB project profiles for water projects in the Pacific', response: 'Pacific water project profiles are filterable at adb.org/projects using the Pacific region and water sector filters. Currently 14 active projects are listed.', dept: 'PARD', date: '2026-08-06' },
      { prompt: 'What project details are available for the Maldives port modernisation project?', response: 'The Maldives Port Modernisation project profile (Loan 4012-MLD) includes project scope, environmental safeguards, and disbursement schedule at adb.org/projects.', dept: 'SARD', date: '2026-08-05' },
    ],
    events: [
      { prompt: 'When is the ADB Annual Meeting 2027 and where will it be held?', response: 'The 60th ADB Annual Meeting will be held in Seoul, Republic of Korea in May 2027. Registration details will be at adb.org/annual-meeting.', dept: 'BPGE', date: '2026-08-08' },
      { prompt: 'Where can I access recordings from ADB webinars on climate finance?', response: 'Recordings of ADB climate finance webinars are at adb.org/events under the Knowledge Events filter, including the Just Energy Transition webinar series.', dept: 'CCSA', date: '2026-08-07' },
      { prompt: 'Is there an upcoming co-financing workshop I can register for?', response: 'ADB\'s Co-financing Workshop is scheduled for November 2026 in Manila. Registration is available at adb.org/events/cofinancing-workshop-2026.', dept: 'PSOD', date: '2026-08-06' },
      { prompt: 'Where do I register for ADB training programs on project management?', response: 'ADB Institute training programs on project management are at adb.org/adbi/events. Upcoming courses include Results-Based Project Management in October 2026.', dept: 'ERCD', date: '2026-08-05' },
    ],
    microsites: [
      { prompt: 'How do I access the ADB Careers portal?', response: 'The ADB Careers portal is at careers.adb.org. It lists staff and ADB Resident Mission vacancies with application instructions and eligibility criteria.', dept: 'BPGE', date: '2026-08-08' },
      { prompt: 'Where is the ADB Data Library?', response: 'The ADB Data Library is at data.adb.org and provides open-access datasets on DMC economies, including poverty, environment, and governance indicators.', dept: 'ERCD', date: '2026-08-07' },
      { prompt: 'Where can I access the ADB Evaluation Hub?', response: 'The ADB Evaluation Hub is at evaluationhub.adb.org and hosts all Independent Evaluation Department reports, ratings, and thematic evaluations.', dept: 'ERCD', date: '2026-08-06' },
      { prompt: 'Is there a Pacific Operations microsite on ADB.org?', response: 'The Pacific Operations portal at adb.org/countries/pacific functions as a microsite with country dashboards, project maps, and regional program summaries.', dept: 'PARD', date: '2026-08-05' },
    ],
    'other-ct': [
      { prompt: 'Where can I access ADB\'s multimedia library?', response: 'ADB\'s multimedia library is at multimedia.adb.org, offering photos, videos, and infographics for use under ADB\'s terms of use.', dept: 'BPGE', date: '2026-08-08' },
      { prompt: 'Does ADB have historical archives available online?', response: 'ADB\'s historical documents, including early board minutes and project archives, are available through the ADB Library at lib.adb.org.', dept: 'ERCD', date: '2026-08-07' },
      { prompt: 'Find ADB photo galleries for recent country missions', response: 'Recent country mission photo galleries are posted on ADB\'s Flickr account and linked from the multimedia library at multimedia.adb.org.', dept: 'SERD', date: '2026-08-06' },
      { prompt: 'Is there an ADB store where I can order publications?', response: 'ADB publications can be ordered at adb.org/publications/ordering. Select publications are also available through regional book distributors.', dept: 'BPGE', date: '2026-08-05' },
    ],
  };

  readonly topicDrilldownRows = computed<DrilldownRow[]>(() => {
    const id = this.selectedTopic();
    return id ? (this.allDrilldowns[id] ?? []) : [];
  });

  readonly drawerDepts = computed(() =>
    [...new Set(this.topicDrilldownRows().map(r => r.dept))].sort()
  );

  readonly filteredDrilldownRows = computed(() => {
    const dept = this.drawerDeptFilter();
    const rows = this.topicDrilldownRows();
    return dept === 'all' ? rows : rows.filter(r => r.dept === dept);
  });

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
      const max   = Math.round(window.innerWidth * SearchAi.DRAWER_MAX);
      this.drawerWidth.set(Math.min(max, Math.max(SearchAi.DRAWER_MIN, startW + delta)));
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

  // ── Search trend chart ────────────────────────────────────────────

  readonly srW    = signal(900);
  readonly srH    = 220;
  readonly srPadL = 46;
  readonly srPadR = 14;
  readonly srPadT = 18;
  readonly srPadB = 44;
  readonly srBottom = this.srH - this.srPadB;

  private readonly srRaw = [
    { period: 'W1',  value: 61 }, { period: 'W2',  value: 62 },
    { period: 'W3',  value: 64 }, { period: 'W4',  value: 63 },
    { period: 'W5',  value: 65 }, { period: 'W6',  value: 64 },
    { period: 'W7',  value: 66 }, { period: 'W8',  value: 67 },
    { period: 'W9',  value: 66 }, { period: 'W10', value: 68 },
    { period: 'W11', value: 67 }, { period: 'W12', value: 68 },
  ];

  private readonly srYMin = 58;
  private readonly srYMax = 72;
  private readonly srPlotW = computed(() => this.srW() - this.srPadL - this.srPadR);
  private readonly srPlotH = this.srH - this.srPadT - this.srPadB;

  private srX = (i: number) => this.srPadL + (i / (this.srRaw.length - 1)) * this.srPlotW();
  private srY = (v: number) => this.srPadT + (1 - (v - this.srYMin) / (this.srYMax - this.srYMin)) * this.srPlotH;

  private srBezier(pts: { x: number; y: number }[]): string {
    return pts.map((p, i) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const prev = pts[i - 1];
      const cpX  = ((prev.x + p.x) / 2).toFixed(1);
      return `C ${cpX} ${prev.y.toFixed(1)}, ${cpX} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }).join(' ');
  }

  readonly srYTicks = [60, 64, 68, 72].map(v => ({
    label: `${v}%`,
    y: this.srY(v),
  }));

  readonly srTrendPts = computed(() => this.srRaw.map((d, i) => ({
    x: this.srX(i), y: this.srY(d.value),
    period: d.period, value: d.value,
    pct: i === 0 ? null : +(d.value - this.srRaw[i - 1].value).toFixed(1),
  })));

  readonly srLinePath = computed(() => this.srBezier(this.srTrendPts()));
  readonly srAreaPath = computed(() => {
    const pts = this.srTrendPts();
    return `${this.srLinePath()} L ${pts[pts.length - 1].x.toFixed(1)} ${this.srBottom} L ${pts[0].x.toFixed(1)} ${this.srBottom} Z`;
  });

  readonly hoveredSrIdx = signal<number | null>(null);
  readonly hoveredSrPt  = computed(() => {
    const i = this.hoveredSrIdx();
    return i !== null ? (this.srTrendPts()[i] ?? null) : null;
  });

  readonly hoveredSrPctPositive = computed(() => (this.hoveredSrPt()?.pct ?? 0) >= 0);
  readonly hoveredSrPctLabel    = computed(() => {
    const pt = this.hoveredSrPt();
    if (!pt || pt.pct === null) return '';
    return `${pt.pct >= 0 ? '+' : ''}${pt.pct}pp vs prev week`;
  });

  onSrMouseMove(e: MouseEvent) {
    const rect   = (e.currentTarget as SVGElement).getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * this.srW();
    let nearest = 0, minDist = Infinity;
    this.srTrendPts().forEach((pt, i) => {
      const d = Math.abs(pt.x - mouseX);
      if (d < minDist) { minDist = d; nearest = i; }
    });
    this.hoveredSrIdx.set(nearest);
  }

  onSrMouseLeave() { this.hoveredSrIdx.set(null); }

  srTooltipX(): number {
    const pt = this.hoveredSrPt();
    if (!pt) return 0;
    return Math.min(Math.max(pt.x + 12, this.srPadL), this.srW() - 160 - this.srPadR);
  }
  srTooltipY(): number {
    return Math.max((this.hoveredSrPt()?.y ?? 0) - 68, this.srPadT);
  }

  ngAfterViewInit() {
    const card = this._el.nativeElement.querySelector('.sr-chart-host');
    if (!card) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w > 0) this.srW.set(Math.round(w));
    });
    ro.observe(card);
  }

  // Legacy aliases kept for zero-result breakdown (still used in template)
  readonly yTicks  = computed(() => [] as never[]);
  readonly xTicks  = computed(() => [] as never[]);
  readonly chartPoints = computed(() => [] as never[]);
  readonly linePath    = computed(() => '');
  readonly areaPath    = computed(() => '');
  readonly chartW = 0; readonly chartH = 0;
  readonly padL = 0; readonly padR = 0; readonly padT = 0; readonly padB = 0;

  readonly topQueryRows: TopQueryRow[] = [
    { query: 'ADB projects Philippines 2025', sessions: 4218, success: 84, zeroResult: false, trending: true  },
    { query: 'climate finance grants',         sessions: 3841, success: 71, zeroResult: false, trending: true  },
    { query: 'ADB annual report 2024',         sessions: 3210, success: 96, zeroResult: false, trending: false },
    { query: 'procurement notices India',      sessions: 2840, success: 52, zeroResult: false, trending: false },
    { query: 'country partnership strategy',   sessions: 2614, success: 79, zeroResult: false, trending: false },
    { query: 'green bond ADB 2025',            sessions: 2480, success: 88, zeroResult: false, trending: true  },
    { query: 'technical assistance grant',     sessions: 1980, success: 43, zeroResult: false, trending: false },
    { query: 'ADB staff vacancy',              sessions: 1740, success: 67, zeroResult: false, trending: false },
    { query: 'Myanmar infrastructure project', sessions: 1280, success: 0,  zeroResult: true,  trending: false },
    { query: 'ASEAN carbon market ADB',        sessions: 1190, success: 0,  zeroResult: true,  trending: false },
    { query: 'Pacific disbursement 2026',      sessions: 980,  success: 0,  zeroResult: true,  trending: false },
    { query: 'knowledge management ADB',       sessions: 840,  success: 58, zeroResult: false, trending: false },
  ];

  readonly zeroResultCategories: ZeroResultCategory[] = [
    { label: 'Procurement / tenders', count: 2841, pct: 38 },
    { label: 'Projects (specific)',   count: 1980, pct: 26 },
    { label: 'Careers / vacancies',   count: 1240, pct: 17 },
    { label: 'Country data',          count: 840,  pct: 11 },
    { label: 'Funding / grants',      count: 540,  pct: 7  },
  ];

  successColor(success: number, zeroResult: boolean): string {
    if (zeroResult) return '#ef4444';
    if (success >= 75) return '#16a34a';
    if (success >= 55) return '#fb923c';
    return '#ef4444';
  }

  // ── Discovery tab ─────────────────────────────────────────────────

  private readonly aiMentionsData = [
    { shortLabel: "Sep '25", audience: 72.4, mentions: 10800 },
    { shortLabel: "Oct '25", audience: 73.8, mentions: 13200 },
    { shortLabel: "Nov '25", audience: 90.8, mentions: 19600 },
    { shortLabel: "Dec '25", audience: 92.1, mentions: 21800 },
    { shortLabel: "Jan '26", audience: 88.3, mentions: 20100 },
    { shortLabel: "Feb '26", audience: 91.6, mentions: 22400 },
  ];

  readonly aiComboChart = (() => {
    const W = 800, H = 200, ML = 52, MR = 56, MT = 16, MB = 36;
    const innerW = W - ML - MR;
    const innerH = H - MT - MB;
    const n = this.aiMentionsData.length;
    const slotW = innerW / n;
    const barW = slotW * 0.55;
    const MMAX = 25000, AMIN = 60, AMAX = 100;

    const bars = this.aiMentionsData.map((d, i) => {
      const bh = innerH * (d.mentions / MMAX);
      return {
        x: ML + slotW * i + (slotW - barW) / 2,
        y: MT + innerH - bh,
        w: barW,
        h: bh,
        cx: ML + slotW * i + slotW / 2,
        label: d.shortLabel,
      };
    });

    const pts = this.aiMentionsData.map((d, i) => ({
      x: ML + slotW * i + slotW / 2,
      y: MT + innerH * (1 - (d.audience - AMIN) / (AMAX - AMIN)),
    }));

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const chartBottom = MT + innerH;
    const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${chartBottom} L${pts[0].x.toFixed(1)},${chartBottom} Z`;

    const aTicks = [60, 70, 80, 90, 100].map(v => ({
      y: MT + innerH * (1 - (v - AMIN) / (AMAX - AMIN)),
      label: `${v}M`,
    }));

    const mTicks = [0, 10, 20].map(v => ({
      y: MT + innerH * (1 - (v * 1000) / MMAX),
      label: v === 0 ? '0' : `${v}K`,
    }));

    return { bars, pts, linePath, areaPath, aTicks, mTicks, chartBottom };
  })();

  readonly aiChannelRows: AiChannelRow[] = [
    { channel: 'Google AI Overview / Gemini', mentions: 553, citedPages: 223, share: 49.3, trend: '+12%' },
    { channel: 'ChatGPT',                     mentions: 167, citedPages: 84,  share: 14.9, trend: '+8%'  },
    { channel: 'Microsoft Copilot',           mentions: 223, citedPages: 91,  share: 19.9, trend: '+21%' },
    { channel: 'Perplexity',                  mentions: 179, citedPages: 68,  share: 16.0, trend: '+6%'  },
  ];

  readonly readinessRows: ReadinessRow[] = [
    { area: 'Projects',          retrievable: 91, citationRate: 72, structured: 'Good',  freshness: 'Good',  issue: '—'               },
    { area: 'Publications',      retrievable: 84, citationRate: 61, structured: 'Good',  freshness: 'Good',  issue: '—'               },
    { area: 'Countries',         retrievable: 71, citationRate: 43, structured: 'Mixed', freshness: 'Mixed', issue: 'Schema'          },
    { area: 'Data & Statistics', retrievable: 68, citationRate: 38, structured: 'Mixed', freshness: 'Good',  issue: 'Discoverability' },
    { area: 'Procurement',       retrievable: 54, citationRate: 28, structured: 'Mixed', freshness: 'Good',  issue: 'Discoverability' },
    { area: 'News & Events',     retrievable: 88, citationRate: 54, structured: 'Good',  freshness: 'Good',  issue: '—'               },
    { area: 'Careers',           retrievable: 62, citationRate: 31, structured: 'Poor',  freshness: 'Good',  issue: 'Schema'          },
  ];

  readinessBadge(val: 'Good' | 'Mixed' | 'Poor'): string {
    return val === 'Good' ? 'badge badge--good' :
           val === 'Mixed' ? 'badge badge--low' : 'badge badge--high';
  }

  pctColor(pct: number): string {
    if (pct >= 75) return '#16a34a';
    if (pct >= 55) return '#fb923c';
    return '#ef4444';
  }

  maxShare = computed(() =>
    Math.max(...this.aiChannelRows.map(r => r.share))
  );

  shareBarPct(share: number): number {
    return Math.round((share / this.maxShare()) * 100);
  }

  // ── Sources tab ───────────────────────────────────────────────────

  readonly sourcesRows: SourcesRow[] = [
    { page: 'Projects database',      url: 'adb.org/projects',       citations: 8420, share: 24.1, trend: '+14%', aiVisible: true  },
    { page: 'Publications library',   url: 'adb.org/publications',   citations: 6180, share: 17.7, trend: '+9%',  aiVisible: true  },
    { page: 'ADB Annual Report 2025', url: 'adb.org/annual-report',  citations: 4810, share: 13.8, trend: '+28%', aiVisible: true  },
    { page: 'Country profiles',       url: 'adb.org/countries',      citations: 3940, share: 11.3, trend: '+5%',  aiVisible: true  },
    { page: 'Climate Change FAQ',     url: 'adb.org/climate',        citations: 2180, share: 6.2,  trend: '-4%',  aiVisible: true  },
    { page: 'Procurement guidelines', url: 'adb.org/procurement',    citations: 1840, share: 5.3,  trend: '+41%', aiVisible: true  },
    { page: 'About ADB',              url: 'adb.org/about',          citations: 1620, share: 4.6,  trend: '+2%',  aiVisible: true  },
    { page: 'Funding mechanisms',     url: 'adb.org/funding',        citations: 980,  share: 2.8,  trend: '-8%',  aiVisible: false },
    { page: 'Myanmar projects',       url: 'adb.org/countries/myanmar', citations: 820, share: 2.3, trend: '-19%', aiVisible: false },
    { page: 'ASEAN cooperation',      url: 'adb.org/asean',          citations: 610,  share: 1.7,  trend: '-12%', aiVisible: false },
  ];

  readonly losingVisibility: LosingVisibilityRow[] = [
    { page: 'Myanmar projects hub',        decline: '-19% citations', reason: 'Content freshness'  },
    { page: 'ASEAN Cooperation page',      decline: '-12% citations', reason: 'Schema gaps'        },
    { page: 'Climate Finance 2021 report', decline: '-8% citations',  reason: 'Stale content'      },
    { page: 'Funding mechanisms overview', decline: '-8% citations',  reason: 'Discoverability'    },
  ];
}
