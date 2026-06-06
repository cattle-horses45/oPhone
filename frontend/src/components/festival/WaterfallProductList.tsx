import { useState, useEffect, useRef, useCallback } from 'react';
import { getProducts } from '../../api/products';
import WaterfallProductCard from './WaterfallProductCard';

/** Infinite scroll waterfall — Brutalist grid */
export default function WaterfallProductList() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const totalRef = useRef(0);

  const fetchMore = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await getProducts({ page: pageNum, page_size: 20, sort: 'sales' });
      const items = data.items || [];
      totalRef.current = data.total || 0;
      if (pageNum === 1) setProducts(items);
      else setProducts((prev) => [...prev, ...items]);
      setTimeout(() => {
        setProducts((prev) => {
          setHasMore(items.length > 0 && prev.length < totalRef.current);
          return prev;
        });
      }, 0);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMore(1); }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && hasMore && !loading) {
          pageRef.current += 1;
          fetchMore(pageRef.current);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, fetchMore]);

  return (
    <div className="px-3 pb-20">
      <div className="fest-waterfall">
        {products.map((p) => (
          <WaterfallProductCard key={p.id} product={p} />
        ))}
      </div>

      <div ref={sentinelRef} className="flex justify-center py-8">
        {loading && (
          <div
            className="w-5 h-5 border-2 animate-spin"
            style={{ borderColor: 'var(--fest-vermillion)', borderTopColor: 'transparent' }}
          />
        )}
        {!hasMore && products.length > 0 && (
          <span className="text-[11px] tracking-widest" style={{ fontFamily: "'Space Mono',monospace", color: 'var(--fest-concrete)' }}>
            — FIN —
          </span>
        )}
      </div>
    </div>
  );
}
