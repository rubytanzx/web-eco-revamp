import {
  AfterViewInit, ChangeDetectionStrategy, Component,
  ElementRef, ViewChild, computed, effect, inject, signal
} from '@angular/core';
import { gsap } from 'gsap';
import { AdbMapComponent } from '../../components/adb-map/adb-map.component';
import { AdbRegionCarouselComponent } from '../../components/adb-region-carousel/adb-region-carousel.component';
import { AiChatPanelComponent } from '../../components/ai-chat-panel/ai-chat-panel.component';
import { SiteHeaderComponent } from '../../components/site-header/site-header.component';
import { RegionEntry } from '../../models/region.model';
import { RouterLink } from '@angular/router';
import { REGION_PANEL_CONTENT, ImpactStoryItem, RegionPanelContent } from '../../data/region-panel-content';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [AdbMapComponent, AdbRegionCarouselComponent, AiChatPanelComponent, SiteHeaderComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements AfterViewInit {
  private el = inject(ElementRef);

  @ViewChild(AdbRegionCarouselComponent) carouselRef!: AdbRegionCarouselComponent;
  @ViewChild('wwworkHero') wwworkHeroRef!: ElementRef<HTMLElement>;
  @ViewChild('wwworkPanel', { static: true }) wwworkPanelRef!: ElementRef<HTMLElement>;
  @ViewChild('wwworkCarousel') wwworkCarouselRef!: ElementRef<HTMLElement>;
  @ViewChild('carouselFadeR') carouselFadeRRef!: ElementRef<HTMLElement>;

  headerHeight = signal(0);
  selectedRegionId = signal<string>('cwrd');
  hoveredRegionId = signal<string>('');
  expandedRegion = signal<RegionEntry | null>(null);
  mapViewBoxOffsetX = signal<number>(380);
  chatOpen = signal(false);
  storyIndex = signal<number>(0);

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

  private syncEffect = effect(() => {
    const id = this.selectedRegionId();
    queueMicrotask(() => this.carouselRef?.scrollToRegion(id));
  });

  ngAfterViewInit(): void {
    if (this.wwworkPanelRef && !this.isMobile()) {
      gsap.set(this.wwworkPanelRef.nativeElement, { opacity: 0, x: 24, pointerEvents: 'none' });
    }
    // Mobile: initial hide is CSS-driven (display: none in @media), no GSAP setup needed
  }

  onRegionSelect(id: string) {
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
    this.animateClose();
  }

  private markers(): HTMLElement[] {
    return Array.from(this.el.nativeElement.querySelectorAll('app-adb-map-marker'));
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
