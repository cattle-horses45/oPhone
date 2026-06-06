export type OrderStatus =
  | 'pending_payment'
  | 'pending'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunding'
  | 'refunded';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  sku_id?: number;
  product_name: string;
  product_image: string;
  sku_spec?: Record<string, string>;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_no: string;
  user_id: number;
  status: OrderStatus;
  total_amount: number;
  items: OrderItem[];
  address?: OrderAddress;
  remark?: string;
  paid_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderAddress {
  receiver_name: string;
  receiver_phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
}

export interface OrderQuery {
  page?: number;
  page_size?: number;
  status?: OrderStatus;
}
