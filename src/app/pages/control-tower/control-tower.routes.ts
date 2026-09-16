import { Routes } from '@angular/router';

export const controlTowerRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: 'overview',  loadComponent: () => import('./overview/overview').then(m => m.Overview) },
  { path: 'audience',  loadComponent: () => import('./audience/audience').then(m => m.Audience) },
  { path: 'feedback',  loadComponent: () => import('./feedback/feedback').then(m => m.Feedback) },
  { path: 'content',   loadComponent: () => import('./content/content').then(m => m.Content) },
  { path: 'search-ai', loadComponent: () => import('./search-ai/search-ai').then(m => m.SearchAi) },
  { path: 'ai-ops',    loadComponent: () => import('./ai-ops/ai-ops').then(m => m.AiOps) },
  { path: 'platform',  loadComponent: () => import('./platform/platform').then(m => m.Platform) },
  { path: '**', redirectTo: 'overview' },
];
