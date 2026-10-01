import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../../components/site-header/site-header.component';
import { AiChatPanelComponent } from '../../components/ai-chat-panel/ai-chat-panel.component';

export interface SearchResult {
  id: string;
  href: string;
  thumbnail?: string;
  type: string;
  date: string;
  lastUpdated?: string;
  title: string;
  titleHtml: string;
  description?: string;
  tags?: string[];
}

export interface FacetValue {
  label: string;
  count: number;
  checked: boolean;
}

export interface Facet {
  key: string;
  title: string;
  values: FacetValue[];
  expanded: boolean;
}

export interface ProjectResult {
  id: string;
  projectNumber: string;
  title: string;
  status: 'Proposed' | 'Active' | 'Approved' | 'Closed' | 'Archived' | 'Dropped / Terminated';
  approvalYear: number;
  country: string;
  sector: string;
  url: string;
  description?: string;
}

export interface DocumentResult {
  id: string;
  projectNumber: string;
  title: string;
  documentDate: string;
  country: string;
  types: string[];
  description: string;
  url: string;
}

export interface TenderResult {
  id: string;
  projectNumber: string;
  title: string;
  status: 'Active' | 'Awarded' | 'Closed' | 'Archived';
  deadline: string;
  postingDate: string;
  country: string;
  sector: string;
  noticeType: string;
  approvalNumber: string | null;
  documentUrl: string;
}

type TabId = 'general' | 'projects' | 'documents' | 'tenders';

const ALL_RESULTS: SearchResult[] = [
  {
    id: '1',
    href: 'https://www.adb.org/news/infographics/climate-finance-2025',
    thumbnail: '/adb-home/search/climate-finance-2025-thumbnail.png',
    type: 'Infographic',
    date: '13 Apr 2026',
    lastUpdated: '02 Sep 2026',
    title: 'Climate Finance in 2025',
    titleHtml: '<em>Climate</em> <em>Finance</em> in 2025',
    description: 'In 2025, ADB committed $14.8 billion in climate finance from investments, technical assistance, and direct charges, comprising $9.4 billion (64%) in climate mitigation finance, and $5.3 billion (36%) in climate adaptation finance.',
    tags: ['Climate mitigation', 'Climate adaptation', 'Investment'],
  },
  {
    id: '2',
    href: 'https://www.adb.org/news/infographics/climate-finance-2018',
    thumbnail: '/adb-home/search/adb-infographic-climate-finance-2018-thumb.png',
    type: 'Infographic',
    date: '20 Mar 2019',
    lastUpdated: '14 Jun 2025',
    title: 'Climate Finance in 2018',
    titleHtml: '<em>Climate</em> <em>Finance</em> in 2018',
    description: 'ADB is committing $80 billion in climate finance cumulatively between 2019 and 2030, and is ensuring that at least 75% of its projects will address climate change mitigation and adaptation by 2030.',
    tags: ['Climate change', 'Sustainable development'],
  },
  {
    id: '3',
    href: 'https://www.adb.org/news/features/six-funding-innovations-boost-climate-finance',
    thumbnail: '/adb-home/search/six-funding-innovations-climate-finance-photo.jpg',
    type: 'Article',
    date: '04 May 2023',
    lastUpdated: '18 Jan 2026',
    title: 'Seven Funding Innovations to Boost Climate Finance',
    titleHtml: 'Seven Funding Innovations to Boost <em>Climate</em> <em>Finance</em>',
    description: 'Innovative Finance Facility for Climate in Asia and the Pacific (IF-CAP). Owned by ASEAN members and ADB, supported by development partners, and managed by ADB, the ACGF helps channel private investment into climate-smart projects.',
    tags: ['Private investment', 'ASEAN', 'Innovative finance'],
  },
  {
    id: '4',
    href: 'https://www.adb.org/documents/establishment-asia-pacific-climate-finance-fund',
    thumbnail: undefined,
    type: 'Institutional Document',
    date: '28 Apr 2017',
    lastUpdated: '05 Mar 2024',
    title: 'Establishment of Asia-Pacific Climate Finance Fund',
    titleHtml: 'Establishment of Asia-Pacific <em>Climate</em> <em>Finance</em> Fund',
    description: 'This paper provides information on the establishment of the Asia-Pacific Climate Finance Fund (ACliFF).',
    tags: ['Asia-Pacific', 'Trust fund', 'Policy'],
  },
  {
    id: '5',
    href: 'https://www.adb.org/news/events/regional-workshop-climate-finance-role-insurance-financing-climate-risk',
    thumbnail: '/adb-home/search/vid-thumb-philippines-wind-farm_6.jpg',
    type: 'Event',
    date: '15 Feb 2024',
    lastUpdated: '22 Aug 2025',
    title: 'Regional Workshop on Climate Finance: Role of Insurance in Financing Climate Risk',
    titleHtml: 'Regional Workshop on <em>Climate</em> <em>Finance</em>: Role of Insurance in <em>Financing</em> <em>Climate</em> Risk',
    description: 'This seminar will bring together insurers, public authorities, and related stakeholders to discuss how to tap and leverage the very promising technical expertise and financial strengths of the insurance industry.',
    tags: ['Insurance', 'Climate risk', 'Regional cooperation'],
  },
  {
    id: '6',
    href: 'https://www.adb.org/publications/building-gender-climate-finance-adb-experience-cif',
    thumbnail: '/adb-home/search/cover-gender-climate-finance.jpg',
    type: 'Publication',
    date: '01 Jul 2016',
    lastUpdated: '30 Nov 2023',
    title: 'Building Gender into Climate Finance: ADB Experience with the Climate Investment Funds',
    titleHtml: 'Building Gender into <em>Climate</em> <em>Finance</em>: ADB Experience with the <em>Climate</em> Investment Funds',
    description: 'This publication confirms the shared commitment of ADB and the Climate Investment Funds (CIF) to mainstreaming gender equality in climate change and showcases how this priority is being integrated into the design of ADB\'s CIF projects.',
    tags: ['Gender equality', 'Climate Investment Funds', 'Inclusion'],
  },
  {
    id: '7',
    href: 'https://www.adb.org/news/speeches/leaders-ascent-dialogue-climate-smart-investment-masato-kanda',
    thumbnail: undefined,
    type: 'Speech',
    date: '01 Sep 2026',
    lastUpdated: '05 Sep 2026',
    title: 'Leaders Ascent Dialogue on Climate-Smart Investment - Masato Kanda',
    titleHtml: 'Leaders Ascent Dialogue on <em>Climate</em>-Smart Investment - Masato Kanda',
    description: 'Remarks by Masato Kanda, President, Asian Development Bank, at the Leaders Ascent Dialogue on Climate-Smart Investment, 1 September 2026, Koror, Palau.',
    tags: ['Leadership', 'Pacific', 'Climate-smart'],
  },
  {
    id: '8',
    href: 'https://www.adb.org/publications/unlocking-islamic-climate-finance',
    thumbnail: '/adb-home/search/cover-unlocking-islamic-climate-finance.jpg',
    type: 'Publication',
    date: '09 Nov 2022',
    lastUpdated: '17 Apr 2025',
    title: 'Unlocking Islamic Climate Finance',
    titleHtml: 'Unlocking Islamic <em>Climate</em> <em>Finance</em>',
    description: 'This report analyzes how Islamic finance can be scaled up to help build urgently-needed climate-resilient infrastructure in the Asia and Pacific region, and ensure its post-COVID-19 recovery is green, sustainable, and inclusive.',
    tags: ['Islamic finance', 'Infrastructure', 'Green recovery'],
  },
  {
    id: '9',
    href: 'https://www.adb.org/publications/nature-solutions-finance-hub-climate-environment',
    thumbnail: '/adb-home/search/cover-nature-solutions-finance-hub-flyer-12sep.png',
    type: 'Publication',
    date: '11 Mar 2024',
    lastUpdated: '29 Jul 2026',
    title: 'Nature Solutions Finance Hub for Climate and the Environment',
    titleHtml: 'Nature Solutions <em>Finance</em> Hub for <em>Climate</em> and the Environment',
    description: 'This flyer promotes the Nature Solutions Finance Hub—a platform with innovative finance approaches that can proactively amplify nature-based solutions projects for a measurable impact in conserving the region\'s biodiversity and ensuring climate resiliency.',
    tags: ['Nature-based solutions', 'Biodiversity', 'Resilience'],
  },
  {
    id: '10',
    href: 'https://www.adb.org/publications/finance-climate-change-responses',
    thumbnail: '/adb-home/search/cover-30368.png',
    type: 'Publication',
    date: '01 Aug 2013',
    lastUpdated: '10 Dec 2022',
    title: 'Finance For Climate Change Responses',
    titleHtml: '<em>Finance</em> For <em>Climate</em> Change Responses',
    description: 'Access to climate change funding among small Pacific developing member countries (DMCs) is constrained by their limited human and technical capacity to prepare funding proposals and manage programs.',
    tags: ['Pacific DMCs', 'Capacity building', 'Funding access'],
  },
  {
    id: '11',
    href: 'https://www.adb.org/news/videos/public-and-private-climate-finance-required-combat-climate-change',
    thumbnail: '/adb-home/search/vid-thumb-philippines-wind-farm_6.jpg',
    type: 'Video',
    date: '01 Jul 2015',
    lastUpdated: '08 Feb 2024',
    title: 'Public and Private Climate Finance Required to Combat Climate Change',
    titleHtml: 'Public and Private <em>Climate</em> <em>Finance</em> Required to Combat <em>Climate</em> Change',
    description: 'In the Philippines, the private sector is joining with the government and ADB to co-fund a wind farm in the northern part of the country, showing how pooled resources can effectively finance climate-smart energy projects.',
    tags: ['Public-private partnership', 'Energy', 'Philippines'],
  },
  {
    id: '12',
    href: 'https://www.adb.org/publications/making-climate-finance-work-women',
    thumbnail: '/adb-home/search/cover-climate-finance-work-women-2.jpg',
    type: 'Publication',
    date: '12 Sep 2014',
    lastUpdated: '25 May 2023',
    title: 'Making Climate Finance Work for Women',
    titleHtml: 'Making <em>Climate</em> <em>Finance</em> Work for Women',
    description: 'Until recently, initiatives to empower women as agents of change have remained woefully neglected in climate policy and finance circles. High transaction costs and gender biases have limited climate finance reach to women.',
    tags: ['Women empowerment', 'Gender', 'Social inclusion'],
  },
];

