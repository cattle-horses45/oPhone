import { create } from 'zustand';
import type { CartItem } from '../api/cart';
import * as cartApi from '../api/cart';

interface CartState {
  items: CartItem[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;

  fetchCart: () => Promise<void>;
  addItem: (productId: number, skuId?: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, _get) => ({
  items: [],
  totalCount: 0,
  isLoading: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await cartApi.getCart();
      set({
        items: res.items,
        totalCount: res.total_count || res.items.length,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取购物车失败';
      set({ error: message, isLoading: false });
    }
  },

  addItem: async (productId, skuId, quantity = 1) => {
    set({ isLoading: true, error: null });
    try {
      await cartApi.addToCart({ product_id: productId, sku_id: skuId, quantity });
      // Refresh cart
      const res = await cartApi.getCart();
      set({
        items: res.items,
        totalCount: res.total_count || res.items.length,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '添加购物车失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateItem: async (itemId, quantity) => {
    set({ error: null });
    try {
      await cartApi.updateCartItem(itemId, quantity);
      const res = await cartApi.getCart();
      set({
        items: res.items,
        totalCount: res.total_count || res.items.length,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '更新购物车失败';
      set({ error: message });
    }
  },

  removeItem: async (itemId) => {
    set({ error: null });
    try {
      await cartApi.removeCartItem(itemId);
      const res = await cartApi.getCart();
      set({
        items: res.items,
        totalCount: res.total_count || res.items.length,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '删除购物车项失败';
      set({ error: message });
    }
  },

  clearCart: () => {
    set({ items: [], totalCount: 0, error: null });
  },
}));
