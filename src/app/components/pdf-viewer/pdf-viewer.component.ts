import {
  Component, Input, OnChanges, OnDestroy, ElementRef, ViewChild,
  signal, AfterViewInit, SimpleChanges, ChangeDetectorRef, inject,
} from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  template: `
    <div style="display:flex;flex-direction:column;flex:1;min-height:0;background:#f4f5f7">
      <!-- Nav bar -->
      <div style="height:48px;display:flex;align-items:center;gap:8px;padding:0 20px;flex-shrink:0;background:#fff;border-bottom:1px solid #e4edf5;font-family:'Source Sans Pro','Source Sans 3',sans-serif">
        <button (click)="prevPage()" [disabled]="page() <= 1"
          style="background:none;border:none;cursor:pointer;display:flex;padding:4px;border-radius:4px;color:#5a7a96"
          [style.opacity]="page() <= 1 ? '0.35' : '1'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        <span style="font-size:13px;color:#5a7a96">Page</span>
        <input #pageInput type="number" [value]="page()" (change)="onPageInput($event)"
          style="width:44px;text-align:center;border:1px solid #e4edf5;border-radius:5px;padding:3px 4px;font-size:13px;font-family:inherit;outline:none;color:#212121;background:#fff"/>
        <span style="font-size:13px;color:#5a7a96">of {{ totalPages() }}</span>

        <button (click)="nextPage()" [disabled]="page() >= totalPages()"
          style="background:none;border:none;cursor:pointer;display:flex;padding:4px;border-radius:4px;color:#5a7a96"
          [style.opacity]="page() >= totalPages() ? '0.35' : '1'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        <div style="flex:1"></div>

        @if (pdfUrl) {
          <a [href]="pdfUrl" download target="_blank"
            style="display:flex;align-items:center;gap:5px;font-size:13px;color:#007DB7;text-decoration:none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download
          </a>
        }
      </div>

      <!-- Canvas -->
      <div style="flex:1;overflow:auto;display:flex;justify-content:center;padding:20px">
        @if (loading()) {
          <div style="display:flex;align-items:center;justify-content:center;font-size:14px;color:#5a7a96;font-family:'Source Sans Pro',sans-serif">
            Loading page {{ page() }}…
          </div>
        }
        <canvas #pdfCanvas style="max-width:100%;box-shadow:0 2px 16px rgba(0,0,0,0.18);border-radius:4px;display:block"></canvas>
      </div>
    </div>
  `,
  styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }`],
})
export class PdfViewerComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() pdfUrl = '';
  @Input() initialPage = 1;

  @ViewChild('pdfCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly cdr = inject(ChangeDetectorRef);

  readonly page       = signal(1);
  readonly totalPages = signal(0);
  readonly loading    = signal(false);

  private pdf: pdfjsLib.PDFDocumentProxy | null = null;
  private renderTask: pdfjsLib.RenderTask | null = null;
  private viewInitialised = false;

  ngAfterViewInit(): void {
    this.viewInitialised = true;
    if (this.pdfUrl) this.loadPdf(this.pdfUrl, this.initialPage);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewInitialised) return;
    if (changes['pdfUrl'] && this.pdfUrl) {
      this.loadPdf(this.pdfUrl, this.initialPage);
    } else if (changes['initialPage']) {
      this.goToPage(this.initialPage);
    }
  }

  ngOnDestroy(): void {
    this.renderTask?.cancel();
    this.pdf?.cleanup();
  }

  private async loadPdf(url: string, startPage = 1): Promise<void> {
    this.loading.set(true);
    this.renderTask?.cancel();
    try {
      if (this.pdf) { this.pdf.cleanup(); this.pdf = null; }
      this.pdf = await pdfjsLib.getDocument({ url }).promise;
      this.totalPages.set(this.pdf.numPages);
      this.page.set(Math.min(Math.max(startPage, 1), this.pdf.numPages));
      await this.renderPage();
    } catch (e) {
      console.error('PDF load error', e);
    } finally {
      this.loading.set(false);
    }
  }

  private async renderPage(): Promise<void> {
    if (!this.pdf || !this.canvasRef) return;
    this.loading.set(true);
    this.renderTask?.cancel();
    try {
      const pdfPage = await this.pdf.getPage(this.page());
      const viewport = pdfPage.getViewport({ scale: 1.5 });
      const canvas = this.canvasRef.nativeElement;
      canvas.width  = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      this.renderTask = pdfPage.render({ canvas, canvasContext: ctx, viewport });
      await this.renderTask.promise;
    } catch (e: any) {
      if (e?.name !== 'RenderingCancelledException') console.error('Render error', e);
    } finally {
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }

  prevPage(): void {
    if (this.page() > 1) { this.page.update(p => p - 1); this.renderPage(); }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) { this.page.update(p => p + 1); this.renderPage(); }
  }

  goToPage(n: number): void {
    const clamped = Math.min(Math.max(n, 1), this.totalPages());
    if (clamped !== this.page()) { this.page.set(clamped); this.renderPage(); }
  }

  onPageInput(event: Event): void {
    const n = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(n)) this.goToPage(n);
  }
}
