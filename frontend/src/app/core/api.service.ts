import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category, Product, Page, Order, OrderInput, ProductInput, OrderStatus } from './models';
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  categories() {
    return this.http.get<Category[]>('/api/categorias');
  }
  products(category?: number, page = 0) {
    return this.http.get<Page<Product>>('/api/productos', {
      params: { page, size: 12, ...(category ? { categoria: category } : {}) },
    });
  }
  product(id: number) {
    return this.http.get<Product>('/api/productos/' + id);
  }
  createOrder(input: OrderInput, key: string) {
    return this.http.post<Order>('/api/pedidos', input, { headers: { 'Idempotency-Key': key } });
  }
  adminProducts(page = 0) {
    return this.http.get<Page<Product>>('/api/admin/productos', { params: { page, size: 20 } });
  }
  saveProduct(input: ProductInput, id?: number) {
    return id
      ? this.http.put<Product>('/api/admin/productos/' + id, input)
      : this.http.post<Product>('/api/admin/productos', input);
  }
  active(id: number, active: boolean) {
    return this.http.patch<Product>(`/api/admin/productos/${id}/activo`, { active });
  }
  orders(status?: OrderStatus, page = 0) {
    return this.http.get<Page<Order>>('/api/admin/pedidos', {
      params: { page, size: 20, ...(status ? { estado: status } : {}) },
    });
  }
  changeStatus(id: number, status: OrderStatus) {
    return this.http.patch<Order>(`/api/admin/pedidos/${id}/estado`, { status });
  }
  csrf() {
    return this.http.get<{ token: string }>('/api/auth/csrf');
  }
}
