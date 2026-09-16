import { computed, Injectable, signal } from '@angular/core';
import { WIDGET_CATALOG, WidgetDef } from './widget-catalog';

export interface PlacedWidget {
  id: string;
  uid: string;
}

const STORAGE_KEY = 'me-overview-widgets-v2';

const DEFAULT_LAYOUT: PlacedWidget[] = [
  { id: 'total-prompts',       uid: 'total-prompts__0'       },
  { id: 'active-users',        uid: 'active-users__0'        },
  { id: 'avg-per-user',        uid: 'avg-per-user__0'        },
  { id: 'feedback-received',   uid: 'feedback-received__0'   },
  { id: 'prompt-volume-trend', uid: 'prompt-volume-trend__0' },
  { id: 'intent-treemap',      uid: 'intent-treemap__0'      },
];

@Injectable({ providedIn: 'root' })
export class OverviewStore {
  private readonly _placed = signal<PlacedWidget[]>(this.load());

  readonly placed = this._placed.asReadonly();

  readonly placedDefs = computed(() =>
    this._placed()
      .map(p => WIDGET_CATALOG.find(w => w.id === p.id))
      .filter((w): w is WidgetDef => !!w)
  );

  readonly addedIds = computed(() => new Set(this._placed().map(p => p.id)));

  add(id: string) {
    if (this.addedIds().has(id)) return;
    const updated = [...this._placed(), { id, uid: `${id}__${Date.now()}` }];
    this._placed.set(updated);
    this.persist(updated);
  }

  remove(uid: string) {
    const updated = this._placed().filter(p => p.uid !== uid);
    this._placed.set(updated);
    this.persist(updated);
  }

  reorder(widgets: PlacedWidget[]) {
    this._placed.set(widgets);
    this.persist(widgets);
  }

  private load(): PlacedWidget[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PlacedWidget[]) : DEFAULT_LAYOUT;
    } catch {
      return DEFAULT_LAYOUT;
    }
  }

  private persist(widgets: PlacedWidget[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch { /* storage full / unavailable */ }
  }
}