const ALL_PROJECTS: ProjectResult[] = [
  { id:'p1', projectNumber:'56298-001', title:'Infrastructure Development for Green and Resilient New Satellite City in the Khushig Valley Area', status:'Proposed', approvalYear:2029, country:'Mongolia', sector:'Water and other urban infrastructure and services', url:'https://www.adb.org/projects/56298-001/main', description:'Supports the development of a climate-resilient satellite city near Ulaanbaatar, integrating smart urban infrastructure and green building standards to reduce the capital\'s congestion.' },
  { id:'p2', projectNumber:'58333-001', title:'Hydropower Development for Energy Security and Grid Flexibility', status:'Proposed', approvalYear:2028, country:'Indonesia', sector:'Energy', url:'https://www.adb.org/projects/58333-001/main', description:'Develops run-of-river hydropower capacity to strengthen Indonesia\'s energy security and provide flexible grid balancing to support the integration of variable renewable energy sources.' },
  { id:'p3', projectNumber:'57099-001', title:'Advancing Economic Stability and Sustainable Livelihoods Program (Subprogram 1)', status:'Proposed', approvalYear:2027, country:'Georgia', sector:'Public sector management', url:'https://www.adb.org/projects/57099-001/main', description:'Strengthens fiscal management and social protection systems to bolster economic resilience, targeting vulnerable households and improving delivery of public services across Georgia.' },
  { id:'p4', projectNumber:'59027-001', title:'Solar Powered Irrigation Project', status:'Proposed', approvalYear:2028, country:'Philippines', sector:'Agriculture, natural resources and rural development', url:'https://www.adb.org/projects/59027-001/main', description:'Replaces diesel-powered pumps with solar irrigation systems across smallholder farms, reducing costs for farmers and cutting carbon emissions while improving water-use efficiency.' },
  { id:'p5', projectNumber:'55073-001', title:'Climate-Resilient Transport Corridor Development Project', status:'Active', approvalYear:2026, country:'Bangladesh', sector:'Transport', url:'https://www.adb.org/projects/55073-001/main', description:'Upgrades key road and bridge corridors to withstand climate-induced flooding and extreme weather, improving connectivity for communities in coastal and delta regions of Bangladesh.' },
  { id:'p6', projectNumber:'54239-001', title:'Renewable Energy Transition and Grid Modernization Program', status:'Active', approvalYear:2025, country:'Vietnam', sector:'Energy', url:'https://www.adb.org/projects/54239-001/main', description:'Scales up solar and wind capacity while modernizing transmission infrastructure, supporting Vietnam\'s target of 50% renewable energy share and improving grid stability for industrial growth.' },
  { id:'p7', projectNumber:'51242-003', title:'Green Finance Catalyzing Facility', status:'Active', approvalYear:2024, country:'India', sector:'Finance', url:'https://www.adb.org/projects/51242-003/main', description:'Establishes a blended finance facility to crowd in private capital for clean energy and sustainable infrastructure investments, targeting underserved states and emerging green sectors.' },
  { id:'p8', projectNumber:'52041-001', title:'Climate Smart Agriculture and Watershed Management Project', status:'Approved', approvalYear:2026, country:'Nepal', sector:'Agriculture, natural resources and rural development', url:'https://www.adb.org/projects/52041-001/main', description:'Promotes climate-adaptive farming techniques and restores degraded watersheds to improve food security and water availability for rural communities in Nepal\'s hill and mountain regions.' },
  { id:'p9', projectNumber:'49450-023', title:'Flood and Drought Risk Management and Mitigation Project', status:'Active', approvalYear:2023, country:'Cambodia', sector:'Water and other urban infrastructure and services', url:'https://www.adb.org/projects/49450-023/main', description:'Builds flood control infrastructure and early warning systems to protect lives and livelihoods in Cambodia\'s most flood-prone provinces, while improving irrigation for dry-season agriculture.' },
  { id:'p10', projectNumber:'43281-033', title:'Access to Clean Energy Project (Additional Financing)', status:'Closed', approvalYear:2019, country:'Pakistan', sector:'Energy', url:'https://www.adb.org/projects/43281-033/main', description:'Extended off-grid solar and clean cooking solutions to over 1 million rural households in Pakistan, reducing reliance on kerosene and biomass while creating local energy entrepreneur jobs.' },
  { id:'p11', projectNumber:'47174-001', title:'Blue Carbon and Coastal Resilience Technical Assistance', status:'Closed', approvalYear:2021, country:'Regional', sector:'Agriculture, natural resources and rural development', url:'https://www.adb.org/projects/47174-001/main', description:'Developed methodologies for measuring blue carbon stocks in mangroves and seagrass across Southeast Asia, laying the groundwork for coastal ecosystem credits in carbon markets.' },
  { id:'p12', projectNumber:'48290-002', title:'Urban Climate Change Resilience Trust Fund Project', status:'Archived', approvalYear:2018, country:'India', sector:'Water and other urban infrastructure and services', url:'https://www.adb.org/projects/48290-002/main', description:'Piloted climate-resilient urban planning tools in secondary cities, integrating flood risk mapping and nature-based drainage solutions into municipal development frameworks.' },
];

