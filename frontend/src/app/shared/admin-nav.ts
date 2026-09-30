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
      <button class="text-xs text-coffee underline" (click)="logout()" [disabled]="busy()">
        {{ busy() ? 'Cerrando sesión…' : 'Cerrar sesión · ' + auth.username() }}
      </button>
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
