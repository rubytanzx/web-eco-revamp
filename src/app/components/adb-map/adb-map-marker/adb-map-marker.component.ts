import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RegionEntry } from '../../../models/region.model';

@Component({
  selector: 'app-adb-map-marker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="marker"
      [class.marker--active]="active()"
      [style.--region-color]="region().color"
      (click)="select.emit(region().id)"
      [attr.aria-label]="region().name"
      [attr.aria-pressed]="active()"
    >
      <svg class="marker__icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <circle class="marker__ring" cx="12" cy="12" r="11" />
        <g transform="translate(12,12) scale(0.62) translate(-12,-12)">
          <path class="marker__pin" fill-rule="evenodd"
            d="M12 5C9.24 5 7 7.24 7 10C7 14 12 19 12 19C12 19 17 14 17 10C17 7.24 14.76 5 12 5ZM12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12Z" />
        </g>
      </svg>
      <span class="marker__label">
        <span class="marker__short">{{ region().shortName }}</span>
      </span>
    </button>
  `,
  styleUrl: './adb-map-marker.component.scss',
})
export class AdbMapMarkerComponent {
  region = input.required<RegionEntry>();
  active = input<boolean>(false);
  select = output<string>();
}
