import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';

const C = {
  cardBg: '#FFFFFF', cardBorder: 'rgba(0,0,0,0.06)',
  textPrimary: '#15181B', textSecondary: '#5F6B7A', textMuted: '#8B95A5',
  danger: '#e06070',
};

export default function BannerManagePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = () => { adminApi.getBanners().then(res => { setItems(Array.isArray(res) ? res : res.items || []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-wide mb-6" style={{ color: C.textPrimary }}>轮播图管理</h2>
      <div className="rounded-xl p-5" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-[#3D6A94] border-t-transparent rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 text-xs" style={{ color: C.textMuted }}>暂无轮播图</div>
        ) : (
          <div className="space-y-2">
            {items.map(b => (
              <div key={b.id} className="flex items-center gap-4 px-4 py-3 rounded-lg transition-colors"
                style={{ background: 'rgba(0,0,0,0.02)', border: `1px solid ${C.cardBorder}` }}>
                <div className="w-28 h-14 rounded-md flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: '#EEF1F5', color: C.textMuted }}>Banner</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: C.textPrimary }}>{b.title || '未命名'}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: C.textMuted }}>{b.link_url} · 排序: {b.sort_order}</p>
                </div>
                <button onClick={async () => { if (confirm('确认删除？')) { await adminApi.deleteBanner(b.id); load(); } }}
                  className="text-xs px-3 py-1.5 rounded-md transition-colors flex-shrink-0"
                  style={{ background: 'rgba(224,96,112,0.08)', color: C.danger }}>删除</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