const ALL_DOCUMENTS: DocumentResult[] = [
  { id:'d1', projectNumber:'45041-002', title:'45041-002: Vientiane Sustainable Urban Transport Project: Social Monitoring Report (July 2025–June 2026)', documentDate:'04 Sep 2026', country:'Lao People\'s Democratic Republic', types:['Environmental and Social Monitoring Reports','Social Monitoring Reports'], description:'Social monitoring reports provide the status of social issues or mitigation measures related to project implementation.', url:'https://www.adb.org/projects/documents/lao-45041-002-smr-6' },
  { id:'d2', projectNumber:'58537-001', title:'58537-001: Regional Water Supply Project: East Kalimantan Subproject Draft Resettlement Plan', documentDate:'04 Sep 2026', country:'Indonesia', types:['Resettlement Planning Documents','Resettlement Plans'], description:'Resettlement plans provide an assessment and measures, as well as time-bound actions and budgets, for projects with involuntary resettlement.', url:'https://www.adb.org/projects/documents/ino-58537-001-rp-0' },
  { id:'d3', projectNumber:'48404-004', title:'48404-004: CAREC Corridor Development Investment Program (Tranche 2): Emergency Response Centres Initial Environmental Examination', documentDate:'03 Sep 2026', country:'Pakistan', types:['Environmental Assessment and Measures','Initial Environmental Examination'], description:'Initial Environmental Examinations describe the environmental condition of a project, including potential impact and formulation of mitigation measures.', url:'https://www.adb.org/projects/documents/pak-48404-004-iee-1' },
  { id:'d4', projectNumber:'59447-001', title:'59447-001: Baku Metro Signaling Modernization and Operations Digitalization Project: Initial Environmental Examination', documentDate:'01 Sep 2026', country:'Azerbaijan', types:['Environmental Assessment and Measures','Initial Environmental Examination'], description:'Initial Environmental Examinations describe the environmental condition of a project, including potential impact and formulation of mitigation measures.', url:'https://www.adb.org/projects/documents/aze-59447-001-iee' },
  { id:'d5', projectNumber:'53303-001', title:'53303-001: 2020 International Comparison Program for Asia and the Pacific: Technical Assistance Completion Report', documentDate:'31 Aug 2026', country:'Regional', types:['Completion Reports','TA Completion Reports'], description:'Technical assistance completion reports describe for technical assistance projects the expected impact, outcome, and outputs achieved.', url:'https://www.adb.org/projects/documents/reg-53303-001-tcr' },
  { id:'d6', projectNumber:'55073-001', title:'55073-001: Climate-Resilient Transport Corridor Development Project: Program Safeguard Systems Assessment', documentDate:'28 Aug 2026', country:'Bangladesh', types:['Program Safeguard Systems Assessments'], description:'Program safeguard systems assessments evaluate the adequacy of a borrower\'s safeguard systems relative to ADB\'s safeguard policy requirements.', url:'https://www.adb.org/projects/documents/ban-55073-001-pssa' },
  { id:'d7', projectNumber:'51242-003', title:'51242-003: Green Finance Catalyzing Facility: Semi-Annual Environmental Monitoring Report', documentDate:'20 Aug 2026', country:'India', types:['Environmental and Social Monitoring Reports'], description:'Environmental monitoring reports provide the status of environmental mitigation measures related to project implementation.', url:'https://www.adb.org/projects/documents/ind-51242-003-smr-4' },
  { id:'d8', projectNumber:'54239-001', title:'54239-001: Renewable Energy Transition and Grid Modernization Program: Due Diligence Report', documentDate:'15 Aug 2026', country:'Vietnam', types:['Due Diligence Reports'], description:'Due diligence reports document the assessment of technical, financial, economic, and safeguard aspects of a project.', url:'https://www.adb.org/projects/documents/vie-54239-001-ddrp' },
  { id:'d9', projectNumber:'52041-001', title:'52041-001: Climate Smart Agriculture and Watershed Management Project: Resettlement Framework', documentDate:'10 Aug 2026', country:'Nepal', types:['Resettlement Planning Documents','Resettlement Framework'], description:'Resettlement frameworks describe the principles, institutional arrangements, and design criteria to be applied during project implementation.', url:'https://www.adb.org/projects/documents/nep-52041-001-rf' },
  { id:'d10', projectNumber:'49450-023', title:'49450-023: Flood and Drought Risk Management Project: Stakeholder Consultation Report', documentDate:'05 Aug 2026', country:'Cambodia', types:['Consultation Reports'], description:'Consultation reports document the process of engaging affected persons and other stakeholders during project preparation and implementation.', url:'https://www.adb.org/projects/documents/cam-49450-023-cr' },
  { id:'d11', projectNumber:'43281-033', title:'43281-033: Access to Clean Energy Project: Project Completion Report', documentDate:'28 Jul 2026', country:'Pakistan', types:['Completion Reports','Project Completion Reports'], description:'Project completion reports document the achievements and lessons learned from completed ADB sovereign operations.', url:'https://www.adb.org/projects/documents/pak-43281-033-pcr' },
  { id:'d12', projectNumber:'47174-001', title:'47174-001: Blue Carbon and Coastal Resilience Technical Assistance: Technical Report on Mangrove Carbon Stock Assessment', documentDate:'20 Jul 2026', country:'Regional', types:['Technical Assistance Reports'], description:'Technical assistance reports document the scope, methodology, and findings of technical assistance provided by ADB.', url:'https://www.adb.org/projects/documents/reg-47174-001-tar' },
];

const ALL_TENDERS: TenderResult[] = [
  { id:'t1', projectNumber:'52031-003', title:'52031-003 VAN: Greater Port Vila Urban Resilience Project – Second Additional Financing [GPVURPW(L)-02]', status:'Active', deadline:'02 Nov 2026', postingDate:'02 Sep 2026', country:'Vanuatu', sector:'Water and other urban infrastructure and services', noticeType:'Invitation for Bids', approvalNumber:null, documentUrl:'https://www.adb.org/sites/default/files/tenders/van52031-003-gpvurpwl-02-ifb.pdf' },
  { id:'t2', projectNumber:'59346-001', title:'Loan 4783-TUR: Istanbul North Rail Crossing Project – Design and Construction of Infrastructure and Superstructure Works (INRAIL)', status:'Active', deadline:'14 Oct 2026', postingDate:'23 Jul 2026', country:'Türkiye', sector:'Transport', noticeType:'General Procurement Notice', approvalNumber:'Loan 4783', documentUrl:'https://www.adb.org/sites/default/files/tenders/tur4783-aygm-inrail-gpn.pdf' },
  { id:'t3', projectNumber:'53389-001', title:'Loan 4511-LAO: Water Supply and Sanitation Improvement Sector Project [CW-01]', status:'Active', deadline:'13 Oct 2026', postingDate:'28 Aug 2026', country:'Lao People\'s Democratic Republic', sector:'Water and other urban infrastructure and services', noticeType:'Invitation for Bids', approvalNumber:'4511', documentUrl:'https://www.adb.org/sites/default/files/tenders/lao4511-cw-01-ifb.pdf' },
  { id:'t4', projectNumber:'47279-002', title:'OCB/KBRT-CW-06: Procurement of Structural Works – Elevated U-Turns, Flyovers, Underpasses and BRT Lanes', status:'Active', deadline:'08 Oct 2026', postingDate:'26 Aug 2026', country:'Pakistan', sector:'Transport', noticeType:'Invitation for Bids', approvalNumber:'Loan 3799', documentUrl:'https://www.adb.org/sites/default/files/tenders/pak3799-kbrtrlp-cw06.pdf' },
  { id:'t5', projectNumber:'55073-001', title:'Loan 4217-BAN: Climate-Resilient Transport Corridor Development Project – Supply and Installation of Bridge Safety Equipment', status:'Active', deadline:'30 Sep 2026', postingDate:'15 Aug 2026', country:'Bangladesh', sector:'Transport', noticeType:'Invitation for Bids', approvalNumber:'4217', documentUrl:'https://www.adb.org/sites/default/files/tenders/ban4217-crtcdp-cw03.pdf' },
  { id:'t6', projectNumber:'54239-001', title:'Loan 4785-VIE: Renewable Energy Transition and Grid Modernization Program – Consulting Services for Project Management', status:'Active', deadline:'23 Oct 2026', postingDate:'21 Aug 2026', country:'Vietnam', sector:'Energy', noticeType:'Invitation for Bids', approvalNumber:'4785', documentUrl:'https://www.adb.org/sites/default/files/tenders/vie4785-retgmp-cs01.pdf' },
  { id:'t7', projectNumber:'49450-023', title:'Grant 0680-CAM: Flood and Drought Risk Management – Supply of Hydrometeorological Monitoring Equipment [GD-01]', status:'Active', deadline:'05 Oct 2026', postingDate:'10 Aug 2026', country:'Cambodia', sector:'Water and other urban infrastructure and services', noticeType:'Invitation for Bids', approvalNumber:'0680', documentUrl:'https://www.adb.org/sites/default/files/tenders/cam0680-fdrm-gd01.pdf' },
  { id:'t8', projectNumber:'52041-001', title:'Loan 4511-NEP: Climate Smart Agriculture and Watershed Management – Community Irrigation Construction Works', status:'Active', deadline:'18 Oct 2026', postingDate:'25 Aug 2026', country:'Nepal', sector:'Agriculture, natural resources and rural development', noticeType:'Invitation for Bids', approvalNumber:'4511', documentUrl:'https://www.adb.org/sites/default/files/tenders/nep4511-csawm-cw02.pdf' },
  { id:'t9', projectNumber:'51242-003', title:'Loan 4785, 10795-IND: Green Finance Catalyzing Facility – Individual Consultant for Environmental and Social Compliance Monitoring', status:'Active', deadline:'25 Sep 2026', postingDate:'01 Sep 2026', country:'India', sector:'Finance', noticeType:'Invitation for Bids', approvalNumber:'4785, 10795', documentUrl:'https://www.adb.org/sites/default/files/tenders/ind4785-gfcf-ic01.pdf' },
  { id:'t10', projectNumber:'48290-002', title:'Loan 3799-IND: Urban Climate Change Resilience Trust Fund – Procurement of GIS Mapping and Remote Sensing Services', status:'Awarded', deadline:'15 Aug 2026', postingDate:'10 Jun 2026', country:'India', sector:'Water and other urban infrastructure and services', noticeType:'Contracts Awarded', approvalNumber:'Loan 3799', documentUrl:'https://www.adb.org/sites/default/files/tenders/ind3799-uccrtf-cs02-award.pdf' },
  { id:'t11', projectNumber:'43281-033', title:'Loan 4217-PAK: Access to Clean Energy Project – Supply of Solar Home Systems and Micro-Grid Components', status:'Closed', deadline:'30 Jun 2026', postingDate:'15 Apr 2026', country:'Pakistan', sector:'Energy', noticeType:'Invitation for Bids', approvalNumber:'4217', documentUrl:'https://www.adb.org/sites/default/files/tenders/pak4217-acep-gd01.pdf' },
  { id:'t12', projectNumber:'47174-001', title:'TA 9876-REG: Blue Carbon and Coastal Resilience – Consulting Firm for Carbon Accounting and Monitoring System Development', status:'Closed', deadline:'15 Jul 2026', postingDate:'20 May 2026', country:'Regional', sector:'Agriculture, natural resources and rural development', noticeType:'Invitation for Bids', approvalNumber:null, documentUrl:'https://www.adb.org/sites/default/files/tenders/reg9876-bccr-cs01.pdf' },
];

