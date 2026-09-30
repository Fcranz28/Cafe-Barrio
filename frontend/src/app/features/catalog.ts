import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Category, Product, errorMessage } from '../core/models';
import { ProductCard } from '../shared/product-card';
import { Subject, switchMap, catchError, of, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({
  imports: [ProductCard],
  template: ` <section class="container-page py-12">
    <p class="eyebrow">La tienda del barrio</p>
    <h1 class="mt-3 font-display text-4xl sm:text-5xl">Tu próximo favorito.</h1>
    <p class="mt-4 max-w-lg text-sm leading-6 text-espresso/65">
      Café de origen, regalos con intención y accesorios para preparar buenos momentos.
    </p>
    <div class="my-8 flex flex-wrap gap-2" aria-label="Filtrar por categoría">
      <button
        class="btn-outline !px-5 !py-2"
        [class.!bg-coffee]="!selected()"
        [class.!text-white]="!selected()"
        [attr.aria-pressed]="!selected()"
        (click)="filter()"
      >
        Todos
      </button>
      @for (c of categories(); track c.id) {
        <button
          class="btn-outline !px-5 !py-2"
          [class.!bg-coffee]="selected() === c.id"
          [class.!text-white]="selected() === c.id"
          [attr.aria-pressed]="selected() === c.id"
          (click)="filter(c.id)"
        >
          {{ c.name }}
        </button>
      }
    </div>
    @if (error()) {
      <p role="alert" class="notice">
        {{ error() }} <button class="underline" (click)="load()">Reintentar</button>
      </p>
    } @else if (loading()) {
      <p role="status" class="py-12 text-center text-coffee">Cargando productos…</p>
    } @else if (!products().length) {
      <div class="panel py-16 text-center">
        <h2 class="text-2xl">Pronto habrá más favoritos.</h2>
        <p class="mt-3 text-sm">No hay productos en esta categoría.</p>
      </div>
    } @else {
      <p class="mb-4 text-xs text-espresso/60">{{ total() }} productos para disfrutar</p>
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        @for (p of products(); track p.id) {
          <app-product-card [product]="p" />
        }
      </div>
      <div class="mt-8 flex items-center justify-center gap-4">
        <button class="btn-outline" [disabled]="page() === 0" (click)="go(-1)">Anterior</button
        ><span class="text-sm">{{ page() + 1 }} / {{ pages() }}</span
        ><button class="btn-outline" [disabled]="page() + 1 >= pages()" (click)="go(1)">
          Siguiente
        </button>
      </div>
    }
  </section>`,
})
export class Catalog {
  api = inject(ApiService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  selected = signal<number | undefined>(undefined);
  loading = signal(true);
  error = signal('');
  page = signal(0);
  pages = signal(1);
  total = signal(0);
  private requests = new Subject<void>();
  constructor() {
    this.requests
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set('');
        }),
        switchMap(() =>
          this.api.products(this.selected(), this.page()).pipe(
            catchError((e) => {
              this.error.set(errorMessage(e));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((r) => {
        if (r) {
          this.products.set(r.content);
          this.pages.set(r.totalPages);
          this.total.set(r.totalElements);
        }
        this.loading.set(false);
      });
    this.api
      .categories()
      .subscribe({
        next: (c) => this.categories.set(c),
        error: (e) => this.error.set(errorMessage(e)),
      });
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((p) => {
      const id = Number(p.get('categoria'));
      this.selected.set(Number.isSafeInteger(id) && id > 0 ? id : undefined);
      this.page.set(0);
      this.load();
    });
  }
  load() {
    this.requests.next();
  }
  filter(id?: number) {
    this.router.navigate(['/catalogo'], { queryParams: id ? { categoria: id } : {} });
  }
  go(delta: number) {
    this.page.update((p) => p + delta);
    this.load();
  }
}
