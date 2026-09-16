import {
  Directive, ElementRef, Input, NgZone, OnDestroy,
  PLATFORM_ID, afterNextRender, inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

@Directive({
  selector: '[appTextReveal]',
  standalone: true,
})
export class TextRevealDirective implements OnDestroy {
  @Input() duration = 0.9;
  @Input() ease = 'power2.out';
  @Input() start = 'top 85%';

  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);
  private tween: gsap.core.Tween | null = null;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    afterNextRender(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      this.zone.runOutsideAngular(() => this.init());
    });
  }

  private init(): void {
    const el = this.el.nativeElement;
    const { duration, ease, start } = this;

    this.tween = gsap.from(el, {
      opacity: 0,
      y: 12,
      duration,
      ease,
      scrollTrigger: {
        trigger: el,
        start,
        once: true,
      },
    });
  }

  ngOnDestroy(): void {
    this.tween?.scrollTrigger?.kill();
    this.tween?.kill();
  }
}
