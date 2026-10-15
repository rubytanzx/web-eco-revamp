import {
  AfterViewInit, ChangeDetectionStrategy, Component,
  ElementRef, OnDestroy, ViewChild, computed, effect, inject, signal
} from '@angular/core';
import { gsap } from 'gsap';
import { AdbMapComponent } from '../../components/adb-map/adb-map.component';
import { AdbRegionCarouselComponent } from '../../components/adb-region-carousel/adb-region-carousel.component';
import { AiChatPanelComponent } from '../../components/ai-chat-panel/ai-chat-panel.component';
import { SiteHeaderComponent } from '../../components/site-header/site-header.component';
import { RegionEntry, SectorMapMarker, UserLocationData } from '../../models/region.model';
import { RouterLink } from '@angular/router';
import { REGION_PANEL_CONTENT, ImpactStoryItem, RegionPanelContent } from '../../data/region-panel-content';
import { ProjectWidget } from '../../components/ai-chat-panel/ai-chat-panel.component';

const WATER_SECTOR_COLOR = '#06b6d4';

const SECTOR_MAP_DATA: Record<string, SectorMapMarker[]> = {
  water: [
    { regionId: 'cwrd', count: 45, color: WATER_SECTOR_COLOR },
    { regionId: 'eard', count: 18, color: WATER_SECTOR_COLOR },
    { regionId: 'sard', count: 72, color: WATER_SECTOR_COLOR },
    { regionId: 'serd', count: 58, color: WATER_SECTOR_COLOR },
    { regionId: 'pard', count: 12, color: WATER_SECTOR_COLOR },
  ],
};

