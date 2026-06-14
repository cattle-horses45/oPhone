import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { useAuthStore } from '../../stores/authStore';

const C = {
  cardBg: '#FFFFFF', cardBorder: 'rgba(15,23,42,0.06)',
  textPrimary: '#15181B', textSecondary: '#5F6B7A', textMuted: '#8B95A5',
  accent: '#3D6A94', accentDim: 'rgba(61,106,148,0.08)',
};

export default function HumanChatPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const { token } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef<Set<number | string>>(new Set());

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { adminApi.getChatQueue().then(res => setQueue(res.queue || [])).catch(() => {}); }, []);

  const addMessage = useCallback((msg: any) => {
    // 用 id 去重
    if (msg.id && seenRef.current.has(msg.id)) return;
    if (msg.id) seenRef.current.add(msg.id);
    setMessages(prev => {
      if (msg.id && prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  // Queue listener
  useEffect(() => {
    if (!token) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const s = new WebSocket(`${protocol}//${window.location.host}/ws/admin/queue?token=${token}`);
    s.onmessage = e => {
      try {
        const d = JSON.parse(e.data);
        if (d.event === 'queue_update') setQueue(d.data.queue_list || []);
      } catch {}
    };
    return () => s.close();
  }, [token]);

  const handleAccept = (sessionId: number) => {
    if (wsRef.current) wsRef.current.close();
    setActiveId(sessionId);
    setMessages([]);
    seenRef.current = new Set();

    adminApi.acceptChatSession(sessionId).then(() => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const s = new WebSocket(`${protocol}//${window.location.host}/ws/admin/chat/${sessionId}?token=${token}`);
      s.onmessage = e => {
        try {
          const d = JSON.parse(e.data);
          if (d.event === 'chat_history') {
            // 加载历史消息
            const history = d.data?.messages || [];
            seenRef.current = new Set(history.map((m: any) => m.id).filter(Boolean));
            setMessages(history);
          } else if (d.event === 'new_message') {
            addMessage(d.data);
          }
        } catch {}
      };
      s.onclose = () => { wsRef.current = null; };
      wsRef.current = s;
    }).catch(() => {});
  };

  const handleSend = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const content = input;
    wsRef.current.send(JSON.stringify({ event: 'send_message', data: { content } }));
    // 不用手动加到 messages——服务器会通过 WS 回传（给用户的消息也发回 admin 确认）
    // 但为了即时 UI 体验，先 optimistic add:
    addMessage({ sender_type: 'admin', content, id: 'sending_' + Date.now() });
    setInput('');
  };

  const handleClose = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'close_session' }));
    }
    if (wsRef.current) wsRef.current.close();
    setActiveId(null);
    setMessages([]);
    seenRef.current = new Set();
  };

  const handleTransferBack = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'transfer_back_to_ai' }));
    }
    setActiveId(null);
    setMessages([]);
    seenRef.current = new Set();
  };

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-wide mb-6" style={{ color: C.textPrimary }}>人工客服</h2>
      <div className="grid lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Queue */}
        <div className="rounded-lg p-4 overflow-auto" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
          <h3 className="text-xs font-medium tracking-wide mb-3" style={{ color: C.textSecondary }}>等待队列 ({queue.length})</h3>
          {queue.length === 0 ? (
            <p className="text-xs text-center py-10" style={{ color: C.textMuted }}>暂无等待</p>
          ) : (
            <div className="space-y-2">
              {queue.map((q: any) => (
                <div key={q.session_id} className="rounded-md p-3 transition-colors"
                  style={{ background: '#F4F6F9', border: `1px solid ${C.cardBorder}` }}>
                  <p className="text-xs font-medium" style={{ color: C.textPrimary }}>{q.user_name}</p>
                  <p className="text-xs mt-1" style={{ color: C.textMuted }}>{q.reason}</p>
                  <button onClick={() => handleAccept(q.session_id)}
                    className="mt-2.5 w-full py-1.5 rounded-md text-xs font-medium transition-opacity hover:opacity-90"
                    style={{ background: C.accent, color: '#FFFFFF' }}>接受</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="lg:col-span-2 rounded-lg flex flex-col" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
          {activeId ? (
            <>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                <span className="text-sm font-medium" style={{ color: C.textPrimary }}>会话 #{activeId}</span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button onClick={handleTransferBack} className="text-xs transition-colors" style={{ color: C.accent }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>转回AI</button>
                  <button onClick={handleClose} className="text-xs transition-colors" style={{ color: C.textMuted }}
                    onMouseEnter={e => e.currentTarget.style.color = '#e06070'}
                    onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>结束会话</button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {messages.map((m, idx) => {
                  const isAdmin = m.sender_type === 'admin';
                  return (
                    <div key={m.id || idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[75%] px-4 py-2.5 rounded-lg text-sm" style={{
                        background: isAdmin ? C.accentDim : 'rgba(0,0,0,0.04)',
                        color: C.textPrimary,
                        borderRadius: isAdmin ? '8px 8px 4px 8px' : '8px 8px 8px 4px',
                      }}>{m.content}</div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="px-4 py-3 flex gap-2" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="输入回复…" className="flex-1 px-3 py-2 text-sm rounded-md outline-none"
                  style={{ background: '#EEF1F5', border: `1px solid ${C.cardBorder}`, color: C.textPrimary }} />
                <button onClick={handleSend}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ background: C.accent, color: '#FFFFFF' }}>发送</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm" style={{ color: C.textMuted }}>请从左侧选择一个会话</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
