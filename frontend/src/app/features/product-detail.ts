import { MEDIA } from '../core/media';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../core/api.service';
import { CartService } from '../core/cart.service';
import { Product, errorMessage } from '../core/models';
import { QuantitySelector } from '../shared/quantity-selector';
import { switchMap, tap, catchError, EMPTY } from 'rxjs';
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
          [src]="p.imageUrl  || images.productFallback"
          (error)="fallback($event)"
          [alt]="p.name"
          width="1448" height="1086"
          class="aspect-[4/3] w-full rounded-2xl bg-sand object-cover"
        />
        <div class="py-4">
          <p class="eyebrow">{{ p.category.name }}</p>
          <h1 class="mt-4 font-display text-4xl leading-tight md:text-5xl">{{ p.name }}</h1>
          <p class="mt-5 text-2xl font-semibold">{{ p.price | currency: 'PEN' : 'S/ ' }}</p>
          <p class="mt-6 whitespace-pre-line text-base leading-7 text-muted">
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
  readonly images = MEDIA;
  api = inject(ApiService);
  cart = inject(CartService);
  private router = inject(Router);
  product = signal<Product | null>(null);
  error = signal('');
  quantity = signal(1);
  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        switchMap((p) => {
          this.product.set(null);
          this.error.set('');
          this.quantity.set(1);
          const reference = p.get('referencia') || '';
          // Keep bookmarked numeric links working, then replace the address with its public UUID.
          const request = /^\d+$/.test(reference)
            ? this.api.product(Number(reference)).pipe(tap(product => {
                this.router.navigate(['/productos', product.publicId], { replaceUrl: true });
              }))
            : this.api.productReference(reference);
          return request.pipe(catchError(e => {
            this.error.set(errorMessage(e));
            return EMPTY;
          }));
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
    img.src = MEDIA.productFallback;
  }
}
