import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../../api/orders';
import ParticleBackground from '../../components/ParticleBackground';

const TABS = ['', 'pending_payment', 'paid', 'shipped', 'completed'];
const TAB_LABELS: Record<string, string> = { '': '全部', pending_payment: '待付款', paid: '已付款', shipped: '已发货', completed: '已完成' };
const STATUS_MAP: Record<string, string> = { pending_payment: '待付款', paid: '已付款', shipped: '已发货', completed: '已完成', cancelled: '已取消' };

export default function OrderListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    setLoading(true);
    getOrders({ status: (activeTab || undefined) as any }).then(res => setOrders(res.items || [])).catch(() => {}).finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="relative min-h-screen"><ParticleBackground />
    <div className="page-content max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-xl tracking-[0.2em] text-gold-glow font-semibold mb-8">我的订单</h1>
      <div className="flex gap-2 mb-6">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-5 py-2.5 rounded-xl text-sm tracking-wider transition-all"
            style={activeTab === tab
              ? { background: 'linear-gradient(135deg, #2F5579, #3D6A94)', color: '#FFFFFF', fontWeight: 600 }
              : { background: '#FFFFFF', color: '#5F6B7A', border: '1px solid rgba(0,0,0,0.06)' }}>
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#3D6A94] border-t-transparent rounded-full animate-spin" /></div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <Link key={order.id} to={`/orders/${order.id}`} className="glass-card block p-5" style={{ borderRadius: 16 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 tracking-wider">订单号：{order.order_no}</span>
                <span className="text-xs tracking-wider" style={{ color: order.status === 'pending_payment' ? '#e8a850' : order.status === 'completed' ? '#4a9e6e' : '#3D6A94' }}>
                  {STATUS_MAP[order.status] || order.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gold-glow">¥{order.total_amount}</span>
                <span className="text-xs text-gray-400">{order.created_at ? new Date(order.created_at).toLocaleDateString('zh-CN') : ''}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20"><p className="text-4xl opacity-30 mb-3">📦</p><p className="text-gray-400 tracking-wider">暂无订单</p></div>
      )}
    </div></div>
  );
}
