import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }: { product: any }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Link
      to={`/products/${product.id}`}
      className="group glass-card block overflow-hidden tap-active"
      style={{ borderRadius: 8, padding: 0, textDecoration: 'none' }}
    >
      {/* Image */}
      <div className="aspect-square flex items-center justify-center text-6xl relative overflow-hidden"
        style={{ background: imgLoaded ? 'linear-gradient(135deg, #EEF1F5, #F7F9FB)' : '#EEF1F5' }}>
        {product.cover_image ? (
          <img src={product.cover_image} alt={product.name}
            onLoad={() => setImgLoaded(true)}
            className="w-3/4 h-3/4 object-contain transition-transform duration-400 group-hover:scale-105"
            style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s ease, transform 0.4s ease' }} />
        ) : (
          <span className="transition-transform duration-400 group-hover:scale-110">📱</span>
        )}
        {/* Hover gradient reveal */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(61,106,148,0.05), transparent 70%)' }}
        />
        {product.is_featured && (
          <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full tracking-wider font-medium"
            style={{ background: 'rgba(61,106,148,0.08)', color: '#3D6A94', border: '1px solid rgba(61,106,148,0.15)' }}>
            精选
          </span>
        )}
      </div>

      <div className="p-3.5">
        <h3 className="text-sm font-medium text-[#15181B] truncate tracking-wider mb-1 group-hover:text-[#3D6A94] transition-colors duration-200">
          {product.name}
        </h3>
        <p className="text-xs text-[#8B95A5] mb-2.5">{product.brand || 'oPhone'}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold" style={{ color: '#3D6A94', fontFamily: "'Space Mono','Courier New',monospace", letterSpacing: '-0.02em' }}>
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
