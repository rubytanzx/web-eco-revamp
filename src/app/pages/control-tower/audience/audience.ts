import { Component, computed } from '@angular/core';
import { DateRangeFilter } from '../shared/date-range-filter/date-range-filter';
import { TablerIconComponent } from '@tabler/icons-angular';

@Component({
  selector: 'app-audience',
  imports: [DateRangeFilter, TablerIconComponent],
  templateUrl: './audience.html',
  styleUrl: './audience.css',
})
export class Audience {

  // ── Overview tab ──────────────────────────────────────────────────────────

  readonly overviewSignals = [
    { label: 'Page views',         value: '4.8M',    sub: '6% vs prior period',  trendClass: 'trend--pos' },
    { label: 'Active users',       value: '284K',    sub: '12% vs prior period', trendClass: 'trend--pos' },
    { label: 'Avg session depth',  value: '4.2 pgs', sub: '3.6 sessions/user',      trendClass: 'trend--neu' },
    { label: 'Bounce rate',        value: '51.4%',   sub: '2m 44s avg time on page',trendClass: 'trend--neu' },
  ];

  readonly monthLabels = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  private readonly monthData = [218, 195, 231, 248, 267, 290, 271, 284, 262, 278, 291, 284];

  readonly barRects = computed(() => {
    const maxVal = Math.max(...this.monthData);
    const svgW = 800, svgH = 160;
    const padL = 8, padT = 10, padB = 30;
    const plotW = svgW - padL * 2;
    const plotH = svgH - padT - padB;
    const slotW = plotW / this.monthData.length;
    const barW = slotW * 0.65;
    return this.monthData.map((v, i) => {
      const barH = (v / maxVal) * plotH;
      return {
        x:       padL + i * slotW + (slotW - barW) / 2,
        y:       padT + plotH - barH,
        width:   barW,
        height:  barH,
        label:   this.monthLabels[i],
        labelX:  padL + i * slotW + slotW / 2,
        labelY:  svgH - 8,
        isLast:  i === this.monthData.length - 1,
      };
    });
  });

  // Donut chart (New 32% vs Returning 68%)
  readonly DONUT_CIRC = 345.575; // 2π × 55
  readonly newDash = '110.58 345.58';     // 32% of circ (345.58 × 0.32)
  readonly retDash = '235.00 345.58';     // 68% of circ (345.58 × 0.68)
  readonly retOffset = '-110.58';         // offset so returning starts after new

  readonly geoRows = [
    { country: 'South Asia',       code: '',   sessions: '84.2K', pct: 84, trend: '+8%'  },
    { country: 'Southeast Asia',   code: '',   sessions: '61.8K', pct: 72, trend: '+5%'  },
    { country: 'East Asia',        code: '',   sessions: '38.6K', pct: 53, trend: '+2%'  },
    { country: 'North America',    code: '',   sessions: '22.1K', pct: 38, trend: '-1%'  },
    { country: 'Europe',           code: '',   sessions: '18.7K', pct: 25, trend: '+3%'  },
    { country: 'Pacific',          code: '',   sessions: '8.4K',  pct: 12, trend: '+1%'  },
  ];

  readonly engagementRows = [
    { label: 'Single-page session', pct: 38, val: '38%' },
    { label: '2–4 pages',           pct: 34, val: '34%' },
    { label: '5–9 pages',           pct: 18, val: '18%' },
    { label: '10+ pages',           pct: 10, val: '10%' },
  ];

  geoTrendClass(t: string): string {
    if (t.startsWith('+')) return 'trend trend--pos';
    if (t.startsWith('-')) return 'trend trend--neg';
    return 'trend trend--neu';
  }

  barFillClass(success: number): string {
    if (success >= 75) return 'inline-bar-fill--green';
    if (success >= 55) return 'inline-bar-fill--warn';
    return 'inline-bar-fill--red';
  }

}
