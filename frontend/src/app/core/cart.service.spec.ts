import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { MEDIA } from './media';
import { Product } from './models';

const product: Product = {
  id: 1,
  publicId: '55883e0d-23fb-4a3e-8c96-73c2dbfcd6d7',
  name: 'Café',
  description: 'Origen peruano',
  price: 28.1,
  stock: 3,
  imageUrl: '/images/coffee.svg',
  active: true,
  category: { id: 1, name: 'Café' },
};
describe('Carrito', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });
  it('calcula el total y limita la cantidad al stock visible', () => {
    const cart = TestBed.inject(CartService);
    cart.add(product, 2);
    cart.add(product, 2);
    expect(cart.count()).toBe(2);
    expect(cart.total()).toBe(56.2);
    cart.quantity(1, 10);
    expect(cart.count()).toBe(3);
    expect(cart.total()).toBe(84.3);
    cart.remove(1);
    expect(cart.total()).toBe(0);
  });
  it('ignora productos inactivos y agotados', () => {
    const cart = TestBed.inject(CartService);
    cart.add({ ...product, stock: 0 });
    cart.add({ ...product, active: false });
    expect(cart.count()).toBe(0);
  });
  it('recupera un carrito válido y descarta contenido corrupto', () => {
    localStorage.setItem(
      'cafe-barrio-cart-v1',
      JSON.stringify([
        { product, quantity: 2 },
        { product, quantity: 2 },
        { product: { ...product, id: 2, price: -1 }, quantity: 1 },
      ]),
    );
    const cart = TestBed.inject(CartService);
    expect(cart.items()).toHaveLength(1);
    expect(cart.items()[0].product.imageUrl).toBe(MEDIA.legacyUrls['/images/coffee.svg']);
    expect(cart.count()).toBe(2);
  });
  it('tolera JSON inválido', () => {
    localStorage.setItem('cafe-barrio-cart-v1', 'no es json');
    expect(TestBed.inject(CartService).items()).toEqual([]);
  });
});
