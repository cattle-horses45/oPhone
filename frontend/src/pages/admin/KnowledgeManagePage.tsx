import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';

const C = {
  cardBg: '#FFFFFF', cardBorder: 'rgba(0,0,0,0.06)',
  textPrimary: '#15181B', textSecondary: '#5F6B7A', textMuted: '#8B95A5',
  accent: '#3D6A94', danger: '#e06070',
};
const CAT_COLORS: Record<string, string> = {
  product: 'rgba(108,142,239,0.12)', order: 'rgba(91,192,160,0.12)',
  aftersale: 'rgba(232,168,80,0.12)', general: 'rgba(0,0,0,0.04)',
};
const CAT_TEXT: Record<string, string> = {
  product: '#6c8eef', order: '#5bc0a0', aftersale: '#e8a850', general: '#5F6B7A',
};

export default function KnowledgeManagePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    adminApi.getKnowledge({ search: search || undefined, page_size: 100 }).then(res => { setItems(res.items || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, [search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold tracking-wide" style={{ color: C.textPrimary }}>知识库管理</h2>
        <span className="text-xs" style={{ color: C.textMuted }}>{items.length} 条</span>
      </div>
      <div className="mb-5">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索知识库…"
          className="w-full max-w-sm px-4 py-2.5 text-sm rounded-xl outline-none transition-all duration-200"
          style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.textPrimary }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(61,106,148,0.25)'}
          onBlur={e => e.currentTarget.style.borderColor = C.cardBorder}
        />
      </div>
      <div className="space-y-2.5">
        {loading ? (
          <div className="flex justify-center py-14"><div className="w-5 h-5 border-2 border-[#3D6A94] border-t-transparent rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-14 rounded-xl text-xs" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}>暂无知识条目</div>
        ) : items.map(item => (
          <div key={item.id} className="rounded-xl p-5 transition-colors" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: CAT_COLORS[item.category] || CAT_COLORS.general, color: CAT_TEXT[item.category] || CAT_TEXT.general }}>
                {item.category === 'product' ? '产品咨询' : item.category === 'order' ? '订单' : item.category === 'aftersale' ? '售后' : '通用'}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: C.textMuted }}>优先级 {item.priority}</span>
                <button onClick={async () => { if (confirm('确认删除？')) { await adminApi.deleteKnowledge(item.id); load(); } }}
                  className="text-xs transition-colors" style={{ color: C.textMuted }}
                  onMouseEnter={e => e.currentTarget.style.color = C.danger}
                  onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>删除</button>
              </div>
            </div>
            <p className="text-sm font-medium mb-1.5" style={{ color: C.textPrimary }}>Q: {item.question}</p>
            <p className="text-sm leading-relaxed" style={{ color: C.textSecondary }}>A: {item.answer}</p>
            {item.keywords && <p className="text-xs mt-2" style={{ color: C.textMuted }}>关键词: {item.keywords}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
