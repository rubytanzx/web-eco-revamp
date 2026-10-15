import {
  ChangeDetectionStrategy, Component, computed,
  ElementRef, inject, input, output,
  QueryList, viewChild, ViewChild, ViewChildren
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { MapData } from '../../models/region.model';
import { DragScrollDirective } from '../../directives/drag-scroll.directive';

@Component({
  selector: 'app-adb-region-carousel',
  standalone: true,
  imports: [DragScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './adb-region-carousel.component.html',
  styleUrl: './adb-region-carousel.component.scss',
})
export class AdbRegionCarouselComponent {
  private http = inject(HttpClient);

  selectedId = input<string>('');
  regionSelect = output<string>();
  regionHover = output<string>();

  mapData = toSignal(this.http.get<MapData>('/adb-map.json'), { initialValue: null });
  regions = computed(() => this.mapData()?.regions ?? []);
  protected regionIdList = computed(() => this.regions().map(r => r.id));

  @ViewChild('track') trackEl!: ElementRef<HTMLElement>;
  @ViewChildren('card') cardEls!: QueryList<ElementRef<HTMLElement>>;

  protected dragScrollDir = viewChild(DragScrollDirective);

  // Track the most-recently emitted id locally so onRegionSettle's guard
  // doesn't have to rely on the Angular input signal (which lags one CD cycle).
  private _lastEmittedId = '';

  scrollToRegion(id: string) {
    const idx = this.regions().findIndex(r => r.id === id);
    if (idx < 0) return;
    const card = this.cardEls?.toArray()[idx];
    if (!card) return;

    const dir = this.dragScrollDir();
    if (dir) dir.settleOverride = id;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    card.nativeElement.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'start',
    });
  }

  onRegionSettle(id: string) {
    // Guard against both the Angular-input lag and re-emitting the same id.
    if (id !== this._lastEmittedId && id !== this.selectedId()) {
      this._lastEmittedId = id;
      this.regionSelect.emit(id);
    }
  }

  onCardClick(id: string) {
    const dir = this.dragScrollDir();
    if (dir?.justDragged) { dir.justDragged = false; return; }
    // Set settleOverride immediately so any in-flight scrollend from a
    // previous animation uses the correct id, not a stale scroll position.
    if (dir) dir.settleOverride = id;
    this._lastEmittedId = id;
    this.regionSelect.emit(id);
  }

  readonly regionImages: Record<string, string> = {
    cwrd: 'https://images.unsplash.com/photo-1681365512853-0a071c982e2c?auto=format&fit=crop&w=800&q=80',
    eard: 'https://images.unsplash.com/photo-1764555846847-8d1c685b3b56?auto=format&fit=crop&w=800&q=80',
    sard: 'https://images.unsplash.com/photo-1592731057019-57ed336948ed?auto=format&fit=crop&w=800&q=80',
    serd: 'https://images.unsplash.com/photo-1784490667386-0d75f2541344?auto=format&fit=crop&w=800&q=80',
    pard: 'https://images.unsplash.com/photo-1650509009946-32b00cb21a0a?auto=format&fit=crop&w=800&q=80',
  };

  countryList(countries: string[]): string {
    return countries.slice(0, 5).join(', ') +
      (countries.length > 5 ? ` +${countries.length - 5} more` : '');
  }

  statNum(stat: string): string { return stat.split(' ')[0]; }
  statLabel(stat: string): string { return stat.split(' ').slice(1).join(' '); }
}
