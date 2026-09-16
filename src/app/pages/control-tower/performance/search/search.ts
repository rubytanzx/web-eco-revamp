import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TablerIconComponent } from '@tabler/icons-angular';
import { DateRangeFilter } from '../../shared/date-range-filter/date-range-filter';

interface SearchKpi { title: string; value: string; sub: string; positive?: boolean; }

@Component({
  selector: 'app-search',
  imports: [TablerIconComponent, RouterLink, DateRangeFilter],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search {
  readonly kpis: SearchKpi[] = [
    {
      title: 'Search Query Volume',
      value: '2,046',
      sub: 'total keyword searches submitted this period',
      positive: true,
    },
    {
      title: 'Zero-Result Search Rate',
      value: '89.2%',
      sub: '% of searches returning no results',
      positive: false,
    },
    {
      title: 'Search-to-AI Conversion',
      value: '999',
      sub: 'sessions where user switched from search to AI prompt',
      positive: true,
    },
  ];
}
