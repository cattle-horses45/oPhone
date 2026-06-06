import client from './client';
import type { Product, Category, Banner, ProductQuery, PaginatedResponse } from '../types/product';
import type { Order, OrderQuery } from '../types/order';
import type { User } from '../types/user';

// --- Products ---
export const adminGetProducts = async (params?: ProductQuery): Promise<PaginatedResponse<Product>> => {
  const res = await client.get('/api/v1/admin/products', { params });
  return res.data;
};

export const adminGetProduct = async (id: number): Promise<Product> => {
  const res = await client.get(`/api/v1/admin/products/${id}`);
  return res.data;
};

export const adminCreateProduct = async (data: FormData): Promise<Product> => {
  const res = await client.post('/api/v1/admin/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const adminUpdateProduct = async (id: number, data: FormData): Promise<Product> => {
  const res = await client.put(`/api/v1/admin/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const adminDeleteProduct = async (id: number): Promise<void> => {
  await client.delete(`/api/v1/admin/products/${id}`);
};

// --- Orders ---
export const adminGetOrders = async (params?: OrderQuery): Promise<PaginatedResponse<Order>> => {
  const res = await client.get('/api/v1/admin/orders', { params });
  return res.data;
};

export const adminGetOrder = async (id: number): Promise<Order> => {
  const res = await client.get(`/api/v1/admin/orders/${id}`);
  return res.data;
};

export const adminUpdateOrderStatus = async (id: number, status: string): Promise<Order> => {
  const res = await client.put(`/api/v1/admin/orders/${id}/status`, { status });
  return res.data;
};

// --- Users ---
export const adminGetUsers = async (params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<User>> => {
  const res = await client.get('/api/v1/admin/users', { params });
  return res.data;
};

export const adminToggleUserActive = async (id: number): Promise<User> => {
  const res = await client.patch(`/api/v1/admin/users/${id}/toggle-active`);
  return res.data;
};

// --- Categories ---
export const adminGetCategories = async (): Promise<Category[]> => {
  const res = await client.get('/api/v1/admin/categories');
  return res.data;
};

export const adminCreateCategory = async (data: Partial<Category>): Promise<Category> => {
  const res = await client.post('/api/v1/admin/categories', data);
  return res.data;
};

export const adminUpdateCategory = async (id: number, data: Partial<Category>): Promise<Category> => {
  const res = await client.put(`/api/v1/admin/categories/${id}`, data);
  return res.data;
};

export const adminDeleteCategory = async (id: number): Promise<void> => {
  await client.delete(`/api/v1/admin/categories/${id}`);
};

// --- Banners ---
export const adminGetBanners = async (): Promise<Banner[]> => {
  const res = await client.get('/api/v1/admin/banners');
  return res.data;
};

export const adminCreateBanner = async (data: FormData): Promise<Banner> => {
  const res = await client.post('/api/v1/admin/banners', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const adminUpdateBanner = async (id: number, data: FormData): Promise<Banner> => {
  const res = await client.put(`/api/v1/admin/banners/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const adminDeleteBanner = async (id: number): Promise<void> => {
  await client.delete(`/api/v1/admin/banners/${id}`);
};

// --- Knowledge ---
export const adminGetKnowledge = async (params?: { search?: string; page?: number; page_size?: number }) => {
  const res = await client.get('/api/v1/admin/knowledge', { params });
  return res.data;
};

export const adminDeleteKnowledge = async (id: number): Promise<void> => {
  await client.delete(`/api/v1/admin/knowledge/${id}`);
};

// --- Chat Queue ---
export const adminGetChatQueue = async () => {
  const res = await client.get('/api/v1/admin/chat/queue');
  return res.data;
};

export const adminAcceptChatSession = async (sessionId: number) => {
  const res = await client.post(`/api/v1/admin/chat/sessions/${sessionId}/accept`);
  return res.data;
};

// --- Banner actions ---
export const adminToggleProduct = async (id: number) => {
  const res = await client.put(`/api/v1/admin/products/${id}/toggle`);
  return res.data;
};

// Namespace export for backward compatibility
export const adminApi = {
  getDashboard: () => client.get('/api/v1/admin/dashboard').then(r => r.data),
  getProducts: (params?: any) => client.get('/api/v1/admin/products', { params }).then(r => r.data),
  toggleProduct: (id: number) => client.put(`/api/v1/admin/products/${id}/toggle`).then(r => r.data),
  deleteProduct: (id: number) => client.delete(`/api/v1/admin/products/${id}`).then(r => r.data),
  getOrders: (params?: any) => client.get('/api/v1/admin/orders', { params }).then(r => r.data),
  getUsers: (params?: any) => client.get('/api/v1/admin/users', { params }).then(r => r.data),
  toggleUserActive: (id: number) => client.put(`/api/v1/admin/users/${id}/toggle-active`).then(r => r.data),
  getCategories: () => client.get('/api/v1/admin/categories').then(r => r.data),
  deleteCategory: (id: number) => client.delete(`/api/v1/admin/categories/${id}`).then(r => r.data),
  getBanners: () => client.get('/api/v1/admin/banners').then(r => r.data),
  deleteBanner: (id: number) => client.delete(`/api/v1/admin/banners/${id}`).then(r => r.data),
  getKnowledge: (params?: any) => client.get('/api/v1/admin/knowledge', { params }).then(r => r.data),
  deleteKnowledge: (id: number) => client.delete(`/api/v1/admin/knowledge/${id}`).then(r => r.data),
  getChatQueue: () => client.get('/api/v1/admin/chat/queue').then(r => r.data),
  acceptChatSession: (id: number) => client.post(`/api/v1/admin/chat/sessions/${id}/accept`).then(r => r.data),
  createProduct: (params: URLSearchParams) => client.post(`/api/v1/admin/products?${params.toString()}`).then(r => r.data),
  createSku: (productId: number, params: URLSearchParams) => client.post(`/api/v1/admin/products/${productId}/skus?${params.toString()}`).then(r => r.data),
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return client.post('/api/v1/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  addProductImage: (productId: number, imageUrl: string, sortOrder: number) =>
    client.post(`/api/v1/admin/products/${productId}/images?image_url=${encodeURIComponent(imageUrl)}&sort_order=${sortOrder}`).then(r => r.data),
  deleteProductImage: (imageId: number) => client.delete(`/api/v1/admin/products/images/${imageId}`).then(r => r.data),
};

// --- Dashboard ---
export const adminGetDashboard = async (): Promise<{
  total_orders: number;
  total_revenue: number;
  total_users: number;
  total_products: number;
  recent_orders: Order[];
}> => {
  const res = await client.get('/api/v1/admin/dashboard');
  return res.data;
};
