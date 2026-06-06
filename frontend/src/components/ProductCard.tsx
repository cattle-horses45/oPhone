import { Link } from 'react-router-dom';

export default function ProductCard({ product }: { product: any }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group glass-card block overflow-hidden"
      style={{ borderRadius: 8, padding: 0 }}
    >
      {/* Image */}
      <div className="aspect-square flex items-center justify-center text-6xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #EEF1F5, #F7F9FB)' }}>
        {product.cover_image ? (
          <img src={product.cover_image} alt={product.name}
            className="w-3/4 h-3/4 object-contain transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <span className="transition-transform duration-500 group-hover:scale-105">📱</span>
        )}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(61,106,148,0.05), transparent 70%)' }} />
        {product.is_featured && (
          <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full tracking-wider font-medium"
            style={{ background: 'rgba(61,106,148,0.08)', color: '#3D6A94', border: '1px solid rgba(61,106,148,0.15)' }}>
            精选
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-sm font-medium text-[#5F6B7A] truncate tracking-wider mb-1 group-hover:text-[#3D6A94] transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-[#8B95A5] mb-3">{product.brand || 'oPhone'}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gold-glow">
            ¥{product.min_price || '--'}
          </span>
          {product.sales_count > 0 && (
            <span className="text-xs text-[#8B95A5]">已售 {product.sales_count}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
