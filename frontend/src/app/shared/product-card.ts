import { MEDIA } from '../core/media';
import { Component, input, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../core/models';
import { CartService } from '../core/cart.service';
@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink],
  template: ` <article
    class="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper"
  >
    <a
      [routerLink]="['/productos', product().publicId]"
      class="relative block overflow-hidden bg-sand"
      ><img
        [src]="product().imageUrl  || images.productFallback"
        (error)="fallback($event)"
        [alt]="product().name"
        loading="lazy"
        width="1448" height="1086" decoding="async"
        class="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      @if (product().stock === 0) {
        <span class="absolute left-4 top-4 rounded-full bg-paper/95 px-3 py-1 text-xs"
          >Agotado</span
        >
      }
    </a>
    <div class="flex flex-1 flex-col p-5 sm:p-6">
      <p class="eyebrow text-[9px]">{{ product().category.name }}</p>
      <a [routerLink]="['/productos', product().publicId]"
        ><h3 class="mt-2 text-xl leading-tight">{{ product().name }}</h3></a
      >
      <p class="mt-3 line-clamp-2 text-sm leading-6 text-muted">
        {{ product().description }}
      </p>
      <div class="mt-auto flex items-center justify-between gap-2 pt-6">
        <span class="text-base font-semibold tabular-nums">{{ product().price | currency: 'PEN' : 'S/ ' }}</span
        ><button
          type="button" class="btn !px-4 !text-xs"
          [disabled]="product().stock === 0"
          (click)="cart.add(product())"
          [attr.aria-label]="'Agregar ' + product().name + ' al carrito'"
        >
          {{ product().stock > 0 ? 'Agregar +' : 'Agotado' }}
        </button>
      </div>
    </div>
  </article>`,
})
export class ProductCard {
  readonly images = MEDIA;
  product = input.required<Product>();
  cart = inject(CartService);
  fallback(event: Event) {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = MEDIA.productFallback;
  }
}
