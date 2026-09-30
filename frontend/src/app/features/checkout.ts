import { Component, inject, signal, viewChild, ElementRef } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { switchMap } from 'rxjs';
import { CartService } from '../core/cart.service';
import { ApiService } from '../core/api.service';
import { Order, errorMessage } from '../core/models';
@Component({
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './checkout.html',
})
export class Checkout {
  cart = inject(CartService);
  api = inject(ApiService);
  router = inject(Router);
  fb = inject(NonNullableFormBuilder);
  form = this.fb.group({
    customerName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^(?=(?:[^0-9]*[0-9]){7,15}[^0-9]*$)\+?[0-9][0-9 ()-]{6,19}$/)]],
    address: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(300)]],
  });
  busy = signal(false);
  error = signal('');
  confirmed = signal<Order | null>(null);
  dialog = viewChild<ElementRef<HTMLDialogElement>>('confirmation');
  private requestSignature = '';
  private key = '';
  invalid(name: 'customerName' | 'phone' | 'address') {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }
  submit() {
    if (this.busy()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.cart.items().length) return;
    const v = this.form.getRawValue();
    const payload = {
      customerName: v.customerName.trim(),
      phone: v.phone.trim(),
      address: v.address.trim(),
      items: this.cart.items().map((i) => ({ productId: i.product.id, quantity: i.quantity })),
    };
    const signature = JSON.stringify(payload);
    // Retain the request key across reloads so a network retry cannot create a second order.
    try {
      const previous = JSON.parse(sessionStorage.getItem('cafe-pending-order') || 'null');
      if (previous?.signature === signature && typeof previous.key === 'string') {
        this.key = previous.key;
        this.requestSignature = signature;
      }
    } catch {}
    if (signature !== this.requestSignature) {
      this.requestSignature = signature;
      this.key = crypto.randomUUID();
    }
    try {
      sessionStorage.setItem('cafe-pending-order', JSON.stringify({ signature, key: this.key }));
    } catch {}
    this.busy.set(true);
    this.error.set('');
    this.api
      .csrf()
      .pipe(switchMap(() => this.api.createOrder(payload, this.key)))
      .subscribe({
        next: (o) => {
          this.confirmed.set(o);
          this.cart.clear();
          this.busy.set(false);
          try {
            sessionStorage.removeItem('cafe-pending-order');
          } catch {}
          setTimeout(() => this.dialog()?.nativeElement.showModal());
        },
        error: (e) => {
          this.error.set(errorMessage(e));
          const fields = e.error?.fields || {};
          for (const name of ['customerName', 'phone', 'address'] as const) {
            if (fields[name]) this.form.controls[name].setErrors({ server: true });
          }
          this.busy.set(false);
        },
      });
  }
  close() {
    this.dialog()?.nativeElement.close();
    this.router.navigate(['/catalogo']);
  }
}
