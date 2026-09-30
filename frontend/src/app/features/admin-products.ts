import { Component, inject, signal, viewChild, ElementRef } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { Product, Category, ProductInput, errorMessage } from '../core/models';
import { AdminNav } from '../shared/admin-nav';
@Component({
  imports: [AdminNav, CurrencyPipe, ReactiveFormsModule],
  template: `
    <section class="container-page py-10">
      <app-admin-nav />
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="eyebrow">Administración</p>
          <h1 class="section-title mt-3">Productos.</h1>
        </div>
        <button class="btn" (click)="edit()">+ Nuevo producto</button>
      </div>
      @if (message()) {
        <p role="status" class="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">
          {{ message() }}
        </p>
      }
      @if (error()) {
        <p role="alert" class="notice mt-5">
          {{ error() }} <button class="underline" (click)="load()">Reintentar</button>
        </p>
      }
      @if (loading()) {
        <p role="status" class="py-10">Cargando productos…</p>
      } @else {
        <div class="panel mt-8 overflow-x-auto">
          <table class="w-full min-w-[720px] text-left text-sm">
            <caption class="sr-only">
              Mantenimiento de productos del catálogo
            </caption>
            <thead
              class="border-b border-line bg-cream text-xs uppercase tracking-wider text-coffee"
            >
              <tr>
                <th class="p-4">Producto</th>
                <th class="p-4">Categoría</th>
                <th class="p-4">Precio</th>
                <th class="p-4">Stock</th>
                <th class="p-4">Estado</th>
                <th class="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              @for (p of products(); track p.id) {
                <tr>
                  <td class="p-4">
                    <div class="flex items-center gap-3">
                      <img
                        [src]="p.imageUrl || '/images/coffee.svg'"
                        (error)="fallback($event)"
                        alt=""
                        class="h-12 w-12 rounded-lg object-cover"
                      /><span>{{ p.name }}</span>
                    </div>
                  </td>
                  <td class="p-4">{{ p.category.name }}</td>
                  <td class="whitespace-nowrap p-4">{{ p.price | currency: 'PEN' : 'S/ ' }}</td>
                  <td class="p-4">{{ p.stock }}</td>
                  <td class="p-4">
                    <span class="rounded-full bg-cream px-3 py-1 text-xs">{{
                      p.active ? 'Activo' : 'Inactivo'
                    }}</span>
                  </td>
                  <td class="p-4">
                    <div class="flex gap-4">
                      <button class="text-coffee underline" (click)="edit(p)">Editar</button
                      ><button
                        class="text-coffee underline disabled:opacity-40"
                        [disabled]="actionId() !== null"
                        (click)="toggle(p)"
                      >
                        {{
                          actionId() === p.id ? 'Guardando…' : p.active ? 'Desactivar' : 'Activar'
                        }}
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="p-8 text-center">Todavía no hay productos.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="mt-6 flex items-center justify-center gap-4">
          <button class="btn-outline" [disabled]="page() === 0" (click)="go(-1)">Anterior</button
          ><span class="text-sm">{{ page() + 1 }} / {{ pages() || 1 }}</span
          ><button class="btn-outline" [disabled]="page() + 1 >= pages()" (click)="go(1)">
            Siguiente
          </button>
        </div>
      }
    </section>
    <dialog
      #editor
      (cancel)="cancel($event)"
      aria-labelledby="product-form-title"
      class="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-line bg-paper p-6 text-espresso shadow-xl backdrop:bg-espresso/50 sm:p-8"
    >
      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="flex items-center justify-between">
          <h2 id="product-form-title" class="text-2xl">
            {{ editingId() ? 'Editar producto' : 'Nuevo producto' }}
          </h2>
          <button
            type="button"
            (click)="close()"
            [disabled]="saving()"
            aria-label="Cerrar formulario"
            class="h-10 w-10 text-2xl"
          >
            ×
          </button>
        </div>
        <fieldset [disabled]="saving()">
          <label class="label mt-6" for="product-name">Nombre</label
          ><input
            autofocus
            id="product-name"
            formControlName="name"
            maxlength="120"
            class="field"
          /><label class="label mt-4" for="product-description">Descripción</label
          ><textarea
            id="product-description"
            formControlName="description"
            rows="3"
            maxlength="1500"
            class="field"
          ></textarea>
          <div class="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label class="label" for="product-price">Precio (S/)</label
              ><input
                id="product-price"
                type="number"
                formControlName="price"
                min="0.01"
                max="9999999999.99"
                step="0.01"
                class="field"
              />
            </div>
            <div>
              <label class="label" for="product-stock">Stock</label
              ><input
                id="product-stock"
                type="number"
                formControlName="stock"
                min="0"
                max="1000000"
                step="1"
                class="field"
              />
            </div>
          </div>
          <label class="label mt-4" for="product-category">Categoría</label
          ><select id="product-category" formControlName="categoryId" class="field">
            <option [ngValue]="0">Seleccionar categoría</option>
            @for (c of categories(); track c.id) {
              <option [ngValue]="c.id">{{ c.name }}</option>
            }</select
          ><label class="label mt-4" for="product-image">Imagen URL (opcional)</label
          ><input
            id="product-image"
            formControlName="imageUrl"
            maxlength="1000"
            class="field"
            placeholder="https://…"
          />
          <p class="mt-2 text-xs text-espresso/60">
            Usa una URL HTTPS. Si la dejas vacía, se mostrará una imagen de referencia.
          </p>
          <label class="mt-5 flex items-center gap-3 text-sm"
            ><input type="checkbox" formControlName="active" class="h-4 w-4 accent-coffee" />Visible
            en el catálogo</label
          >
        </fieldset>
        @if (form.touched && form.invalid) {
          <p role="alert" class="notice mt-4">
            Revisa los campos: nombre, descripción y categoría son obligatorios; precio positivo con
            hasta dos decimales, stock entero no negativo e imagen HTTPS.
          </p>
        }
        @if (formError()) {
          <div role="alert" class="notice mt-4">
            {{ formError() }}
            @for (field of serverFields(); track field) {
              <p class="mt-1 text-xs">{{ field }}</p>
            }
          </div>
        }
        <div class="mt-6 flex justify-end gap-3">
          <button type="button" class="btn-outline" (click)="close()" [disabled]="saving()">
            Cancelar</button
          ><button class="btn" [disabled]="saving()">
            {{ saving() ? 'Guardando…' : 'Guardar producto' }}
          </button>
        </div>
      </form>
    </dialog>
  `,
})
export class AdminProducts {
  api = inject(ApiService);
  fb = inject(NonNullableFormBuilder);
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  error = signal('');
  message = signal('');
  page = signal(0);
  pages = signal(1);
  actionId = signal<number | null>(null);
  editingId = signal<number | undefined>(undefined);
  saving = signal(false);
  formError = signal('');
  serverFields = signal<string[]>([]);
  dialog = viewChild<ElementRef<HTMLDialogElement>>('editor');
  form = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1500)]],
    price: [
      0,
      [
        Validators.required,
        Validators.min(0.01),
        Validators.max(9999999999.99),
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
      ],
    ],
    stock: [
      0,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(1000000),
        Validators.pattern(/^\d+$/),
      ],
    ],
    categoryId: [0, [Validators.required, Validators.min(1)]],
    imageUrl: [
      '',
      [
        Validators.maxLength(1000),
        Validators.pattern(/^(https:\/\/[^\s]+|\/images\/[a-zA-Z0-9._-]+|)$/),
      ],
    ],
    active: [true],
  });
  constructor() {
    this.load();
    this.api
      .categories()
      .subscribe({
        next: (c) => this.categories.set(c),
        error: (e) => this.error.set(errorMessage(e)),
      });
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.api.adminProducts(this.page()).subscribe({
      next: (r) => {
        this.products.set(r.content);
        this.pages.set(r.totalPages);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }
  go(d: number) {
    this.page.update((p) => p + d);
    this.load();
  }
  edit(p?: Product) {
    this.editingId.set(p?.id);
    this.formError.set('');
    this.serverFields.set([]);
    this.form.reset(
      p
        ? {
            name: p.name,
            description: p.description,
            price: p.price,
            stock: p.stock,
            categoryId: p.category.id,
            imageUrl: p.imageUrl || '',
            active: p.active,
          }
        : {
            name: '',
            description: '',
            price: 0,
            stock: 0,
            categoryId: 0,
            imageUrl: '',
            active: true,
          },
    );
    this.dialog()?.nativeElement.showModal();
  }
  close() {
    if (!this.saving()) this.dialog()?.nativeElement.close();
  }
  cancel(e: Event) {
    if (this.saving()) e.preventDefault();
  }
  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.formError.set('');
    this.serverFields.set([]);
    const v = this.form.getRawValue();
    this.api
      .saveProduct(
        {
          ...v,
          name: v.name.trim(),
          description: v.description.trim(),
          imageUrl: v.imageUrl.trim(),
        } as ProductInput,
        this.editingId(),
      )
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.close();
          this.message.set('Producto guardado. El catálogo ya está actualizado.');
          this.load();
        },
        error: (e) => {
          this.formError.set(errorMessage(e));
          this.serverFields.set(Object.values(e.error?.fields || {}));
          this.saving.set(false);
        },
      });
  }
  toggle(p: Product) {
    this.actionId.set(p.id);
    this.error.set('');
    this.api.active(p.id, !p.active).subscribe({
      next: () => {
        this.actionId.set(null);
        this.load();
      },
      error: (e) => {
        this.actionId.set(null);
        this.error.set(errorMessage(e));
      },
    });
  }
  fallback(e: Event) {
    const img = e.target as HTMLImageElement;
    img.onerror = null;
    img.src = '/images/coffee.svg';
  }
}
