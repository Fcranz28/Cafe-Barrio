import { MEDIA } from './core/media';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from './core/cart.service';
import { AuthService } from './core/auth.service';
import { CartDrawer } from './shared/cart-drawer';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CartDrawer],
  templateUrl: './app.html',
})
export class App {
  readonly images = MEDIA;
  cart = inject(CartService);
  auth = inject(AuthService);
  router = inject(Router);
  menu = signal(false);
  constructor() {
    this.auth.check().pipe(takeUntilDestroyed()).subscribe();
    this.router.events.subscribe(() => this.menu.set(false));
  }
}
