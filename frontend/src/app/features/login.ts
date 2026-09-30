import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/models';
@Component({
  imports: [ReactiveFormsModule],
  template: `<section class="container-page py-16">
    <div class="panel mx-auto max-w-md p-8">
      <p class="eyebrow">Café de Barrio · Administración</p>
      <h1 class="mt-3 text-3xl">Bienvenido de nuevo.</h1>
      <p class="mt-3 text-sm text-espresso/60">Ingresa para gestionar productos y pedidos.</p>
      <form [formGroup]="form" (ngSubmit)="submit()" class="mt-8">
        <label for="username" class="label">Usuario</label
        ><input
          id="username"
          formControlName="username"
          autocomplete="username"
          class="field"
          required
        /><label for="password" class="label mt-5">Contraseña</label
        ><input
          id="password"
          type="password"
          formControlName="password"
          autocomplete="current-password"
          class="field"
          required
        />
        @if (error()) {
          <p role="alert" class="notice mt-5">{{ error() }}</p>
        }
        <button class="btn mt-6 w-full" [disabled]="busy() || form.invalid">
          {{ busy() ? 'Ingresando…' : 'Iniciar sesión →' }}
        </button>
      </form>
    </div>
  </section>`,
})
export class Login {
  auth = inject(AuthService);
  router = inject(Router);
  fb = inject(NonNullableFormBuilder);
  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  busy = signal(false);
  error = signal('');
  submit() {
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    this.auth.login(v.username, v.password).subscribe({
      next: (ok) => {
        this.busy.set(false);
        if (ok) this.router.navigate(['/admin/productos']);
        else this.error.set('No se pudo iniciar la sesión');
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.busy.set(false);
      },
    });
  }
}
