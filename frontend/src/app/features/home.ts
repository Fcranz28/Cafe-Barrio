import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Product, errorMessage } from '../core/models';
import { ProductCard } from '../shared/product-card';
@Component({
  imports: [RouterLink, ProductCard],
  template: `
    <section class="relative overflow-hidden bg-[#ece1d4]">
      <div
        class="container-page grid min-h-[560px] items-center gap-8 py-12 md:grid-cols-2 lg:py-16"
      >
        <div class="relative z-10 max-w-xl">
          <p class="eyebrow">De nuestro barrio, para tu día</p>
          <h1 class="mt-6 text-5xl leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Buen café.<br />Buenos <span class="italic text-coffee">momentos.</span>
          </h1>
          <p class="mt-6 max-w-sm text-sm leading-7 text-espresso/70">
            Descubre el café de origen peruano, los regalos y los pequeños detalles que hacen
            especial lo cotidiano.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a routerLink="/catalogo" class="btn"
              >Explorar catálogo <span aria-hidden="true">↗</span></a
            ><a routerLink="/" fragment="historia" class="btn-outline">Conócenos</a>
          </div>
          <div class="mt-10 flex items-center gap-3">
            <span class="h-px w-9 bg-coffee/40"></span
            ><span class="text-[10px] uppercase tracking-[0.15em] text-coffee"
              >Un ritual que empieza con un grano</span
            >
          </div>
        </div>
        <div class="relative">
          <div
            class="absolute -right-8 -top-8 h-56 w-56 rounded-full border border-coffee/15"
          ></div>
          <img
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85"
            (error)="fallback($event)"
            alt="Una taza de café para disfrutar con calma"
            fetchpriority="high"
            class="relative aspect-[5/4] w-full rounded-t-full rounded-b-[2rem] object-cover shadow-xl shadow-espresso/10"
          />
          <div
            class="absolute -bottom-4 left-4 rounded-xl border border-line bg-paper px-5 py-4 shadow-sm"
          >
            <span class="block font-display text-xl italic">Hecho para disfrutar.</span
            ><span class="mt-1 block text-[9px] uppercase tracking-[0.15em] text-coffee"
              >Café de Barrio · Perú</span
            >
          </div>
        </div>
      </div>
    </section>
    <section class="container-page py-14">
      <div class="grid gap-4 sm:grid-cols-3">
        @for (c of categories; track c.id) {
          <a
            routerLink="/catalogo"
            [queryParams]="{ categoria: c.id }"
            class="group flex items-center justify-between rounded-2xl border border-line px-6 py-5 hover:bg-paper"
            ><div>
              <p class="eyebrow">{{ c.subtitle }}</p>
              <h2 class="mt-2 text-2xl">{{ c.name }}</h2>
            </div>
            <span
              class="text-2xl text-coffee transition-transform group-hover:translate-x-1"
              aria-hidden="true"
              >↗</span
            ></a
          >
        }
      </div>
    </section>
    <section class="container-page pb-16">
      <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="eyebrow">Encuentra tu favorito</p>
          <h2 class="section-title mt-3">Pequeños placeres del barrio</h2>
        </div>
        <a routerLink="/catalogo" class="text-sm text-coffee underline underline-offset-4"
          >Ver todo el catálogo ↗</a
        >
      </div>
      @if (error()) {
        <p role="alert" class="notice">
          {{ error() }} <button class="underline" (click)="load()">Reintentar</button>
        </p>
      } @else if (loading()) {
        <p role="status" class="py-8 text-sm text-coffee">Preparando nuestro catálogo…</p>
      } @else {
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          @for (p of products(); track p.id) {
            <app-product-card [product]="p" />
          }
        </div>
      }
    </section>
    <section id="historia" class="scroll-mt-24 bg-[#ece1d4]">
      <div class="container-page grid items-center gap-10 py-16 md:grid-cols-2">
        <div class="rounded-2xl bg-espresso p-10 text-cream">
          <p class="eyebrow !text-caramel">Nuestra esencia</p>
          <p class="mt-6 font-display text-4xl leading-tight">
            Más que una taza.<br /><span class="italic text-caramel">Un momento para ti.</span>
          </p>
          <div class="mt-8 border-t border-cream/20 pt-5 text-xs tracking-widest">
            ORIGEN PERUANO · PASIÓN POR EL CAFÉ
          </div>
        </div>
        <div>
          <p class="eyebrow">Nuestra historia</p>
          <h2 class="section-title mt-3">El café nos reúne.</h2>
          <p class="mt-5 text-sm leading-7 text-espresso/70">
            Café de Barrio nace de una idea sencilla: disfrutar un buen café debería sentirse
            cercano. Por eso reunimos granos de origen peruano, accesorios para prepararlos y kits
            para compartir.
          </p>
          <p class="mt-4 text-sm leading-7 text-espresso/70">
            Elige tu favorito y haz de cada mañana un pequeño ritual.
          </p>
          <a routerLink="/catalogo" class="btn mt-6">Encuentra tu próximo café ↗</a>
        </div>
      </div>
    </section>
  `,
})
export class Home {
  api = inject(ApiService);
  products = signal<Product[]>([]);
  loading = signal(true);
  error = signal('');
  categories = [
    { id: 1, name: 'Café de origen', subtitle: 'De grano en grano' },
    { id: 2, name: 'Kits para regalar', subtitle: 'Comparte un buen momento' },
    { id: 3, name: 'Accesorios', subtitle: 'Completa tu ritual' },
  ];
  constructor() {
    this.load();
    this.api.categories().subscribe({
      next: (cs) => {
        this.categories = cs.map((c) => ({
          id: c.id,
          name: c.name,
          subtitle:
            c.name === 'Café'
              ? 'De grano en grano'
              : c.name === 'Kits'
                ? 'Comparte un buen momento'
                : 'Completa tu ritual',
        }));
      },
      error: () => {},
    });
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.api.products().subscribe({
      next: (r) => {
        this.products.set(r.content.slice(0, 4));
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }
  fallback(e: Event) {
    (e.target as HTMLImageElement).src = '/images/hero.svg';
  }
}
