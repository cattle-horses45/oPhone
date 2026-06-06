import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../../api/products';
import ProductCard from '../../components/ProductCard';
import ParticleBackground from '../../components/ParticleBackground';

const SORT_OPTIONS = [
  { value: '', label: '综合' },
  { value: 'price_asc', label: '价格↑' },
  { value: 'price_desc', label: '价格↓' },
  { value: 'sales', label: '销量' },
];

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const page = Number(searchParams.get('page') || '1');
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const search = searchParams.get('search') || '';

  useEffect(() => { getCategories().then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    getProducts({ page, page_size: 12, category_id: category ? Number(category) : undefined, sort_by: sort || undefined, search: search || undefined } as any)
      .then(res => { setProducts(res.items || []); setTotal(res.total || 0); setTotalPages(res.total_pages || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, category, sort, search]);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  const accentColor = '#3D6A94';

  return (
    <div className="relative min-h-screen">
      <ParticleBackground />
      <div className="page-content max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden md:block w-52 flex-shrink-0">
            <div className="glass-card p-5" style={{ borderRadius: 16 }}>
              <h4 className="text-sm tracking-wider text-gold-glow font-semibold mb-4">商品分类</h4>
              <div className="space-y-1">
                <button onClick={() => updateParams('category', '')}
                  className={`block w-full text-left px-3 py-2.5 rounded-xl text-sm tracking-wider transition-all ${
                    !category ? 'text-[#3D6A94]' : 'text-gray-400 hover:text-gray-600'}`}
                  style={!category ? { background: 'rgba(61,106,148,0.06)' } : {}}>
                  全部分类
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => updateParams('category', String(cat.id))}
                    className={`block w-full text-left px-3 py-2.5 rounded-xl text-sm tracking-wider transition-all ${
                      String(cat.id) === category ? 'text-[#3D6A94]' : 'text-gray-400 hover:text-gray-600'}`}
                    style={String(cat.id) === category ? { background: 'rgba(61,106,148,0.06)' } : {}}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1">
            {/* Sort + Count */}
            <div className="flex items-center justify-between mb-6 glass-card px-5 py-3" style={{ borderRadius: 14 }}>
              <div className="flex gap-6">
                {SORT_OPTIONS.map(s => (
                  <button key={s.value} onClick={() => updateParams('sort', s.value)}
                    className={`text-sm tracking-wider transition-colors ${sort === s.value ? 'text-[#3D6A94] font-medium' : 'text-gray-400 hover:text-gray-600'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-400">共 {total} 件</span>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex justify-center py-24">
                <div className="w-8 h-8 border-2 border-[#3D6A94] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center gap-3 mt-10">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => updateParams('page', String(p))}
                        className="w-10 h-10 rounded-xl text-sm tracking-wider transition-all"
                        style={p === page
                          ? { background: `linear-gradient(135deg, #2F5579, ${accentColor})`, color: '#FFFFFF', fontWeight: 600 }
                          : { background: '#FFFFFF', color: '#5F6B7A', border: '1px solid rgba(0,0,0,0.06)' }}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-24">
                <p className="text-5xl mb-4 opacity-30">🔍</p>
                <p className="text-gray-400 tracking-wider">暂无商品</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
