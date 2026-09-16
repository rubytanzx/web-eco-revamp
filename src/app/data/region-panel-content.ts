export interface RegionPulseItem {
  date: string;
  title: string;
  description: string;
  tags: string[];
  image: string;
  href: string;
}

export interface ImpactStat {
  value: string;
  label: string;
}

export interface ImpactStoryItem {
  category: string;
  categoryColor: string;
  quote: string;
  person: string;
  image: string;
  href: string;
  internalRoute?: string;
  stats: ImpactStat[];
}

export interface RegionArticle {
  country: string;
  title: string;
  date: string;
  image: string;
  href: string;
}

export interface RegionShortItem {
  image: string;
  caption: string;
  href: string;
}

export interface RegionPanelContent {
  tagline: string;
  memberCountries: string[];
  regionPulse: RegionPulseItem;
  impactStories: ImpactStoryItem[];
  fromTheRegion: RegionArticle[];
  shorts: RegionShortItem[];
  exploreHref: string;
}

export const REGION_PANEL_CONTENT: Record<string, RegionPanelContent> = {
  cwrd: {
    tagline: 'From the Caucasus to Central Asia, ADB works with countries to build more resilient, prosperous, and inclusive societies.',
    memberCountries: ['Afghanistan', 'Armenia', 'Azerbaijan', 'Georgia', 'Kazakhstan', 'Kyrgyz Republic', 'Pakistan', 'Tajikistan', 'Turkmenistan', 'Uzbekistan'],
    regionPulse: {
      date: '15 JUN 2025',
      title: 'ADB Approves $400 Million to Modernize Borders and Facilitate Trade in CAREC Region',
      description: 'A new regional financing facility will modernize border crossing points, lower transport and logistics costs, and improve the movement of people and goods across the Central Asia Regional Economic Cooperation region.',
      tags: ['Trade facilitation', 'Regional connectivity'],
      image: '/adb-home/img-homepage-me-conflict.jpg',
      href: 'https://www.adb.org/where-we-work/central-west-asia',
    },
    impactStories: [
      {
        category: 'Water Security',
        categoryColor: '#1565c0',
        quote: '"Our irrigation system had not been upgraded in 30 years. The canals were losing water before it ever reached the fields."',
        person: '— Farmer cooperative leader, Fergana Valley, Uzbekistan',
        image: '/adb-home/topbox-sub-black.jpg',
        href: 'https://www.adb.org/where-we-work/uzbekistan',
        stats: [
          { value: '320,000 ha', label: 'irrigation modernized' },
          { value: '1.2M', label: 'people served' },
          { value: 'Uzbekistan Water Systems', label: '$200M (2021–2026)' },
        ],
      },
      {
        category: 'Clean Energy',
        categoryColor: '#00695c',
        quote: '"Wind power is giving Kazakhstan a way to grow its economy without growing its emissions. The turbines are already running."',
        person: '— Energy analyst, Astana Economic Forum, Kazakhstan',
        image: '/adb-home/blog-digital-transformation.jpg',
        href: 'https://www.adb.org/where-we-work/kazakhstan',
        stats: [
          { value: '1,000 MW', label: 'renewable capacity added' },
          { value: '800,000', label: 'households powered' },
          { value: 'Kazakhstan Renewables', label: '$500M (2022–2027)' },
        ],
      },
      {
        category: 'Transport Connectivity',
        categoryColor: '#4527a0',
        quote: '"The new road cut our trip to the market from six hours to two. It changed everything for the families in our district."',
        person: '— District official, CAREC Corridor 3, Tajikistan',
        image: '/adb-home/img-homepage-me-conflict.jpg',
        href: 'https://www.adb.org/where-we-work/tajikistan',
        stats: [
          { value: '2,400 km', label: 'roads upgraded' },
          { value: '12M+', label: 'people connected' },
          { value: 'CAREC Transport', label: '$1.2B (2019–2026)' },
        ],
      },
      {
        category: 'Skills & Employment',
        categoryColor: '#bf360c',
        quote: '"I never thought I could learn welding at 35. The training center opened up a job I did not know was possible for someone like me."',
        person: '— Graduate, ADB-supported TVET center, Kabul, Afghanistan',
        image: '/adb-home/blog-disasters-strike.jpg',
        href: 'https://www.adb.org/where-we-work/afghanistan',
        stats: [
          { value: '45,000', label: 'trainees certified' },
          { value: '68%', label: 'employment rate within 6 months' },
          { value: 'Afghanistan TVET', label: '$80M (2020–2025)' },
        ],
      },
    ],
    fromTheRegion: [
      {
        country: 'Armenia',
        title: 'Turning Audit Standards into Practice: Lessons from the Kyrgyz Republic',
        date: '29 MAY 2025',
        image: '/adb-home/blog-disasters-strike.jpg',
        href: 'https://www.adb.org/where-we-work/armenia',
      },
      {
        country: 'Kazakhstan',
        title: 'Uzbekistan\'s Long Journey to Modern Water Systems is Nourishing Farms, Families, and Factories',
        date: '4 JUN 2025',
        image: '/adb-home/blog-digital-transformation.jpg',
        href: 'https://www.adb.org/where-we-work/kazakhstan',
      },
      {
        country: 'Pakistan',
        title: 'ADB and Pakistan Forge New Path on Climate-Resilient Urban Flood Management',
        date: '12 JUN 2025',
        image: '/adb-home/img-homepage-me-conflict.jpg',
        href: 'https://www.adb.org/where-we-work/pakistan',
      },
    ],
    shorts: [
      { image: '/adb-home/blog-digital-transformation.jpg', caption: 'ADB\'s $400M CAREC border facility is transforming trade across Central Asia — shorter wait times, lower costs.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/blog-disasters-strike.jpg', caption: 'Clean water for 1.2M people in Uzbekistan\'s Fergana Valley: inside ADB\'s irrigation modernization program.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/topbox-sub-black.jpg', caption: 'From mountain glaciers to Caspian shores — how climate change is reshaping water security in CWRD.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/blog-mongolia-rangelands.jpg', caption: 'Kazakhstan\'s renewable energy transition: ADB-backed wind and solar projects power a greener future.', href: 'https://blogs.adb.org/' },
    ],
    exploreHref: 'https://www.adb.org/where-we-work/central-west-asia',
  },
  eard: {
    tagline: 'From the steppes of Mongolia to the dynamic economies of China and Korea, ADB drives transformative growth across East Asia.',
    memberCountries: ["China, People's Republic of", 'Hong Kong, China', 'Japan', 'Korea, Republic of', 'Mongolia', 'Taipei,China'],
    regionPulse: {
      date: '12 JUN 2025',
      title: 'From School to Work: Youth Employment in Mongolia',
      description: 'Analyzing how Mongolia has boosted education and youth skills, this report considers why the school-to-work transition remains challenging and outlines ways to strengthen pathways to quality jobs.',
      tags: ['Youth employment', 'Education'],
      image: '/adb-home/blog-mongolia-rangelands.jpg',
      href: 'https://www.adb.org/where-we-work/east-asia',
    },
    impactStories: [
      {
        category: 'Education & Skills',
        categoryColor: '#0277bd',
        quote: '"Getting a technical qualification used to mean leaving your aimag for Ulaanbaatar. Now the training center is here."',
        person: '— Oyunbileg, TVET graduate, Darkhan, Mongolia',
        image: '/adb-home/blog-digital-transformation.jpg',
        href: 'https://www.adb.org/where-we-work/mongolia',
        internalRoute: '/stories/eard/education-skills',
        stats: [
          { value: '$276.9M', label: 'committed in Mongolia' },
          { value: '$1.1B', label: 'committed in PRC' },
          { value: 'East Asia Operations', label: '2024 commitments' },
        ],
      },
      {
        category: 'Environment',
        categoryColor: '#2e7d32',
        quote: '"Groundwater is the invisible foundation of our food system. Once it is gone, it takes decades to come back — if it comes back at all."',
        person: '— Hydrologist, ADB groundwater project, Hebei Province, PRC',
        image: '/adb-home/blog-mongolia-rangelands.jpg',
        href: 'https://www.adb.org/where-we-work/prc',
        stats: [
          { value: '3M ha', label: 'farmland protected' },
          { value: '40%', label: 'reduction in aquifer depletion' },
          { value: 'PRC Groundwater', label: '$300M (2021–2026)' },
        ],
      },
      {
        category: 'Urban Resilience',
        categoryColor: '#6a1b9a',
        quote: '"Ulaanbaatar grows by tens of thousands of people each year. We needed a plan that matched that pace — and ADB helped us build one."',
        person: '— Urban planner, Ulaanbaatar City Government, Mongolia',
        image: '/adb-home/topbox-sub-black.jpg',
        href: 'https://www.adb.org/where-we-work/mongolia',
        stats: [
          { value: '180,000', label: 'ger district residents served' },
          { value: '500 km', label: 'new piped water network' },
          { value: 'UB Urban Services', label: '$150M (2020–2025)' },
        ],
      },
      {
        category: 'Green Innovation',
        categoryColor: '#00695c',
        quote: '"Korea is showing that green growth and economic competitiveness are not trade-offs — they are the same goal."',
        person: '— Researcher, Korea Green Growth Institute, Seoul',
        image: '/adb-home/blog-disasters-strike.jpg',
        href: 'https://www.adb.org/where-we-work/korea',
        stats: [
          { value: '22 GW', label: 'offshore wind target by 2030' },
          { value: '$2B', label: 'ADB co-financing mobilized' },
          { value: 'Korea Clean Energy', label: 'ongoing 2023–2030' },
        ],
      },
    ],
    fromTheRegion: [
      {
        country: 'Mongolia',
        title: 'Mongolia\'s Rangelands Can Bounce Back—If the Livestock Model Changes',
        date: '18 MAY 2025',
        image: '/adb-home/blog-mongolia-rangelands.jpg',
        href: 'https://www.adb.org/where-we-work/mongolia',
      },
      {
        country: "China, People's Republic of",
        title: 'Protecting Groundwater Resources in the People\'s Republic of China',
        date: '3 JUN 2025',
        image: '/adb-home/blog-digital-transformation.jpg',
        href: 'https://www.adb.org/where-we-work/prc',
      },
      {
        country: 'Korea, Republic of',
        title: 'Korea\'s Green New Deal and ADB\'s Role in Catalyzing Low-Carbon Innovation',
        date: '22 MAY 2025',
        image: '/adb-home/blog-disasters-strike.jpg',
        href: 'https://www.adb.org/where-we-work/korea',
      },
    ],
    shorts: [
      { image: '/adb-home/blog-mongolia-rangelands.jpg', caption: 'From school to work in Mongolia — ADB\'s TVET program is bridging the gap between education and employment.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/blog-digital-transformation.jpg', caption: 'Digital transformation in East Asia: how ADB is helping PRC cities build smarter, greener urban futures.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/blog-disasters-strike.jpg', caption: 'Mongolia\'s rangelands are under pressure. ADB is working with herder communities on sustainable grazing.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/topbox-sub-black.jpg', caption: 'Korea\'s green innovation hub: ADB-backed research centers driving low-carbon solutions across East Asia.', href: 'https://blogs.adb.org/' },
    ],
    exploreHref: 'https://www.adb.org/where-we-work/east-asia',
  },
  sard: {
    tagline: 'ADB helps South Asia build infrastructure, tackle poverty, and adapt to climate change across its most populous region.',
    memberCountries: ['Bangladesh', 'Bhutan', 'India', 'Maldives', 'Nepal', 'Sri Lanka'],
    regionPulse: {
      date: '2 JUN 2025',
      title: 'When Disasters Strike, Mental Health Care Must Be Ready Too',
      description: 'Putting mental health and psychosocial support at the heart of primary health care and disaster planning can help communities recover faster and better withstand future shocks.',
      tags: ['Disaster resilience', 'Health'],
      image: '/adb-home/blog-disasters-strike.jpg',
      href: 'https://www.adb.org/where-we-work/south-asia',
    },
    impactStories: [
      {
        category: 'Climate Adaptation',
        categoryColor: '#2e7d32',
        quote: '"When the flood came, we had already moved our seeds and our savings to higher ground. The cooperative had been preparing us for two years."',
        person: '— Cooperative member, Sylhet district, Bangladesh',
        image: '/adb-home/topbox-sub-van-3rdo-me-conflict-v2.jpg',
        href: 'https://www.adb.org/where-we-work/bangladesh',
        stats: [
          { value: '2.4M', label: 'people reached' },
          { value: '680 km', label: 'rural roads improved' },
          { value: 'Bihar Rural Roads', label: '$200M (2019–2025)' },
        ],
      },
      {
        category: 'Rural Connectivity',
        categoryColor: '#e65100',
        quote: '"Before the road, we could not get our produce to market. Now trucks come to the village — our income has doubled."',
        person: '— Vegetable farmer, Bihar state, India',
        image: '/adb-home/img-homepage-me-conflict.jpg',
        href: 'https://www.adb.org/where-we-work/india',
        stats: [
          { value: '7,000 km', label: 'rural roads built' },
          { value: '10M', label: 'villagers connected' },
          { value: 'India Rural Roads II', label: '$500M (2020–2026)' },
        ],
      },
      {
        category: 'Disaster Resilience',
        categoryColor: '#880e4f',
        quote: '"Our new school was built to withstand an 8.0 earthquake. The old one would not have survived a 6.0. That difference matters."',
        person: '— Headteacher, earthquake-resilient school, Gorkha district, Nepal',
        image: '/adb-home/blog-disasters-strike.jpg',
        href: 'https://www.adb.org/where-we-work/nepal',
        stats: [
          { value: '1,200', label: 'schools rebuilt' },
          { value: '600,000', label: 'students in safer classrooms' },
          { value: 'Nepal School Rebuilding', label: '$150M (2016–2024)' },
        ],
      },
      {
        category: 'Clean Energy',
        categoryColor: '#0277bd',
        quote: '"Solar power is changing what is possible. We run our irrigation pump at noon when the sun is strongest — no fuel costs, no emissions."',
        person: '— Farmer, ADB solar irrigation pilot, Anuradhapura, Sri Lanka',
        image: '/adb-home/blog-mongolia-rangelands.jpg',
        href: 'https://www.adb.org/where-we-work/sri-lanka',
        stats: [
          { value: '1.1 GW', label: 'renewable energy added' },
          { value: '300,000', label: 'households electrified' },
          { value: 'Sri Lanka Energy', label: '$400M (2021–2027)' },
        ],
      },
    ],
    fromTheRegion: [
      {
        country: 'India',
        title: 'Tripura Clean Energy Road Map and Implementation Plan 2025–2035',
        date: '10 JUN 2025',
        image: '/adb-home/blog-disasters-strike.jpg',
        href: 'https://www.adb.org/where-we-work/india',
      },
      {
        country: 'Bangladesh',
        title: 'Women-Led Cooperatives Delivering Climate Adaptation Actions',
        date: '25 MAY 2025',
        image: '/adb-home/img-homepage-me-conflict.jpg',
        href: 'https://www.adb.org/where-we-work/bangladesh',
      },
      {
        country: 'Nepal',
        title: 'Rebuilding Smarter: ADB\'s Earthquake-Resilient School Construction in Nepal',
        date: '8 JUN 2025',
        image: '/adb-home/blog-mongolia-rangelands.jpg',
        href: 'https://www.adb.org/where-we-work/nepal',
      },
    ],
    shorts: [
      { image: '/adb-home/blog-disasters-strike.jpg', caption: 'When disasters strike, mental health matters. ADB is embedding psychosocial support in South Asia\'s health systems.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/img-homepage-me-conflict.jpg', caption: 'Women-led cooperatives in Bangladesh are preparing communities for climate shocks — one season at a time.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/blog-mongolia-rangelands.jpg', caption: 'Earthquake-proof classrooms in Nepal: ADB is helping rebuild schools that can withstand the next disaster.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/blog-digital-transformation.jpg', caption: 'Tripura\'s solar roadmap: how India\'s northeast is charting a clean energy path with ADB support.', href: 'https://blogs.adb.org/' },
    ],
    exploreHref: 'https://www.adb.org/where-we-work/south-asia',
  },
  serd: {
    tagline: 'From the Mekong Delta to the archipelagos of Southeast Asia, ADB supports dynamic economic growth and inclusive development.',
    memberCountries: ['Brunei Darussalam', 'Cambodia', 'Indonesia', 'Lao PDR', 'Malaysia', 'Myanmar', 'Philippines', 'Singapore', 'Thailand', 'Timor-Leste', 'Viet Nam'],
    regionPulse: {
      date: '3 SEP 2026',
      title: 'ADB, Viet Nam Sign $42.76 Million Package to Build Modern, Resilient Irrigation System',
      description: 'The financing will help modernize irrigation infrastructure serving rice farmers across key agricultural provinces, improving water efficiency and climate resilience.',
      tags: ['Water management', 'Agriculture'],
      image: '/adb-home/blog-digital-transformation.jpg',
      href: 'https://www.adb.org/where-we-work/southeast-asia',
    },
    impactStories: [
      {
        category: 'Urban Environment',
        categoryColor: '#00695c',
        quote: '"We mapped every informal settlement along the river. Once we had the data, we could finally have different conversations with barangay officials."',
        person: '— Environmental officer, Pasig River Rehabilitation Commission, Philippines',
        image: '/adb-home/topbox-sub-palau-president-mission.jpg',
        href: 'https://www.adb.org/where-we-work/philippines',
        stats: [
          { value: '27 km', label: 'river corridor rehabilitated' },
          { value: '1.8M', label: 'residents benefiting' },
          { value: 'Pasig River Project', label: '$275M (2020–2026)' },
        ],
      },
      {
        category: 'Water & Agriculture',
        categoryColor: '#1565c0',
        quote: '"Before the irrigation upgrade, we could only grow one crop a year. Now we grow two — and my children can stay in school."',
        person: '— Rice farmer, Mekong Delta, Viet Nam',
        image: '/adb-home/blog-digital-transformation.jpg',
        href: 'https://www.adb.org/where-we-work/viet-nam',
        stats: [
          { value: '180,000 ha', label: 'irrigated farmland modernized' },
          { value: '2 crops/year', label: 'from 1 crop/year' },
          { value: 'Viet Nam Irrigation', label: '$42.76M (2026)' },
        ],
      },
      {
        category: 'Clean Energy',
        categoryColor: '#bf360c',
        quote: '"Indonesia has more geothermal energy than any country on earth. We are only beginning to use it — and ADB is helping us go faster."',
        person: '— Geothermal engineer, Pertamina Geothermal Energy, Sumatra, Indonesia',
        image: '/adb-home/blog-disasters-strike.jpg',
        href: 'https://www.adb.org/where-we-work/indonesia',
        stats: [
          { value: '2.1 GW', label: 'geothermal capacity target' },
          { value: '5M', label: 'households powered cleanly' },
          { value: 'Indonesia Geothermal', label: '$600M (2022–2028)' },
        ],
      },
      {
        category: 'Digital Connectivity',
        categoryColor: '#4527a0',
        quote: '"Once we had reliable internet in the commune, the young people stopped leaving for the city. The skills came to us instead."',
        person: '— Village chief, digital connectivity pilot, Kampong Speu, Cambodia',
        image: '/adb-home/blog-mongolia-rangelands.jpg',
        href: 'https://www.adb.org/where-we-work/cambodia',
        stats: [
          { value: '3,500', label: 'rural communes connected' },
          { value: '8M', label: 'people with broadband access' },
          { value: 'Cambodia Digital', label: '$100M (2023–2027)' },
        ],
      },
    ],
    fromTheRegion: [
      {
        country: 'Viet Nam',
        title: 'ASEAN Economic Cooperation Enters a New Era of Resilience and Security',
        date: '26 AUG 2026',
        image: '/adb-home/blog-digital-transformation.jpg',
        href: 'https://www.adb.org/where-we-work/viet-nam',
      },
      {
        country: 'Philippines',
        title: 'How Cities Can Reduce River Plastic Pollution with Digital Twins',
        date: '1 JUN 2025',
        image: '/adb-home/topbox-sub-palau-president-mission.jpg',
        href: 'https://www.adb.org/where-we-work/philippines',
      },
      {
        country: 'Indonesia',
        title: 'Geothermal Power Expansion in Indonesia: ADB Backs Clean Energy Transition',
        date: '18 JUN 2025',
        image: '/adb-home/blog-disasters-strike.jpg',
        href: 'https://www.adb.org/where-we-work/indonesia',
      },
    ],
    shorts: [
      { image: '/adb-home/blog-digital-transformation.jpg', caption: 'Viet Nam\'s $42.76M irrigation upgrade is bringing modern, climate-resilient farming to the Mekong Delta.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/topbox-sub-palau-president-mission.jpg', caption: 'Digital twins of Manila\'s Pasig River are helping city planners tackle plastic pollution at its source.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/blog-disasters-strike.jpg', caption: 'Indonesia\'s geothermal potential is vast. ADB is backing clean energy projects to tap this renewable source.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/img-homepage-me-conflict.jpg', caption: 'ASEAN connectivity in a new era: ADB is helping Southeast Asia build resilient infrastructure networks.', href: 'https://blogs.adb.org/' },
    ],
    exploreHref: 'https://www.adb.org/where-we-work/southeast-asia',
  },
  pard: {
    tagline: 'ADB partners with Pacific island nations to build resilience, sustainable growth, and climate adaptation in one of the world\'s most vulnerable regions.',
    memberCountries: ['Cook Islands', 'Fiji', 'Kiribati', 'Marshall Islands', 'Micronesia, Federated States of', 'Nauru', 'Niue', 'Palau', 'Papua New Guinea', 'Samoa', 'Solomon Islands', 'Tonga', 'Tuvalu', 'Vanuatu'],
    regionPulse: {
      date: '5 JUN 2025',
      title: 'ADB Backs Palau\'s Fiscal and Energy Resilience Amid Global Shocks, Expands North Pacific Presence',
      description: 'ADB President Masato Kanda met with Palau President Surangel S. Whipps, Jr. to discuss how Palau\'s sound fiscal management and a faster energy transition can reduce the country\'s exposure to external shocks.',
      tags: ['Energy transition', 'Fiscal resilience'],
      image: '/adb-home/topbox-sub-palau-president-mission.jpg',
      href: 'https://www.adb.org/where-we-work/pacific',
    },
    impactStories: [
      {
        category: 'Ocean Health',
        categoryColor: '#006064',
        quote: '"We are trying coral gardening, heat-resistant strains, 3D-printed reef structures. But ultimately it all depends on temperature."',
        person: '— Marine biologist, Palau International Coral Reef Center',
        image: '/adb-home/topbox-sub-palau-president-mission.jpg',
        href: 'https://www.adb.org/where-we-work/palau',
        stats: [
          { value: '700 km²', label: 'reef area under protection' },
          { value: '40,000', label: 'coral fragments transplanted' },
          { value: 'Palau Ocean Program', label: '$25M (2022–2027)' },
        ],
      },
      {
        category: 'Disaster Recovery',
        categoryColor: '#bf360c',
        quote: '"Within 48 hours of the earthquake, ADB had mobilized emergency funds. We had tents and clean water before the week was out."',
        person: '— Relief coordinator, National Disaster Management Office, Vanuatu',
        image: '/adb-home/topbox-sub-van-3rdo-me-conflict-v2.jpg',
        href: 'https://www.adb.org/where-we-work/vanuatu',
        stats: [
          { value: '$25M', label: 'emergency response mobilized' },
          { value: '10,000', label: 'families reached' },
          { value: 'Vanuatu Recovery', label: 'Dec 2024 – 2026' },
        ],
      },
      {
        category: 'Energy Transition',
        categoryColor: '#e65100',
        quote: '"Our goal is 100% renewable electricity by 2036. Fiji has the sun, the wind, and the rivers — we just needed the investment."',
        person: '— Energy minister, Fiji Electricity Authority, Suva',
        image: '/adb-home/blog-digital-transformation.jpg',
        href: 'https://www.adb.org/where-we-work/fiji',
        stats: [
          { value: '80%', label: 'renewable electricity target 2030' },
          { value: '120 MW', label: 'new solar & hydro capacity' },
          { value: 'Fiji Clean Energy', label: '$100M (2021–2026)' },
        ],
      },
      {
        category: 'Blue Economy',
        categoryColor: '#1565c0',
        quote: '"We are sitting on one of the richest fisheries on earth. ADB is helping us manage it so it is still rich for our grandchildren."',
        person: '— Fisheries director, National Fisheries Authority, Papua New Guinea',
        image: '/adb-home/blog-mongolia-rangelands.jpg',
        href: 'https://www.adb.org/where-we-work/papua-new-guinea',
        stats: [
          { value: '$2B+', label: 'annual tuna export value' },
          { value: '30%', label: 'increase in monitored catch zones' },
          { value: 'PNG Blue Economy', label: '$80M (2023–2028)' },
        ],
      },
    ],
    fromTheRegion: [
      {
        country: 'Palau',
        title: 'How Technology Could Help Restore Palau\'s Coral Reefs',
        date: '5 JUN 2025',
        image: '/adb-home/topbox-sub-palau-president-mission.jpg',
        href: 'https://www.adb.org/where-we-work/palau',
      },
      {
        country: 'Vanuatu',
        title: 'ADB Accelerates Disaster Response and Recovery for Vanuatu After December Earthquake',
        date: '28 MAY 2025',
        image: '/adb-home/topbox-sub-van-3rdo-me-conflict-v2.jpg',
        href: 'https://www.adb.org/where-we-work/vanuatu',
      },
      {
        country: 'Papua New Guinea',
        title: 'PNG\'s LNG Revenues: How ADB Is Helping Channel Resource Wealth into Human Development',
        date: '2 JUN 2025',
        image: '/adb-home/blog-digital-transformation.jpg',
        href: 'https://www.adb.org/where-we-work/papua-new-guinea',
      },
    ],
    shorts: [
      { image: '/adb-home/topbox-sub-palau-president-mission.jpg', caption: 'Coral gardening, heat-resistant strains, 3D-printed reefs — ADB is backing Palau\'s cutting-edge reef restoration.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/topbox-sub-van-3rdo-me-conflict-v2.jpg', caption: 'After December\'s earthquake, ADB mobilized rapid support for Vanuatu — food, shelter, and rebuilding.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/blog-digital-transformation.jpg', caption: 'PNG\'s resource wealth is growing. ADB is working to ensure it reaches communities through better governance.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/blog-disasters-strike.jpg', caption: 'The Pacific is on the frontline of climate change. ADB\'s resilience programs are helping island nations adapt.', href: 'https://blogs.adb.org/' },
    ],
    exploreHref: 'https://www.adb.org/where-we-work/pacific',
  },
  rlo: {
    tagline: 'ADB\'s regional and liaison offices connect member countries, partners, and stakeholders across the globe to advance the bank\'s development mission.',
    memberCountries: ['European Representative Office', 'Japan Liaison Office', 'North American Representative Office', 'Pacific Liaison & Coordination Office', 'Frankfurt Office', 'Seoul Office'],
    regionPulse: {
      date: '24 NOV 2026',
      title: 'Masato Kanda Reelected ADB President for 5-Year Term',
      description: 'ADB President Masato Kanda received unanimous support for a second term from ADB\'s Board of Governors. His new term runs for 5 years beginning 24 November 2026.',
      tags: ['Leadership', 'Governance'],
      image: '/adb-home/topbox-main-president-kanda-reelection-v1.jpg',
      href: 'https://www.adb.org/news/masato-kanda-reelected-adb-president-5-year-term',
    },
    impactStories: [
      {
        category: 'Partnerships',
        categoryColor: '#0d5fa6',
        quote: '"Our offices are not just representative functions—they are where we maintain the relationships that make financing possible."',
        person: '— ADB President Masato Kanda',
        image: '/adb-home/profile-adb-president-kanda.jpg',
        href: 'https://www.adb.org/who-we-are/main',
        stats: [
          { value: '6', label: 'liaison offices worldwide' },
          { value: '69', label: 'member countries' },
          { value: 'ADB Operations', label: 'Est. 1966' },
        ],
      },
      {
        category: 'Climate Finance',
        categoryColor: '#2e7d32',
        quote: '"European capital is looking for bankable green projects in Asia. ADB is the bridge — we know the projects, and we know the risks."',
        person: '— Director, ADB European Representative Office, Frankfurt',
        image: '/adb-home/img-homepage-me-conflict.jpg',
        href: 'https://www.adb.org/where-we-work/european-representative-office',
        stats: [
          { value: '€2B', label: 'European co-financing mobilized' },
          { value: '18', label: 'green projects co-financed' },
          { value: 'EU-ADB Climate', label: 'ongoing 2024–2030' },
        ],
      },
      {
        category: 'Knowledge Exchange',
        categoryColor: '#bf360c',
        quote: '"Japan brings 60 years of hard-won development experience. Through ADB, that knowledge reaches every corner of Asia and the Pacific."',
        person: '— Director, ADB Japan Liaison Office, Tokyo',
        image: '/adb-home/blog-mongolia-rangelands.jpg',
        href: 'https://www.adb.org/where-we-work/japan-liaison-office',
        stats: [
          { value: '$90B+', label: 'Japan contributions since 1966' },
          { value: '200+', label: 'Japanese experts deployed annually' },
          { value: 'ADB–Japan Partnership', label: '60 years' },
        ],
      },
    ],
    fromTheRegion: [
      {
        country: 'Europe',
        title: 'ADB Deepens Ties with European Partners on Climate Finance',
        date: '15 MAY 2025',
        image: '/adb-home/img-homepage-me-conflict.jpg',
        href: 'https://www.adb.org/where-we-work/european-representative-office',
      },
      {
        country: 'North America',
        title: 'ADB and US Treasury Strengthen Development Finance Partnership',
        date: '10 MAY 2025',
        image: '/adb-home/blog-digital-transformation.jpg',
        href: 'https://www.adb.org/where-we-work/north-american-representative-office',
      },
      {
        country: 'Japan',
        title: 'ADB–Japan Partnership: 60 Years of Shared Commitment to Asia\'s Development',
        date: '5 MAY 2025',
        image: '/adb-home/blog-mongolia-rangelands.jpg',
        href: 'https://www.adb.org/where-we-work/japan-liaison-office',
      },
    ],
    shorts: [
      { image: '/adb-home/topbox-main-president-kanda-reelection-v1.jpg', caption: 'Masato Kanda reelected ADB President for a second term — unanimous Board of Governors support.', href: 'https://www.adb.org/news/masato-kanda-reelected-adb-president-5-year-term' },
      { image: '/adb-home/img-homepage-me-conflict.jpg', caption: 'ADB and European partners align on climate finance: €2B in co-financing for green infrastructure in Asia.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/blog-digital-transformation.jpg', caption: 'US–ADB development finance partnership opens new channels for private sector investment in the Indo-Pacific.', href: 'https://blogs.adb.org/' },
      { image: '/adb-home/blog-mongolia-rangelands.jpg', caption: '60 years of ADB–Japan partnership: from post-war reconstruction to climate action and digital development.', href: 'https://blogs.adb.org/' },
    ],
    exploreHref: 'https://www.adb.org/where-we-work/regional-offices',
  },
};
