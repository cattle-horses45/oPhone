import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderDetail, cancelOrder, payOrder, confirmOrder } from '../../api/orders';
import ParticleBackground from '../../components/ParticleBackground';

const STATUS_MAP: Record<string, string> = {
  pending_payment: '待付款', paid: '已付款', shipped: '已发货', completed: '已完成', cancelled: '已取消',
};
const STATUS_STEPS = ['pending_payment', 'paid', 'shipped', 'completed'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = () => {
    if (!id) return;
    getOrderDetail(Number(id)).then(setOrder).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { loadOrder(); }, [id]);

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-[#3D6A94] border-t-transparent rounded-full animate-spin" /></div>;
  if (!order) return <div className="text-center py-24 text-gray-400 tracking-wider">订单不存在</div>;

  const currentStep = order.status === 'cancelled' ? -1 : STATUS_STEPS.indexOf(order.status);

  return (
    <div className="relative min-h-screen"><ParticleBackground />
    <div className="page-content max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-xl tracking-[0.2em] text-gold-glow font-semibold mb-8">订单详情</h1>

      <div className="glass-card p-6 mb-5" style={{ borderRadius: 16 }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-400 tracking-wider">订单号：{order.order_no}</span>
          <span className="text-base font-semibold text-gold-glow tracking-wider">{STATUS_MAP[order.status]}</span>
        </div>
        {order.status !== 'cancelled' && (
          <div className="flex items-center">
            {STATUS_STEPS.map((step, idx) => (
              <div key={step} className="flex-1 flex items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={idx <= currentStep
                    ? { background: 'linear-gradient(135deg, #2F5579, #3D6A94)', color: '#FFFFFF' }
                    : { background: '#EEF1F5', color: '#8B95A5', border: '1px solid rgba(0,0,0,0.06)' }}>
                  {idx + 1}
                </div>
                {idx < 3 && <div className="flex-1 h-0.5 mx-1 rounded" style={{ background: idx < currentStep ? '#3D6A94' : 'rgba(0,0,0,0.06)' }} />}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-5 mb-5" style={{ borderRadius: 16 }}>
        <h3 className="text-sm tracking-wider text-gray-600 font-medium mb-4">商品清单</h3>
        {order.items?.map((item: any) => (
          <div key={item.id} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #EEF1F5, #F7F9FB)' }}>📱</div>
            <div className="flex-1"><p className="text-sm text-gray-600">{item.product_name}</p><p className="text-xs text-gray-400">{item.sku_name}</p></div>
            <div className="text-right"><p className="text-sm text-gray-500">¥{item.price} × {item.quantity}</p><p className="text-sm font-medium text-gold-glow">¥{item.subtotal}</p></div>
          </div>
        ))}
      </div>

      <div className="glass-card p-5 mb-5" style={{ borderRadius: 16 }}>
        <div className="flex justify-between items-center"><span className="text-gray-400 tracking-wider">订单总额</span><span className="text-2xl font-bold text-gold-glow">¥{order.total_amount}</span></div>
      </div>

      <div className="flex gap-3">
        {order.status === 'pending_payment' && (
          <>
            <button onClick={() => payOrder(Number(id)).then(loadOrder)} className="btn-gold flex-1 py-3 text-sm tracking-wider">立即支付</button>
            <button onClick={() => { if (confirm('确认取消？')) cancelOrder(Number(id)).then(loadOrder); }} className="btn-outline-gold px-6 py-3 text-sm tracking-wider">取消订单</button>
          </>
        )}
        {order.status === 'shipped' && (
          <button onClick={() => { if (confirm('确认收货？')) confirmOrder(Number(id)).then(loadOrder); }} className="btn-gold flex-1 py-3 text-sm tracking-wider">确认收货</button>
        )}
        <Link to="/orders" className="btn-outline-gold px-6 py-3 text-sm tracking-wider inline-block">返回</Link>
      </div>
    </div></div>
  );
}
