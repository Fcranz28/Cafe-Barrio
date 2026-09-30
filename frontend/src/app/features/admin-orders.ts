import { Component, inject, signal, viewChild, ElementRef } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../core/api.service';
import { Order, OrderStatus, errorMessage, statusLabel } from '../core/models';
import { AdminNav } from '../shared/admin-nav';
import { Subject, switchMap, catchError, of, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({
  imports: [AdminNav, CurrencyPipe, DatePipe],
  template: `
    <section class="container-page py-10">
      <app-admin-nav />
      <p class="eyebrow">Administración</p>
      <h1 class="section-title mt-3">Pedidos del barrio.</h1>
      <div class="mt-6 flex flex-wrap gap-2">
        <button
          class="btn-outline"
          [attr.aria-pressed]="!filter()"
          [class.!bg-coffee]="!filter()"
          [class.!text-white]="!filter()"
          (click)="select()"
        >
          Todos
        </button>
        @for (s of statuses; track s) {
          <button
            class="btn-outline"
            [attr.aria-pressed]="filter() === s"
            [class.!bg-coffee]="filter() === s"
            [class.!text-white]="filter() === s"
            (click)="select(s)"
          >
            {{ label(s) }}
          </button>
        }
      </div>
      @if (error()) {
        <p role="alert" class="notice mt-5">
          {{ error() }} <button class="underline" (click)="load()">Reintentar</button>
        </p>
      }
      @if (loading()) {
        <p role="status" class="py-10">Cargando pedidos…</p>
      } @else {
        <div class="panel mt-8 overflow-x-auto">
          <table class="w-full min-w-[680px] text-left text-sm">
            <caption class="sr-only">
              Pedidos recibidos
            </caption>
            <thead
              class="border-b border-line bg-cream text-xs uppercase tracking-wider text-coffee"
            >
              <tr>
                <th class="p-4">Pedido</th>
                <th class="p-4">Cliente</th>
                <th class="p-4">Fecha</th>
                <th class="p-4">Total</th>
                <th class="p-4">Estado</th>
                <th class="p-4">Detalle</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              @for (o of orders(); track o.id) {
                <tr>
                  <td class="p-4 font-semibold">#{{ o.id }}</td>
                  <td class="p-4">{{ o.customerName }}</td>
                  <td class="p-4">{{ o.createdAt | date: 'dd/MM/yyyy HH:mm' : '-0500' }}</td>
                  <td class="whitespace-nowrap p-4">{{ o.total | currency: 'PEN' : 'S/ ' }}</td>
                  <td class="p-4">
                    <span class="rounded-full bg-cream px-3 py-1 text-xs">{{
                      label(o.status)
                    }}</span>
                  </td>
                  <td class="p-4">
                    <button class="text-coffee underline" (click)="open(o)">Ver pedido ↗</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="p-10 text-center">No hay pedidos en este estado.</td>
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
      #details
      (cancel)="cancel($event)"
      aria-labelledby="order-title"
      class="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-line bg-paper p-6 text-espresso shadow-xl backdrop:bg-espresso/50 sm:p-8"
    >
      @if (selected(); as o) {
        <div class="flex justify-between gap-4">
          <div>
            <p class="eyebrow">{{ label(o.status) }}</p>
            <h2 id="order-title" class="mt-2 text-3xl">Pedido #{{ o.id }}</h2>
          </div>
          <button
            autofocus
            class="h-10 w-10 text-2xl"
            aria-label="Cerrar detalle"
            [disabled]="busy()"
            (click)="close()"
          >
            ×
          </button>
        </div>
        <dl class="mt-6 grid gap-4 rounded-xl bg-cream p-5 text-sm">
          <div>
            <dt class="text-xs text-coffee">Cliente</dt>
            <dd class="mt-1">{{ o.customerName }}</dd>
          </div>
          <div>
            <dt class="text-xs text-coffee">Celular</dt>
            <dd class="mt-1">{{ o.phone }}</dd>
          </div>
          <div>
            <dt class="text-xs text-coffee">Dirección</dt>
            <dd class="mt-1 whitespace-pre-line">{{ o.address }}</dd>
          </div>
        </dl>
        <div class="mt-6 space-y-4">
          @for (i of o.items; track i.productId) {
            <div class="flex justify-between gap-4 text-sm">
              <div>
                <p>{{ i.quantity }} × {{ i.productName }}</p>
                <p class="mt-1 text-xs text-espresso/60">
                  {{ i.unitPrice | currency: 'PEN' : 'S/ ' }} por unidad
                </p>
              </div>
              <span class="whitespace-nowrap">{{ i.subtotal | currency: 'PEN' : 'S/ ' }}</span>
            </div>
          }
        </div>
        <div class="mt-6 flex justify-between border-t border-line pt-5 font-semibold">
          <span>Total</span><span>{{ o.total | currency: 'PEN' : 'S/ ' }}</span>
        </div>
        @if (detailError()) {
          <p role="alert" class="notice mt-4">{{ detailError() }}</p>
        }
        @if (nextStatus(o.status); as next) {
          <button class="btn mt-6 w-full" [disabled]="busy()" (click)="advance(o, next)">
            {{ busy() ? 'Actualizando…' : 'Cambiar a ' + label(next) }}
          </button>
        } @else {
          <p class="mt-6 text-center text-sm text-coffee">Este pedido ya fue entregado.</p>
        }
      }
    </dialog>
  `,
})
export class AdminOrders {
  api = inject(ApiService);
  orders = signal<Order[]>([]);
  loading = signal(true);
  error = signal('');
  filter = signal<OrderStatus | undefined>(undefined);
  page = signal(0);
  pages = signal(1);
  selected = signal<Order | null>(null);
  detailError = signal('');
  busy = signal(false);
  dialog = viewChild<ElementRef<HTMLDialogElement>>('details');
  statuses: OrderStatus[] = ['PENDIENTE', 'EN_PREPARACION', 'ENTREGADO'];
  label = statusLabel;
  private requests = new Subject<void>();
  constructor() {
    this.requests
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set('');
        }),
        switchMap(() =>
          this.api.orders(this.filter(), this.page()).pipe(
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
          this.orders.set(r.content);
          this.pages.set(r.totalPages);
        }
        this.loading.set(false);
      });
    this.load();
  }
  load() {
    this.requests.next();
  }
  select(s?: OrderStatus) {
    this.filter.set(s);
    this.page.set(0);
    this.load();
  }
  go(d: number) {
    this.page.update((p) => p + d);
    this.load();
  }
  open(o: Order) {
    this.selected.set(o);
    this.detailError.set('');
    this.dialog()?.nativeElement.showModal();
  }
  close() {
    if (!this.busy()) this.dialog()?.nativeElement.close();
  }
  cancel(e: Event) {
    if (this.busy()) e.preventDefault();
  }
  nextStatus(s: OrderStatus): OrderStatus | undefined {
    return s === 'PENDIENTE' ? 'EN_PREPARACION' : s === 'EN_PREPARACION' ? 'ENTREGADO' : undefined;
  }
  advance(o: Order, next: OrderStatus) {
    this.busy.set(true);
    this.detailError.set('');
    this.api.changeStatus(o.id, next).subscribe({
      next: (r) => {
        this.selected.set(r);
        this.busy.set(false);
        this.load();
      },
      error: (e) => {
        this.detailError.set(errorMessage(e));
        this.busy.set(false);
      },
    });
  }
}
