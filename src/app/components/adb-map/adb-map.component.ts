import {
  ChangeDetectionStrategy, Component, computed,
  inject, input, output
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { MapData } from '../../models/region.model';
import { AdbMapMarkerComponent } from './adb-map-marker/adb-map-marker.component';

@Component({
  selector: 'app-adb-map',
  standalone: true,
  imports: [AdbMapMarkerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './adb-map.component.html',
  styleUrl: './adb-map.component.scss',
})
export class AdbMapComponent {
  private http = inject(HttpClient);

  selectedId = input<string>('');
  viewBoxOffsetX = input<number>(0);
  // Base X for calculating marker CSS positions (the resting viewBox X, not animated)
  viewBoxBaseX = input<number>(0);
  viewBoxW = input<number | null>(null);
  viewBoxY = input<number | null>(null);
  viewBoxH = input<number | null>(null);
  regionSelect = output<string>();

  mapData = toSignal(this.http.get<MapData>('/adb-map.json'), { initialValue: null });
  viewBox = computed(() => {
    const raw = this.mapData()?.viewBox ?? '0 0 1000 402';
    const parts = raw.split(' ').map(Number);
    const y = this.viewBoxY() ?? parts[1];
    const w = this.viewBoxW() ?? parts[2];
    const h = this.viewBoxH() ?? parts[3];
    return `${this.viewBoxOffsetX()} ${y} ${w} ${h}`;
  });
  aspectRatio = computed(() => {
    const d = this.mapData();
    if (!d) return '1000 / 402';
    const w = this.viewBoxW() ?? d.width;
    const h = this.viewBoxH() ?? d.height;
    return `${w} / ${h}`;
  });
  countries = computed(() => this.mapData()?.countries ?? []);
  regions = computed(() => this.mapData()?.regions ?? []);
  liaisonOffices = computed(() => this.mapData()?.liaisonOffices ?? []);
  showLiaison = computed(() => this.selectedId() === 'rlo' || this.hoveredId() === 'rlo');

  private readonly VB_X = 380;
  private readonly VB_W = 700;
  private readonly VB_Y = 75;
  private readonly VB_H = 275;

  markerLeftPct(markerX: number): number {
    const fullW = this.mapData()?.width ?? 1000;
    return (markerX / 100 * fullW - this.VB_X) / this.VB_W * 100;
  }

  markerTopPct(markerY: number): number {
    const fullH = this.mapData()?.height ?? 402;
    return (markerY / 100 * fullH - this.VB_Y) / this.VB_H * 100;
  }

  hoveredId = input<string>('');
  regionHover = output<string>();

  countryClass(regionId: string | null): string {
    const active = this.selectedId();
    const hovered = this.hoveredId();
    const regionSuffix = regionId ?? 'none';
    const base = `country country--${regionSuffix}`;
    if (!regionId) return base; // non-ADB countries: no highlight/dim
    if (active === 'rlo' || hovered === 'rlo') return `${base} country--rlo`;
    const focused = active || hovered;
    if (!focused) return base;
    const isHighlighted = regionId === active || regionId === hovered;
    return isHighlighted ? `${base} country--active` : `${base} country--dimmed`;
  }

  isMarkerActive(regionId: string): boolean {
    return regionId === this.selectedId() || regionId === this.hoveredId();
  }

  onRegionEnter(regionId: string) { this.regionHover.emit(regionId); }
  onRegionLeave() { this.regionHover.emit(''); }
}
