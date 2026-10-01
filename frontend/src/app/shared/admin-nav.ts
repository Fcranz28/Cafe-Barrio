import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/models';
@Component({
  selector: 'app-admin-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `<div
      class="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5"
    >
      <nav aria-label="Administración" class="flex gap-2">
        <a
          routerLink="/admin/productos"
          routerLinkActive="!bg-coffee !text-white"
          class="btn-outline"
          >Productos</a
        ><a
          routerLink="/admin/pedidos"
          routerLinkActive="!bg-coffee !text-white"
          class="btn-outline"
          >Pedidos</a
        >
      </nav>
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-3">
          <span aria-hidden="true" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coffee text-sm font-semibold text-white">
            {{ (auth.username() || 'A').slice(0, 1).toUpperCase() }}
          </span>
          <div class="leading-tight">
            <span class="block text-sm font-semibold text-espresso">{{ auth.username() }}</span>
            <span class="mt-1 block text-xs text-muted">Administrador</span>
          </div>
        </div>
        <button type="button" class="btn-outline" (click)="logout()" [disabled]="busy()" [attr.aria-busy]="busy()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M9 5H4v14h5M9 12h12m-4-4 4 4-4 4" />
          </svg>
          {{ busy() ? 'Cerrando sesión…' : 'Cerrar sesión' }}
        </button>
      </div>
    </div>
    @if (error()) {
      <p role="alert" class="notice mb-4">{{ error() }}</p>
    }`,
})
export class AdminNav {
  auth = inject(AuthService);
  router = inject(Router);
  busy = signal(false);
  error = signal('');
  logout() {
    if (this.busy()) return;
    this.error.set('');
    this.busy.set(true);
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/admin/login']),
      error: (e) => {
        this.busy.set(false);
        this.error.set(errorMessage(e));
      },
    });
  }
}
