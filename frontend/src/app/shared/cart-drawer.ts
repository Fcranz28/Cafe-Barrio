import { MEDIA } from '../core/media';
import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartService } from '../core/cart.service';
import { QuantitySelector } from './quantity-selector';

@Component({
  selector: 'app-cart-drawer',
  imports: [CurrencyPipe, RouterLink, QuantitySelector],
  template: `
    <dialog #panel aria-labelledby="cart-drawer-title" class="cart-drawer"
      (click)="dismissBackdrop($event)">
      <div class="flex h-full flex-col">
        <header class="flex items-center justify-between gap-4 border-b border-line p-6">
          <div>
            <h2 id="cart-drawer-title" class="text-3xl">Tu carrito.</h2>
            <p class="mt-2 text-sm text-muted">{{ cart.count() }} {{ cart.count() === 1 ? 'unidad' : 'unidades' }}</p>
          </div>
          <button type="button" autofocus aria-label="Cerrar carrito" (click)="close()"
            class="btn-outline !h-11 !w-11 !p-0 text-xl">×</button>
        </header>
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6">
          @if (!cart.items().length) {
            <div class="py-16 text-center">
              <p class="font-display text-2xl">Tu próximo café te está esperando.</p>
              <p class="mt-3 text-sm text-espresso/65">Todavía no has agregado productos.</p>
              <a routerLink="/catalogo" (click)="close()" class="btn-outline mt-6">Explorar catálogo ↗</a>
            </div>
          } @else {
            <ul class="divide-y divide-line">
              @for (item of cart.items(); track item.product.id) {
                <li class="flex gap-4 py-6">
                  <img [src]="item.product.imageUrl  || images.productFallback"
                    [alt]="item.product.name" (error)="fallback($event)"
                    class="h-20 w-20 shrink-0 rounded-xl object-cover" />
                  <div class="min-w-0 flex-1">
                    <a [routerLink]="item.product.publicId ? ['/productos', item.product.publicId] : ['/catalogo']" (click)="close()"
                      class="font-display text-lg">{{ item.product.name }}</a>
                    <p class="mt-1 text-sm text-coffee">{{ item.product.price | currency: 'PEN' : 'S/ ' }} por unidad</p>
                    <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <app-quantity [value]="item.quantity" [max]="item.product.stock < 999 ? item.product.stock : 999"
                        (changed)="cart.quantity(item.product.id, $event)" />
                      <button type="button" (click)="cart.remove(item.product.id)"
                        [attr.aria-label]="'Eliminar ' + item.product.name"
                        class="py-2 text-xs text-coffee underline underline-offset-4">Eliminar</button>
                    </div>
                    <p class="mt-3 text-right text-sm font-semibold">
                      {{ item.quantity * item.product.price | currency: 'PEN' : 'S/ ' }}
                    </p>
                  </div>
                </li>
              }
            </ul>
          }
        </div>
        <footer class="border-t border-line bg-paper p-6">
          <div class="flex items-center justify-between gap-4 font-semibold">
            <span>Total de productos</span>
            <span>{{ cart.total() | currency: 'PEN' : 'S/ ' }}</span>
          </div>
          <p class="mt-3 text-xs leading-5 text-espresso/60">Los precios y la disponibilidad se verifican al confirmar.</p>
          <a routerLink="/carrito" (click)="close()" class="btn mt-5 w-full">Ver carrito →</a>
          <button type="button" (click)="close()" class="mt-4 w-full py-2 text-sm text-coffee">Seguir comprando</button>
        </footer>
      </div>
    </dialog>
  `,
})
export class CartDrawer {
  readonly images = MEDIA;
  readonly cart = inject(CartService);
  private readonly panel = viewChild.required<ElementRef<HTMLDialogElement>>('panel');

  constructor() {
    inject(Router).events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) this.close();
    });
  }

  open() { this.panel().nativeElement.showModal(); }
  close() { this.panel().nativeElement.close(); }
  dismissBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) this.close();
  }
  fallback(event: Event) {
    const image = event.target as HTMLImageElement;
    image.onerror = null;
    image.src = MEDIA.productFallback;
  }
}
