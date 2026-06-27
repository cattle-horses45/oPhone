import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeCartItem } from '../../api/cart';
import { useCartStore } from '../../stores/cartStore';
import ParticleBackground from '../../components/ParticleBackground';

export default function CartPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const { fetchCart } = useCartStore();

  useEffect(() => { loadCart(); }, []);
  const loadCart = async () => {
    try {
      const data = await getCart();
      setItems(data.items || []);
      setSelectedIds(new Set((data.items || []).map((i: any) => i.id)));
    } catch {} finally { setLoading(false); }
  };

  const handleQty = async (itemId: number, qty: number) => {
    if (qty < 1) return;
    await updateCartItem(itemId, qty);
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: qty } : i));
    fetchCart();
  };

  const handleRemove = async (itemId: number) => {
    await removeCartItem(itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(itemId); return n; });
    fetchCart();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleAll = () => {
    if (selectedIds.size === items.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map((i: any) => i.id)));
  };

  const selectedItems = items.filter((i: any) => selectedIds.has(i.id));
  const totalAmount = selectedItems.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

  if (loading) {
    return <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-[#3D6A94] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="relative min-h-screen">
      <ParticleBackground />
      <div className="page-content max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8" style={{ paddingBottom: 'max(40px, calc(env(safe-area-inset-bottom, 0px) + 24px))' }}>
        <h1 className="text-xl tracking-[0.2em] text-gold-glow font-semibold mb-8">购物车</h1>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4 opacity-30">🛒</p>
            <p className="text-gray-400 tracking-wider mb-6">购物车是空的</p>
            <Link to="/products" className="btn-gold inline-block">去逛逛</Link>
          </div>
        ) : (
          <>
            <div className="glass-card overflow-hidden" style={{ borderRadius: 16 }}>
              {/* Header */}
              <div className="flex items-center px-5 py-3 text-xs text-gray-400 tracking-wider"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <label className="flex items-center gap-2 w-12 cursor-pointer">
                  <input type="checkbox" checked={selectedIds.size === items.length} onChange={toggleAll}
                    className="accent-[#3D6A94]" />
                  全选
                </label>
                <span className="flex-1">商品</span>
                <span className="w-24 text-center">单价</span>
                <span className="w-28 text-center">数量</span>
                <span className="w-24 text-center">小计</span>
                <span className="w-16 text-center">操作</span>
              </div>

              {items.map((item: any) => (
                <div key={item.id} className="flex items-center px-5 py-4 transition-colors"
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)}
                    className="accent-[#3D6A94] mr-2" />
                  <Link to={`/products/${item.product_id}`} className="flex items-center gap-3 flex-1 group">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #EEF1F5, #F7F9FB)' }}>
                      📱
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 group-hover:text-[#3D6A94] transition-colors tracking-wider">{item.product_name}</p>
                      <p className="text-xs text-gray-400 mt-1">{item.sku_name}</p>
                    </div>
                  </Link>
                  <span className="w-24 text-center text-sm text-gray-600">¥{item.price}</span>
                  <div className="w-28 flex justify-center">
                    <div className="flex items-center" style={{ borderRadius: 8, border: '1px solid rgba(15,23,42,0.08)' }}>
                      <button onClick={() => handleQty(item.id, item.quantity - 1)}
                        className="tap-active"
                        style={{ width: 32, height: 32, border: 'none', background: 'transparent', color: '#5F6B7A', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent' }}>−</button>
                      <span style={{ width: 40, textAlign: 'center', fontSize: 13, color: '#15181B', fontFamily: "'Space Mono','Courier New',monospace" }}>{item.quantity}</span>
                      <button onClick={() => handleQty(item.id, item.quantity + 1)}
                        className="tap-active"
                        style={{ width: 32, height: 32, border: 'none', background: 'transparent', color: '#5F6B7A', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent' }}>+</button>
                    </div>
                  </div>
                  <span className="w-24 text-center text-sm text-gold-glow font-medium">¥{(item.price * item.quantity).toFixed(2)}</span>
                  <button onClick={() => handleRemove(item.id)} className="w-16 text-center text-xs text-gray-400 hover:text-red-500 transition-colors">删除</button>
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div className="glass-card mt-5 px-6 py-4 flex items-center justify-between" style={{ borderRadius: 16 }}>
              <div className="text-sm">
                <span className="text-gray-400">已选 {selectedItems.length} 件</span>
                <span className="ml-6 text-gray-600">合计 <span className="text-xl font-bold text-gold-glow ml-1">¥{totalAmount.toFixed(2)}</span></span>
              </div>
              <button onClick={() => navigate('/checkout')} disabled={selectedItems.length === 0}
                className="btn-gold text-sm tracking-wider">
                去结算
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
