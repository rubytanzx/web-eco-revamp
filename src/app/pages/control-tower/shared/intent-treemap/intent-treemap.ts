import { Component, computed, input, output, signal } from '@angular/core';

type KptTab = 'knowledge' | 'people' | 'unclassified';

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

  readonly activeTab = signal<KptTab>('knowledge');

  readonly kptTabDefs = [
    { id: 'knowledge'    as KptTab, label: 'Knowledge' },
    { id: 'people'       as KptTab, label: 'People' },
    { id: 'unclassified' as KptTab, label: 'Unclassified' },
  ];

  private readonly knowledgeTopics: TreemapTopic[] = [
    { id: 'news',    name: 'News & Events',              pct: 18, count: 648, color: '#ef4444' },
    { id: 'acro',    name: 'Acronyms',                   pct: 17, count: 609, color: '#06b6d4' },
    { id: 'gen',     name: 'General Queries',            pct: 16, count: 583, color: '#6366f1' },
    { id: 'sect',    name: 'ADB Sectoral Priorities',    pct: 15, count: 550, color: '#f97316', trending: true },
    { id: 'admin',   name: 'Admin & Employee Support',   pct: 11, count: 382, color: '#14b8a6' },
    { id: 'orginfo', name: 'Organisational Information', pct:  9, count: 310, color: '#3b82f6' },
    { id: 'proj',    name: 'Projects & Initiatives',     pct:  7, count: 239, color: '#8b5cf6' },
    { id: 'reg',     name: 'Regional Queries',           pct:  4, count: 141, color: '#ec4899' },
    { id: 'tmpl',    name: 'Templates & Documents',      pct:  3, count:  97, color: '#f59e0b' },
    { id: 'pol',     name: 'Policies & Guidelines',      pct:  2, count:  76, color: '#10b981' },
  ];

  private readonly peopleTopics: TreemapTopic[] = [
    { id: 'contact',  name: 'Contact Information',  pct: 57, count: 2573, color: '#3b82f6' },
    { id: 'orgchart', name: 'Organisational Chart', pct: 22, count:  992, color: '#8b5cf6' },
    { id: 'roles',    name: 'Roles & Expertise',    pct: 22, count:  948, color: '#f97316' },
  ];

  private readonly unclassifiedTopics: TreemapTopic[] = [
    { id: 'no-answer', name: 'No Answer',        pct: 34, count: 222, color: '#64748b' },
    { id: 'ambig',     name: 'Ambiguous Prompt', pct: 28, count: 183, color: '#94a3b8' },
    { id: 'absent',    name: 'Absent Data',      pct: 24, count: 157, color: '#78716c' },
    { id: 'ai-fail',   name: 'AI Failure',       pct: 14, count:  91, color: '#a8a29e' },
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
    const topics = tab === 'knowledge' ? this.knowledgeTopics
                 : tab === 'people'    ? this.peopleTopics
                 : this.unclassifiedTopics;
    const sorted = [...topics].sort((a, b) => b.count - a.count);
    return this.squarify(sorted.map(t => ({ value: t.count, topic: t })), 0, 0, this.TM_W, this.TM_H);
  });

  onTabClick(tab: KptTab) {
    this.activeTab.set(tab);
    this.topicClicked.emit(null);
  }

  onCellClick(id: string) {
    this.topicClicked.emit(this.selectedTopic() === id ? null : id);
  }
}