const DETECTED_LOCATION: UserLocationData = {
  countryCode: 'PH',
  countryName: 'Philippines',
  regionCode: 'SERD',
  regionName: 'Southeast Asia',
  markerX: 83.8,
  markerY: 53.7,
};

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [AdbMapComponent, AdbRegionCarouselComponent, AiChatPanelComponent, SiteHeaderComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);

  @ViewChild(AdbRegionCarouselComponent) carouselRef!: AdbRegionCarouselComponent;
  @ViewChild('wwworkHero') wwworkHeroRef!: ElementRef<HTMLElement>;
  @ViewChild('wwworkPanel', { static: true }) wwworkPanelRef!: ElementRef<HTMLElement>;
  @ViewChild('wwworkCarousel') wwworkCarouselRef!: ElementRef<HTMLElement>;
  @ViewChild('carouselFadeR') carouselFadeRRef!: ElementRef<HTMLElement>;

  readonly detectedLocation: UserLocationData = DETECTED_LOCATION;

  headerHeight = signal(0);
  selectedRegionId = signal<string>('');
  hoveredRegionId = signal<string>('');
  expandedRegion = signal<RegionEntry | null>(null);
  mapViewBoxOffsetX = signal<number>(380);
  chatOpen = signal(false);
  chatExpandCompleted = signal(false);
  hiwQuery = signal('');
  storyIndex = signal<number>(0);
  exploreTab = signal<'region' | 'sector'>('region');
  selectedSector = signal<string>('');
  sectorMapMarkers = computed<SectorMapMarker[]>(() => SECTOR_MAP_DATA[this.selectedSector()] ?? []);
  expandedSector = signal<string>('');
  aiPanelContext = signal<string>('');

  // ── Inline panel chat ──────────────────────────────────────────────────────
  panelChatPrompt = signal<string>('');

  private resetPanelChatOnRegionChange = effect(() => {
    this.expandedRegion(); // track
    this.panelChatPrompt.set('');
  });

  onPanelPromptClick(prompt: string) {
    this.panelChatPrompt.set(prompt);
  }

  exitPanelChat() {
    this.panelChatPrompt.set('');
  }

  expandPanelChat() {
    const prompt = this.panelChatPrompt();
    if (prompt) this.hiwQuery.set(prompt);
    this.chatExpandCompleted.set(true);
    this.chatOpen.set(true);
  }

  onChatClose() {
    this.chatOpen.set(false);
    this.chatExpandCompleted.set(false);
    this.aiPanelContext.set('');
  }

  readonly sectors = [
    { id: 'agri',      name: 'Agriculture, Natural Resources & Rural Dev.', stat: '200+ projects', color: '#22c55e', image: 'https://images.unsplash.com/photo-1559628233-eb1b1a45564b?auto=format&fit=crop&w=800&q=80' },
    { id: 'education', name: 'Education',                                    stat: '100+ projects', color: '#f97316', image: 'https://images.unsplash.com/photo-1490424660416-359912d314b3?auto=format&fit=crop&w=800&q=80' },
    { id: 'energy',    name: 'Energy',                                       stat: '380+ projects', color: '#f59e0b', image: 'https://images.unsplash.com/photo-1677137264354-e8c011fe0413?auto=format&fit=crop&w=800&q=80' },
    { id: 'finance',   name: 'Finance',                                      stat: '180+ projects', color: '#8b5cf6', image: 'https://images.unsplash.com/photo-1684679674829-fc7b436ec8e8?auto=format&fit=crop&w=800&q=80' },
    { id: 'health',    name: 'Health',                                       stat: '120+ projects', color: '#ef4444', image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80' },
    { id: 'healthsp',  name: 'Health & Social Protection',                   stat: 'Cross-cutting', color: '#ec4899', image: 'https://images.unsplash.com/photo-1727208863988-ede35969f589?auto=format&fit=crop&w=800&q=80' },
    { id: 'industry',  name: 'Industry & Trade',                             stat: '90+ projects',  color: '#0ea5e9', image: 'https://images.unsplash.com/photo-1765206810565-63f26023e1c9?auto=format&fit=crop&w=800&q=80' },
    { id: 'ict',       name: 'Information & Communication Technology',       stat: '80+ projects',  color: '#6366f1', image: 'https://images.unsplash.com/photo-1683322499436-f4383dd59f5a?auto=format&fit=crop&w=800&q=80' },
    { id: 'multi',     name: 'Multisector',                                  stat: '60+ projects',  color: '#64748b', image: 'https://images.unsplash.com/photo-1466803136990-7c174b34ff32?auto=format&fit=crop&w=800&q=80' },
    { id: 'psm',       name: 'Public Sector Management',                     stat: '150+ projects', color: '#002569', image: 'https://images.unsplash.com/photo-1764147385045-cd671db53dd9?auto=format&fit=crop&w=800&q=80' },
    { id: 'transport', name: 'Transport',                                    stat: '300+ projects', color: '#3b82f6', image: 'https://images.unsplash.com/photo-1719574778890-460807a74478?auto=format&fit=crop&w=800&q=80' },
    { id: 'transict',  name: 'Transport & ICT',                              stat: '40+ projects',  color: '#14b8a6', image: 'https://images.unsplash.com/photo-1631981152698-bdee35111fd2?auto=format&fit=crop&w=800&q=80' },
    { id: 'water',     name: 'Water & Other Urban Infrastructure',           stat: '260+ projects', color: '#06b6d4', image: 'https://images.unsplash.com/photo-1567046956024-197850696bba?auto=format&fit=crop&w=800&q=80' },
  ];

  /** 'country' when the panel was opened via the user-location marker */
  panelMode = signal<'region' | 'country'>('region');
  countryFocus = signal<UserLocationData | null>(null);

  regionContent = computed<RegionPanelContent | null>(() => {
    const id = this.expandedRegion()?.id;
    return id ? (REGION_PANEL_CONTENT[id] ?? null) : null;
  });

  currentStory = computed<ImpactStoryItem | null>(() => {
    const stories = this.regionContent()?.impactStories;
    if (!stories?.length) return null;
    return stories[Math.min(this.storyIndex(), stories.length - 1)];
  });

  private resetStoryIndex = effect(() => {
    this.expandedRegion();
    this.storyIndex.set(0);
  });

  prevStory(): void {
    const len = this.regionContent()?.impactStories.length ?? 1;
    this.storyIndex.update(i => (i - 1 + len) % len);
  }

  nextStory(): void {
    const len = this.regionContent()?.impactStories.length ?? 1;
    this.storyIndex.update(i => (i + 1) % len);
  }

  regionChatQuery = computed<string>(() => {
    const r = this.expandedRegion();
    return r ? `Tell me about ADB's work in ${r.name} (${r.shortName})` : '';
  });

  regionChatSeed = computed<string>(() => {
    const r = this.expandedRegion();
    const c = this.regionContent();
    if (!r || !c) return '';
    const topCountries = c.memberCountries.slice(0, 5).join(', ') +
      (c.memberCountries.length > 5 ? ` and ${c.memberCountries.length - 5} others` : '');
    const s0 = c.impactStories[0];
    const stats = s0.stats.map(s => `${s.value} ${s.label}`).join(' · ');
    return `ADB's ${r.name} (${r.shortName}) covers ${c.memberCountries.length} member countries including ${topCountries}.\n\n${c.tagline}\n\nLatest: ${c.regionPulse.title}\n${c.regionPulse.description}\n\nImpact — ${s0.category}:\n${s0.quote}\n${s0.person}\n\nKey figures: ${stats}`;
  });

  regionChatProjects = computed<ProjectWidget[]>(() => {
    const c = this.regionContent();
    if (!c?.latestProjects) return [];
    return c.latestProjects as ProjectWidget[];
  });

  regionChatRelated = computed<string[]>(() => {
    const r = this.expandedRegion();
    const c = this.regionContent();
    if (!r || !c) return [];
    return [
      `What are ADB's latest projects in ${r.name}?`,
      `How is ADB addressing ${c.impactStories[0].category} in this region?`,
      `${c.regionPulse.tags[0]}: What is ADB doing?`,
    ];
  });

  private readonly VB_X = 380;
  private readonly VB_W = 700;
  private readonly VB_Y = 75;
  private readonly VB_H = 275;

  private isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 960;
  }

  private activeTl: gsap.core.Timeline | null = null;
  private currentVbX = 380;
  private parallaxCleanup: (() => void) | null = null;
  private resizeCleanup: (() => void) | null = null;

  ngOnDestroy(): void {
    this.parallaxCleanup?.();
    this.resizeCleanup?.();
  }

  private setupBreakpointReset(): void {
    let wasMobile = this.isMobile();
    const onResize = () => {
      const isMobileNow = this.isMobile();
      if (wasMobile === isMobileNow) return;
      wasMobile = isMobileNow;
      // Reset all panel + GSAP state when crossing the 960px breakpoint
      this.activeTl?.kill();
      this.activeTl = null;
      this.expandedRegion.set(null);
      this.panelMode.set('region');
      this.countryFocus.set(null);
      const panel = this.wwworkPanelRef?.nativeElement;
      const hero = this.wwworkHeroRef?.nativeElement;
      const carousel = this.wwworkCarouselRef?.nativeElement;
      const fadeR = this.carouselFadeRRef?.nativeElement;
      if (panel) gsap.set(panel, { clearProps: 'all' });
      if (carousel) gsap.set(carousel, { clearProps: 'all' });
      if (fadeR) gsap.set(fadeR, { clearProps: 'all' });
      if (!isMobileNow) {
        // Re-apply desktop hidden state for panel
        if (panel) gsap.set(panel, { opacity: 0, x: 24, pointerEvents: 'none' });
        if (hero) gsap.set(hero, { clearProps: 'all' });
      }
    };
    window.addEventListener('resize', onResize, { passive: true });
    this.resizeCleanup = () => window.removeEventListener('resize', onResize);
  }

  private setupParallax(): void {
    const section = this.el.nativeElement.querySelector('.wwwork-map-area') as HTMLElement;
    const hero = this.wwworkHeroRef?.nativeElement;
    if (!section || !hero) return;

    // Track the scroll position at the moment the section enters the viewport
    let entryScrollY: number | null = null;
    let raf: number | null = null;

    const onScroll = () => {
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const rect = section.getBoundingClientRect();
        const viewH = window.innerHeight;

        if (rect.top > viewH || rect.bottom < 0) {
          entryScrollY = null;
          return;
        }

        if (entryScrollY === null) entryScrollY = window.scrollY;

        // The section container scrolls up with the page at 100%.
        // Pushing the hero DOWN (+Y) by 30% of that distance makes it
        // move at only 70% of page scroll speed → visible floating depth.
        const delta = window.scrollY - entryScrollY;
        gsap.set(hero, { y: delta * 0.3 });
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    this.parallaxCleanup = () => {
      window.removeEventListener('scroll', onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }

  private syncEffect = effect(() => {
    const id = this.selectedRegionId();
    queueMicrotask(() => this.carouselRef?.scrollToRegion(id));
  });

  ngAfterViewInit(): void {
    if (this.wwworkPanelRef && !this.isMobile()) {
      gsap.set(this.wwworkPanelRef.nativeElement, { opacity: 0, x: 24, pointerEvents: 'none' });
    }

    if (!this.isMobile()) {
      this.setupParallax();
    }

    this.setupBreakpointReset();

    // Animate "Advancing Economies, Elevating Lives" in when scrolled into view
    const hero = this.wwworkHeroRef?.nativeElement;
    if (hero) {
      const title = hero.querySelector('.wwwork-title');
      const strong = hero.querySelector('.wwwork-title strong');
      const sub = hero.querySelector('.wwwork-sub');
      gsap.set([title, strong, sub], { opacity: 0, y: 22 });

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          gsap.to(title, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
          gsap.to(strong, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.15 });
          gsap.to(sub,    { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.38 });
        },
        { threshold: 0.25 },
      );
      observer.observe(hero);
    }
  }

  onRegionSelect(id: string, fromUserLocation = false) {
    if (!fromUserLocation) {
      this.panelMode.set('region');
      this.countryFocus.set(null);
    }
    this.selectedSector.set('');
    this.selectedRegionId.set(id);
    const region = this.carouselRef?.regions().find(r => r.id === id) ?? null;
    if (!region) return;
    if (this.expandedRegion()?.id === id) return;
    const panelWasOpen = this.expandedRegion() !== null;
    this.expandedRegion.set(region);
    setTimeout(() => this.animateOpen(panelWasOpen), 0);
  }

  onRegionHover(id: string) {
    this.hoveredRegionId.set(id);
    const lm = this.liaisonMarkers();
    if (!lm.length) return;
    if (id === 'rlo' && this.selectedRegionId() !== 'rlo') {
      gsap.to(lm, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    } else if (!id && this.selectedRegionId() !== 'rlo') {
      gsap.to(lm, { opacity: 0, duration: 0.2, ease: 'power2.in' });
    }
  }

  closePanel() {
    this.panelMode.set('region');
    this.countryFocus.set(null);
    this.selectedRegionId.set('');
    this.expandedSector.set('');
    this.exitPanelChat();
    this.animateClose();
  }

  onSectorBubbleClick() {
    const sectorId = this.selectedSector();
    if (!sectorId) return;
    const wasOpen = this.expandedRegion() !== null || this.expandedSector() !== '';
    this.expandedSector.set(sectorId);
    this.expandedRegion.set(null);
    this.panelMode.set('sector' as any);
    setTimeout(() => this.animateOpen(wasOpen), 0);
  }

  openHiwChat() {
    if (!this.hiwQuery()) {
      this.hiwQuery.set("I'm an NGO focused on green energy in Nepal. What ADB funds can I tap into?");
    }
    this.aiPanelContext.set('hiw');
    this.chatOpen.set(true);
  }

  onUserLocationSelect() {
    this.panelMode.set('country');
    this.countryFocus.set(this.detectedLocation);
    this.onRegionSelect(this.detectedLocation.regionCode.toLowerCase(), true);
  }

  private markers(): HTMLElement[] {
    const el = this.el.nativeElement;
    return [
      ...Array.from(el.querySelectorAll('app-adb-map-marker')),
      ...Array.from(el.querySelectorAll('.ulm-gsap-anchor')),
    ] as HTMLElement[];
  }

  private liaisonMarkers(): HTMLElement[] {
    return Array.from(this.el.nativeElement.querySelectorAll('.liaison-marker'));
  }

  private animateOpen(wasAlreadyOpen: boolean) {
    const hero = this.wwworkHeroRef?.nativeElement;
    const panel = this.wwworkPanelRef?.nativeElement;
    if (!panel) return;

    // ── Mobile: bottom-sheet slide up ────────────────────────────
    if (this.isMobile()) {
      this.activeTl?.kill();
      const tl = gsap.timeline();
      this.activeTl = tl;
      gsap.set(panel, { pointerEvents: 'auto' });
      if (!wasAlreadyOpen) {
        gsap.set(panel, { display: 'flex', y: '100%' });
        tl.to(panel, { y: '0%', duration: 0.38, ease: 'power3.out' });
      }
      const header = panel.querySelector<HTMLElement>('.wwwork-panel__header');
      if (header) {
        tl.fromTo(header, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.25 }, wasAlreadyOpen ? 0 : '>-0.15');
      }
      return;
    }

    const isRlo = this.expandedRegion()?.id === 'rlo';
    const sectionW = (this.el.nativeElement.querySelector('.wwwork-map-area') as HTMLElement)?.offsetWidth ?? 1000;
    const targetVbX = isRlo ? 220 : 570;
    const markerShift = -(targetVbX - this.VB_X) / this.VB_W * sectionW;

    this.activeTl?.kill();
    const tl = gsap.timeline();
    this.activeTl = tl;

    gsap.set(panel, { pointerEvents: 'auto' });
    if (!wasAlreadyOpen) {
      if (hero) {
        if (isRlo) {
          tl.to(hero, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0);
        } else {
          tl.to(hero, { x: '-115%', opacity: 0, duration: 0.38, ease: 'power2.in' }, 0);
        }
      }
      tl.to(panel, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, 0.18);
    } else {
      gsap.set(panel, { opacity: 1, x: 0 });
      if (hero) gsap.set(hero, { opacity: 0, x: isRlo ? 0 : '-115%' });
    }

    const header = panel.querySelector<HTMLElement>('.wwwork-panel__header');
    if (header) {
      const delay = wasAlreadyOpen ? 0 : 0.38;
      tl.fromTo(header, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, delay);
    }

    const mapSvg = this.el.nativeElement.querySelector('.map-svg') as SVGSVGElement | null;
    const vbObj = { x: this.currentVbX };
    tl.to(vbObj, {
      x: targetVbX,
      duration: 0.55,
      ease: 'power3.out',
      onUpdate: () => {
        this.currentVbX = vbObj.x;
        mapSvg?.setAttribute('viewBox', `${vbObj.x} ${this.VB_Y} ${this.VB_W} ${this.VB_H}`);
      },
    }, 0);

    const mk = this.markers();
    if (mk.length) tl.to(mk, { x: markerShift, duration: 0.55, ease: 'power3.out' }, 0);

    const carousel = this.wwworkCarouselRef?.nativeElement;
    const fadeR = this.carouselFadeRRef?.nativeElement;
    const panelRight = sectionW * 0.46 + 16;
    if (carousel) {
      if (fadeR) gsap.set(fadeR, { height: carousel.offsetHeight });
      tl.to(carousel, { right: panelRight, duration: 0.55, ease: 'power3.out' }, 0);
    }
    if (fadeR) tl.to(fadeR, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.15);

    const lm = this.liaisonMarkers();
    if (isRlo && lm.length) {
      tl.fromTo(lm,
        { y: '-100%', x: 0, opacity: 0 },
        { y: '-100%', x: markerShift, opacity: 1, duration: 0.55, ease: 'power3.out' },
        0,
      );
    }
  }

  private animateClose() {
    const hero = this.wwworkHeroRef?.nativeElement;
    const panel = this.wwworkPanelRef?.nativeElement;
    if (!panel) return;

    // ── Mobile: bottom-sheet slide down ──────────────────────────
    if (this.isMobile()) {
      this.activeTl?.kill();
      const tl = gsap.timeline({
        onComplete: () => {
          this.expandedRegion.set(null);
          gsap.set(panel, { clearProps: 'display,transform' });
        },
      });
      this.activeTl = tl;
      tl.to(panel, { y: '100%', duration: 0.3, ease: 'power2.in' });
      return;
    }

    const wasRlo = this.expandedRegion()?.id === 'rlo';
    const mk = this.markers();
    const lm = this.liaisonMarkers();

    this.activeTl?.kill();
    const tl = gsap.timeline({
      onComplete: () => {
        this.expandedRegion.set(null);
        gsap.set(panel, { pointerEvents: 'none' });
        if (hero) gsap.set(hero, { clearProps: 'transform,opacity' });
        if (mk.length) gsap.set(mk, { clearProps: 'transform' });
        if (lm.length) gsap.set(lm, { clearProps: 'transform' });
        const carousel = this.wwworkCarouselRef?.nativeElement;
        if (carousel) gsap.set(carousel, { clearProps: 'right' });
        const fadeR = this.carouselFadeRRef?.nativeElement;
        if (fadeR) gsap.set(fadeR, { opacity: 0 });
        this.currentVbX = this.VB_X;
        this.mapViewBoxOffsetX.set(this.VB_X);
        const svg = this.el.nativeElement.querySelector('.map-svg') as SVGSVGElement | null;
        svg?.setAttribute('viewBox', `${this.VB_X} ${this.VB_Y} ${this.VB_W} ${this.VB_H}`);
      },
    });
    this.activeTl = tl;

    tl.to(panel, { opacity: 0, x: 16, duration: 0.25, ease: 'power2.in' }, 0);

    const mapSvg = this.el.nativeElement.querySelector('.map-svg') as SVGSVGElement | null;
    const vbObj = { x: this.currentVbX };
    tl.to(vbObj, {
      x: this.VB_X,
      duration: 0.45,
      ease: 'power3.out',
      onUpdate: () => {
        this.currentVbX = vbObj.x;
        mapSvg?.setAttribute('viewBox', `${vbObj.x} ${this.VB_Y} ${this.VB_W} ${this.VB_H}`);
      },
    }, 0.1);

    if (mk.length) tl.to(mk, { x: 0, duration: 0.45, ease: 'power3.out' }, 0.1);
    if (wasRlo && lm.length) tl.to(lm, { x: 0, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.1);

    const carousel = this.wwworkCarouselRef?.nativeElement;
    if (carousel) tl.to(carousel, { right: 0, duration: 0.45, ease: 'power3.out' }, 0.1);
    const fadeR = this.carouselFadeRRef?.nativeElement;
    if (fadeR) tl.to(fadeR, { opacity: 0, duration: 0.25, ease: 'power2.in' }, 0);

    if (hero) {
      if (wasRlo) {
        tl.to(hero, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.2);
      } else {
        tl.fromTo(
          hero,
          { x: '-115%', opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
          0.2,
        );
      }
    }
  }
}
