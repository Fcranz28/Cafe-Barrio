import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from './core/cart.service';
import { AuthService } from './core/auth.service';
import { CartDrawer } from './shared/cart-drawer';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CartDrawer],
  templateUrl: './app.html',
})
export class App {
  cart = inject(CartService);
  auth = inject(AuthService);
  router = inject(Router);
  menu = signal(false);
  constructor() {
    this.router.events.subscribe(() => this.menu.set(false));
  }
}
