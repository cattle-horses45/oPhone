/** Base URL for backend API — empty = same origin */
export const API_BASE_URL = '';

/** Brand configuration */
export const BRAND = {
  name: 'oPhone',
  fullName: 'oPhone Store',
  description: 'oPhone 官方商城 - 探索科技之美',
  supportPhone: '400-888-8888',
  supportEmail: 'support@ophone.com',
  colorPrimary: '#3D6A94',
  colorGold: '#3D6A94',
};

/** Local storage keys */
export const STORAGE_KEYS = {
  TOKEN: 'ophone_token',
  USER: 'ophone_user',
} as const;

/** Sort options for product listing */
export const SORT_OPTIONS = [
  { value: 'default', label: '综合' },
  { value: 'sales', label: '销量' },
  { value: 'price_asc', label: '价格从低到高' },
  { value: 'price_desc', label: '价格从高到低' },
] as const;
