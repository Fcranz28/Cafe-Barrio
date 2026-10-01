export interface Category {
  id: number;
  name: string;
}
export interface Product {
  id: number;
  publicId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  active: boolean;
  category: Category;
}
export type OrderStatus = 'PENDIENTE' | 'EN_PREPARACION' | 'ENTREGADO';
export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
export interface Order {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  createdAt: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
}
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface OrderInput {
  customerName: string;
  phone: string;
  address: string;
  items: { productId: number; quantity: number }[];
}
export interface ProductInput {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  categoryId: number;
  active: boolean;
}
export function errorMessage(error: unknown): string {
  const e = error as {
    status?: number;
    error?: { message?: string; fields?: Record<string, string> };
  };
  if (e.status === 0)
    return 'No pudimos conectar con la tienda. Comprueba que el backend esté iniciado.';
  return e.error?.message || 'No pudimos completar la solicitud. Inténtalo nuevamente.';
}
export const statusLabel = (s: OrderStatus) =>
  ({ PENDIENTE: 'Pendiente', EN_PREPARACION: 'En preparación', ENTREGADO: 'Entregado' })[s];
