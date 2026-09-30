import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../core/api.service';
import { CartService } from '../core/cart.service';
import { Product, errorMessage } from '../core/models';
import { QuantitySelector } from '../shared/quantity-selector';
import { switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({
  imports: [RouterLink, CurrencyPipe, QuantitySelector],
  template: ` <section class="container-page py-10">
    <a routerLink="/catalogo" class="text-sm text-coffee">← Volver al catálogo</a>
    @if (error()) {
      <p role="alert" class="notice mt-8">{{ error() }}</p>
    } @else if (product(); as p) {
      <div class="mt-8 grid items-start gap-10 md:grid-cols-2">
        <img
          [src]="p.imageUrl || '/images/coffee.svg'"
          (error)="fallback($event)"
          [alt]="p.name"
          class="aspect-square w-full rounded-3xl bg-[#ece1d4] object-cover"
        />
        <div class="py-4">
          <p class="eyebrow">{{ p.category.name }}</p>
          <h1 class="mt-4 font-display text-4xl leading-tight md:text-5xl">{{ p.name }}</h1>
          <p class="mt-5 text-2xl font-semibold">{{ p.price | currency: 'PEN' : 'S/ ' }}</p>
          <p class="mt-6 whitespace-pre-line text-sm leading-7 text-espresso/70">
            {{ p.description }}
          </p>
          <p class="mt-6 text-xs" [class.text-coffee]="p.stock > 0">
            {{ p.stock > 0 ? p.stock + ' unidades disponibles' : 'Este producto está agotado' }}
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <app-quantity
              [value]="quantity()"
              [max]="p.stock < 999 ? p.stock : 999"
              (changed)="quantity.set($event)"
            /><button class="btn" [disabled]="p.stock === 0" (click)="cart.add(p, quantity())">
              Agregar al carrito +
            </button>
          </div>
          <p class="mt-8 border-t border-line pt-5 text-xs leading-6 text-espresso/60">
            Confirma tu pedido con tus datos de entrega. El registro no incluye un pago en línea.
          </p>
        </div>
      </div>
    } @else {
      <p role="status" class="py-12">Cargando producto…</p>
    }
  </section>`,
})
export class ProductDetail {
  api = inject(ApiService);
  cart = inject(CartService);
  product = signal<Product | null>(null);
  error = signal('');
  quantity = signal(1);
  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        switchMap((p) => {
          this.product.set(null);
          this.quantity.set(1);
          return this.api.product(Number(p.get('id')));
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (p) => this.product.set(p),
        error: (e) => this.error.set(errorMessage(e)),
      });
  }
  fallback(e: Event) {
    const img = e.target as HTMLImageElement;
    img.onerror = null;
    img.src = '/images/coffee.svg';
  }
}
