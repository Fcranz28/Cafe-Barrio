import { Component, input, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../core/models';
import { CartService } from '../core/cart.service';
@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink],
  template: ` <article
    class="group h-full overflow-hidden rounded-2xl border border-line bg-paper transition-shadow hover:shadow-lg hover:shadow-coffee/5"
  >
    <a
      [routerLink]="['/productos', product().id]"
      class="relative block overflow-hidden bg-[#ede2d5]"
      ><img
        [src]="product().imageUrl || '/images/coffee.svg'"
        (error)="fallback($event)"
        [alt]="product().name"
        loading="lazy"
        class="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      @if (product().stock === 0) {
        <span class="absolute left-4 top-4 rounded-full bg-paper/95 px-3 py-1 text-xs"
          >Agotado</span
        >
      }
    </a>
    <div class="p-5">
      <p class="eyebrow text-[9px]">{{ product().category.name }}</p>
      <a [routerLink]="['/productos', product().id]"
        ><h3 class="mt-2 text-xl leading-tight">{{ product().name }}</h3></a
      >
      <p class="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-espresso/65">
        {{ product().description }}
      </p>
      <div class="mt-5 flex items-center justify-between gap-2">
        <span class="font-semibold">{{ product().price | currency: 'PEN' : 'S/ ' }}</span
        ><button
          class="btn !min-h-9 !px-4 !py-2 !text-xs"
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
  product = input.required<Product>();
  cart = inject(CartService);
  fallback(event: Event) {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = '/images/coffee.svg';
  }
}
