import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'news' },
  {
    path: 'news',
    loadComponent: () => import('./news/pages/news-list/news-list').then((m) => m.NewsList),
  },
  {
    path: 'article',
    loadComponent: () =>
      import('./news/pages/article-details/article-details').then((m) => m.ArticleDetails),
  },
  { path: '**', redirectTo: 'news' },
];
