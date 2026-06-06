import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

const menuItems = [
  { label: '仪表盘', path: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: '商品管理', path: '/admin/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label: '订单管理', path: '/admin/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: '用户管理', path: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { label: '分类管理', path: '/admin/categories', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { label: '轮播图管理', path: '/admin/banners', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: '知识库管理', path: '/admin/knowledge', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { label: '人工客服', path: '/admin/chat', icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z' },
];

// Cold-tone design tokens
const C = {
  sidebarBg: '#EEF1F5',
  sidebarHover: 'rgba(15,23,42,0.04)',
  sidebarActive: 'rgba(61,106,148,0.08)',
  sidebarText: '#5F6B7A',
  sidebarTextActive: '#3D6A94',
  topbarBg: 'rgba(255,255,255,0.92)',
  pageBg: '#F4F6F9',
  cardBg: '#FFFFFF',
  cardHover: '#F7F9FB',
  cardBorder: 'rgba(15,23,42,0.06)',
  textPrimary: '#15181B',
  textSecondary: '#5F6B7A',
  textMuted: '#8B95A5',
  accent: '#3D6A94',
  accentDim: 'rgba(61,106,148,0.08)',
  tableStripe: 'rgba(15,23,42,0.015)',
  tableHover: 'rgba(15,23,42,0.03)',
};

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: C.pageBg, color: C.textPrimary, fontFamily: "'Inter', 'Noto Sans SC', system-ui, -apple-system, sans-serif" }}>
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-60 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: C.sidebarBg, borderRight: '1px solid rgba(15,23,42,0.06)' }}>
        {/* Brand */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-bold"
              style={{ background: `linear-gradient(135deg, #2F5579, ${C.accent})`, color: '#FFFFFF' }}>O</div>
            <div>
              <div className="font-semibold text-sm tracking-wide" style={{ color: C.textPrimary }}>oPhone</div>
              <div className="text-xs" style={{ color: C.textMuted }}>管理后台</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 space-y-0.5 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {menuItems.map((item) => {
            const isActive = item.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150"
                style={{
                  background: isActive ? C.sidebarActive : 'transparent',
                  color: isActive ? C.sidebarTextActive : C.sidebarText,
                  fontWeight: isActive ? 500 : 400,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.sidebarHover; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(15,23,42,0.06)' }}>
          <Link to="/" className="block text-xs py-1.5 transition-colors" style={{ color: C.textMuted }}
            onMouseEnter={e => e.currentTarget.style.color = C.textSecondary}
            onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>← 返回商城</Link>
          <button onClick={() => { logout(); navigate('/'); }}
            className="block text-xs py-1.5 transition-colors" style={{ color: C.textMuted }}
            onMouseEnter={e => e.currentTarget.style.color = '#d4645c'}
            onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>退出登录</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar — white glass */}
        <header className="sticky top-0 z-30" style={{ background: C.topbarBg, backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
          <div className="flex items-center justify-between px-5 h-14">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-md" style={{ color: C.textSecondary }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-xs" style={{ color: C.textMuted }}>{user?.username}</span>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ background: `linear-gradient(135deg, #2F5579, ${C.accent})`, color: '#FFFFFF' }}>
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-5 lg:p-7 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
