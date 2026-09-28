import { Component, Input, AfterViewInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

export interface GeoRow {
  country: string;
  sessions: string;
  pct: number;
  trend: string;
}

// ISO-3166 numeric → ADB region name
const REGION_CODES = new Map<number, string>([
  // South Asia
  [4, 'South Asia'], [50, 'South Asia'], [64, 'South Asia'], [144, 'South Asia'],
  [356, 'South Asia'], [462, 'South Asia'], [524, 'South Asia'], [586, 'South Asia'],
  // Southeast Asia
  [96, 'Southeast Asia'], [104, 'Southeast Asia'], [116, 'Southeast Asia'],
  [360, 'Southeast Asia'], [418, 'Southeast Asia'], [458, 'Southeast Asia'],
  [608, 'Southeast Asia'], [626, 'Southeast Asia'], [702, 'Southeast Asia'],
  [704, 'Southeast Asia'], [764, 'Southeast Asia'],
  // East Asia
  [156, 'East Asia'], [344, 'East Asia'], [392, 'East Asia'],
  [408, 'East Asia'], [410, 'East Asia'], [496, 'East Asia'],
  // North America
  [124, 'North America'], [484, 'North America'], [840, 'North America'],
  // Europe
  [8, 'Europe'], [20, 'Europe'], [40, 'Europe'], [56, 'Europe'], [70, 'Europe'],
  [100, 'Europe'], [112, 'Europe'], [191, 'Europe'], [196, 'Europe'], [203, 'Europe'],
  [208, 'Europe'], [233, 'Europe'], [246, 'Europe'], [250, 'Europe'], [276, 'Europe'],
  [300, 'Europe'], [348, 'Europe'], [352, 'Europe'], [372, 'Europe'], [380, 'Europe'],
  [428, 'Europe'], [438, 'Europe'], [440, 'Europe'], [442, 'Europe'], [470, 'Europe'],
  [492, 'Europe'], [498, 'Europe'], [499, 'Europe'], [528, 'Europe'], [578, 'Europe'],
  [616, 'Europe'], [620, 'Europe'], [642, 'Europe'], [643, 'Europe'], [688, 'Europe'],
  [703, 'Europe'], [705, 'Europe'], [724, 'Europe'], [752, 'Europe'], [756, 'Europe'],
  [804, 'Europe'], [807, 'Europe'], [826, 'Europe'],
  // Pacific
  [36, 'Pacific'], [90, 'Pacific'], [184, 'Pacific'], [242, 'Pacific'], [296, 'Pacific'],
  [316, 'Pacific'], [520, 'Pacific'], [540, 'Pacific'], [548, 'Pacific'], [554, 'Pacific'],
  [570, 'Pacific'], [574, 'Pacific'], [585, 'Pacific'], [598, 'Pacific'],
  [612, 'Pacific'], [776, 'Pacific'], [882, 'Pacific'],
]);

const REGION_CENTERS: Record<string, [number, number]> = {
  'South Asia':     [78, 22],
  'Southeast Asia': [108, 9],
  'East Asia':      [116, 35],
  'North America':  [-100, 45],
  'Europe':         [15, 52],
  'Pacific':        [168, -22],
};

const REGION_COLORS: Record<string, string> = {
  'South Asia':     '#2563EB',
  'Southeast Asia': '#0891B2',
  'East Asia':      '#7C3AED',
  'North America':  '#059669',
  'Europe':         '#D97706',
  'Pacific':        '#DC2626',
};

interface CountryPath { id: number; d: string; region: string | null; }
interface Bubble { name: string; cx: number; cy: number; r: number; sessions: string; color: string; }

const W = 760;
const H = 320;

@Component({
  selector: 'app-audience-map',
  standalone: true,
  imports: [],
  templateUrl: './audience-map.html',
  styleUrl: './audience-map.css',
})
export class AudienceMap implements AfterViewInit {
  @Input() regions: GeoRow[] = [];

  private readonly cdRef = inject(ChangeDetectorRef);

  readonly hoveredRegion = signal<string | null>(null);
  readonly isLoading = signal(true);

  readonly W = W;
  readonly H = H;

  countryPaths: CountryPath[] = [];
  bubbles: Bubble[] = [];

  async ngAfterViewInit() {
    try {
      const topo = await fetch('/countries-110m.json').then(r => r.json());
      const projection = geoNaturalEarth1().scale(138).translate([W / 2, H / 2 + 8]);
      const path = geoPath(projection);

      const countries = feature(topo, (topo as any).objects.countries);
      this.countryPaths = ((countries as any).features as any[]).map((f: any) => ({
        id: +f.id,
        d: path(f) ?? '',
        region: REGION_CODES.get(+f.id) ?? null,
      }));

      const sessionNums = this.regions.map(r => parseFloat(r.sessions) * 1000);
      const maxS = Math.max(...sessionNums);

      this.bubbles = this.regions.map((r, i) => {
        const [lon, lat] = REGION_CENTERS[r.country] ?? [0, 0];
        const p = projection([lon, lat]);
        const ratio = sessionNums[i] / maxS;
        return {
          name: r.country,
          cx: p ? p[0] : 0,
          cy: p ? p[1] : 0,
          r: 14 + ratio * 30,
          sessions: r.sessions,
          color: REGION_COLORS[r.country] ?? '#449DF7',
        };
      });

      this.isLoading.set(false);
      this.cdRef.markForCheck();
    } catch {
      this.isLoading.set(false);
      this.cdRef.markForCheck();
    }
  }

  setHover(name: string | null) { this.hoveredRegion.set(name); }

  regionColor(region: string | null): string {
    return region ? (REGION_COLORS[region] ?? '#449DF7') : '#c8d8e8';
  }

  countryOpacity(region: string | null): number {
    const h = this.hoveredRegion();
    if (!region) return 1;
    if (!h) return 0.65;
    return h === region ? 0.85 : 0.2;
  }

  bubbleOpacity(name: string): number {
    const h = this.hoveredRegion();
    return !h ? 0.9 : (h === name ? 1 : 0.25);
  }

  shortName(name: string): string {
    const m: Record<string, string> = {
      'South Asia': 'S. Asia', 'Southeast Asia': 'SE Asia',
      'East Asia': 'E. Asia', 'North America': 'N. America',
      'Europe': 'Europe', 'Pacific': 'Pacific',
    };
    return m[name] ?? name;
  }

  trendClass(t: string): string {
    if (t.startsWith('+')) return 'trend--pos';
    if (t.startsWith('-')) return 'trend--neg';
    return 'trend--neu';
  }
}
