import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart } from '../../api/cart';
import { createOrder, payOrder } from '../../api/orders';
import { useCartStore } from '../../stores/cartStore';

type PaymentMethod = 'wechat' | 'alipay' | 'card';

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string; desc: string }[] = [
  { key: 'wechat', label: '微信支付', icon: '💬', desc: '推荐微信用户使用' },
  { key: 'alipay', label: '支付宝', icon: '🔵', desc: '推荐支付宝用户使用' },
  { key: 'card', label: '银行卡支付', icon: '💳', desc: '支持储蓄卡/信用卡' },
];

export default function CheckoutPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'checkout' | 'paying' | 'success'>('checkout');
  const [address, setAddress] = useState({ receiver_name: '', phone: '', detail: '' });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [cardInfo, setCardInfo] = useState({ number: '', expiry: '', cvv: '' });
  const navigate = useNavigate();
  const { fetchCart } = useCartStore();
  const payingRef = useRef(false);

  useEffect(() => {
    getCart().then(data => { setItems(data.items || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const totalAmount = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

  const handleSubmitOrder = async () => {
    if (!address.receiver_name || !address.phone || !address.detail) { alert('请填写收货信息'); return; }
    if (payingRef.current) return;
    payingRef.current = true;
    setSubmitting(true);

    try {
      // 1. 创建订单
      const order = await createOrder({ address_id: 1, remark: '' });
      setOrderId(order.id);

      // 2. 进入支付中状态
      setStep('paying');

      // 3. 模拟支付处理（1.5秒延迟模拟银行处理）
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 4. 调用支付接口
      await payOrder(order.id);

      // 5. 支付成功
      await fetchCart();
      setStep('success');
    } catch (err: any) {
      alert(err.response?.data?.detail || '支付失败，请重试');
      setStep('checkout');
    } finally {
      setSubmitting(false);
      payingRef.current = false;
    }
  };

  // -- Loading state --
  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-2 border-[#3D6A94] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // -- Empty cart --
  if (items.length === 0) return (
    <div className="text-center py-24" style={{ color: '#8B95A5' }}>
      <span style={{ fontSize: 48, opacity: 0.3, marginBottom: 16, display: 'block' }}>🛒</span>
      <p style={{ fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif", fontSize: 15 }}>没有待结算的商品</p>
      <button onClick={() => navigate('/products')} className="btn-gold mt-6">去逛逛</button>
    </div>
  );

  // ==========================================
  // 支付成功页面
  // ==========================================
  if (step === 'success') {
    return (
      <div className="page-content max-w-md mx-auto px-4 py-10" style={{ paddingBottom: 'max(40px, calc(env(safe-area-inset-bottom, 0px) + 24px))' }}>
        <div className="glass-card" style={{ borderRadius: 16, padding: '48px 32px', textAlign: 'center' }}>
          {/* 成功图标 */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3D6A94, #5C8DB8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 4px 24px rgba(61,106,148,0.2)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h2 style={{
            fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
            fontSize: 22, fontWeight: 600, color: '#15181B',
            margin: '0 0 8px 0',
          }}>
            支付成功
          </h2>
          <p style={{
            fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
            fontSize: 14, color: '#8B95A5',
            margin: '0 0 32px 0',
          }}>
            感谢您的购买，我们将尽快为您发货
          </p>

          {/* 订单信息 */}
          <div style={{
            background: '#EEF1F5', borderRadius: 12,
            padding: 20, marginBottom: 32,
          }}>
            <div className="flex justify-between text-sm" style={{ marginBottom: 12 }}>
              <span style={{ color: '#8B95A5' }}>订单编号</span>
              <span style={{ fontFamily: "'Space Mono','Courier New',monospace", color: '#15181B', fontWeight: 500 }}>
                #{String(orderId).padStart(6, '0')}
              </span>
            </div>
            <div className="flex justify-between text-sm" style={{ marginBottom: 12 }}>
              <span style={{ color: '#8B95A5' }}>支付方式</span>
              <span style={{ color: '#15181B' }}>
                {PAYMENT_METHODS.find(m => m.key === paymentMethod)?.label}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#8B95A5' }}>支付金额</span>
              <span style={{
                fontFamily: "'Space Mono','Courier New',monospace",
                fontSize: 18, fontWeight: 700, color: '#3D6A94',
              }}>
                ¥{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/orders')}
              className="btn-outline-gold flex-1" style={{ padding: '12px 0', fontSize: 14 }}
            >
              查看订单
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-gold flex-1" style={{ padding: '12px 0', fontSize: 14 }}
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 支付中页面
  // ==========================================
  if (step === 'paying') {
    return (
      <div className="page-content max-w-md mx-auto px-4 py-10" style={{ paddingBottom: 'max(40px, calc(env(safe-area-inset-bottom, 0px) + 24px))' }}>
        <div className="glass-card" style={{ borderRadius: 16, padding: '48px 32px', textAlign: 'center' }}>
          {/* 转圈动画 */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #EEF1F5, #F4F6F9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            position: 'relative',
          }}>
            <div style={{
              width: 48, height: 48,
              border: '3px solid rgba(61,106,148,0.12)',
              borderTopColor: '#3D6A94',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>

          <h2 style={{
            fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
            fontSize: 18, fontWeight: 600, color: '#15181B',
            margin: '0 0 8px 0',
          }}>
            正在支付...
          </h2>
          <p style={{
            fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
            fontSize: 14, color: '#8B95A5',
            margin: 0,
          }}>
            请稍候，正在处理您的支付请求
          </p>
          <p style={{
            fontFamily: "'Space Mono','Courier New',monospace",
            fontSize: 20, fontWeight: 700, color: '#3D6A94',
            margin: '24px 0 0 0',
          }}>
            ¥{totalAmount.toFixed(2)}
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // 结算页面
  // ==========================================
  return (
    <div className="page-content max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8"
      style={{ paddingBottom: 'max(40px, calc(env(safe-area-inset-bottom, 0px) + 24px))' }}>
      <h1 style={{
        fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
        fontSize: 'clamp(1.25rem, 3vw, 1.375rem)',
        fontWeight: 600,
        color: '#15181B',
        margin: '0 0 24px 0',
        letterSpacing: '0.04em',
      }}>
        确认订单
      </h1>

      {/* ===== 收货信息 ===== */}
      <div className="glass-card p-5 sm:p-6" style={{ borderRadius: 16, marginBottom: 20 }}>
        <h3 style={{
          fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
          fontSize: 15, fontWeight: 600, color: '#15181B',
          margin: '0 0 16px 0',
        }}>
          收货信息
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text" placeholder="收货人姓名"
            value={address.receiver_name}
            onChange={e => setAddress({ ...address, receiver_name: e.target.value })}
            className="input-luxury"
          />
          <input
            type="text" placeholder="手机号码"
            value={address.phone}
            onChange={e => setAddress({ ...address, phone: e.target.value })}
            className="input-luxury"
          />
          <input
            type="text" placeholder="详细地址"
            value={address.detail}
            onChange={e => setAddress({ ...address, detail: e.target.value })}
            className="input-luxury col-span-full"
          />
        </div>
      </div>

      {/* ===== 商品清单 ===== */}
      <div className="glass-card p-5 sm:p-6" style={{ borderRadius: 16, marginBottom: 20 }}>
        <h3 style={{
          fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
          fontSize: 15, fontWeight: 600, color: '#15181B',
          margin: '0 0 16px 0',
        }}>
          商品清单
        </h3>
        {items.map((item: any) => (
          <div key={item.id} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #EEF1F5, #F7F9FB)' }}>📱</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: '#15181B' }}>{item.product_name}</p>
              <p className="text-xs" style={{ color: '#8B95A5' }}>{item.sku_name}</p>
            </div>
            <span style={{ fontSize: 13, color: '#5F6B7A', whiteSpace: 'nowrap' }}>
              ¥{item.price} × {item.quantity}
            </span>
          </div>
        ))}
      </div>

      {/* ===== 支付方式 ===== */}
      <div className="glass-card p-5 sm:p-6" style={{ borderRadius: 16, marginBottom: 20 }}>
        <h3 style={{
          fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
          fontSize: 15, fontWeight: 600, color: '#15181B',
          margin: '0 0 16px 0',
        }}>
          支付方式
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PAYMENT_METHODS.map(method => (
            <button
              key={method.key}
              onClick={() => setPaymentMethod(method.key)}
              className="tap-active"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                border: paymentMethod === method.key
                  ? '1px solid #3D6A94'
                  : '1px solid rgba(15,23,42,0.06)',
                background: paymentMethod === method.key
                  ? 'rgba(61,106,148,0.04)'
                  : '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: 24, flexShrink: 0 }}>{method.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{
                  fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                  fontSize: 14, fontWeight: 500,
                  color: paymentMethod === method.key ? '#3D6A94' : '#15181B',
                  margin: 0,
                }}>
                  {method.label}
                </p>
                <p style={{
                  fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                  fontSize: 11, color: '#8B95A5',
                  margin: '2px 0 0 0',
                }}>
                  {method.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* 银行卡输入（选银行卡时显示） */}
        {paymentMethod === 'card' && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <input
              type="text" placeholder="卡号 1234 5678 9012 3456" maxLength={19}
              value={cardInfo.number}
              onChange={e => setCardInfo({ ...cardInfo, number: e.target.value })}
              className="input-luxury col-span-full"
            />
            <input
              type="text" placeholder="有效期 MM/YY" maxLength={5}
              value={cardInfo.expiry}
              onChange={e => setCardInfo({ ...cardInfo, expiry: e.target.value })}
              className="input-luxury"
            />
            <input
              type="text" placeholder="安全码 CVV" maxLength={4}
              value={cardInfo.cvv}
              onChange={e => setCardInfo({ ...cardInfo, cvv: e.target.value })}
              className="input-luxury"
            />
          </div>
        )}
      </div>

      {/* ===== 金额汇总 + 支付按钮 ===== */}
      <div className="glass-card p-5 sm:p-6" style={{ borderRadius: 16 }}>
        <div className="flex justify-between text-sm" style={{ marginBottom: 8 }}>
          <span style={{ color: '#8B95A5' }}>商品合计</span>
          <span style={{ color: '#5F6B7A' }}>¥{totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm" style={{ marginBottom: 8 }}>
          <span style={{ color: '#8B95A5' }}>运费</span>
          <span style={{ color: '#2F5579' }}>免运费</span>
        </div>
        <div className="flex justify-between items-baseline" style={{
          paddingTop: 16, marginBottom: 24,
          borderTop: '1px solid rgba(15,23,42,0.06)',
        }}>
          <span style={{
            fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
            fontSize: 15, fontWeight: 500, color: '#15181B',
          }}>
            应付总额
          </span>
          <span style={{
            fontFamily: "'Space Mono','Courier New',monospace",
            fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
            fontWeight: 700, color: '#3D6A94', letterSpacing: '-0.03em',
          }}>
            ¥{totalAmount.toFixed(2)}
          </span>
        </div>

        <button
          onClick={handleSubmitOrder}
          disabled={submitting}
          className="btn-gold w-full"
          style={{ padding: '15px 0', fontSize: 16, fontWeight: 600 }}
        >
          {submitting ? '处理中...' : `确认支付 ¥${totalAmount.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
