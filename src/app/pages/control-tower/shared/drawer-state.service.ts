import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DrawerStateService {
  readonly isOpen = signal(false);
}
