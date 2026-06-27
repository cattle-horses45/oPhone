import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductDetail } from '../../api/products';
import { addToCart } from '../../api/cart';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';

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
  const [addedAnim, setAddedAnim] = useState(false);

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
    try {
      await addToCart({ product_id: product.id, sku_id: selectedSku.id, quantity });
      await fetchCart();
      setAddedAnim(true);
      setTimeout(() => setAddedAnim(false), 1500);
    } catch { alert('添加失败'); }
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
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
        <div className="w-8 h-8 border-2 border-[#3D6A94] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!product) return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh', color: '#8B95A5' }}>
      <span style={{ fontSize: 48, marginBottom: 16 }}>📦</span>
      <p style={{ fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif", fontSize: 15 }}>商品不存在</p>
    </div>
  );

  return (
    <div className="page-content max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10" style={{ paddingBottom: 'max(40px, calc(env(safe-area-inset-bottom, 0px) + 24px))' }}>
      <div className="glass-card" style={{ borderRadius: 12, padding: 0, overflow: 'hidden' }}>

        {/* ================================================================
            1. PRODUCT IMAGE — large, clean
            ================================================================ */}
        <div className="aspect-[4/3] sm:aspect-[16/9] md:aspect-[2/1] flex items-center justify-center text-8xl relative"
          style={{ background: 'linear-gradient(135deg, #EEF1F5 0%, #F4F6F9 50%, #EEF1F5 100%)' }}>
          {product.images?.[0]?.image_url ? (
            <img src={product.images[0].image_url} alt={product.name}
              className="w-2/3 h-2/3 object-contain" />
          ) : product.cover_image ? (
            <img src={product.cover_image} alt={product.name}
              className="w-2/3 h-2/3 object-contain" />
          ) : (
            <span style={{ opacity: 0.3 }}>📱</span>
          )}
        </div>

        {/* ================================================================
            INFO — ordered: name → description → spec → quantity → buttons
            ================================================================ */}
        <div className="p-5 sm:p-8">

          {/* --- 2. PRODUCT NAME --- */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{
              fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
              fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
              fontWeight: 600,
              color: '#15181B',
              letterSpacing: '-0.01em',
              margin: 0,
              lineHeight: 1.3,
            }}>
              {product.name}
            </h1>
            <p style={{
              fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
              fontSize: 13,
              color: '#8B95A5',
              margin: '6px 0 0 0',
            }}>
              {product.brand || 'oPhone'} · 已售 {product.sales_count || 0} 件
            </p>
            {/* Price */}
            <div style={{ marginTop: 16 }}>
              <span style={{
                fontFamily: "'Space Mono','Courier New',monospace",
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 700,
                color: '#3D6A94',
                letterSpacing: '-0.03em',
              }}>
                ¥{selectedSku?.price || product.min_price}
              </span>
              {selectedSku?.original_price && selectedSku.original_price > selectedSku.price && (
                <span style={{
                  fontFamily: "'Space Mono','Courier New',monospace",
                  fontSize: 14,
                  color: '#8B95A5',
                  textDecoration: 'line-through',
                  marginLeft: 10,
                }}>
                  ¥{selectedSku.original_price}
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(15,23,42,0.06)', marginBottom: 24 }} />

          {/* --- 3. PRODUCT DESCRIPTION --- */}
          {product.description && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{
                fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: '#15181B',
                margin: '0 0 12px 0',
                letterSpacing: '0.02em',
              }}>
                商品详情
              </h3>
              <p style={{
                fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                fontSize: 14,
                lineHeight: 1.75,
                color: '#5F6B7A',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(15,23,42,0.06)', marginBottom: 28 }} />

          {/* --- 4. SPEC / SKU SELECTION --- */}
          {product.skus?.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{
                fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: '#15181B',
                margin: '0 0 14px 0',
                letterSpacing: '0.02em',
              }}>
                规格选择
                {selectedSku && (
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#8B95A5', marginLeft: 8 }}>
                    已选：{selectedSku.sku_name}
                  </span>
                )}
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.skus.map((sku: any) => {
                  const isSelected = selectedSku?.id === sku.id;
                  const isOutOfStock = sku.stock === 0;
                  return (
                    <button
                      key={sku.id}
                      onClick={() => { if (!isOutOfStock) { setSelectedSku(sku); setQuantity(1); } }}
                      disabled={isOutOfStock}
                      className="tap-active"
                      style={{
                        padding: '10px 20px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: isSelected ? 500 : 400,
                        fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        background: isSelected ? 'rgba(61,106,148,0.08)' : '#EEF1F5',
                        border: isSelected ? '1px solid #3D6A94' : '1px solid rgba(15,23,42,0.06)',
                        color: isOutOfStock ? '#C0C6CE' : isSelected ? '#3D6A94' : '#5F6B7A',
                        transition: 'all 0.15s ease',
                        userSelect: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        opacity: isOutOfStock ? 0.5 : 1,
                      }}
                    >
                      {sku.sku_name}
                      {isOutOfStock && ' (缺货)'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(15,23,42,0.06)', marginBottom: 28 }} />

          {/* --- 5. QUANTITY --- */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{
              fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: '#15181B',
              margin: '0 0 14px 0',
              letterSpacing: '0.02em',
            }}>
              数量
            </h3>
            <div className="flex items-center gap-5">
              <div className="flex items-center" style={{
                borderRadius: 8,
                border: '1px solid rgba(15,23,42,0.1)',
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="tap-active"
                  style={{
                    width: 40, height: 40,
                    border: 'none', background: 'transparent',
                    color: quantity <= 1 ? '#C0C6CE' : '#5F6B7A',
                    fontSize: 18, cursor: quantity <= 1 ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >−</button>
                <span style={{
                  width: 56, textAlign: 'center',
                  fontFamily: "'Space Mono','Courier New',monospace",
                  fontSize: 15, fontWeight: 500,
                  color: '#15181B',
                  userSelect: 'none',
                }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(selectedSku?.stock || 99, quantity + 1))}
                  disabled={quantity >= (selectedSku?.stock || 99)}
                  className="tap-active"
                  style={{
                    width: 40, height: 40,
                    border: 'none', background: 'transparent',
                    color: quantity >= (selectedSku?.stock || 99) ? '#C0C6CE' : '#5F6B7A',
                    fontSize: 18, cursor: quantity >= (selectedSku?.stock || 99) ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >+</button>
              </div>
              <span style={{
                fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                fontSize: 12,
                color: '#8B95A5',
              }}>
                库存 {selectedSku?.stock || 0} 件
              </span>
            </div>
          </div>

          {/* --- 6. ACTION BUTTONS --- */}
          <div className="flex gap-3 sm:gap-4" style={{ position: 'relative' }}>
            <button
              onClick={handleAddToCart}
              disabled={adding || !selectedSku || selectedSku.stock === 0}
              className="btn-outline-gold flex-1"
              style={{
                padding: '14px 0',
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              {addedAnim ? '✓ 已添加' : adding ? '添加中...' : '加入购物车'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!selectedSku || selectedSku.stock === 0}
              className="btn-gold flex-1"
              style={{
                padding: '14px 0',
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              立即购买
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
