import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';

const C = {
  cardBg: '#FFFFFF', cardBorder: 'rgba(0,0,0,0.06)',
  textPrimary: '#15181B', textSecondary: '#5F6B7A', textMuted: '#8B95A5',
  accent: '#3D6A94', danger: '#e06070', success: '#5bc0a0',
};

export default function CategoryManagePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = () => { adminApi.getCategories().then(res => { setItems(res.items || []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-wide mb-6" style={{ color: C.textPrimary }}>分类管理</h2>
      <div className="rounded-xl overflow-hidden" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                <th className="text-left py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>ID</th>
                <th className="text-left py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>名称</th>
                <th className="text-left py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>Slug</th>
                <th className="text-right py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>排序</th>
                <th className="text-center py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>状态</th>
                <th className="text-center py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-10"><div className="w-5 h-5 border-2 border-[#3D6A94] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              : items.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-xs" style={{ color: C.textMuted }}>暂无分类</td></tr>
              : items.map((c, i) => (
                <tr key={c.id} className="transition-colors" style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#EEF1F5'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'}>
                  <td className="py-2.5 px-5 text-xs font-mono" style={{ color: C.textMuted }}>{c.id}</td>
                  <td className="py-2.5 px-5 text-xs font-medium" style={{ color: C.textPrimary }}>{c.name}</td>
                  <td className="py-2.5 px-5 text-xs" style={{ color: C.textSecondary }}>{c.slug}</td>
                  <td className="py-2.5 px-5 text-xs text-right" style={{ color: C.textSecondary }}>{c.sort_order}</td>
                  <td className="py-2.5 px-5 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: c.is_active ? 'rgba(91,192,160,0.1)' : 'rgba(0,0,0,0.04)',
                      color: c.is_active ? C.success : C.textMuted,
                    }}>{c.is_active ? '启用' : '禁用'}</span>
                  </td>
                  <td className="py-2.5 px-5 text-center">
                    <button onClick={async () => { if (confirm('确认删除？')) { await adminApi.deleteCategory(c.id); load(); } }}
                      className="text-xs px-2.5 py-1 rounded-md transition-colors" style={{ background: 'rgba(224,96,112,0.08)', color: C.danger }}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
