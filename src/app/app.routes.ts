import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'map',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.component').then(m => m.SearchComponent),
  },
  {
    path: 'stories/eard/education-skills',
    loadComponent: () => import('./pages/impact-story/impact-story.component').then(m => m.ImpactStoryComponent),
  },
  {
    path: 'control-tower',
    loadComponent: () => import('./pages/control-tower/control-tower.component').then(m => m.ControlTowerComponent),
    loadChildren: () => import('./pages/control-tower/control-tower.routes').then(m => m.controlTowerRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
