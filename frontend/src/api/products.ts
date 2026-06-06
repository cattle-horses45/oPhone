import client from './client';
import type { Product, Banner, Category, ProductQuery, PaginatedResponse } from '../types/product';

export const getProducts = async (params?: ProductQuery): Promise<PaginatedResponse<Product>> => {
  const res = await client.get('/api/v1/products', { params });
  return res.data;
};

export const getProductDetail = async (id: number): Promise<Product> => {
  const res = await client.get(`/api/v1/products/${id}`);
  return res.data;
};

export const getFeaturedProducts = async (): Promise<Product[]> => {
  const res = await client.get('/api/v1/products/featured');
  return res.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const res = await client.get('/api/v1/categories');
  return res.data;
};

export const getBanners = async (): Promise<Banner[]> => {
  const res = await client.get('/api/v1/banners');
  return res.data;
};
