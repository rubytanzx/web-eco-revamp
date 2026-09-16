import { AfterViewInit, Component, computed, ElementRef, inject, signal } from '@angular/core';

@Component({
  selector: 'app-pv-chart',
  standalone: true,
  templateUrl: './pv-chart.html',
  styleUrl: './pv-chart.css',
})
export class PvChart implements AfterViewInit {
  private readonly _el = inject(ElementRef);

  readonly pvW    = signal(900);
  readonly pvH    = 220;
  readonly pvPadL = 46;
  readonly pvPadR = 14;
  readonly pvPadT = 18;
  readonly pvPadB = 44;

  private readonly pvRaw = [
    { period: 'May 1',  value: 480 }, { period: 'May 8',  value: 500 },
    { period: 'May 15', value: 520 }, { period: 'May 22', value: 540 },
    { period: 'Jun 1',  value: 550 }, { period: 'Jun 8',  value: 570 },
    { period: 'Jun 15', value: 585 }, { period: 'Jun 22', value: 600 },
    { period: 'Jul 1',  value: 610 }, { period: 'Jul 8',  value: 625 },
    { period: 'Jul 15', value: 640 }, { period: 'Jul 22', value: 650 },
    { period: 'Aug 1',  value: 665 }, { period: 'Aug 8',  value: 680 },
    { period: 'Aug 15', value: 695 }, { period: 'Aug 20', value: 718 },
  ];

  private readonly pvYMax  = 800;
  readonly pvBottom        = this.pvH - this.pvPadB;
  private readonly pvPlotW = computed(() => this.pvW() - this.pvPadL - this.pvPadR);
  private readonly pvPlotH = this.pvH - this.pvPadT - this.pvPadB;

  private pvX = (i: number) =>
    this.pvPadL + (i / (this.pvRaw.length - 1)) * this.pvPlotW();
  private pvY = (v: number) =>
    this.pvPadT + (1 - v / this.pvYMax) * this.pvPlotH;

  private pvBezier(pts: { x: number; y: number }[]): string {
    return pts.map((p, i) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const prev = pts[i - 1];
      const cpX  = ((prev.x + p.x) / 2).toFixed(1);
      return `C ${cpX} ${prev.y.toFixed(1)}, ${cpX} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }).join(' ');
  }

  readonly pvYTicks = [0, 200, 400, 600, 800].map(v => ({
    label: v === 0 ? '0' : `${v}`,
    y: this.pvPadT + (1 - v / this.pvYMax) * this.pvPlotH,
  }));

  readonly pvTrendPts = computed(() => this.pvRaw.map((d, i) => ({
    x: this.pvX(i), y: this.pvY(d.value),
    period: d.period, value: d.value,
    pct: i === 0 ? null : Math.round((d.value - this.pvRaw[i - 1].value) / this.pvRaw[i - 1].value * 100),
  })));

  readonly pvLinePath = computed(() => this.pvBezier(this.pvTrendPts()));
  readonly pvAreaPath = computed(() => {
    const pts = this.pvTrendPts();
    return `${this.pvLinePath()} L ${pts[pts.length - 1].x.toFixed(1)} ${this.pvBottom} L ${pts[0].x.toFixed(1)} ${this.pvBottom} Z`;
  });

  readonly hoveredPvIdx = signal<number | null>(null);
  readonly hoveredPvPt  = computed(() => {
    const i = this.hoveredPvIdx();
    return i !== null ? (this.pvTrendPts()[i] ?? null) : null;
  });

  readonly hoveredPvPctPositive = computed(() => (this.hoveredPvPt()?.pct ?? 0) >= 0);
  readonly hoveredPvPctLabel    = computed(() => {
    const pt = this.hoveredPvPt();
    if (!pt || pt.pct === null) return '';
    return `${pt.pct >= 0 ? '+' : ''}${pt.pct}% vs prev week`;
  });

  onPvMouseMove(e: MouseEvent) {
    const rect   = (e.currentTarget as SVGElement).getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * this.pvW();
    let nearest = 0, minDist = Infinity;
    this.pvTrendPts().forEach((pt, i) => {
      const d = Math.abs(pt.x - mouseX);
      if (d < minDist) { minDist = d; nearest = i; }
    });
    this.hoveredPvIdx.set(nearest);
  }

  onPvMouseLeave() { this.hoveredPvIdx.set(null); }

  pvTooltipX(): number {
    const pt = this.hoveredPvPt();
    if (!pt) return 0;
    return Math.min(Math.max(pt.x + 12, this.pvPadL), this.pvW() - 170 - this.pvPadR);
  }
  pvTooltipY(): number {
    return Math.max((this.hoveredPvPt()?.y ?? 0) - 68, this.pvPadT);
  }

  ngAfterViewInit() {
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w > 0) this.pvW.set(Math.round(w));
    });
    ro.observe(this._el.nativeElement);
  }
}