const PROJECTS_FACETS: Facet[] = [
  { key:'country', title:'Country/Economy', expanded:true, values:[
    { label:'Bangladesh', count:5481, checked:false },
    { label:'India', count:3204, checked:false },
    { label:'Indonesia', count:2876, checked:false },
    { label:'Philippines', count:2103, checked:false },
    { label:'Vietnam', count:1987, checked:false },
  ]},
  { key:'sector', title:'Sector', expanded:true, values:[
    { label:'Energy', count:2341, checked:false },
    { label:'Transport', count:1987, checked:false },
    { label:'Water and other urban infrastructure and services', count:1654, checked:false },
    { label:'Finance', count:1203, checked:false },
    { label:'Agriculture, natural resources and rural development', count:1089, checked:false },
  ]},
  { key:'status', title:'Status', expanded:true, values:[
    { label:'Active', count:2260, checked:false },
    { label:'Approved', count:254, checked:false },
    { label:'Proposed', count:189, checked:false },
    { label:'Closed', count:5981, checked:false },
    { label:'Archived', count:3985, checked:false },
  ]},
  { key:'year', title:'Approval Year', expanded:false, values:[
    { label:'2026', count:142, checked:false },
    { label:'2025', count:198, checked:false },
    { label:'2024', count:214, checked:false },
    { label:'2023', count:231, checked:false },
    { label:'2022', count:256, checked:false },
  ]},
];

const DOCUMENTS_FACETS: Facet[] = [
  { key:'country', title:'Country/Economy', expanded:true, values:[
    { label:'Bangladesh', count:5481, checked:false },
    { label:'India', count:4203, checked:false },
    { label:'Indonesia', count:3876, checked:false },
    { label:'Philippines', count:3102, checked:false },
    { label:'Vietnam', count:2987, checked:false },
  ]},
  { key:'type', title:'Type', expanded:true, values:[
    { label:'Audited Project Financial Statements', count:6507, checked:false },
    { label:'Agreements', count:5372, checked:false },
    { label:'Environmental and Social Monitoring Reports', count:4218, checked:false },
    { label:'Resettlement Planning Documents', count:3901, checked:false },
    { label:'Completion Reports', count:3654, checked:false },
  ]},
  { key:'language', title:'Language', expanded:false, values:[
    { label:'English', count:79020, checked:true },
    { label:'Bengali', count:45, checked:false },
    { label:'Burmese', count:47, checked:false },
    { label:'Hindi', count:38, checked:false },
    { label:'Khmer', count:29, checked:false },
  ]},
  { key:'year', title:'Year', expanded:true, values:[
    { label:'2026', count:2743, checked:false },
    { label:'2025', count:5020, checked:false },
    { label:'2024', count:5018, checked:false },
    { label:'2023', count:5089, checked:false },
    { label:'2022', count:5211, checked:false },
  ]},
];

const TENDERS_FACETS: Facet[] = [
  { key:'country', title:'Country/Economy', expanded:true, values:[
    { label:'Bangladesh', count:4312, checked:false },
    { label:'India', count:3876, checked:false },
    { label:'Indonesia', count:3201, checked:false },
    { label:'Pakistan', count:2987, checked:false },
    { label:'Philippines', count:2654, checked:false },
  ]},
  { key:'sector', title:'Sector', expanded:true, values:[
    { label:'Agriculture, natural resources and rural development', count:7075, checked:false },
    { label:'Energy', count:5885, checked:false },
    { label:'Transport', count:5234, checked:false },
    { label:'Water and other urban infrastructure and services', count:4987, checked:false },
    { label:'Education', count:4365, checked:false },
  ]},
  { key:'noticeType', title:'Notice Type', expanded:true, values:[
    { label:'Individual', count:29535, checked:false },
    { label:'Contracts Awarded', count:12527, checked:false },
    { label:'Invitation for Bids', count:4352, checked:false },
    { label:'General Procurement Notice', count:18, checked:false },
  ]},
  { key:'status', title:'Status', expanded:false, values:[
    { label:'Closed', count:37941, checked:false },
    { label:'Awarded', count:12527, checked:false },
    { label:'Active', count:473, checked:false },
    { label:'Archived', count:209, checked:false },
  ]},
];

const INITIAL_FACETS: Facet[] = [
  {
    key: 'type', title: 'Refine by Type', expanded: true,
    values: [
      { label: 'Article', count: 326, checked: false },
      { label: 'Blog Entry', count: 419, checked: false },
      { label: 'Business Document', count: 12, checked: false },
      { label: 'Business Guide', count: 57, checked: false },
      { label: 'Business How-To', count: 41, checked: false },
    ],
  },
  {
    key: 'subtype', title: 'Refine by Subtype', expanded: true,
    values: [
      { label: 'Accountability Mechanism Documents', count: 20, checked: false },
      { label: 'Asian Development Blog', count: 263, checked: false },
      { label: 'Blog', count: 1, checked: false },
      { label: 'Board Documents', count: 395, checked: false },
      { label: 'Books', count: 316, checked: false },
    ],
  },
  {
    key: 'subject', title: 'Refine by Subject', expanded: true,
    values: [
      { label: 'ADB administration and governance', count: 3633, checked: false },
      { label: 'ADB funds and products', count: 2838, checked: false },
      { label: 'Agriculture and natural resources', count: 1030, checked: false },
      { label: 'Capacity development', count: 127, checked: false },
      { label: 'Climate change', count: 1726, checked: false },
    ],
  },
  {
    key: 'country', title: 'Refine by Country/Economy', expanded: false,
    values: [
      { label: 'Afghanistan', count: 207, checked: false },
      { label: 'Armenia', count: 166, checked: false },
      { label: 'Azerbaijan', count: 229, checked: false },
      { label: 'Bangladesh', count: 713, checked: false },
      { label: 'Bhutan', count: 288, checked: false },
    ],
  },
  {
    key: 'language', title: 'Refine by Language', expanded: true,
    values: [
      { label: 'English', count: 16051, checked: true },
      { label: 'Armenian', count: 26, checked: false },
      { label: 'Azerbaijani', count: 21, checked: false },
      { label: 'Bengali', count: 14, checked: false },
      { label: 'Burmese', count: 17, checked: false },
    ],
  },
  {
    key: 'year', title: 'Refine by Year', expanded: true,
    values: [
      { label: '2026', count: 996, checked: false },
      { label: '2025', count: 1091, checked: false },
      { label: '2024', count: 1158, checked: false },
      { label: '2023', count: 1147, checked: false },
      { label: '2022', count: 1202, checked: false },
    ],
  },
];

