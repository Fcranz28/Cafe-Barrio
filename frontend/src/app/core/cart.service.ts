import { MEDIA } from './media';
import { Injectable, computed, effect, signal } from '@angular/core';
import { Product } from './models';
export interface CartItem {
  product: Product;
  quantity: number;
}
const KEY = 'cafe-barrio-cart-v1';
@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartItem[]>(this.restore());
  readonly count = computed(() => this.items().reduce((n, i) => n + i.quantity, 0));
  readonly total = computed(
    () =>
      this.items().reduce((n, i) => n + Math.round(i.product.price * 100) * i.quantity, 0) / 100,
  );
  readonly notice = signal('');
  private timer?: ReturnType<typeof setTimeout>;
  constructor() {
    effect(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.items()));
      } catch {
        /* Cart remains available in memory. */
      }
    });
  }
  add(product: Product, quantity = 1) {
    if (!product.active || product.stock < 1) return;
    const existing = this.items().find((i) => i.product.id === product.id);
    const next = (existing?.quantity || 0) + quantity;
    if (next > Math.min(product.stock, 999)) {
      this.flash('Ya tienes la cantidad disponible en tu carrito.');
      return;
    }
    this.items.update((items) =>
      existing
        ? items.map((i) => (i.product.id === product.id ? { product, quantity: next } : i))
        : [...items, { product, quantity }],
    );
    this.flash('Producto agregado al carrito');
  }
  quantity(id: number, value: number) {
    if (value < 1) return;
    this.items.update((items) =>
      items.map((i) =>
        i.product.id === id ? { ...i, quantity: Math.min(value, i.product.stock, 999) } : i,
      ),
    );
  }
  remove(id: number) {
    this.items.update((items) => items.filter((i) => i.product.id !== id));
  }
  clear() {
    this.items.set([]);
  }
  private flash(message: string) {
    this.notice.set(message);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.notice.set(''), 3500);
  }
  private restore(): CartItem[] {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      const seen = new Set<number>();
      return raw
        .filter((i: any) => {
          const p = i?.product;
          const ok =
            p &&
            Number.isSafeInteger(p.id) &&
            p.id > 0 &&
            typeof p.name === 'string' &&
            p.name.length <= 120 &&
            typeof p.price === 'number' &&
            Number.isFinite(p.price) &&
            p.price > 0 &&
            p.price <= 9999999999.99 &&
            Number.isInteger(p.stock) &&
            p.stock > 0 &&
            p.active === true &&
            typeof p.description === 'string' &&
            p.category &&
            typeof p.category.name === 'string' &&
            typeof p.imageUrl === 'string' &&
            (/^https:\/\//.test(p.imageUrl) ||
              /^\/images\/[\w.-]+$/.test(p.imageUrl) ||
              p.imageUrl === '') &&
            Number.isInteger(i.quantity) &&
            i.quantity > 0 &&
            i.quantity <= Math.min(p.stock, 999) &&
            !seen.has(p.id);
          if (ok) seen.add(p.id);
          return ok;
        })
        .slice(0, 50)
        .map((item: CartItem) => ({ ...item, product: { ...item.product,
          imageUrl: MEDIA.legacyUrls[item.product.imageUrl as keyof typeof MEDIA.legacyUrls] || item.product.imageUrl,
        } }));
    } catch {
      return [];
    }
  }
}
