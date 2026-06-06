import client from './client';

export interface CartItem {
  id: number;
  product_id: number;
  sku_id?: number;
  product_name: string;
  product_image: string;
  sku_spec?: Record<string, string>;
  price: number;
  quantity: number;
  stock: number;
  is_checked: boolean;
}

export interface CartResponse {
  items: CartItem[];
  total_count: number;
}

export interface AddCartRequest {
  product_id: number;
  sku_id?: number;
  quantity?: number;
}

export const getCart = async (): Promise<CartResponse> => {
  const res = await client.get('/api/v1/cart');
  return res.data;
};

export const addToCart = async (data: AddCartRequest): Promise<CartItem> => {
  const res = await client.post('/api/v1/cart/items', data);
  return res.data;
};

export const updateCartItem = async (cartItemId: number, quantity: number): Promise<CartItem> => {
  const res = await client.put(`/api/v1/cart/items/${cartItemId}`, { quantity });
  return res.data;
};

export const removeCartItem = async (cartItemId: number): Promise<void> => {
  await client.delete(`/api/v1/cart/items/${cartItemId}`);
};

export const clearCart = async (): Promise<void> => {
  await client.delete('/api/v1/cart');
};

export const checkCartItem = async (cartItemId: number, is_checked: boolean): Promise<void> => {
  await client.patch(`/api/cart/${cartItemId}/check`, { is_checked });
};
