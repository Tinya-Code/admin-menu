import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/app-layout/app-layout').then((m) => m.AppLayout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'categories',
        loadComponent: () => import('./pages/categories/categories').then((m) => m.Categories),
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/products').then((m) => m.Products),
      },
      {
        path: 'products/new',
        loadComponent: () => import('./pages/product-form/product-form').then((m) => m.ProductForm),
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./pages/product-form/product-form').then((m) => m.ProductForm),
      },
      {
        path: 'combos',
        loadComponent: () => import('./pages/combos/combos').then((m) => m.Combos),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings-page').then((m) => m.SettingsPage),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
