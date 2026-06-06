import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart } from '../../api/cart';
import { createOrder } from '../../api/orders';
import { useCartStore } from '../../stores/cartStore';
import ParticleBackground from '../../components/ParticleBackground';

export default function CheckoutPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState({ receiver_name: '', phone: '', detail: '' });
  const navigate = useNavigate();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    getCart().then(data => { setItems(data.items || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const totalAmount = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

  const handleSubmit = async () => {
    if (!address.receiver_name || !address.phone || !address.detail) { alert('请填写收货信息'); return; }
    setSubmitting(true);
    try {
      await createOrder({ address_id: 1, remark: '' });
      await fetchCart();
      alert('下单成功！');
      navigate('/orders');
    } catch (err: any) { alert(err.response?.data?.detail || '下单失败'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-[#3D6A94] border-t-transparent rounded-full animate-spin" /></div>;
  if (items.length === 0) return <div className="text-center py-24 text-gray-400 tracking-wider">没有待结算的商品</div>;

  return (
    <div className="relative min-h-screen"><ParticleBackground />
    <div className="page-content max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-xl tracking-[0.2em] text-gold-glow font-semibold mb-8">确认订单</h1>
      <div className="glass-card p-6 mb-5" style={{ borderRadius: 16 }}>
        <h3 className="text-sm tracking-wider text-gray-600 font-medium mb-4">收货信息</h3>
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="收货人姓名" value={address.receiver_name} onChange={e => setAddress({ ...address, receiver_name: e.target.value })} className="input-luxury" />
          <input type="text" placeholder="手机号码" value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} className="input-luxury" />
          <input type="text" placeholder="详细地址" value={address.detail} onChange={e => setAddress({ ...address, detail: e.target.value })} className="input-luxury col-span-2" />
        </div>
      </div>
      <div className="glass-card p-6 mb-5" style={{ borderRadius: 16 }}>
        <h3 className="text-sm tracking-wider text-gray-600 font-medium mb-4">商品清单</h3>
        {items.map((item: any) => (
          <div key={item.id} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #EEF1F5, #F7F9FB)' }}>📱</div>
            <div className="flex-1"><p className="text-sm text-gray-600">{item.product_name}</p><p className="text-xs text-gray-400">{item.sku_name}</p></div>
            <span className="text-sm text-gray-500">¥{item.price} × {item.quantity}</span>
          </div>
        ))}
      </div>
      <div className="glass-card p-6" style={{ borderRadius: 16 }}>
        <div className="flex justify-between text-sm mb-2"><span className="text-gray-400">商品合计</span><span className="text-gray-600">¥{totalAmount.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm mb-2"><span className="text-gray-400">运费</span><span className="text-green-600">免运费</span></div>
        <div className="flex justify-between font-semibold text-base pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <span className="text-gray-600">应付总额</span><span className="text-gold-glow text-xl">¥{totalAmount.toFixed(2)}</span>
        </div>
        <button onClick={handleSubmit} disabled={submitting} className="btn-gold w-full mt-6 py-3.5 text-sm tracking-widest">
          {submitting ? '提交中...' : '提交订单'}
        </button>
      </div>
    </div></div>
  );
}
