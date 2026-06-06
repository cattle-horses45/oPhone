export interface Category {
  id: number;
  name: string;
  icon?: string;
  image?: string;
  parent_id?: number;
  sort_order: number;
  is_active: boolean;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

export interface SKU {
  id: number;
  product_id: number;
  name: string;
  spec: Record<string, string>;
  price: number;
  stock: number;
  image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  detail?: string;
  category_id: number;
  category?: Category;
  images: string[];
  cover_image: string;
  base_price: number;
  is_featured: boolean;
  is_hot: boolean;
  is_active: boolean;
  sales_count: number;
  sort_order: number;
  skus: SKU[];
  min_price?: number;
  max_price?: number;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: number;
  title: string;
  image: string;
  link?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductQuery {
  page?: number;
  page_size?: number;
  category_id?: number;
  keyword?: string;
  sort?: 'default' | 'price_asc' | 'price_desc' | 'sales';
  is_featured?: boolean;
  is_hot?: boolean;
  min_price?: number;
  max_price?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