// ── Myanmar mock data ──────────────────────────────────────────────────────

const MYANMAR_RESULTS: SearchResult[] = [
  { id:'m1', href:'https://www.adb.org/news/features/adb-myanmar-portfolio-projects-progress', thumbnail:'/adb-home/search/six-funding-innovations-climate-finance-photo.jpg', type:'Article', date:'18 Mar 2024', title:'ADB Myanmar Portfolio: Projects and Progress', titleHtml:'ADB <em>Myanmar</em> Portfolio: <em>Projects</em> and Progress', description:'An overview of ADB\'s active portfolio in Myanmar, covering infrastructure, rural development, financial inclusion, and social sector investments across the country.' },
  { id:'m2', href:'https://www.adb.org/publications/myanmar-transport-sector-assessment', thumbnail:'/adb-home/search/cover-30368.png', type:'Publication', date:'05 Nov 2023', title:'Myanmar Transport Sector Assessment, Strategy, and Road Map', titleHtml:'<em>Myanmar</em> Transport Sector Assessment, Strategy, and Road Map', description:'This report assesses Myanmar\'s transport sector, identifies key challenges in road, rail, and port connectivity, and proposes a strategic road map for sustainable development.' },
  { id:'m3', href:'https://www.adb.org/news/features/flood-risk-management-myanmar-irrawaddy-delta', thumbnail:'/adb-home/search/vid-thumb-philippines-wind-farm_6.jpg', type:'Article', date:'22 Aug 2023', title:'Flood Risk Management in Myanmar\'s Irrawaddy Delta', titleHtml:'Flood Risk Management in <em>Myanmar</em>\'s Irrawaddy Delta', description:'Communities in the Irrawaddy Delta face escalating flood risks. ADB is supporting early warning systems, embankment upgrades, and climate-resilient agriculture to protect livelihoods.' },
  { id:'m4', href:'https://www.adb.org/publications/myanmar-energy-sector-road-map', thumbnail:undefined, type:'Publication', date:'14 Jun 2021', title:'Energy Sector Road Map for Myanmar 2021–2030', titleHtml:'Energy Sector Road Map for <em>Myanmar</em> 2021–2030', description:'Presents a strategic framework for expanding access to reliable and affordable electricity in Myanmar, with a focus on renewable energy, grid expansion, and off-grid solutions for rural areas.' },
  { id:'m5', href:'https://www.adb.org/news/features/rural-roads-shan-state-myanmar', thumbnail:'/adb-home/search/cover-nature-solutions-finance-hub-flyer-12sep.png', type:'Article', date:'10 Jan 2024', title:'Rural Road Development Transforming Lives in Shan State', titleHtml:'Rural Road Development Transforming Lives in Shan State, <em>Myanmar</em>', description:'Improved rural roads in Shan State are reducing travel times, lowering transport costs, and connecting farmers to markets — driving inclusive growth in one of Myanmar\'s most remote regions.' },
  { id:'m6', href:'https://www.adb.org/publications/financial-inclusion-myanmar', thumbnail:'/adb-home/search/cover-gender-climate-finance.jpg', type:'Publication', date:'20 Apr 2022', title:'Financial Inclusion in Myanmar: Expanding Access to Finance', titleHtml:'Financial Inclusion in <em>Myanmar</em>: Expanding Access to Finance', description:'This study examines barriers to financial inclusion in Myanmar and presents policy recommendations and ADB interventions to expand access to credit, savings, and insurance for underserved populations.' },
  { id:'m7', href:'https://www.adb.org/news/features/adb-myanmar-resilient-infrastructure', thumbnail:undefined, type:'Article', date:'30 Sep 2022', title:'ADB and Myanmar: Building Resilient Infrastructure', titleHtml:'ADB and <em>Myanmar</em>: Building Resilient Infrastructure', description:'A look at ADB\'s $3 billion committed portfolio in Myanmar, focusing on climate-resilient roads, urban water supply, and community health facilities built to withstand natural hazards.' },
  { id:'m8', href:'https://www.adb.org/news/videos/clean-water-myanmar-dry-zone', thumbnail:'/adb-home/search/vid-thumb-philippines-wind-farm_6.jpg', type:'Video', date:'08 Feb 2023', title:'Clean Water for Myanmar\'s Dry Zone Communities', titleHtml:'Clean Water for <em>Myanmar</em>\'s Dry Zone Communities', description:'ADB\'s water supply project in the Dry Zone is delivering safe drinking water to over 400,000 rural households, reducing waterborne diseases and saving hours of daily water-collection labor.' },
  { id:'m9', href:'https://www.adb.org/publications/urban-development-myanmar-mandalay', thumbnail:'/adb-home/search/cover-unlocking-islamic-climate-finance.jpg', type:'Publication', date:'03 Jul 2024', title:'Urban Development in Myanmar: Mandalay Case Study', titleHtml:'Urban Development in <em>Myanmar</em>: Mandalay Case Study', description:'Explores Mandalay\'s rapid urbanization challenges and the role of ADB urban services projects in improving drainage, solid waste management, and urban roads in Myanmar\'s second-largest city.' },
  { id:'m10', href:'https://www.adb.org/news/features/agriculture-livelihoods-myanmar', thumbnail:undefined, type:'Article', date:'15 Mar 2021', title:'Supporting Agriculture and Rural Livelihoods in Myanmar', titleHtml:'Supporting Agriculture and Rural Livelihoods in <em>Myanmar</em>', description:'ADB is helping Myanmar farmers adopt climate-smart practices, access better seeds and fertilizers, and connect to value chains — boosting productivity and incomes in the Dry Zone and Delta regions.' },
  { id:'m11', href:'https://www.adb.org/news/events/myanmar-infrastructure-development-forum-2023', thumbnail:'/adb-home/search/adb-infographic-climate-finance-2018-thumb.png', type:'Event', date:'25 Oct 2023', title:'Myanmar Infrastructure Development Forum 2023', titleHtml:'<em>Myanmar</em> Infrastructure Development Forum 2023', description:'Bringing together government officials, development partners, and private sector leaders to discuss priorities and financing strategies for Myanmar\'s infrastructure development over the next decade.' },
  { id:'m12', href:'https://www.adb.org/publications/myanmar-health-sector-assessment', thumbnail:undefined, type:'Publication', date:'01 Dec 2020', title:'Health Sector Assessment in Myanmar', titleHtml:'Health Sector Assessment in <em>Myanmar</em>', description:'A comprehensive assessment of Myanmar\'s health sector capacity, financing, and service delivery gaps — providing the evidence base for ADB\'s primary health care improvement investments.' },
];

const MYANMAR_PROJECTS: ProjectResult[] = [
  { id:'mp1', projectNumber:'46390-001', title:'Rural Roads Improvement Project', status:'Active', approvalYear:2022, country:'Myanmar', sector:'Transport', url:'https://www.adb.org/projects/46390-001/main' },
  { id:'mp2', projectNumber:'47249-001', title:'Mandalay Urban Services Improvement Project', status:'Proposed', approvalYear:2027, country:'Myanmar', sector:'Water and other urban infrastructure and services', url:'https://www.adb.org/projects/47249-001/main' },
  { id:'mp3', projectNumber:'52322-001', title:'Flood and Landslide Risk Reduction Project', status:'Proposed', approvalYear:2026, country:'Myanmar', sector:'Water and other urban infrastructure and services', url:'https://www.adb.org/projects/52322-001/main' },
  { id:'mp4', projectNumber:'51353-001', title:'Financial Inclusion Program', status:'Active', approvalYear:2023, country:'Myanmar', sector:'Finance', url:'https://www.adb.org/projects/51353-001/main' },
  { id:'mp5', projectNumber:'52107-001', title:'Water Supply and Sanitation Development in Dry Zone', status:'Active', approvalYear:2024, country:'Myanmar', sector:'Water and other urban infrastructure and services', url:'https://www.adb.org/projects/52107-001/main' },
  { id:'mp6', projectNumber:'46390-002', title:'Rural Primary Health Care and Sanitation Improvement Project', status:'Active', approvalYear:2022, country:'Myanmar', sector:'Health', url:'https://www.adb.org/projects/46390-002/main' },
  { id:'mp7', projectNumber:'42458-013', title:'Greater Mekong Subregion Corridor Towns Development', status:'Closed', approvalYear:2018, country:'Myanmar', sector:'Water and other urban infrastructure and services', url:'https://www.adb.org/projects/42458-013/main' },
  { id:'mp8', projectNumber:'48099-003', title:'Coastal Fisheries Livelihood Improvement Project', status:'Closed', approvalYear:2019, country:'Myanmar', sector:'Agriculture, natural resources and rural development', url:'https://www.adb.org/projects/48099-003/main' },
  { id:'mp9', projectNumber:'43261-013', title:'Education Sector Development Program', status:'Closed', approvalYear:2016, country:'Myanmar', sector:'Education', url:'https://www.adb.org/projects/43261-013/main' },
  { id:'mp10', projectNumber:'44212-013', title:'Irrigation Command Area Development Project', status:'Closed', approvalYear:2017, country:'Myanmar', sector:'Agriculture, natural resources and rural development', url:'https://www.adb.org/projects/44212-013/main' },
  { id:'mp11', projectNumber:'40354-093', title:'Power Transmission and Distribution Project', status:'Archived', approvalYear:2013, country:'Myanmar', sector:'Energy', url:'https://www.adb.org/projects/40354-093/main' },
  { id:'mp12', projectNumber:'53501-001', title:'Shan State Agricultural Value Chain Development', status:'Dropped / Terminated', approvalYear:2020, country:'Myanmar', sector:'Agriculture, natural resources and rural development', url:'https://www.adb.org/projects/53501-001/main' },
];

