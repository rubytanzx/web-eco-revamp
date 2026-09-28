import { Component, ElementRef, HostListener, inject, signal, viewChild, computed } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { TablerIconComponent } from '@tabler/icons-angular';
import { AiChatService } from './shared/ai-chat.service';
import { DrawerStateService } from './shared/drawer-state.service';

interface NavChild {
  label: string;
  icon: string;
  route: string;
  queryParams?: Record<string, string>;
}

interface NavGroup {
  type: 'group';
  label: string;
  icon: string;
  children: NavChild[];
}

interface NavLeaf {
  type: 'leaf';
  label: string;
  icon: string;
  route: string;
}

type NavEntry = NavLeaf | NavGroup;

interface NavLink {
  label: string;
  icon: string;
  route?: string;
}

type AiSection = { type: 'p'; text: string } | { type: 'bullets'; items: string[] };
type AiMessage = { role: 'user'; text: string } | { role: 'ai'; sections: AiSection[]; sourcesCount?: number };

@Component({
  selector: 'app-control-tower',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TablerIconComponent],
  templateUrl: './control-tower.component.html',
  styleUrl: './control-tower.component.css',
})
export class ControlTowerComponent {
  protected readonly title = signal('adb-control-tower');
  readonly expanded = signal(true);

  private readonly router = inject(Router);

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly navigating = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationStart || e instanceof NavigationEnd),
      map(e => e instanceof NavigationStart),
      startWith(false),
    ),
    { initialValue: false },
  );

  readonly nav: NavEntry[] = [
    { type: 'leaf', label: 'Overview', icon: 'layout-dashboard', route: '/control-tower/overview' },
    {
      type: 'group', label: 'Usage', icon: 'chart-bar',
      children: [
        { label: 'Audience',    icon: 'users',            route: '/control-tower/audience'  },
        { label: 'Content',     icon: 'file-description', route: '/control-tower/content'   },
        { label: 'Search & AI', icon: 'search',           route: '/control-tower/search-ai' },
      ],
    },
    { type: 'leaf', label: 'Platform', icon: 'server', route: '/control-tower/platform' },
  ];

  readonly footerLinks: NavLink[] = [];

  readonly openGroups = signal<string[]>(['Analytics', 'Usage']);

  toggleGroup(label: string) {
    if (!this.expanded()) {
      this.expanded.set(true);
      this.openGroups.update(groups => groups.includes(label) ? groups : [...groups, label]);
      return;
    }
    this.openGroups.update(groups =>
      groups.includes(label) ? groups.filter(g => g !== label) : [...groups, label]
    );
  }

  isGroupOpen(label: string): boolean {
    return this.openGroups().includes(label);
  }

  isChildActive(child: NavChild): boolean {
    const url = this.currentUrl() ?? '/';
    const [path, search] = url.split('?');
    if (path !== child.route) return false;
    if (!child.queryParams) return true;
    const params = new URLSearchParams(search ?? '');
    return Object.entries(child.queryParams).every(([k, v]) => params.get(k) === v);
  }

  isGroupActive(group: NavGroup): boolean {
    return group.children.some(c => this.isChildActive(c));
  }

  toggle() {
    this.expanded.update((v) => !v);
    this.tooltip.set(null);
  }

  // ---- Collapsed sidebar tooltip ----
  readonly tooltip = signal<{ label: string; y: number } | null>(null);

  showTooltip(event: MouseEvent, label: string): void {
    if (this.expanded()) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.tooltip.set({ label, y: Math.round(rect.top + rect.height / 2) });
  }

  hideTooltip(): void {
    this.tooltip.set(null);
  }

  // ---- View mode toggle (Admin / User) ----
  readonly viewMode = signal<'user' | 'admin'>('admin');

  setViewMode(mode: 'user' | 'admin') {
    this.viewMode.set(mode);
  }

  // ---- Profile / avatar menu ----
  readonly profileMenuOpen = signal(false);
  private readonly profileMenuEl = viewChild<ElementRef<HTMLElement>>('profileMenuEl');

  toggleProfileMenu() { this.profileMenuOpen.update(v => !v); }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    if (this.profileMenuOpen()) {
      const el = this.profileMenuEl()?.nativeElement;
      if (el && !el.contains(ev.target as Node)) this.profileMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(ev: KeyboardEvent) {
    if ((ev.metaKey || ev.ctrlKey) && ev.key === 'k') {
      ev.preventDefault();
      this.searchOpen.set(true);
    }
    if (ev.key === 'Escape') {
      if (this.searchOpen()) { this.searchOpen.set(false); this.searchQuery.set(''); }
      if (this.profileMenuOpen()) this.profileMenuOpen.set(false);
    }
  }

  // ---- Search command palette ----
  readonly searchOpen = signal(false);
  readonly searchQuery = signal('');

  readonly searchItems = [
    { type: 'metric', label: 'Page views',          value: '4.8M',   sub: '8% vs last month',    icon: 'trending-up',      route: '/control-tower/overview'  },
    { type: 'metric', label: 'Active users',         value: '284K',   sub: '12% vs last month',   icon: 'users',            route: '/control-tower/audience'  },
    { type: 'metric', label: 'Content actions',      value: '82.4K',  sub: '18% vs last month',   icon: 'chart-bar',        route: '/control-tower/content'   },
    { type: 'metric', label: 'Search success rate',  value: '68%',    sub: '3pts this month',      icon: 'search',           route: '/control-tower/search-ai' },
    { type: 'metric', label: 'Zero-result rate',     value: '12.4%',  sub: 'Up 41% this week',       icon: 'alert-triangle',   route: '/control-tower/search-ai' },
    { type: 'metric', label: 'AI interactions',      value: '30,020', sub: '60% staff adoption',     icon: 'cpu',              route: '/control-tower/ai-ops'    },
    { type: 'metric', label: 'Negative feedback',    value: '8.2%',   sub: 'Up from 6.1% last month',icon: 'thumb-down',       route: '/control-tower/feedback'  },
    { type: 'metric', label: 'Platform uptime',      value: '99.7%',  sub: '1 active incident',      icon: 'server',           route: '/control-tower/platform'  },
    { type: 'page',   label: 'Overview',             icon: 'layout-dashboard',  route: '/control-tower/overview'  },
    { type: 'page',   label: 'Audience',             icon: 'users',             route: '/control-tower/audience'  },
    { type: 'page',   label: 'Content',              icon: 'file-description',  route: '/control-tower/content'   },
    { type: 'page',   label: 'Feedback',             icon: 'messages',          route: '/control-tower/feedback'  },
    { type: 'page',   label: 'Search & AI',          icon: 'search',            route: '/control-tower/search-ai' },
    { type: 'page',   label: 'AI Operations',        icon: 'cpu',               route: '/control-tower/ai-ops'    },
    { type: 'page',   label: 'Platform',             icon: 'server',            route: '/control-tower/platform'  },
  ];

  filteredSearch = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return { metrics: this.searchItems.filter(i => i.type === 'metric').slice(0, 5), pages: this.searchItems.filter(i => i.type === 'page') };
    const all = this.searchItems.filter(i => i.label.toLowerCase().includes(q) || (i.type === 'metric' && ('value' in i) && (i as any).sub?.toLowerCase().includes(q)));
    return { metrics: all.filter(i => i.type === 'metric'), pages: all.filter(i => i.type === 'page') };
  });

  openSearch() { this.searchOpen.set(true); }

  navigateSearch(route: string) {
    this.router.navigate([route]);
    this.searchOpen.set(false);
    this.searchQuery.set('');
  }

  // ---- Ask AI side panel ----
  private readonly chat        = inject(AiChatService);
  private readonly drawerState = inject(DrawerStateService);
  readonly aiOpen      = this.chat.isOpen;
  readonly drawerOpen  = this.drawerState.isOpen;
  readonly aiInput = this.chat.input;
  readonly aiMessages = signal<AiMessage[]>([]);
  readonly aiThinking = signal(false);
  readonly copiedKey = signal<string | null>(null);
  readonly thumbs = signal<Record<string, 'up' | 'down'>>({});
  readonly sourcesOpen = signal<Record<number, boolean>>({});

  copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    this.copiedKey.set(key);
    setTimeout(() => this.copiedKey.update(k => k === key ? null : k), 2000);
  }

  setThumb(key: string, dir: 'up' | 'down') {
    this.thumbs.update(t => ({ ...t, [key]: dir }));
  }

  getThumb(key: string): 'up' | 'down' | null {
    return this.thumbs()[key] ?? null;
  }

  toggleSources(idx: number) {
    this.sourcesOpen.update(s => ({ ...s, [idx]: !s[idx] }));
  }

  sourcesOpenFor(idx: number): boolean {
    return !!this.sourcesOpen()[idx];
  }

  getAiText(msg: AiMessage): string {
    if (msg.role !== 'ai') return '';
    return msg.sections.map(s => s.type === 'p' ? s.text : s.items.join('\n')).join('\n');
  }

  readonly aiSuggestions = [
    'Which region is adoption picking up in?',
    "What's driving the negative feedback spike?",
    'Where are the biggest content gaps?',
  ];

  useSuggestion(text: string) { this.chat.setInput(text); }
  setAiInput(v: string) { this.chat.setInput(v); }

  sendMessage() {
    const text = this.aiInput().trim();
    if (!text) return;
    this.aiMessages.update(msgs => [...msgs, { role: 'user' as const, text }]);
    this.chat.setInput('');
    this.aiThinking.set(true);
    setTimeout(() => {
      this.aiThinking.set(false);
      this.aiMessages.update(msgs => [...msgs, this.mockResponse(text)]);
    }, 1200);
  }

  private mockResponse(prompt: string): AiMessage {
    const t = prompt.toLowerCase();
    if (t.includes('region')) return { role: 'ai', sections: [
      { type: 'p', text: 'Adoption is picking up fastest in CWRD and SARD this period.' },
      { type: 'bullets', items: ['CWRD — top departments: DOCK (100), ITD (92), ORM (86)', 'SARD — strong India contribution (4,100 queries)', 'SERD shows moderate uplift via infrastructure queries'] },
    ], sourcesCount: 4 };
    if (t.includes('feedback') || t.includes('negative')) return { role: 'ai', sections: [
      { type: 'p', text: 'The spike is concentrated in Project Brief Generation (142 affected prompts).' },
      { type: 'bullets', items: ['Macroeconomic Research — 86 prompts, no dedicated collection', 'Staff Finder · CWRD — 54 prompts, profile gaps', 'Top drivers: factual errors and instruction-following failures'] },
    ], sourcesCount: 3 };
    if (t.includes('content') || t.includes('gap')) return { role: 'ai', sections: [
      { type: 'p', text: 'Three significant gaps surfaced this period:' },
      { type: 'bullets', items: ['Infrastructure Financing — 56 prompts, no collection', 'Climate Finance · PARD — 18 prompts', 'Governance & Procurement — 14 prompts'] },
    ], sourcesCount: 5 };
    return { role: 'ai', sections: [
      { type: 'p', text: 'Looking across metrics for Jan–May 2026: 30,020 page views, 3,095 active staff (60% adoption), 83.88% retention.' },
      { type: 'p', text: 'Try one of the suggested prompts or specify a topic, agent, or region.' },
    ], sourcesCount: 2 };
  }

  openAi()  { this.chat.open(); }
  closeAi() { this.chat.close(); }
}
