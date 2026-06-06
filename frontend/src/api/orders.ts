import client from './client';
import type { Order, OrderQuery } from '../types/order';
import type { PaginatedResponse } from '../types/product';

export interface CreateOrderRequest {
  address_id: number;
  cart_item_ids?: number[];
  remark?: string;
}

export const createOrder = async (data: CreateOrderRequest): Promise<Order> => {
  const res = await client.post('/api/v1/orders', data);
  return res.data;
};

export const getOrders = async (params?: OrderQuery): Promise<PaginatedResponse<Order>> => {
  const res = await client.get('/api/v1/orders', { params });
  return res.data;
};

export const getOrderDetail = async (id: number): Promise<Order> => {
  const res = await client.get(`/api/v1/orders/${id}`);
  return res.data;
};

export const cancelOrder = async (id: number): Promise<Order> => {
  const res = await client.put(`/api/v1/orders/${id}/cancel`);
  return res.data;
};

export const payOrder = async (id: number): Promise<Order> => {
  const res = await client.put(`/api/v1/orders/${id}/pay`);
  return res.data;
};

export const confirmOrder = async (id: number): Promise<Order> => {
  const res = await client.put(`/api/v1/orders/${id}/confirm`);
  return res.data;
};