const MYANMAR_DOCUMENTS: DocumentResult[] = [
  { id:'md1', projectNumber:'46390-001', title:'46390-001: Rural Roads Improvement Project: Semi-Annual Environmental Monitoring Report (January–June 2024)', documentDate:'15 Jul 2024', country:'Myanmar', types:['Environmental and Social Monitoring Reports'], description:'Environmental monitoring reports provide the status of environmental mitigation measures related to project implementation.', url:'https://www.adb.org/projects/documents/mya-46390-001-emr-6' },
  { id:'md2', projectNumber:'52107-001', title:'52107-001: Water Supply and Sanitation Development in Dry Zone: Initial Environmental Examination', documentDate:'10 Jun 2024', country:'Myanmar', types:['Environmental Assessment and Measures','Initial Environmental Examination'], description:'Initial Environmental Examinations describe the environmental condition of a project, including potential impact and formulation of mitigation measures.', url:'https://www.adb.org/projects/documents/mya-52107-001-iee' },
  { id:'md3', projectNumber:'47249-001', title:'47249-001: Mandalay Urban Services Improvement Project: Urban Sector Assessment', documentDate:'20 May 2024', country:'Myanmar', types:['Sector Assessments'], description:'Sector assessments provide an analysis of sector context, challenges, and opportunities to inform project design and investment planning.', url:'https://www.adb.org/projects/documents/mya-47249-001-ssa' },
  { id:'md4', projectNumber:'51353-001', title:'51353-001: Financial Inclusion Program: Due Diligence Report on Financial Intermediaries', documentDate:'28 Apr 2024', country:'Myanmar', types:['Due Diligence Reports'], description:'Due diligence reports document the assessment of technical, financial, economic, and safeguard aspects of a project.', url:'https://www.adb.org/projects/documents/mya-51353-001-ddrfi' },
  { id:'md5', projectNumber:'52322-001', title:'52322-001: Flood and Landslide Risk Reduction Project: Climate Risk and Vulnerability Assessment', documentDate:'05 Apr 2024', country:'Myanmar', types:['Climate Risk Assessments'], description:'Climate risk and vulnerability assessments identify climate-related risks and recommend adaptation measures for project design.', url:'https://www.adb.org/projects/documents/mya-52322-001-crva' },
  { id:'md6', projectNumber:'46390-002', title:'46390-002: Rural Primary Health Care and Sanitation Improvement: Social Monitoring Report (July–December 2023)', documentDate:'15 Jan 2024', country:'Myanmar', types:['Environmental and Social Monitoring Reports','Social Monitoring Reports'], description:'Social monitoring reports provide the status of social issues or mitigation measures related to project implementation.', url:'https://www.adb.org/projects/documents/mya-46390-002-smr-4' },
  { id:'md7', projectNumber:'42458-013', title:'42458-013: GMS Corridor Towns Development: Project Completion Report', documentDate:'30 Nov 2023', country:'Myanmar', types:['Completion Reports','Project Completion Reports'], description:'Project completion reports document the achievements and lessons learned from completed ADB sovereign operations.', url:'https://www.adb.org/projects/documents/mya-42458-013-pcr' },
  { id:'md8', projectNumber:'46390-001', title:'46390-001: Rural Roads Improvement Project: Resettlement Plan (Updated)', documentDate:'14 Oct 2023', country:'Myanmar', types:['Resettlement Planning Documents','Resettlement Plans'], description:'Resettlement plans provide an assessment and measures, as well as time-bound actions and budgets, for projects with involuntary resettlement.', url:'https://www.adb.org/projects/documents/mya-46390-001-rp-3' },
  { id:'md9', projectNumber:'48099-003', title:'48099-003: Coastal Fisheries Livelihood Improvement: Technical Assistance Completion Report', documentDate:'20 Sep 2023', country:'Myanmar', types:['Completion Reports','TA Completion Reports'], description:'Technical assistance completion reports describe for technical assistance projects the expected impact, outcome, and outputs achieved.', url:'https://www.adb.org/projects/documents/mya-48099-003-tcr' },
  { id:'md10', projectNumber:'52107-001', title:'52107-001: Water Supply and Sanitation Development in Dry Zone: Stakeholder Consultation Report', documentDate:'01 Sep 2023', country:'Myanmar', types:['Consultation Reports'], description:'Consultation reports document the process of engaging affected persons and other stakeholders during project preparation and implementation.', url:'https://www.adb.org/projects/documents/mya-52107-001-cr' },
  { id:'md11', projectNumber:'44212-013', title:'44212-013: Irrigation Command Area Development: Project Completion Report', documentDate:'10 Aug 2023', country:'Myanmar', types:['Completion Reports','Project Completion Reports'], description:'Project completion reports document the achievements and lessons learned from completed ADB sovereign operations.', url:'https://www.adb.org/projects/documents/mya-44212-013-pcr' },
  { id:'md12', projectNumber:'51353-001', title:'51353-001: Financial Inclusion Program: Quarterly Progress Report (Q1 2024)', documentDate:'15 Apr 2024', country:'Myanmar', types:['Progress Reports'], description:'Quarterly progress reports document implementation progress, issues, and upcoming activities for ongoing ADB projects.', url:'https://www.adb.org/projects/documents/mya-51353-001-pr-5' },
];

