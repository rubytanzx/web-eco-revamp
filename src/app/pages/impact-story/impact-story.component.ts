import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../../components/site-header/site-header.component';

@Component({
  selector: 'app-impact-story',
  standalone: true,
  imports: [SiteHeaderComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './impact-story.component.html',
  styleUrl: './impact-story.component.scss',
})
export class ImpactStoryComponent {
  headerHeight = signal(0);
}
