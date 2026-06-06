/**
 * Format price to CNY string
 */
export const formatPrice = (price: number): string => {
  return `¥${price.toFixed(2)}`;
};

/**
 * Format date string to readable format
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * Format date for short display
 */
export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
};

/**
 * Order status mapping to Chinese
 */
export const orderStatusMap: Record<string, string> = {
  pending_payment: '待付款',
  pending: '待发货',
  shipped: '已发货',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消',
  refunding: '退款中',
  refunded: '已退款',
};

/**
 * Get order status color class
 */
export const getOrderStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending_payment: 'text-amber-600',
    pending: 'text-[#5F6B7A]',
    shipped: 'text-blue-500',
    delivered: 'text-green-500',
    completed: 'text-green-600',
    cancelled: 'text-gray-400',
    refunding: 'text-red-400',
    refunded: 'text-gray-400',
  };
  return colorMap[status] || 'text-gray-500';
};

/**
 * Get order status badge background
 */
export const getOrderStatusBg = (status: string): string => {
  const bgMap: Record<string, string> = {
    pending_payment: 'bg-amber-50 border-amber-200',
    pending: 'bg-gray-50 border-gray-200',
    shipped: 'bg-blue-50 border-blue-200',
    delivered: 'bg-green-50 border-green-200',
    completed: 'bg-green-50 border-green-200',
    cancelled: 'bg-gray-50 border-gray-200',
    refunding: 'bg-red-50 border-red-200',
    refunded: 'bg-gray-50 border-gray-200',
  };
  return bgMap[status] || 'bg-gray-50 border-gray-200';
};
