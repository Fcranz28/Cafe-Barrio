import { Routes } from '@angular/router';
import { adminGuard } from './core/auth.service';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home').then((m) => m.Home) },
  { path: 'catalogo', loadComponent: () => import('./features/catalog').then((m) => m.Catalog) },
  {
    path: 'productos/:id',
    loadComponent: () => import('./features/product-detail').then((m) => m.ProductDetail),
  },
  { path: 'carrito', loadComponent: () => import('./features/cart').then((m) => m.Cart) },
  { path: 'checkout', loadComponent: () => import('./features/checkout').then((m) => m.Checkout) },
  { path: 'admin/login', loadComponent: () => import('./features/login').then((m) => m.Login) },
  {
    path: 'admin/productos',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin-products').then((m) => m.AdminProducts),
  },
  {
    path: 'admin/pedidos',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin-orders').then((m) => m.AdminOrders),
  },
  { path: '**', loadComponent: () => import('./features/not-found').then((m) => m.NotFound) },
];
