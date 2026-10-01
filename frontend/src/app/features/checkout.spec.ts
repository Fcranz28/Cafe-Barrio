import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Checkout } from './checkout';
import { CartService } from '../core/cart.service';
import { Order } from '../core/models';

describe('Checkout', () => {
  beforeAll(() => {
    // jsdom does not implement the native dialog API; browsers do.
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
      },
    });
  });
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });
  it('conserva carrito y clave al reintentar; solo confirma después del éxito', () => {
    const fixture = TestBed.createComponent(Checkout);
    const checkout = fixture.componentInstance;
    const cart = TestBed.inject(CartService);
    const http = TestBed.inject(HttpTestingController);
    cart.add({
      id: 1,
      publicId: '55883e0d-23fb-4a3e-8c96-73c2dbfcd6d7',
      name: 'Café',
      description: 'Origen',
      price: 28,
      stock: 3,
      active: true,
      imageUrl: '',
      category: { id: 1, name: 'Café' },
    });
    checkout.form.setValue({ customerName: 'Ana', phone: '987654321', address: 'Calle 123' });
    checkout.submit();
    http.expectOne('/api/auth/csrf').flush({ token: 'token' });
    const first = http.expectOne('/api/pedidos');
    const key = first.request.headers.get('Idempotency-Key');
    expect(first.request.body).toEqual({
      customerName: 'Ana',
      phone: '987654321',
      address: 'Calle 123',
      items: [{ productId: 1, quantity: 1 }],
    });
    expect(first.request.body.total).toBeUndefined();
    expect(checkout.confirmed()).toBeNull();
    first.flush({ message: 'Stock insuficiente' }, { status: 409, statusText: 'Conflict' });
    expect(cart.count()).toBe(1);
    expect(checkout.error()).toBe('Stock insuficiente');
    checkout.submit();
    http.expectOne('/api/auth/csrf').flush({ token: 'token' });
    const retry = http.expectOne('/api/pedidos');
    expect(retry.request.headers.get('Idempotency-Key')).toBe(key);
    const order: Order = {
      id: 125,
      customerName: 'Ana',
      phone: '987654321',
      address: 'Calle 123',
      createdAt: '2026-09-30T12:00:00Z',
      status: 'PENDIENTE',
      total: 28,
      items: [],
    };
    retry.flush(order);
    expect(checkout.confirmed()?.id).toBe(125);
    expect(cart.count()).toBe(0);
    http.verify();
  });
  it('no envía pedidos con datos incompletos', () => {
    const checkout = TestBed.createComponent(Checkout).componentInstance;
    checkout.submit();
    TestBed.inject(HttpTestingController).expectNone('/api/pedidos');
    expect(checkout.confirmed()).toBeNull();
  });
});
