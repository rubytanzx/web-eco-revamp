import { Component, computed, input, output, signal } from '@angular/core';

type KptTab = 'country' | 'sector' | 'content-type';

interface TreemapTopic {
  id: string; name: string; pct: number; count: number; color: string; trending?: boolean;
}
interface TmRect { x: number; y: number; w: number; h: number; }
interface TmCell { topic: TreemapTopic; rect: TmRect; }

@Component({
  selector: 'app-intent-treemap',
  standalone: true,
  templateUrl: './intent-treemap.html',
  styleUrl: './intent-treemap.css',
})
export class IntentTreemap {
  readonly selectedTopic = input<string | null>(null);
  readonly topicClicked  = output<string | null>();

  readonly activeTab = signal<KptTab>('country');

  readonly kptTabDefs = [
    { id: 'country'      as KptTab, label: 'Country' },
    { id: 'sector'       as KptTab, label: 'Sector' },
    { id: 'content-type' as KptTab, label: 'Content Type' },
  ];

  private readonly countryTopics: TreemapTopic[] = [
    { id: 'country-pages', name: 'Country Pages',          pct: 22, count: 220, color: '#ef4444' },
    { id: 'proj-ops',      name: 'Project Operations',     pct: 19, count: 190, color: '#06b6d4' },
    { id: 'publications',  name: 'Publications & Research', pct: 15, count: 150, color: '#6366f1' },
    { id: 'news-events',   name: 'News & Events',          pct: 12, count: 120, color: '#f97316' },
    { id: 'sectors',       name: 'Sectors & Themes',       pct: 10, count: 100, color: '#14b8a6' },
    { id: 'climate',       name: 'Climate & Environment',  pct:  8, count:  80, color: '#3b82f6' },
    { id: 'private',       name: 'Private Sector',         pct:  6, count:  60, color: '#8b5cf6' },
    { id: 'jobs',          name: 'Jobs & Procurement',     pct:  5, count:  50, color: '#ec4899' },
    { id: 'other-c',       name: 'Other',                  pct:  3, count:  30, color: '#f59e0b' },
  ];

  private readonly sectorTopics: TreemapTopic[] = [
    { id: 'energy',      name: 'Energy & Power',    pct: 24, count: 240, color: '#ef4444' },
    { id: 'transport',   name: 'Transport',          pct: 18, count: 180, color: '#f97316' },
    { id: 'water',       name: 'Water & Sanitation', pct: 14, count: 140, color: '#3b82f6' },
    { id: 'agriculture', name: 'Agriculture',        pct: 11, count: 110, color: '#10b981' },
    { id: 'finance',     name: 'Finance',            pct: 10, count: 100, color: '#6366f1' },
    { id: 'urban',       name: 'Urban Dev.',         pct:  9, count:  90, color: '#14b8a6' },
    { id: 'health',      name: 'Health',             pct:  7, count:  70, color: '#ec4899' },
    { id: 'education',   name: 'Education',          pct:  5, count:  50, color: '#8b5cf6' },
    { id: 'digital',     name: 'Digital',            pct:  2, count:  20, color: '#64748b' },
  ];

  private readonly contentTypeTopics: TreemapTopic[] = [
    { id: 'web-pages',     name: 'Web Pages',          pct: 28, count: 280, color: '#3b82f6' },
    { id: 'pdf',           name: 'Publications (PDF)',  pct: 22, count: 220, color: '#6366f1' },
    { id: 'data-stats',    name: 'Data / Statistics',  pct: 17, count: 170, color: '#14b8a6' },
    { id: 'news-releases', name: 'News Releases',      pct: 13, count: 130, color: '#f97316' },
    { id: 'proj-profiles', name: 'Project Profiles',   pct: 10, count: 100, color: '#10b981' },
    { id: 'events',        name: 'Events',             pct:  5, count:  50, color: '#ec4899' },
    { id: 'microsites',    name: 'Microsites',         pct:  3, count:  30, color: '#f59e0b' },
    { id: 'other-ct',      name: 'Other',              pct:  2, count:  20, color: '#64748b' },
  ];

  readonly TM_W = 1000;
  readonly TM_H = 400;

  private squarify(
    items: Array<{ value: number; topic: TreemapTopic }>,
    x: number, y: number, w: number, h: number,
  ): TmCell[] {
    if (items.length === 0) return [];
    if (items.length === 1) return [{ topic: items[0].topic, rect: { x, y, w, h } }];

    const total  = items.reduce((s, i) => s + i.value, 0);
    const isWide = w >= h;
    let stripSum = 0, worstBest = Infinity, splitAt = items.length;

    for (let n = 1; n <= items.length; n++) {
      stripSum += items[n - 1].value;
      const stripFrac  = stripSum / total;
      const stripLen   = isWide ? w * stripFrac : h * stripFrac;
      const stripOther = isWide ? h : w;
      let worst = 0;
      for (let i = 0; i < n; i++) {
        const itemLen = stripOther * (items[i].value / stripSum);
        const aspect  = Math.max(stripLen / itemLen, itemLen / stripLen);
        if (aspect > worst) worst = aspect;
      }
      if (worst < worstBest) { worstBest = worst; splitAt = n; }
      else break;
    }

    const stripItems = items.slice(0, splitAt);
    const restItems  = items.slice(splitAt);
    const strSum     = stripItems.reduce((s, i) => s + i.value, 0);
    const results: TmCell[] = [];

    if (isWide) {
      const stripW = w * (strSum / total);
      let cy = y;
      for (const item of stripItems) {
        const itemH = h * (item.value / strSum);
        results.push({ topic: item.topic, rect: { x, y: cy, w: stripW, h: itemH } });
        cy += itemH;
      }
      if (restItems.length) results.push(...this.squarify(restItems, x + stripW, y, w - stripW, h));
    } else {
      const stripH = h * (strSum / total);
      let cx = x;
      for (const item of stripItems) {
        const itemW = w * (item.value / strSum);
        results.push({ topic: item.topic, rect: { x: cx, y, w: itemW, h: stripH } });
        cx += itemW;
      }
      if (restItems.length) results.push(...this.squarify(restItems, x, y + stripH, w, h - stripH));
    }

    return results;
  }

  readonly treemapCells = computed((): TmCell[] => {
    const tab    = this.activeTab();
    const topics = tab === 'country'      ? this.countryTopics
                 : tab === 'sector'       ? this.sectorTopics
                 : this.contentTypeTopics;
    const sorted = [...topics].sort((a, b) => b.count - a.count);
    return this.squarify(sorted.map(t => ({ value: t.count, topic: t })), 0, 0, this.TM_W, this.TM_H);
  });

  onTabClick(tab: KptTab): void {
    this.activeTab.set(tab);
    this.topicClicked.emit(null);
  }

  onCellClick(id: string) {
    this.topicClicked.emit(this.selectedTopic() === id ? null : id);
  }
}
