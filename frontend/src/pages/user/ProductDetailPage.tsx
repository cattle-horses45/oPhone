import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductDetail } from '../../api/products';
import { addToCart } from '../../api/cart';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import ParticleBackground from '../../components/ParticleBackground';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { fetchCart } = useCartStore();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSku, setSelectedSku] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProductDetail(Number(id)).then(data => {
      setProduct(data);
      if (data.skus?.length > 0) setSelectedSku(data.skus[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!selectedSku) return;
    setAdding(true);
    try { await addToCart({ product_id: product.id, sku_id: selectedSku.id, quantity }); await fetchCart(); alert('已添加到购物车！'); }
    catch { alert('添加失败'); }
    finally { setAdding(false); }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!selectedSku) return;
    await addToCart({ product_id: product.id, sku_id: selectedSku.id, quantity });
    await fetchCart();
    navigate('/checkout');
  };

  if (loading) {
    return <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-[#3D6A94] border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!product) return <div className="text-center py-32 text-gray-400">商品不存在</div>;

  return (
    <div className="relative min-h-screen">
      <ParticleBackground />
      <div className="page-content max-w-7xl mx-auto px-6 py-8">
        <div className="glass-card p-6 md:p-10" style={{ borderRadius: 20 }}>
          <div className="grid md:grid-cols-2 gap-10">
            {/* Image */}
            <div className="aspect-square rounded-2xl flex items-center justify-center text-8xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #EEF1F5, #F7F9FB)' }}>
              {product.images?.[0]?.image_url ? (
                <img src={product.images[0].image_url} alt={product.name}
                  className="w-3/4 h-3/4 object-contain" />
              ) : product.cover_image ? (
                <img src={product.cover_image} alt={product.name}
                  className="w-3/4 h-3/4 object-contain" />
              ) : (
                '📱'
              )}
            </div>

            {/* Info */}
            <div>
              <h1 className="text-2xl font-semibold tracking-wider text-gray-800 mb-2">{product.name}</h1>
              <p className="text-sm text-gray-400 mb-6 tracking-wider">{product.brand} · 已售 {product.sales_count || 0}</p>

              <div className="mb-8">
                <span className="text-3xl font-bold text-gold-glow">¥{selectedSku?.price || product.min_price}</span>
              </div>

              {/* SKU */}
              {product.skus?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs text-gray-400 tracking-wider mb-3">规格选择</h4>
                  <div className="flex flex-wrap gap-3">
                    {product.skus.map((sku: any) => (
                      <button key={sku.id} onClick={() => { setSelectedSku(sku); setQuantity(1); }}
                        className="px-5 py-2.5 rounded-xl text-sm tracking-wider transition-all duration-300"
                        style={selectedSku?.id === sku.id
                          ? { background: 'rgba(61,106,148,0.06)', border: `1px solid #3D6A94`, color: '#3D6A94', boxShadow: '0 0 12px rgba(61,106,148,0.08)' }
                          : { background: '#EEF1F5', border: '1px solid rgba(0,0,0,0.06)', color: '#5F6B7A' }}>
                        {sku.sku_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-8">
                <h4 className="text-xs text-gray-400 tracking-wider mb-3">数量</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }}>
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 text-gray-400 hover:text-gray-600 text-lg">−</button>
                    <span className="w-14 text-center text-gray-700">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(selectedSku?.stock || 99, quantity + 1))} className="w-10 h-10 text-gray-400 hover:text-gray-600 text-lg">+</button>
                  </div>
                  <span className="text-xs text-gray-400">库存 {selectedSku?.stock || 0} 件</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button onClick={handleAddToCart} disabled={adding || !selectedSku || selectedSku.stock === 0}
                  className="btn-outline-gold flex-1 py-3 text-sm tracking-wider">
                  {adding ? '添加中...' : '加入购物车'}
                </button>
                <button onClick={handleBuyNow} disabled={!selectedSku || selectedSku.stock === 0}
                  className="btn-gold flex-1 py-3 text-sm tracking-wider">
                  立即购买
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-10 pt-8" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <h3 className="text-sm tracking-wider text-gold-glow font-semibold mb-4">商品详情</h3>
              <p className="text-sm text-gray-500 leading-relaxed tracking-wider whitespace-pre-wrap">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
