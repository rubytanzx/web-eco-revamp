export type WidgetPage =
  | 'dashboard'
  | 'usage-intent'
  | 'usage-modules'
  | 'collections'
  | 'preferences'
  | 'performance-ai'
  | 'performance-search';

export type WidgetType =
  | 'kpi-card'
  | 'bar-chart'
  | 'line-chart'
  | 'donut-chart'
  | 'table'
  | 'treemap';

export interface WidgetDef {
  id: string;
  title: string;
  page: WidgetPage;
  pageLabel: string;
  pageRoute: string;
  type: WidgetType;
  cols: 1 | 2 | 3 | 4;
  icon: string;
  // KPI-specific
  kpiValue?: string;
  kpiDelta?: string;
  kpiDeltaPositive?: boolean;
  kpiSub?: string;
  // Chart/table preview
  summary?: string;
}

export const WIDGET_PAGES: { id: WidgetPage | 'all'; label: string }[] = [
  { id: 'all',                label: 'All'                  },
  { id: 'dashboard',          label: 'Overview'             },
  { id: 'usage-intent',       label: 'Usage · Intent'       },
  { id: 'usage-modules',      label: 'Usage · Modules'      },
  { id: 'collections',        label: 'Collections'          },
  { id: 'preferences',        label: 'Preferences'          },
  { id: 'performance-ai',     label: 'Performance · AI'     },
  { id: 'performance-search', label: 'Performance · Search' },
];

