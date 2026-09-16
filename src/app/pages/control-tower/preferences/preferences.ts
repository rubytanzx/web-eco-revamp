import { Component, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TablerIconComponent } from '@tabler/icons-angular';
import { REGION_GROUPS, VPU_GROUPS } from '../shared/hier-filter/hier-filter-catalog';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';

interface PreferenceTag {
  name: string;
  userCount: number;
  pct: number;
  trending?: boolean;
}

interface EmergingTopic {
  name: string;
  userCount: number;
  newThisPeriod: boolean;
}

interface UnselectedTag {
  name: string;
  selectionPct: number;
}

@Component({
  selector: 'app-preferences',
  imports: [TablerIconComponent, DateRangeFilter, DecimalPipe],
  templateUrl: './preferences.html',
  styleUrl: './preferences.css',
})
export class Preferences {
  readonly regionGroups = REGION_GROUPS;
  readonly vpuGroups    = VPU_GROUPS;

  readonly totalTagsAvailable    = { value: '8',    sub: 'preference tags available platform-wide' };
  readonly avgPreferencesPerUser = { value: '4.2',  delta: '+1.0',  deltaGood: true,  sub: 'avg tags selected per user' };
  readonly adoptionRate          = { value: '33%',  delta: '-4pp',  deltaGood: false, sub: 'users with ≥1 preference set' };
  readonly changeFrequency       = { value: '1.8×', delta: '+0.2×', deltaGood: true,  sub: 'average updates per user this period' };

  readonly topPreferences: PreferenceTag[] = [
    { name: 'Knowledge Management',    userCount: 481, pct: 100 },
    { name: 'HR & Talent',             userCount: 378, pct:  79 },
    { name: 'Communications',          userCount: 361, pct:  75 },
    { name: 'Operations',              userCount: 167, pct:  35 },
    { name: 'Policy & Strategy',       userCount: 111, pct:  23 },
    { name: 'IT & Systems',            userCount:  89, pct:  19 },
    { name: 'Partnerships',            userCount:  67, pct:  14 },
    { name: 'Administrative Services', userCount:  43, pct:   9 },
  ];

  showAllPreferences = signal(false);

  readonly visiblePreferences = computed(() =>
    this.showAllPreferences() ? this.topPreferences : this.topPreferences.slice(0, 5)
  );

  readonly emergingTopics: EmergingTopic[] = [
    { name: 'Climate Adaptation Financing', userCount: 45, newThisPeriod: false },
    { name: 'Hybrid Work Policy',           userCount: 35, newThisPeriod: false },
    { name: 'AI Ethics',                    userCount: 22, newThisPeriod: false },
    { name: 'Green Procurement',            userCount: 19, newThisPeriod: false },
    { name: 'Staff Learning Pathways',      userCount: 17, newThisPeriod: false },
    { name: 'Data Governance',              userCount: 15, newThisPeriod: false },
    { name: 'Inclusive Development',        userCount: 12, newThisPeriod: false },
    { name: 'Knowledge Transfer',           userCount: 10, newThisPeriod: false },
  ];

  readonly maxEmergingCount = 45;
  readonly maxTrendingCount = 481;

  cloudFontSize(count: number, max: number): number {
    return Math.round(11 + (count / max) * 9);
  }

  cloudPadding(count: number, max: number): string {
    const t = count / max;
    return `${Math.round(5 + t * 4)}px ${Math.round(12 + t * 8)}px`;
  }

  readonly cloudColors = [
    'pref-cloud-chip--c0',
    'pref-cloud-chip--c1',
    'pref-cloud-chip--c2',
    'pref-cloud-chip--c3',
    'pref-cloud-chip--c4',
  ];

  cloudColorClass(idx: number): string {
    return this.cloudColors[idx % this.cloudColors.length];
  }

  readonly unselectedTags: UnselectedTag[] = [
    { name: 'Sectoral Priorities: Energy', selectionPct: 0.27 },
    { name: 'Regional News: Pacific',      selectionPct: 0.55 },
    { name: 'HR Policy Updates',           selectionPct: 0.61 },
    { name: 'Climate Finance',             selectionPct: 0.81 },
  ];
}
