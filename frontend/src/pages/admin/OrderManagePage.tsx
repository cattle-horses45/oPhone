import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';

const C = {
  cardBg: '#FFFFFF', cardBorder: 'rgba(0,0,0,0.06)',
  textPrimary: '#15181B', textSecondary: '#5F6B7A', textMuted: '#8B95A5',
  accent: '#3D6A94',
};
const STATUS: Record<string, string> = { '': '全部', pending_payment: '待付款', paid: '已付款', shipped: '已发货', completed: '已完成' };
const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'rgba(232,168,80,0.12)', paid: 'rgba(108,142,239,0.12)', shipped: 'rgba(180,140,220,0.12)',
  completed: 'rgba(91,192,160,0.12)', cancelled: 'rgba(224,96,112,0.12)',
};
const STATUS_TEXT: Record<string, string> = {
  pending_payment: '#e8a850', paid: '#6c8eef', shipped: '#b48cdc', completed: '#5bc0a0', cancelled: '#e06070',
};

export default function OrderManagePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    adminApi.getOrders({ status: filter || undefined, page_size: 100 }).then(res => { setOrders(res.items || []); setLoading(false); }).catch(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-wide mb-6" style={{ color: C.textPrimary }}>订单管理</h2>
      <div className="flex gap-2 mb-5">
        {Object.entries(STATUS).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)}
            className="text-xs px-4 py-2 rounded-lg transition-all font-medium"
            style={{
              background: filter === k ? C.accent : C.cardBg, color: filter === k ? '#FFFFFF' : C.textSecondary,
              border: filter === k ? 'none' : `1px solid ${C.cardBorder}`,
            }}>{v}</button>
        ))}
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                <th className="text-left py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>订单号</th>
                <th className="text-left py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>用户</th>
                <th className="text-right py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>金额</th>
                <th className="text-center py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>状态</th>
                <th className="text-right py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>时间</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="text-center py-10"><div className="w-5 h-5 border-2 border-[#3D6A94] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              : orders.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-xs" style={{ color: C.textMuted }}>暂无订单</td></tr>
              : orders.map((o, i) => (
                <tr key={o.id} className="transition-colors" style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#EEF1F5'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'}>
                  <td className="py-2.5 px-5 text-xs font-mono" style={{ color: C.textSecondary }}>{o.order_no}</td>
                  <td className="py-2.5 px-5 text-xs" style={{ color: C.textSecondary }}>{o.user_id}</td>
                  <td className="py-2.5 px-5 text-xs text-right" style={{ color: C.textPrimary }}>¥{o.total_amount}</td>
                  <td className="py-2.5 px-5 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: STATUS_COLOR[o.status] || 'rgba(0,0,0,0.04)', color: STATUS_TEXT[o.status] || C.textMuted }}>
                      {STATUS[o.status] || o.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-5 text-right text-xs" style={{ color: C.textMuted }}>{o.created_at ? new Date(o.created_at).toLocaleString('zh-CN') : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