const MYANMAR_TENDERS: TenderResult[] = [
  { id:'mt1', projectNumber:'46390-001', title:'Loan 4102-MYA: Rural Roads Improvement Project – Periodic Maintenance Works for State Roads, Shan State [CW-04]', status:'Active', deadline:'20 Oct 2026', postingDate:'05 Sep 2026', country:'Myanmar', sector:'Transport', noticeType:'Invitation for Bids', approvalNumber:'4102', documentUrl:'https://www.adb.org/sites/default/files/tenders/mya4102-rrip-cw04-ifb.pdf' },
  { id:'mt2', projectNumber:'52107-001', title:'Loan 4318-MYA: Water Supply and Sanitation in Dry Zone – Supply and Installation of Piped Water Systems, Sagaing Region [GD-02]', status:'Active', deadline:'14 Nov 2026', postingDate:'18 Sep 2026', country:'Myanmar', sector:'Water and other urban infrastructure and services', noticeType:'Invitation for Bids', approvalNumber:'4318', documentUrl:'https://www.adb.org/sites/default/files/tenders/mya4318-wssdz-gd02-ifb.pdf' },
  { id:'mt3', projectNumber:'51353-001', title:'Grant 0712-MYA: Financial Inclusion Program – Individual Consultant for Digital Finance Advisory [IC-03]', status:'Active', deadline:'30 Sep 2026', postingDate:'25 Aug 2026', country:'Myanmar', sector:'Finance', noticeType:'Invitation for Bids', approvalNumber:'0712', documentUrl:'https://www.adb.org/sites/default/files/tenders/mya0712-fip-ic03-ifb.pdf' },
  { id:'mt4', projectNumber:'47249-001', title:'47249-001: Mandalay Urban Services Improvement – Consulting Firm for Detailed Engineering Design [CS-01]', status:'Active', deadline:'05 Dec 2026', postingDate:'10 Sep 2026', country:'Myanmar', sector:'Water and other urban infrastructure and services', noticeType:'General Procurement Notice', approvalNumber:null, documentUrl:'https://www.adb.org/sites/default/files/tenders/mya47249-001-csupd-cs01-gpn.pdf' },
  { id:'mt5', projectNumber:'52322-001', title:'52322-001: Flood and Landslide Risk Reduction – Consulting Services for Hydrology and Flood Modelling [CS-01]', status:'Active', deadline:'28 Nov 2026', postingDate:'02 Sep 2026', country:'Myanmar', sector:'Water and other urban infrastructure and services', noticeType:'General Procurement Notice', approvalNumber:null, documentUrl:'https://www.adb.org/sites/default/files/tenders/mya52322-001-flrr-cs01-gpn.pdf' },
  { id:'mt6', projectNumber:'46390-002', title:'Loan 4102-MYA: Rural Primary Health Care – Supply of Medical Equipment and Supplies for 120 Rural Health Centers [GD-03]', status:'Active', deadline:'10 Oct 2026', postingDate:'20 Aug 2026', country:'Myanmar', sector:'Health', noticeType:'Invitation for Bids', approvalNumber:'4102', documentUrl:'https://www.adb.org/sites/default/files/tenders/mya4102-rphcsi-gd03-ifb.pdf' },
  { id:'mt7', projectNumber:'46390-001', title:'Loan 4102-MYA: Rural Roads Improvement Project – Bridge Construction Works, Mandalay Division [CW-05]', status:'Active', deadline:'25 Oct 2026', postingDate:'01 Sep 2026', country:'Myanmar', sector:'Transport', noticeType:'Invitation for Bids', approvalNumber:'4102', documentUrl:'https://www.adb.org/sites/default/files/tenders/mya4102-rrip-cw05-ifb.pdf' },
  { id:'mt8', projectNumber:'42458-013', title:'Loan 3201-MYA: GMS Corridor Towns Development – Procurement of Urban Solid Waste Collection Vehicles', status:'Awarded', deadline:'30 Jun 2024', postingDate:'01 Apr 2024', country:'Myanmar', sector:'Water and other urban infrastructure and services', noticeType:'Contracts Awarded', approvalNumber:'3201', documentUrl:'https://www.adb.org/sites/default/files/tenders/mya3201-gmscdt-gd01-award.pdf' },
  { id:'mt9', projectNumber:'48099-003', title:'TA 9123-MYA: Coastal Fisheries Livelihood – Individual Consultant for Fisheries Value Chain Development', status:'Closed', deadline:'15 Mar 2023', postingDate:'01 Feb 2023', country:'Myanmar', sector:'Agriculture, natural resources and rural development', noticeType:'Invitation for Bids', approvalNumber:null, documentUrl:'https://www.adb.org/sites/default/files/tenders/mya9123-cflip-ic01.pdf' },
  { id:'mt10', projectNumber:'44212-013', title:'Loan 3456-MYA: Irrigation Command Area Development – Supply of Irrigation Infrastructure Equipment', status:'Closed', deadline:'01 Nov 2020', postingDate:'15 Sep 2020', country:'Myanmar', sector:'Agriculture, natural resources and rural development', noticeType:'Invitation for Bids', approvalNumber:'3456', documentUrl:'https://www.adb.org/sites/default/files/tenders/mya3456-icadp-gd02.pdf' },
  { id:'mt11', projectNumber:'40354-093', title:'Loan 2753-MYA: Power Transmission and Distribution – Construction of 230kV Substation, Yangon', status:'Archived', deadline:'30 Apr 2015', postingDate:'01 Feb 2015', country:'Myanmar', sector:'Energy', noticeType:'Invitation for Bids', approvalNumber:'2753', documentUrl:'https://www.adb.org/sites/default/files/tenders/mya2753-ptdp-cw03.pdf' },
  { id:'mt12', projectNumber:'51353-001', title:'Grant 0712-MYA: Financial Inclusion Program – Consulting Firm for Microfinance Regulatory Framework Review', status:'Active', deadline:'15 Oct 2026', postingDate:'28 Aug 2026', country:'Myanmar', sector:'Finance', noticeType:'Invitation for Bids', approvalNumber:'0712', documentUrl:'https://www.adb.org/sites/default/files/tenders/mya0712-fip-cs02-ifb.pdf' },
];

const MYANMAR_PROJECTS_FACETS: Facet[] = [
  { key:'country', title:'Country/Economy', expanded:true, values:[
    { label:'Myanmar', count:148, checked:false },
  ]},
  { key:'sector', title:'Sector', expanded:true, values:[
    { label:'Transport', count:42, checked:false },
    { label:'Water and other urban infrastructure and services', count:35, checked:false },
    { label:'Agriculture, natural resources and rural development', count:28, checked:false },
    { label:'Finance', count:19, checked:false },
    { label:'Energy', count:14, checked:false },
  ]},
  { key:'status', title:'Status', expanded:true, values:[
    { label:'Active', count:41, checked:false },
    { label:'Approved', count:5, checked:false },
    { label:'Proposed', count:12, checked:false },
    { label:'Closed', count:63, checked:false },
    { label:'Archived', count:27, checked:false },
  ]},
  { key:'year', title:'Approval Year', expanded:false, values:[
    { label:'2024', count:3, checked:false },
    { label:'2023', count:6, checked:false },
    { label:'2022', count:8, checked:false },
    { label:'2021', count:5, checked:false },
    { label:'2020', count:7, checked:false },
  ]},
];

const MYANMAR_DOCUMENTS_FACETS: Facet[] = [
  { key:'country', title:'Country/Economy', expanded:true, values:[
    { label:'Myanmar', count:2847, checked:false },
  ]},
  { key:'type', title:'Type', expanded:true, values:[
    { label:'Environmental and Social Monitoring Reports', count:412, checked:false },
    { label:'Resettlement Planning Documents', count:298, checked:false },
    { label:'Completion Reports', count:276, checked:false },
    { label:'Agreements', count:254, checked:false },
    { label:'Audited Project Financial Statements', count:231, checked:false },
  ]},
  { key:'language', title:'Language', expanded:false, values:[
    { label:'English', count:2741, checked:true },
    { label:'Burmese', count:106, checked:false },
  ]},
  { key:'year', title:'Year', expanded:true, values:[
    { label:'2024', count:183, checked:false },
    { label:'2023', count:347, checked:false },
    { label:'2022', count:412, checked:false },
    { label:'2021', count:389, checked:false },
    { label:'2020', count:356, checked:false },
  ]},
];

const MYANMAR_TENDERS_FACETS: Facet[] = [
  { key:'country', title:'Country/Economy', expanded:true, values:[
    { label:'Myanmar', count:1203, checked:false },
  ]},
  { key:'sector', title:'Sector', expanded:true, values:[
    { label:'Transport', count:387, checked:false },
    { label:'Water and other urban infrastructure and services', count:312, checked:false },
    { label:'Agriculture, natural resources and rural development', count:214, checked:false },
    { label:'Finance', count:156, checked:false },
    { label:'Energy', count:134, checked:false },
  ]},
  { key:'noticeType', title:'Notice Type', expanded:true, values:[
    { label:'Invitation for Bids', count:612, checked:false },
    { label:'Contracts Awarded', count:387, checked:false },
    { label:'Individual', count:145, checked:false },
    { label:'General Procurement Notice', count:59, checked:false },
  ]},
  { key:'status', title:'Status', expanded:false, values:[
    { label:'Closed', count:814, checked:false },
    { label:'Awarded', count:387, checked:false },
    { label:'Active', count:2, checked:false },
    { label:'Archived', count:0, checked:false },
  ]},
];

