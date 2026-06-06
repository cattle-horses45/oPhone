import { useNavigate } from 'react-router-dom';

interface Props {
  product: {
    id: number;
    name: string;
    min_price?: number;
    cover_image?: string;
    sales_count?: number;
  };
}

/** Waterfall card — Brutalist with accent border, editorial typography */
export default function WaterfallProductCard({ product }: Props) {
  const navigate = useNavigate();

  const tagMatch = product.name.match(/【(.+?)】/);
  const promoTag = tagMatch ? tagMatch[1] : '';
  const displayName = product.name.replace(/【.+?】/, '').trim();

  return (
    <div
      onClick={() => navigate(`/products/${product.id}`)}
      className="fest-card-brutal cursor-pointer overflow-hidden"
      style={{ borderRadius: 0 }}
    >
      {/* Image — raw, no rounded corners */}
      <div
        className="w-full flex items-center justify-center relative"
        style={{ height: 220, background: 'var(--fest-paper)' }}
      >
        {product.cover_image ? (
          <img
            src={product.cover_image}
            alt={product.name}
            className="w-3/4 h-3/4 object-contain"
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              border: '3px solid var(--fest-ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Space Mono',monospace",
              fontSize: 20,
              opacity: 0.2,
            }}
          >
            oP
          </div>
        )}

        {/* Promo tag */}
        {promoTag && (
          <span
            className="absolute top-0 left-0 text-[10px] font-bold px-2 py-0.5"
            style={{
              background: 'var(--fest-vermillion)',
              color: '#fff',
              fontFamily: "'Space Mono',monospace",
            }}
          >
            {promoTag}
          </span>
        )}
      </div>

      {/* Accent border strip */}
      <div style={{ height: 3, background: 'var(--fest-vermillion)' }} />

      {/* Title */}
      <div className="px-2.5 pt-2.5 pb-1">
        <p
          className="text-sm font-medium line-clamp-2"
          style={{ color: 'var(--fest-ink)', lineHeight: 1.35, fontSize: 13 }}
        >
          {displayName}
        </p>
      </div>

      {/* Price */}
      <div className="px-2.5 pb-2.5 flex items-baseline gap-1">
        <span className="fest-price" style={{ fontSize: 20 }}>
          ¥{product.min_price ?? '--'}
        </span>
        {(product.sales_count ?? 0) > 0 && (
          <span className="text-[10px]" style={{ color: 'var(--fest-concrete)' }}>
            · 售{product.sales_count}
          </span>
        )}
      </div>
    </div>
  );
}
