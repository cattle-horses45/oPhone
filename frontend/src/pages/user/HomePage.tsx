import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedProducts, getCategories } from '../../api/products';
import ProductCard from '../../components/ProductCard';

const catMeta: Record<string, { icon: string; desc: string }> = {
  '手机': { icon: '📱', desc: '旗舰影像 · 5G 全网通' },
  '平板': { icon: '📋', desc: '创作利器 · 随行办公' },
  '手表': { icon: '⌚', desc: '健康伴侣 · 全天候' },
  '耳机': { icon: '🎧', desc: '沉浸降噪 · 无线自由' },
  '电脑': { icon: '💻', desc: '轻薄本 · 工作站 · 一体机' },
};

function SkeletonCategory() {
  return (
    <div className="animate-pulse flex flex-col items-center gap-3 p-6 rounded-lg" style={{ background: '#EEF1F5' }}>
      <div className="w-12 h-12 rounded-xl" style={{ background: 'rgba(15,23,42,0.06)' }} />
      <div className="w-16 h-3 rounded" style={{ background: 'rgba(15,23,42,0.06)' }} />
      <div className="w-20 h-2.5 rounded" style={{ background: 'rgba(15,23,42,0.04)' }} />
    </div>
  );
}

function SkeletonProductCard() {
  return (
    <div className="animate-pulse rounded-lg overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.06)' }}>
      <div className="aspect-square" style={{ background: 'rgba(15,23,42,0.04)' }} />
      <div className="p-4 space-y-2">
        <div className="w-3/4 h-3.5 rounded" style={{ background: 'rgba(15,23,42,0.06)' }} />
        <div className="w-1/2 h-2.5 rounded" style={{ background: 'rgba(15,23,42,0.04)' }} />
        <div className="w-1/3 h-4 rounded" style={{ background: 'rgba(15,23,42,0.08)' }} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
      .finally(() => setCatsLoading(false));

    getFeaturedProducts()
      .then((data: any) => setFeaturedProducts(Array.isArray(data) ? data : (data.items || [])))
      .catch(() => setFeaturedProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  return (
    <div style={{ background: '#F4F6F9' }}>
      {/* ================================================================
          HERO — compact asymmetric, shopping-first
          ================================================================ */}
      <section className="relative overflow-hidden" style={{ background: '#EEF1F5' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between" style={{ minHeight: 'clamp(200px, 40vw, 320px)' }}>
            {/* Left: text + CTA */}
            <div className="pt-10 lg:pt-0 pb-6 lg:pb-0 lg:max-w-lg">
              <h1 style={{
                fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                fontSize: 'clamp(2rem, 5vw, 3.25rem)',
                fontWeight: 700,
                lineHeight: 1.12,
                letterSpacing: '-0.025em',
                color: '#15181B',
                margin: 0,
              }}>
                oPhone Store
              </h1>
              <p style={{
                fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#5F6B7A',
                margin: '12px 0 0 0',
                maxWidth: '38ch',
              }}>
                精选科技装备，即刻送达。从手机到耳机，每一件都经过严选。
              </p>
              <div className="flex items-center gap-3 mt-7">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 btn-gold"
                  style={{ fontSize: 15, letterSpacing: '0.02em' }}
                >
                  探索全部商品
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Right: monogram — precision instrument mark */}
            <div className="hidden lg:flex items-center justify-center lg:pr-8" style={{ minWidth: 240 }}>
              <div style={{
                width: 200,
                height: 200,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(61,106,148,0.06) 0%, rgba(61,106,148,0.12) 50%, rgba(61,106,148,0.04) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                <span style={{
                  fontFamily: "'Space Mono','Courier New',monospace",
                  fontSize: 88,
                  fontWeight: 700,
                  color: 'rgba(61,106,148,0.18)',
                  letterSpacing: '-0.04em',
                  userSelect: 'none',
                }}>O</span>
                {/* Precision grid lines */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.08 }}>
                  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="66" x2="200" y2="66" stroke="#3D6A94" strokeWidth="0.5" />
                    <line x1="0" y1="133" x2="200" y2="133" stroke="#3D6A94" strokeWidth="0.5" />
                    <line x1="66" y1="0" x2="66" y2="200" stroke="#3D6A94" strokeWidth="0.5" />
                    <line x1="133" y1="0" x2="133" y2="200" stroke="#3D6A94" strokeWidth="0.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          TRUST STRIP — thin data bar, connected to hero
          ================================================================ */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 md:gap-x-12 gap-y-1.5 py-3">
            {[
              { label: '全国包邮', detail: '满99免运费', icon: 'M3 4h18M5 4v12a2 2 0 002 2h10a2 2 0 002-2V4M8 21h8M10 4V1m4 3V1' },
              { label: '7天无理由', detail: '放心退换货', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { label: '官方正品', detail: '品质保证', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: '24h客服', detail: 'AI + 人工在线', icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2" style={{ fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3D6A94" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d={item.icon} />
                </svg>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#15181B', letterSpacing: '0.03em' }}>{item.label}</span>
                <span className="hidden sm:inline" style={{ fontSize: 11, color: '#8B95A5' }}>{item.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================
          CATEGORIES — prominent, action-oriented
          ================================================================ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10" style={{ paddingTop: 52, paddingBottom: 64 }}>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 style={{
              fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
              fontSize: 20,
              fontWeight: 600,
              color: '#15181B',
              letterSpacing: '-0.01em',
              margin: 0,
            }}>按品类选购</h2>
            <p style={{
              fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
              fontSize: 13,
              color: '#8B95A5',
              margin: '4px 0 0 0',
            }}>找到适合你的科技装备</p>
          </div>
          {!catsLoading && categories.length > 0 && (
            <Link to="/products" style={{
              fontFamily: "'Space Mono','Courier New',monospace",
              fontSize: 12,
              color: '#3D6A94',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
            }}>
              全部 →
            </Link>
          )}
        </div>

        {catsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => <SkeletonCategory key={i} />)}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="group flex flex-col items-center gap-3 p-6 rounded-lg text-center transition-all duration-200"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(15,23,42,0.06)',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(15,23,42,0.1)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,0.06)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(15,23,42,0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: 40, lineHeight: 1, transition: 'transform 0.2s ease' }}
                  className="group-hover:scale-110">
                  {catMeta[cat.name]?.icon || '📦'}
                </span>
                <div>
                  <p style={{
                    fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#15181B',
                    margin: 0,
                    letterSpacing: '0.02em',
                    transition: 'color 0.2s ease',
                  }}
                  className="group-hover:text-[#3D6A94]">
                    {cat.name}
                  </p>
                  <p style={{
                    fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                    fontSize: 11,
                    color: '#8B95A5',
                    margin: '2px 0 0 0',
                  }}>
                    {catMeta[cat.name]?.desc || ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16" style={{ color: '#8B95A5' }}>
            <p style={{ fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif", fontSize: 14 }}>分类加载失败，请刷新页面</p>
          </div>
        )}
      </section>

      {/* ================================================================
          FEATURED PRODUCTS — clean grid, real data
          ================================================================ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10" style={{ paddingBottom: 80 }}>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 style={{
              fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
              fontSize: 20,
              fontWeight: 600,
              color: '#15181B',
              letterSpacing: '-0.01em',
              margin: 0,
            }}>精选推荐</h2>
            <p style={{
              fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
              fontSize: 13,
              color: '#8B95A5',
              margin: '4px 0 0 0',
            }}>为你甄选的科技好物</p>
          </div>
          {!productsLoading && featuredProducts.length > 0 && (
            <Link to="/products" style={{
              fontFamily: "'Space Mono','Courier New',monospace",
              fontSize: 12,
              color: '#3D6A94',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
            }}>
              查看全部 →
            </Link>
          )}
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
            {[...Array(4)].map((_, i) => <SkeletonProductCard key={i} />)}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p style={{ fontSize: 48, lineHeight: 1, opacity: 0.2, margin: '0 0 12px 0' }}>📦</p>
            <p style={{
              fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
              fontSize: 14,
              color: '#8B95A5',
              letterSpacing: '0.03em',
              margin: 0,
            }}>暂无精选商品</p>
            <p style={{
              fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
              fontSize: 12,
              color: '#8B95A5',
              margin: '4px 0 0 0',
            }}>
              管理员可在后台添加精选商品
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