const MYANMAR_INITIAL_FACETS: Facet[] = [
  { key:'type', title:'Refine by Type', expanded:true, values:[
    { label:'Article', count:87, checked:false },
    { label:'Publication', count:142, checked:false },
    { label:'Video', count:31, checked:false },
    { label:'Event', count:24, checked:false },
    { label:'Speech', count:18, checked:false },
  ]},
  { key:'subtype', title:'Refine by Subtype', expanded:true, values:[
    { label:'Asian Development Blog', count:43, checked:false },
    { label:'Board Documents', count:98, checked:false },
    { label:'Books', count:27, checked:false },
    { label:'Working Papers', count:54, checked:false },
    { label:'Briefs', count:39, checked:false },
  ]},
  { key:'subject', title:'Refine by Subject', expanded:true, values:[
    { label:'Infrastructure', count:312, checked:false },
    { label:'Agriculture and natural resources', count:187, checked:false },
    { label:'Finance sector development', count:143, checked:false },
    { label:'Climate change', count:128, checked:false },
    { label:'Transport', count:114, checked:false },
  ]},
  { key:'country', title:'Refine by Country/Economy', expanded:false, values:[
    { label:'Myanmar', count:1042, checked:false },
  ]},
  { key:'language', title:'Refine by Language', expanded:true, values:[
    { label:'English', count:987, checked:true },
    { label:'Burmese', count:55, checked:false },
  ]},
  { key:'year', title:'Refine by Year', expanded:true, values:[
    { label:'2024', count:83, checked:false },
    { label:'2023', count:127, checked:false },
    { label:'2022', count:148, checked:false },
    { label:'2021', count:163, checked:false },
    { label:'2020', count:142, checked:false },
  ]},
];

function isMyanmarQuery(q: string): boolean {
  return q.toLowerCase().includes('myanmar');
}

function isNepalQuery(q: string): boolean {
  return q.toLowerCase().includes('nepal');
}

const SEARCH_SOURCES = [
  { label: 'ADB Documents',                 count: '50,000+ documents'           },
  { label: 'ADB Project Database',           count: '12,400+ projects'            },
  { label: 'ADB Publications Repository',    count: '8,200+ documents'            },
  { label: 'ADB Key Indicators Data Portal', count: '2,800+ datasets'             },
  { label: 'ADB Country Partnership Portal', count: '49 DMCs'                     },
  { label: 'ADB Newsroom',                   count: '15,000+ articles'            },
  { label: 'ADB Procurement Portal',         count: 'Tenders, works & consulting' },
];

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, RouterLink, SiteHeaderComponent, AiChatPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  private router = inject(Router);

  activeTab    = signal<TabId>('general');
  query        = signal('climate finance projects');
  sortBy       = signal('');
  facets       = signal<Facet[]>(INITIAL_FACETS);
  results      = signal<SearchResult[]>(ALL_RESULTS);
  projects     = signal<ProjectResult[]>(ALL_PROJECTS);
  documents    = signal<DocumentResult[]>(ALL_DOCUMENTS);
  tenders      = signal<TenderResult[]>(ALL_TENDERS);
  totalResults   = signal(16051);
  totalProjects  = signal(12836);
  totalDocuments = signal(79020);
  totalTenders   = signal(51169);
  currentPage  = signal(1);
  perPage      = 12;
  aiExpanded   = signal(false);
  sourcesOpen  = signal(false);
  viewMode     = signal<'list' | 'card'>('list');
  chatOpen     = signal(false);
  chatQuery    = signal('');
  filterOpen   = signal(false);

  readonly searchLoading = signal(false);
  readonly searchStep    = signal(0);
  readonly searchSources = SEARCH_SOURCES;
  private _overlayTimer: ReturnType<typeof setTimeout> | null = null;

  isMyanmarQuery = computed(() => isMyanmarQuery(this.query()));
  isNepalQuery   = computed(() => isNepalQuery(this.query()));

  activeTotal = computed(() => {
    switch (this.activeTab()) {
      case 'projects':  return this.totalProjects();
      case 'documents': return this.totalDocuments();
      case 'tenders':   return this.totalTenders();
      default:          return this.totalResults();
    }
  });

  totalPages  = computed(() => Math.ceil(this.activeTotal() / this.perPage));
  startResult = computed(() => (this.currentPage() - 1) * this.perPage + 1);
  endResult   = computed(() => Math.min(this.currentPage() * this.perPage, this.activeTotal()));

  activeChips = computed(() =>
    this.facets().flatMap(f => f.values.filter(v => v.checked).map(v => ({ facetKey: f.key, label: v.label })))
  );

  private startSearchOverlay() {
    if (this._overlayTimer) clearTimeout(this._overlayTimer);
    this.searchLoading.set(true);
    this.searchStep.set(0);
    let step = 0;
    const tick = () => {
      step++;
      this.searchStep.set(step);
      if (step < SEARCH_SOURCES.length) {
        this._overlayTimer = setTimeout(tick, 700);
      } else {
        this._overlayTimer = setTimeout(() => this.searchLoading.set(false), 1000);
      }
    };
    this._overlayTimer = setTimeout(tick, 500);
  }

  constructor() {
    inject(ActivatedRoute).queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const q = params.get('keywords') ?? 'climate finance projects';
      this.query.set(q);
      this.loadDataForQuery(q);
      this.startSearchOverlay();
    });
  }

  private loadDataForQuery(q: string) {
    const myanmar = isMyanmarQuery(q);
    this.activeTab.set('general');
    this.currentPage.set(1);
    this.results.set(myanmar ? MYANMAR_RESULTS : ALL_RESULTS);
    this.projects.set(myanmar ? MYANMAR_PROJECTS : ALL_PROJECTS);
    this.documents.set(myanmar ? MYANMAR_DOCUMENTS : ALL_DOCUMENTS);
    this.tenders.set(myanmar ? MYANMAR_TENDERS : ALL_TENDERS);
    this.totalResults.set(myanmar ? 1042 : 16051);
    this.totalProjects.set(myanmar ? 148 : 12836);
    this.totalDocuments.set(myanmar ? 2847 : 79020);
    this.totalTenders.set(myanmar ? 1203 : 51169);
    this.facets.set(JSON.parse(JSON.stringify(myanmar ? MYANMAR_INITIAL_FACETS : INITIAL_FACETS)));
  }

  setTab(tab: TabId) {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    const myanmar = this.isMyanmarQuery();
    const map: Record<TabId, Facet[]> = myanmar
      ? { general: MYANMAR_INITIAL_FACETS, projects: MYANMAR_PROJECTS_FACETS, documents: MYANMAR_DOCUMENTS_FACETS, tenders: MYANMAR_TENDERS_FACETS }
      : { general: INITIAL_FACETS, projects: PROJECTS_FACETS, documents: DOCUMENTS_FACETS, tenders: TENDERS_FACETS };
    this.facets.set(JSON.parse(JSON.stringify(map[tab])));
  }

  openIntelligence() {
    const base = this.query();
    const tab  = this.activeTab();
    const q = tab === 'projects'
      ? (base.toLowerCase().includes('project') ? base : `${base} projects`)
      : base;
    this.chatQuery.set(q);
    this.chatOpen.set(true);
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      'Proposed': 'proposed', 'Active': 'active', 'Approved': 'approved',
      'Closed': 'closed', 'Archived': 'archived',
      'Dropped / Terminated': 'dropped', 'Awarded': 'awarded',
    };
    return map[status] ?? 'closed';
  }

  onSearch() {
    const q = this.searchInputRef?.nativeElement.value?.trim() ?? '';
    this.router.navigate(['/search'], q ? { queryParams: { keywords: q } } : {});
  }

  toggleFacet(facetIdx: number) {
    this.facets.update(fs => {
      const copy = fs.map(f => ({ ...f, values: f.values.map(v => ({ ...v })) }));
      copy[facetIdx].expanded = !copy[facetIdx].expanded;
      return copy;
    });
  }

  toggleValue(facetIdx: number, valIdx: number) {
    this.facets.update(fs => {
      const copy = fs.map(f => ({ ...f, values: f.values.map(v => ({ ...v })) }));
      copy[facetIdx].values[valIdx].checked = !copy[facetIdx].values[valIdx].checked;
      return copy;
    });
  }

  removeChip(facetKey: string, label: string) {
    this.facets.update(fs => {
      const copy = fs.map(f => ({ ...f, values: f.values.map(v => ({ ...v })) }));
      const facet = copy.find(f => f.key === facetKey);
      if (facet) {
        const val = facet.values.find(v => v.label === label);
        if (val) val.checked = false;
      }
      return copy;
    });
  }

  clearAll() {
    this.facets.update(fs =>
      fs.map(f => ({ ...f, values: f.values.map(v => ({ ...v, checked: false })) }))
    );
  }

  formatCount(n: number): string {
    return n.toLocaleString();
  }
}
