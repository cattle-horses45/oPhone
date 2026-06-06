import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import ChatWidget from '../components/ChatWidget';
import ParticleBackground from '../components/ParticleBackground';

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { totalCount, fetchCart } = useCartStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated, fetchCart]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: '#F4F6F9' }}>
      <ParticleBackground />

      {/* Header — white glass */}
      <header className="sticky top-0 z-40" style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(15,23,42,0.06)',
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Nav */}
            <div className="flex items-center gap-10">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-md flex items-center justify-center text-lg font-bold"
                  style={{ background: 'linear-gradient(135deg, #2F5579, #3D6A94)', color: '#FFFFFF' }}>
                  O
                </div>
                <span className="text-lg tracking-wider hidden sm:block text-gold-glow font-semibold">oPhone</span>
              </Link>
              <nav className="hidden md:flex items-center gap-8">
                <Link to="/" className="text-sm tracking-wider text-[#5F6B7A] hover:text-[#3D6A94] transition-colors duration-200">首页</Link>
                <Link to="/products" className="text-sm tracking-wider text-[#5F6B7A] hover:text-[#3D6A94] transition-colors duration-200">全部商品</Link>
              </nav>
            </div>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full flex items-center">
                <input
                  type="text"
                  placeholder="搜索 oPhone 商品..."
                  className="w-full py-3 pl-5 pr-5 text-sm rounded-full outline-none transition-all duration-200"
                  style={{
                    background: '#EEF1F5',
                    border: '1px solid transparent',
                    color: '#15181B',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3D6A94';
                    e.target.style.boxShadow = '0 0 0 3px rgba(61,106,148,0.12)';
                    e.target.style.background = '#FFFFFF';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'transparent';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = '#EEF1F5';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (v) navigate(`/products?search=${encodeURIComponent(v)}`);
                    }
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Link to="/cart" className="relative p-2 text-[#8B95A5] hover:text-[#3D6A94] transition-colors duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                {totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-xs font-semibold"
                    style={{ background: 'linear-gradient(135deg, #2F5579, #3D6A94)', color: '#FFFFFF' }}>
                    {totalCount > 99 ? '99+' : totalCount}
                  </span>
                )}
              </Link>

              {isAuthenticated && user ? (
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 text-sm text-[#5F6B7A] hover:text-[#3D6A94] transition-colors duration-200 p-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{ background: 'linear-gradient(135deg, #2F5579, #3D6A94)', color: '#FFFFFF' }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block tracking-wider">{user.username}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-44 glass-card py-2 z-50" style={{ borderRadius: 8 }}>
                      <Link to="/orders" className="block px-5 py-2.5 text-sm text-[#5F6B7A] hover:text-[#3D6A94] hover:bg-black/[0.03] transition-all" onClick={() => setShowUserMenu(false)}>我的订单</Link>
                      <Link to="/profile" className="block px-5 py-2.5 text-sm text-[#5F6B7A] hover:text-[#3D6A94] hover:bg-black/[0.03] transition-all" onClick={() => setShowUserMenu(false)}>个人中心</Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" className="block px-5 py-2.5 text-sm text-[#3D6A94] hover:bg-black/[0.03] transition-all" onClick={() => setShowUserMenu(false)}>管理后台</Link>
                      )}
                      <div className="my-1 mx-3 border-t border-black/5" />
                      <button onClick={() => { logout(); setShowUserMenu(false); navigate('/'); }}
                        className="block w-full text-left px-5 py-2.5 text-sm text-[#8B95A5] hover:text-red-500 hover:bg-black/[0.03] transition-all">
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="text-sm tracking-wider text-[#3D6A94] hover:text-[#2F5579] transition-colors duration-200 font-medium">
                  登录
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 page-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="page-content border-t" style={{ borderColor: 'rgba(15,23,42,0.06)', background: '#EEF1F5' }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div>
              <h4 className="text-gold-glow font-semibold text-lg mb-4 tracking-wider">oPhone</h4>
              <p className="text-sm text-[#8B95A5] leading-relaxed">探索科技之美，体验极致创新。</p>
            </div>
            <div>
              <h5 className="text-[#5F6B7A] font-medium mb-4 tracking-wider text-sm">购物指南</h5>
              <div className="space-y-2 text-sm text-[#8B95A5]">购物流程 · 支付方式 · 配送说明</div>
            </div>
            <div>
              <h5 className="text-[#5F6B7A] font-medium mb-4 tracking-wider text-sm">售后服务</h5>
              <div className="space-y-2 text-sm text-[#8B95A5]">退换货政策 · 保修服务 · 常见问题</div>
            </div>
            <div>
              <h5 className="text-[#5F6B7A] font-medium mb-4 tracking-wider text-sm">联系我们</h5>
              <div className="space-y-2 text-sm text-[#8B95A5]">400-888-8888 · support@ophone.com</div>
            </div>
          </div>
          <div className="text-center mt-12 pt-8 border-t text-xs text-[#8B95A5]" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
            © 2026 oPhone. All rights reserved.
          </div>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
