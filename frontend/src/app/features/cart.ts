import { MEDIA } from '../core/media';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../core/cart.service';
import { ApiService } from '../core/api.service';
import { QuantitySelector } from '../shared/quantity-selector';
@Component({
  imports: [RouterLink, CurrencyPipe, QuantitySelector],
  template: ` <section class="container-page py-12">
    <p class="eyebrow">Un buen momento empieza aquí</p>
    <h1 class="section-title mt-3">Tu carrito.</h1>
    @if (!cart.items().length) {
      <div class="panel mt-8 px-6 py-16 text-center">
        <p class="font-display text-2xl">Tu próximo café te está esperando.</p>
        <p class="mt-3 text-sm text-espresso/65">Todavía no has agregado productos.</p>
        <a routerLink="/catalogo" class="btn mt-6">Explorar catálogo ↗</a>
      </div>
    } @else {
      <div class="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        <div class="panel divide-y divide-line">
          @for (i of cart.items(); track i.product.id) {
            <div class="flex flex-wrap items-center gap-4 p-5">
              <img
                [src]="i.product.imageUrl  || images.productFallback"
                (error)="fallback($event)"
                [alt]="i.product.name"
                class="h-20 w-20 rounded-xl object-cover"
              />
              <div class="min-w-36 flex-1">
                <a [routerLink]="i.product.publicId ? ['/productos', i.product.publicId] : ['/catalogo']" class="font-display text-lg">{{
                  i.product.name
                }}</a>
                <p class="mt-1 text-xs text-espresso/65">
                  {{ i.product.price | currency: 'PEN' : 'S/ ' }} por unidad
                </p>
                <button
                  class="mt-2 text-xs text-coffee underline underline-offset-4"
                  (click)="cart.remove(i.product.id)"
                >
                  Eliminar
                </button>
              </div>
              <app-quantity
                [value]="i.quantity"
                [max]="i.product.stock < 999 ? i.product.stock : 999"
                (changed)="cart.quantity(i.product.id, $event)"
              />
              <p class="min-w-20 text-right font-semibold">
                {{ i.quantity * i.product.price | currency: 'PEN' : 'S/ ' }}
              </p>
            </div>
          }
        </div>
        <aside class="panel p-6 lg:sticky lg:top-28">
          <h2 class="text-2xl">Resumen del pedido</h2>
          <div class="mt-6 flex justify-between text-sm">
            <span>{{ cart.count() }} unidades</span
            ><span>{{ cart.total() | currency: 'PEN' : 'S/ ' }}</span>
          </div>
          <div class="mt-5 flex justify-between border-t border-line pt-5 font-semibold">
            <span>Total de productos</span><span>{{ cart.total() | currency: 'PEN' : 'S/ ' }}</span>
          </div>
          <p class="mt-4 text-xs leading-5 text-espresso/60">
            Los precios y la disponibilidad se verifican al confirmar. No se realiza un pago en
            línea.
          </p>
          <a routerLink="/checkout" class="btn mt-6 w-full">Continuar con el pedido →</a
          ><a routerLink="/catalogo" class="mt-4 block text-center text-xs text-coffee"
            >Seguir explorando</a
          >
        </aside>
      </div>
    }
  </section>`,
})
export class Cart {
  readonly images = MEDIA;
  cart = inject(CartService);
  private api = inject(ApiService);
  constructor() {
    // Refresh photos for products saved in the cart before a catalog update.
    for (const item of this.cart.items()) {
      this.api.product(item.product.id).subscribe({
        next: (product) =>
          this.cart.items.update((items) =>
            items.map((i) =>
              i.product.id === product.id
                ? { ...i, product: { ...i.product, imageUrl: product.imageUrl, publicId: product.publicId } }
                : i,
            ),
          ),
        error: () => { /* Keep the cached photo if the catalog is unavailable. */ },
      });
    }
  }
  fallback(e: Event) {
    const img = e.target as HTMLImageElement;
    img.onerror = null;
    img.src = MEDIA.productFallback;
  }
}
