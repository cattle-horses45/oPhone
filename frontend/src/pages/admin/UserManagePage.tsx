import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';

const C = {
  cardBg: '#FFFFFF', cardBorder: 'rgba(0,0,0,0.06)',
  textPrimary: '#15181B', textSecondary: '#5F6B7A', textMuted: '#8B95A5',
  accent: '#3D6A94', danger: '#e06070', success: '#5bc0a0',
};

export default function UserManagePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    adminApi.getUsers({ page_size: 100 }).then(res => { setUsers(res.items || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-wide mb-6" style={{ color: C.textPrimary }}>用户管理</h2>
      <div className="rounded-xl overflow-hidden" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                <th className="text-left py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>ID</th>
                <th className="text-left py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>用户名</th>
                <th className="text-left py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>邮箱</th>
                <th className="text-center py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>角色</th>
                <th className="text-center py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>状态</th>
                <th className="text-center py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-10"><div className="w-5 h-5 border-2 border-[#3D6A94] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              : users.map((u, i) => (
                <tr key={u.id} className="transition-colors" style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#EEF1F5'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'}>
                  <td className="py-2.5 px-5 text-xs font-mono" style={{ color: C.textMuted }}>{u.id}</td>
                  <td className="py-2.5 px-5 text-xs font-medium" style={{ color: C.textPrimary }}>{u.username}</td>
                  <td className="py-2.5 px-5 text-xs" style={{ color: C.textSecondary }}>{u.email}</td>
                  <td className="py-2.5 px-5 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: u.role === 'admin' ? 'rgba(61,106,148,0.08)' : 'rgba(0,0,0,0.04)',
                      color: u.role === 'admin' ? C.accent : C.textMuted,
                    }}>{u.role === 'admin' ? '管理员' : '用户'}</span>
                  </td>
                  <td className="py-2.5 px-5 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: u.is_active ? 'rgba(91,192,160,0.1)' : 'rgba(224,96,112,0.1)',
                      color: u.is_active ? C.success : C.danger,
                    }}>{u.is_active ? '正常' : '已禁用'}</span>
                  </td>
                  <td className="py-2.5 px-5 text-center">
                    <button onClick={async () => { if (u.role === 'admin') return alert('不能禁用管理员'); await adminApi.toggleUserActive(u.id); load(); }}
                      className="text-xs px-2.5 py-1 rounded-md transition-colors"
                      style={{
                        background: u.is_active ? 'rgba(224,96,112,0.08)' : 'rgba(91,192,160,0.08)',
                        color: u.is_active ? C.danger : C.success,
                      }}>{u.is_active ? '禁用' : '启用'}</button>
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
