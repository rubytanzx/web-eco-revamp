import {
  AfterViewInit, ChangeDetectionStrategy, Component,
  ElementRef, EventEmitter, NgZone, OnDestroy, OnInit,
  Output, ViewChild, inject, signal
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.scss',
})
export class SiteHeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('headerEl') headerRef!: ElementRef<HTMLElement>;
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;
  @Output() heightChange = new EventEmitter<number>();

  scrollProgress = signal(0);
  activeMenu = signal<number | null>(null);
  activeRegion = signal<string>('central-west-asia');
  searchState = signal<'idle' | 'hover' | 'focused'>('idle');

  private router = inject(Router);
  private scrollEl: HTMLElement | null = null;
  private menuTimer: ReturnType<typeof setTimeout> | null = null;
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;
  private isHovered = false;

  private onScroll = () => {
    const el = this.scrollEl!;
    const pct = el.scrollHeight - el.clientHeight > 0
      ? (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100 : 0;
    this.scrollProgress.set(pct);
  };

  constructor(private zone: NgZone) {}

  ngOnInit() {
    this.scrollEl = document.querySelector('.app-content');
    this.zone.runOutsideAngular(() => {
      this.scrollEl?.addEventListener('scroll', this.onScroll, { passive: true });
    });
  }

  ngAfterViewInit() {
    this.heightChange.emit(this.headerRef.nativeElement.offsetHeight);
  }

  ngOnDestroy() {
    this.scrollEl?.removeEventListener('scroll', this.onScroll);
    if (this.menuTimer) clearTimeout(this.menuTimer);
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
  }

  onSearchMouseEnter() {
    this.isHovered = true;
    if (this.hoverTimer) { clearTimeout(this.hoverTimer); this.hoverTimer = null; }
    if (this.searchState() === 'idle') this.searchState.set('hover');
  }

  onSearchMouseLeave() {
    this.isHovered = false;
    if (this.searchState() === 'hover') {
      this.hoverTimer = setTimeout(() => {
        if (!this.isHovered) this.searchState.set('idle');
      }, 2000);
    }
  }

  onSearchFocus() {
    if (this.hoverTimer) { clearTimeout(this.hoverTimer); this.hoverTimer = null; }
    this.searchState.set('focused');
  }

  onSearchBlur() {
    setTimeout(() => {
      if (document.activeElement !== this.searchInputRef?.nativeElement) {
        this.searchState.set(this.isHovered ? 'hover' : 'idle');
      }
    }, 150);
  }

  onSearch() {
    const q = this.searchInputRef?.nativeElement.value?.trim() ?? '';
    this.router.navigate(['/search'], q ? { queryParams: { keywords: q } } : {});
  }

  setMenu(n: number): void {
    if (this.menuTimer) { clearTimeout(this.menuTimer); this.menuTimer = null; }
    this.activeMenu.set(n);
  }

  scheduleClose(): void {
    this.menuTimer = setTimeout(() => this.activeMenu.set(null), 150);
  }

  cancelClose(): void {
    if (this.menuTimer) { clearTimeout(this.menuTimer); this.menuTimer = null; }
  }

  setRegion(r: string): void {
    this.activeRegion.set(r);
  }
}
