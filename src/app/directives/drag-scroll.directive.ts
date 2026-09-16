import {
  Directive,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';

/**
 * Single threshold used for BOTH confirming a drag gesture and enabling
 * pointer capture + disabling scroll snap. Keeping them identical means a
 * release with totalMovement ≤ DRAG_THRESHOLD is always treated as a plain
 * click: snap is never touched, no scroll fires, no scrollend overrides the
 * click handler's region selection.
 */
const DRAG_THRESHOLD = 6;

@Directive({
  selector: '[appDragScroll]',
  standalone: true,
})
export class DragScrollDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ngZone = inject(NgZone);

  regionIds = input<string[]>([]);
  regionSettle = output<string>();
  readonly hasDragged = signal(false);

  /**
   * True immediately after a drag-release; consumed by the host component
   * to suppress the synthesised click that follows pointerup.
   */
  justDragged = false;

  /**
   * When the caller knows exactly which card a scroll will land on (flick,
   * programmatic scrollToRegion), it sets this before the scrollIntoView call.
   * emitSettledRegion uses it instead of position-based detection, then clears it.
   */
  settleOverride: string | null = null;

  private get track(): HTMLElement { return this.el.nativeElement; }
  private get prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private isPointerDown = false;
  private snapDisabled = false;
  private activePointerId = -1;
  private startX = 0;
  private startScrollLeft = 0;
  private totalMovement = 0;
  private pendingDelta: number | null = null;
  private pendingClientX = 0;
  private velocitySamples: Array<{ t: number; x: number }> = [];
  private rafId: number | null = null;
  private scrollFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private cleanupFns: Array<() => void> = [];

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.track.style.touchAction = 'pan-x';
    this.track.style.cursor = 'grab';

    this.ngZone.runOutsideAngular(() => {
      const addTo = (target: EventTarget, type: string, fn: (e: Event) => void) => {
        target.addEventListener(type, fn);
        this.cleanupFns.push(() => target.removeEventListener(type, fn));
      };

      addTo(this.track, 'pointerdown', this.onPointerDown);
      addTo(this.track, 'pointermove', this.onPointerMove);
      addTo(this.track, 'pointerup', this.onPointerUp);
      addTo(this.track, 'pointercancel', this.onPointerUp);

      // Safety net: pointerup off the track before capture is set
      addTo(window, 'pointerup', this.onWindowPointerUp);
      addTo(window, 'pointercancel', this.onWindowPointerUp);

      if ('onscrollend' in window) {
        addTo(this.track, 'scrollend', this.onScrollEnd);
      } else {
        addTo(this.track, 'scroll', this.onScrollFallback);
      }
    });
  }

  ngOnDestroy(): void {
    this.cleanupFns.forEach(fn => fn());
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.scrollFallbackTimer !== null) clearTimeout(this.scrollFallbackTimer);
  }

  // ── Pointer handlers ───────────────────────────────────────────────────────

  private readonly onPointerDown = (e: Event): void => {
    const pe = e as PointerEvent;
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    this.snapDisabled = false;
    this.isPointerDown = true;
    this.justDragged = false;
    this.activePointerId = pe.pointerId;
    this.startX = pe.clientX;
    this.startScrollLeft = this.track.scrollLeft;
    this.totalMovement = 0;
    this.velocitySamples = [{ t: performance.now(), x: pe.clientX }];
    this.track.style.cursor = 'grabbing';
    // setPointerCapture is intentionally deferred to onPointerMove once the
    // drag threshold is confirmed. Setting it here causes Chrome to dispatch
    // the resulting `click` event on the track element rather than the card,
    // breaking Angular's (click) binding on the card.
  };

  private readonly onPointerMove = (e: Event): void => {
    if (!this.isPointerDown) return;
    const pe = e as PointerEvent;

    const delta = pe.clientX - this.startX;
    this.totalMovement = Math.max(this.totalMovement, Math.abs(delta));

    // Use the same DRAG_THRESHOLD for both snap-disable and drag detection so
    // that any release with totalMovement ≤ DRAG_THRESHOLD is ALWAYS a plain
    // click: snap is never disabled, restoreScroll is never called, and no
    // spurious scrollend fires to override the card click handler.
    if (!this.snapDisabled && this.totalMovement > DRAG_THRESHOLD) {
      this.track.setPointerCapture(pe.pointerId);
      this.track.style.scrollSnapType = 'none';
      this.track.style.scrollBehavior = 'auto';
      this.snapDisabled = true;
    }

    if (!this.snapDisabled) return;

    this.velocitySamples.push({ t: performance.now(), x: pe.clientX });
    if (this.velocitySamples.length > 10) this.velocitySamples.shift();

    this.pendingDelta = delta;
    this.pendingClientX = pe.clientX;

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        if (this.pendingDelta === null) return;
        const maxScroll = this.track.scrollWidth - this.track.clientWidth;
        const raw = this.startScrollLeft - this.pendingDelta;
        const clamped = Math.max(0, Math.min(maxScroll, raw));
        this.track.scrollLeft = clamped;
        // Re-anchor at boundary so reversing direction responds immediately
        if (clamped !== raw) {
          this.startScrollLeft = clamped;
          this.startX = this.pendingClientX;
        }
        this.pendingDelta = null;
      });
    }
  };

  private readonly onPointerUp = (e: Event): void => {
    if (!this.isPointerDown) return;
    const pe = e as PointerEvent;
    this.isPointerDown = false;

    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    if (this.snapDisabled) this.track.releasePointerCapture(pe.pointerId);
    this.track.style.cursor = 'grab';

    if (this.totalMovement > DRAG_THRESHOLD) {
      this.justDragged = true;
      if (!this.hasDragged()) this.hasDragged.set(true);

      const v = this.prefersReducedMotion ? 0 : this.computeVelocity();
      if (Math.abs(v) > 1) {
        this.flickToAdjacentCard(v > 0 ? 1 : -1);
      } else {
        this.restoreScroll();
      }
    } else {
      // Plain click — snap was never disabled so nothing to restore, no
      // scrollend will fire, and the card's (click) handler owns selection.
      // (The snapDisabled guard below is just a safety net for edge cases.)
      if (this.snapDisabled) this.restoreScroll();
    }
  };

  private readonly onWindowPointerUp = (e: Event): void => {
    const pe = e as PointerEvent;
    if (this.isPointerDown && pe.pointerId === this.activePointerId) {
      this.onPointerUp(e);
    }
  };

  // ── Flick ──────────────────────────────────────────────────────────────────

  private flickToAdjacentCard(direction: 1 | -1): void {
    const ids = this.regionIds();
    const cards = Array.from(this.track.children) as HTMLElement[];
    const maxScroll = this.track.scrollWidth - this.track.clientWidth;

    // Nearest card using clamped snap-point logic (same as emitSettledRegion)
    let closestIdx = 0;
    let minDist = Infinity;
    cards.forEach((card, i) => {
      if (i >= ids.length) return;
      const snapPt = Math.min(card.offsetLeft, maxScroll);
      const dist = Math.abs(snapPt - this.track.scrollLeft);
      if (dist <= minDist) { minDist = dist; closestIdx = i; }
    });

    const targetIdx = Math.max(0, Math.min(cards.length - 1, closestIdx + direction));
    const targetCard = cards[targetIdx];

    // Tell the settle listener which card we're animating to so it doesn't
    // have to infer it from scroll position (which breaks for the last card).
    this.settleOverride = ids[targetIdx] ?? null;

    this.restoreScroll();
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }

  // ── Settle detection ───────────────────────────────────────────────────────

  private readonly onScrollEnd = (): void => {
    if (this.isPointerDown) return;
    this.ngZone.run(() => this.emitSettledRegion());
  };

  private readonly onScrollFallback = (): void => {
    if (this.isPointerDown) return;
    if (this.scrollFallbackTimer !== null) clearTimeout(this.scrollFallbackTimer);
    this.scrollFallbackTimer = setTimeout(() => {
      this.scrollFallbackTimer = null;
      this.ngZone.run(() => this.emitSettledRegion());
    }, 120);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  private computeVelocity(): number {
    const now = performance.now();
    const recent = this.velocitySamples.filter(s => now - s.t < 100);
    if (recent.length < 2) return 0;
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = last.t - first.t;
    if (dt === 0) return 0;
    return ((first.x - last.x) / dt) * 16;
  }

  private restoreScroll(): void {
    this.track.style.scrollSnapType = '';
    this.track.style.scrollBehavior = '';
    this.snapDisabled = false;
  }

  private emitSettledRegion(): void {
    const ids = this.regionIds();
    if (!ids.length) return;

    // Prefer an explicitly set override (from flickToAdjacentCard or
    // scrollToRegion) over position inference. This handles the common case
    // where the last card(s) can't scroll all the way to offsetLeft 0, so
    // the nearest-card heuristic would pick the wrong card.
    const id = this.settleOverride ?? this.detectSettledCard(ids);
    this.settleOverride = null;
    if (id) this.regionSettle.emit(id);
  }

  private detectSettledCard(ids: string[]): string {
    const cards = Array.from(this.track.children) as HTMLElement[];
    const scrollLeft = this.track.scrollLeft;
    const maxScroll = this.track.scrollWidth - this.track.clientWidth;

    // Use each card's *effective* snap point: min(offsetLeft, maxScroll).
    // Cards near the end of the track share the same max scroll position;
    // using `<=` for the tie-break means the rightmost card wins there.
    let closestIdx = 0;
    let minDist = Infinity;
    cards.forEach((card, i) => {
      if (i >= ids.length) return;
      const snapPt = Math.min((card as HTMLElement).offsetLeft, maxScroll);
      const dist = Math.abs(snapPt - scrollLeft);
      if (dist <= minDist) { minDist = dist; closestIdx = i; }
    });

    return ids[closestIdx];
  }
}