export const WIDGET_CATALOG: WidgetDef[] = [
  // ── Overview ──────────────────────────────────────────────────────────────
  {
    id: 'total-prompts',
    title: 'Total Prompts',
    page: 'dashboard', pageLabel: 'Overview', pageRoute: '/',
    type: 'kpi-card', cols: 1, icon: 'message-dots',
    kpiValue: '917', kpiDelta: '8.4%', kpiDeltaPositive: false,
    kpiSub: 'vs previous period',
  },
  {
    id: 'active-users',
    title: 'Active Users',
    page: 'dashboard', pageLabel: 'Overview', pageRoute: '/',
    type: 'kpi-card', cols: 1, icon: 'users',
    kpiValue: '209', kpiDelta: '3.1%', kpiDeltaPositive: false,
    kpiSub: 'vs previous period',
  },
  {
    id: 'avg-per-user',
    title: 'Avg. per User',
    page: 'dashboard', pageLabel: 'Overview', pageRoute: '/',
    type: 'kpi-card', cols: 1, icon: 'trending-up',
    kpiValue: '4.4', kpiDelta: '1.2%', kpiDeltaPositive: true,
    kpiSub: 'vs previous period',
  },
  {
    id: 'feedback-received',
    title: 'Feedback Received',
    page: 'dashboard', pageLabel: 'Overview', pageRoute: '/',
    type: 'kpi-card', cols: 1, icon: 'star',
    kpiValue: '2,011', kpiDelta: '6.8%', kpiDeltaPositive: true,
    kpiSub: 'vs previous period',
  },
  {
    id: 'prompt-volume-trend',
    title: 'Prompt Volume Trend',
    page: 'dashboard', pageLabel: 'Overview', pageRoute: '/',
    type: 'line-chart', cols: 4, icon: 'chart-line',
    summary: 'Peak 857 prompts on Jun 13 · 8-week rolling window',
  },

  // ── Usage — Intent ────────────────────────────────────────────────────────
  {
    id: 'usage-total-prompts',
    title: 'Total Prompts',
    page: 'usage-intent', pageLabel: 'Usage · Intent', pageRoute: '/usage',
    type: 'kpi-card', cols: 1, icon: 'message-dots',
    kpiValue: '4,218', kpiDelta: '12.3%', kpiDeltaPositive: true,
    kpiSub: 'all-time submissions',
  },
  {
    id: 'knowledge-prompts',
    title: 'Knowledge Prompts',
    page: 'usage-intent', pageLabel: 'Usage · Intent', pageRoute: '/usage',
    type: 'kpi-card', cols: 1, icon: 'book-2',
    kpiValue: '2,847', kpiDelta: '9.1%', kpiDeltaPositive: true,
    kpiSub: '67.5% of total',
  },
  {
    id: 'people-prompts',
    title: 'People Prompts',
    page: 'usage-intent', pageLabel: 'Usage · Intent', pageRoute: '/usage',
    type: 'kpi-card', cols: 1, icon: 'user-search',
    kpiValue: '1,124', kpiDelta: '18.4%', kpiDeltaPositive: true,
    kpiSub: '26.6% of total',
  },
  {
    id: 'unclassified-intent',
    title: 'Unclassified Intent',
    page: 'usage-intent', pageLabel: 'Usage · Intent', pageRoute: '/usage',
    type: 'kpi-card', cols: 1, icon: 'help-circle',
    kpiValue: '247', kpiDelta: '3.2%', kpiDeltaPositive: false,
    kpiSub: '5.9% of total',
  },
  {
    id: 'intent-treemap',
    title: 'Intent Treemap',
    page: 'usage-intent', pageLabel: 'Usage · Intent', pageRoute: '/usage',
    type: 'treemap', cols: 4, icon: 'layout-grid',
    summary: 'Knowledge · People · Unclassified — click any tile for prompt drill-down',
  },

  // ── Usage — Modules ───────────────────────────────────────────────────────
  {
    id: 'top-services',
    title: 'Top Services',
    page: 'usage-modules', pageLabel: 'Usage · Modules', pageRoute: '/usage',
    type: 'bar-chart', cols: 2, icon: 'chart-bar',
    summary: 'IT Helpdesk leads with 284 clicks · toggle by clicks or unique users',
  },
  {
    id: 'week-over-week-click-trend',
    title: 'Week-over-Week Click Trend',
    page: 'usage-modules', pageLabel: 'Usage · Modules', pageRoute: '/usage',
    type: 'line-chart', cols: 4, icon: 'chart-line',
    summary: 'Top 3 services — IT Helpdesk trending up 14% vs last week',
  },
  {
    id: 'services-usage-breakdown',
    title: 'Services Usage Breakdown',
    page: 'usage-modules', pageLabel: 'Usage · Modules', pageRoute: '/usage',
    type: 'bar-chart', cols: 4, icon: 'chart-bar',
    summary: '% share of total click volume per service',
  },

  // ── Collections ───────────────────────────────────────────────────────────
  {
    id: 'total-collections',
    title: 'Total Collections',
    page: 'collections', pageLabel: 'Collections', pageRoute: '/collections',
    type: 'kpi-card', cols: 1, icon: 'folder',
    kpiValue: '28',
    kpiSub: 'registered knowledge bases',
  },
  {
    id: 'overall-utilization-rate',
    title: 'Overall Utilization Rate',
    page: 'collections', pageLabel: 'Collections', pageRoute: '/collections',
    type: 'kpi-card', cols: 1, icon: 'percentage',
    kpiValue: '67%', kpiDelta: '4.2pp', kpiDeltaPositive: true,
    kpiSub: 'avg across all collections',
  },
  {
    id: 'collections-active',
    title: 'Collections Active',
    page: 'collections', pageLabel: 'Collections', pageRoute: '/collections',
    type: 'kpi-card', cols: 1, icon: 'folder-check',
    kpiValue: '21',
    kpiSub: 'queried in last 30 days',
  },
  {
    id: 'collections-not-retrieved',
    title: 'Not Retrieved',
    page: 'collections', pageLabel: 'Collections', pageRoute: '/collections',
    type: 'kpi-card', cols: 1, icon: 'folder-x',
    kpiValue: '7',
    kpiSub: 'zero retrieval events',
  },
  {
    id: 'collection-registry',
    title: 'Collection Registry',
    page: 'collections', pageLabel: 'Collections', pageRoute: '/collections',
    type: 'table', cols: 4, icon: 'table',
    summary: '28 collections · sortable by name, last updated, utilization, queries',
  },

  // ── Preferences ───────────────────────────────────────────────────────────
  {
    id: 'preference-tags-available',
    title: 'Preference Tags Available',
    page: 'preferences', pageLabel: 'Preferences', pageRoute: '/preferences',
    type: 'kpi-card', cols: 1, icon: 'tags',
    kpiValue: '42',
    kpiSub: 'selectable tags',
  },
  {
    id: 'avg-selected-per-user',
    title: 'Avg. Selected per User',
    page: 'preferences', pageLabel: 'Preferences', pageRoute: '/preferences',
    type: 'kpi-card', cols: 1, icon: 'list-check',
    kpiValue: '3.2',
    kpiSub: 'tags per user on average',
  },
  {
    id: 'preference-adoption-rate',
    title: 'Preference Adoption Rate',
    page: 'preferences', pageLabel: 'Preferences', pageRoute: '/preferences',
    type: 'kpi-card', cols: 1, icon: 'circle-check',
    kpiValue: '78%', kpiDelta: '5.3pp', kpiDeltaPositive: true,
    kpiSub: 'users with ≥1 tag set',
  },
  {
    id: 'preference-change-frequency',
    title: 'Preference Change Frequency',
    page: 'preferences', pageLabel: 'Preferences', pageRoute: '/preferences',
    type: 'kpi-card', cols: 1, icon: 'refresh',
    kpiValue: '1.4×', kpiDelta: '0.2×', kpiDeltaPositive: true,
    kpiSub: 'avg changes per user/mo',
  },
  {
    id: 'trending-preferences',
    title: 'Trending Preferences',
    page: 'preferences', pageLabel: 'Preferences', pageRoute: '/preferences',
    type: 'bar-chart', cols: 2, icon: 'chart-bar',
    summary: '"Concise answers" most selected · 341 users · Rising badge',
  },
  {
    id: 'least-popular-preferences',
    title: 'Least Popular Preferences',
    page: 'preferences', pageLabel: 'Preferences', pageRoute: '/preferences',
    type: 'bar-chart', cols: 2, icon: 'chart-bar',
    summary: 'Low-selection tags — candidates for consolidation or removal',
  },

  // ── Performance — AI ──────────────────────────────────────────────────────
  {
    id: 'avg-ai-response-time',
    title: 'Avg. AI Response Time',
    page: 'performance-ai', pageLabel: 'Performance · AI', pageRoute: '/performance',
    type: 'kpi-card', cols: 1, icon: 'clock',
    kpiValue: '1.8s', kpiDelta: '0.2s', kpiDeltaPositive: true,
    kpiSub: 'end-to-end latency',
  },
  {
    id: 'no-answer-rate',
    title: 'No Answer Rate',
    page: 'performance-ai', pageLabel: 'Performance · AI', pageRoute: '/performance',
    type: 'kpi-card', cols: 1, icon: 'alert-circle',
    kpiValue: '4.2%', kpiDelta: '0.8pp', kpiDeltaPositive: true,
    kpiSub: 'prompts with no retrieval',
  },
  {
    id: 'retrieval-success-rate',
    title: 'Retrieval Success Rate',
    page: 'performance-ai', pageLabel: 'Performance · AI', pageRoute: '/performance',
    type: 'kpi-card', cols: 1, icon: 'circle-check',
    kpiValue: '91.3%', kpiDelta: '1.5pp', kpiDeltaPositive: true,
    kpiSub: 'relevant docs retrieved',
  },
  {
    id: 'error-rate',
    title: 'Error Rate',
    page: 'performance-ai', pageLabel: 'Performance · AI', pageRoute: '/performance',
    type: 'kpi-card', cols: 1, icon: 'bug',
    kpiValue: '0.9%', kpiDelta: '0.1pp', kpiDeltaPositive: true,
    kpiSub: 'system errors per request',
  },
  {
    id: 'response-time-by-collection',
    title: 'Response Time by Collection',
    page: 'performance-ai', pageLabel: 'Performance · AI', pageRoute: '/performance',
    type: 'bar-chart', cols: 4, icon: 'chart-bar',
    summary: 'Policy Search slowest at 3.1s · ADB Climate fastest at 1.2s',
  },
  {
    id: 'token-usage-per-query',
    title: 'Token Usage per Query',
    page: 'performance-ai', pageLabel: 'Performance · AI', pageRoute: '/performance',
    type: 'bar-chart', cols: 2, icon: 'chart-bar',
    summary: '847 avg tokens · context at 68% · stacked by token bucket',
  },

  // ── Performance — Search ──────────────────────────────────────────────────
  {
    id: 'follow-up-search-queries',
    title: 'Follow-up Search Queries',
    page: 'performance-search', pageLabel: 'Performance · Search', pageRoute: '/performance',
    type: 'kpi-card', cols: 2, icon: 'search',
    kpiValue: '23.4%', kpiDelta: '1.8pp', kpiDeltaPositive: false,
    kpiSub: 'searches after an AI response',
  },
  {
    id: 'search-to-ai-conversion',
    title: 'Search → AI Conversion',
    page: 'performance-search', pageLabel: 'Performance · Search', pageRoute: '/performance',
    type: 'kpi-card', cols: 2, icon: 'arrow-right',
    kpiValue: '18.7%', kpiDelta: '2.3pp', kpiDeltaPositive: true,
    kpiSub: 'searches escalated to AI',
  },
  {
    id: 'zero-results-by-content-type',
    title: 'Zero Results by Content Type',
    page: 'performance-search', pageLabel: 'Performance · Search', pageRoute: '/performance',
    type: 'bar-chart', cols: 4, icon: 'chart-bar',
    summary: 'News content: 12.4% zero-result rate · lowest for Policies at 1.8%',
  },
];
