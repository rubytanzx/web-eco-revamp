import {
  AfterViewInit, ChangeDetectionStrategy, Component, NgZone, OnDestroy,
  computed, effect, ElementRef, inject, signal, ViewChild
} from '@angular/core';
import { gsap } from 'gsap';
import { RouterLink } from '@angular/router';
import { AdbMapComponent } from '../../components/adb-map/adb-map.component';
import { AdbRegionCarouselComponent } from '../../components/adb-region-carousel/adb-region-carousel.component';
import { AiChatPanelComponent } from '../../components/ai-chat-panel/ai-chat-panel.component';
import { RegionEntry } from '../../models/region.model';
import { REGION_PANEL_CONTENT, ImpactStoryItem, RegionPanelContent } from '../../data/region-panel-content';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AdbMapComponent, AdbRegionCarouselComponent, AiChatPanelComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private el   = inject(ElementRef);
  private zone = inject(NgZone);

  private scrollHandler: (() => void) | null = null;

  private readonly VB_X = 380;
  private readonly VB_W = 700;
  private readonly VB_Y = 75;
  private readonly VB_H = 275;

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
    this.expandedRegion(); // track region changes
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

  @ViewChild(AdbRegionCarouselComponent) carouselRef!: AdbRegionCarouselComponent;
  @ViewChild('heroOverlay') heroOverlayRef!: ElementRef<HTMLElement>;
  @ViewChild('regionPanel', { static: true }) regionPanelRef!: ElementRef<HTMLElement>;
  @ViewChild('carouselOverlay') carouselOverlayRef!: ElementRef<HTMLElement>;
  @ViewChild('carouselFadeR') carouselFadeRRef!: ElementRef<HTMLElement>;

  private activeTl: gsap.core.Timeline | null = null;
  private currentVbX = 380;

  private syncEffect = effect(() => {
    const id = this.selectedRegionId();
    queueMicrotask(() => this.carouselRef?.scrollToRegion(id));
  });

  ngAfterViewInit() {
    gsap.set(this.regionPanelRef.nativeElement, { opacity: 0, x: 24, pointerEvents: 'none' });

    this.zone.runOutsideAngular(() => {
      const hero    = this.heroOverlayRef?.nativeElement;
      const heading = hero?.querySelector<HTMLElement>('.hero-heading');
      const sub     = hero?.querySelector<HTMLElement>('.hero-sub');

      // Entrance: staggered slide-up fade
      if (heading && sub) {
        gsap.from([heading, sub], {
          opacity: 0,
          y: 24,
          duration: 1.05,
          ease: 'power3.out',
          stagger: 0.2,
          delay: 0.25,
        });
      }

      // Parallax: listen on host + parent — whichever scrolls fires the handler
      const host   = this.el.nativeElement as HTMLElement;
      const parent = host.parentElement as HTMLElement;

      this.scrollHandler = () => {
        const scrollTop = host.scrollTop || parent?.scrollTop || 0;
        hero.style.transform = `translateY(${scrollTop * 0.25}px)`;
      };

      host.addEventListener('scroll',   this.scrollHandler, { passive: true });
      parent?.addEventListener('scroll', this.scrollHandler, { passive: true });
    });
  }

  ngOnDestroy() {
    if (this.scrollHandler) {
      const host = this.el.nativeElement as HTMLElement;
      host.removeEventListener('scroll', this.scrollHandler);
      host.parentElement?.removeEventListener('scroll', this.scrollHandler);
    }
  }

  onRegionSelect(id: string) {
    this.selectedRegionId.set(id);

    const region = this.carouselRef?.regions().find(r => r.id === id) ?? null;
    if (!region) return;

    // scrollToRegion() re-emits regionSelect for the same id; skip re-animation
    if (this.expandedRegion()?.id === id) return;

    const panelWasOpen = this.expandedRegion() !== null;
    this.expandedRegion.set(region);

    // Defer one task so Angular's zone tick renders @if(showLiaison()) before we query
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
    const hero = this.heroOverlayRef?.nativeElement;
    const panel = this.regionPanelRef.nativeElement;

    const isRlo = this.expandedRegion()?.id === 'rlo';
    const sectionW = (this.el.nativeElement.querySelector('.map-section') as HTMLElement)?.offsetWidth ?? 1000;
    const targetVbX = isRlo ? 220 : 750;
    // markerShift: absolute GSAP x value that keeps markers aligned with the zoomed viewBox
    const markerShift = -(targetVbX - this.VB_X) / this.VB_W * sectionW;

    this.activeTl?.kill();
    const tl = gsap.timeline();
    this.activeTl = tl;

    if (!wasAlreadyOpen) {
      // First open: slide/fade hero out, fade panel in
      if (hero) {
        if (isRlo) {
          tl.to(hero, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0);
        } else {
          tl.to(hero, { x: '-115%', opacity: 0, duration: 0.38, ease: 'power2.in' }, 0);
        }
      }
      tl.to(panel, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, 0.18);
      tl.set(panel, { pointerEvents: 'auto' }, 0.18);
    } else {
      gsap.set(panel, { opacity: 1, x: 0 });
      if (hero) gsap.set(hero, { opacity: 0, x: isRlo ? 0 : '-115%' });
    }

    // Always animate panel header (new region content)
    const header = panel.querySelector<HTMLElement>('.region-panel__header');
    if (header) {
      const delay = wasAlreadyOpen ? 0 : 0.38;
      tl.fromTo(header, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, delay);
    }

    // Map geography shift (from current vbX to target) — direct DOM setAttribute bypasses Angular binding
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

    // HTML markers shift by equivalent pixels
    const mk = this.markers();
    if (mk.length) tl.to(mk, { x: markerShift, duration: 0.55, ease: 'power3.out' }, 0);

    const carouselEl = this.carouselOverlayRef?.nativeElement;
    const fadeR = this.carouselFadeRRef?.nativeElement;
    const panelRight = sectionW * 0.46 + 16;
    if (carouselEl) {
      if (fadeR) gsap.set(fadeR, { height: carouselEl.offsetHeight });
      tl.to(carouselEl, { right: panelRight, duration: 0.55, ease: 'power3.out' }, 0);
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
    const hero = this.heroOverlayRef?.nativeElement;
    const panel = this.regionPanelRef.nativeElement;
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
        const carouselEl = this.carouselOverlayRef?.nativeElement;
        if (carouselEl) gsap.set(carouselEl, { clearProps: 'right' });
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

    const carouselEl = this.carouselOverlayRef?.nativeElement;
    if (carouselEl) tl.to(carouselEl, { right: 0, duration: 0.45, ease: 'power3.out' }, 0.1);
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
