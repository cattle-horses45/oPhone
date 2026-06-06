import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';

const C = {
  cardBg: '#FFFFFF', cardHover: '#EEF1F5', cardBorder: 'rgba(0,0,0,0.06)',
  textPrimary: '#15181B', textSecondary: '#5F6B7A', textMuted: '#8B95A5',
  accent: '#3D6A94', accentDim: 'rgba(61,106,148,0.1)',
  iconBg: (color: string) => color,
};

const STAT_CARDS = [
  { key: 'user_count', label: '用户总数', color: '#6c8eef', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
  { key: 'product_count', label: '商品总数', color: '#5bc0a0', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { key: 'order_count', label: '订单总数', color: '#e8a850', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2' },
  { key: 'revenue', label: '总收入', color: '#e06070', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    adminApi.getDashboard().then(res => { setStats(res.stats); setOrders(res.recent_orders || []); }).catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6 tracking-wide" style={{ color: C.textPrimary }}>仪表盘</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(card => (
          <div key={card.key} className="rounded-xl p-4 transition-all duration-200 cursor-default"
            style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${card.color}18` }}>
                <svg className="w-4 h-4" fill="none" stroke={card.color} strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <span className="text-xs font-medium" style={{ color: C.textMuted }}>{card.label}</span>
            </div>
            <p className="text-2xl font-semibold tracking-tight" style={{ color: C.textPrimary }}>
              {card.key === 'revenue' ? `¥${((stats?.[card.key] || 0)).toFixed(2)}` : (stats?.[card.key] ?? '—')}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl overflow-hidden" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
          <h3 className="text-sm font-medium tracking-wide" style={{ color: C.textPrimary }}>最近订单</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                <th className="text-left py-2.5 px-5 text-xs font-medium" style={{ color: C.textMuted }}>订单号</th>
                <th className="text-left py-2.5 px-5 text-xs font-medium" style={{ color: C.textMuted }}>状态</th>
                <th className="text-right py-2.5 px-5 text-xs font-medium" style={{ color: C.textMuted }}>金额</th>
                <th className="text-right py-2.5 px-5 text-xs font-medium" style={{ color: C.textMuted }}>时间</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={o.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                  <td className="py-2.5 px-5 font-mono text-xs" style={{ color: C.textSecondary }}>{o.order_no}</td>
                  <td className="py-2.5 px-5">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: o.status === 'completed' ? 'rgba(91,192,160,0.12)' : o.status === 'cancelled' ? 'rgba(224,96,112,0.12)' : 'rgba(108,142,239,0.12)',
                      color: o.status === 'completed' ? '#5bc0a0' : o.status === 'cancelled' ? '#e06070' : '#6c8eef',
                    }}>{o.status === 'pending_payment' ? '待付款' : o.status === 'paid' ? '已付款' : o.status === 'shipped' ? '已发货' : o.status === 'completed' ? '已完成' : o.status}</span>
                  </td>
                  <td className="py-2.5 px-5 text-right text-xs" style={{ color: C.textPrimary }}>¥{o.total_amount}</td>
                  <td className="py-2.5 px-5 text-right text-xs" style={{ color: C.textMuted }}>{o.created_at ? new Date(o.created_at).toLocaleDateString('zh-CN') : ''}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-xs" style={{ color: C.textMuted }}>暂无订单</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
