import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '../../stores/authStore';
import { createChatSession } from '../../api/chat';

const QUICK_QUESTIONS = [
  'oPhone支持哪些支付方式？',
  '如何申请退换货？',
  '订单发货后多久能收到？',
];

/* ──── design tokens (aligned to DESIGN.md) ──── */
const T = {
  accent:      '#3D6A94',
  accentDark:  '#2F5579',
  accentDim:   'rgba(61,106,148,0.08)',
  accentRing:  'rgba(61,106,148,0.15)',
  panelBg:     '#FFFFFF',
  chatBg:      '#F7F9FB',
  bubbleAI:    '#EEF1F5',
  ink:         '#15181B',
  secondary:   '#5F6B7A',
  muted:       '#8B95A5',
  border:      'rgba(15,23,42,0.06)',
  borderLight: 'rgba(15,23,42,0.04)',
};

/* ──── tiny inline icons ──── */
const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconChat = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconHeadset = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0118 0v6" /><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
  </svg>
);

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div style={{
        display: 'flex', gap: 4, padding: '10px 16px', borderRadius: '12px 12px 12px 4px',
        background: T.bubbleAI, border: `1px solid ${T.borderLight}`,
      }}>
        {[0, 120, 240].map(delay => (
          <span key={delay} style={{
            display: 'block', width: 6, height: 6, borderRadius: '50%', background: T.accent,
            opacity: 0.5, animation: `chatBounce 1.4s ${delay}ms infinite ease-in-out`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes chatBounce { 0%,80%,100% { transform:scale(0.6); opacity:0.3; } 40% { transform:scale(1); opacity:0.7; } }
      `}</style>
    </div>
  );
}

export default function ChatWidget() {
  const { isAuthenticated, token } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [justOpened, setJustOpened] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamBufferRef = useRef<string>('');
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearLoadingTimer = () => {
    if (loadingTimerRef.current) { clearTimeout(loadingTimerRef.current); loadingTimerRef.current = null; }
  };

  /* ── scroll to bottom ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTyping]);

  /* ── auto-focus input when panel opens ── */
  useEffect(() => {
    if (isOpen && justOpened) {
      setTimeout(() => inputRef.current?.focus(), 250);
      setJustOpened(false);
    }
  }, [isOpen, justOpened]);

  const initSession = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setMessages([{ sender_type: 'ai', content: '您好！请先**登录**以获取完整客服体验。', id: 'init' }]);
      return;
    }
    try {
      const session = await createChatSession();
      setSessionId(session.id);
      setMessages([{ sender_type: 'ai', content: '您好！我是 oPhone 智能客服小 O，有什么可以帮您的吗？', id: 'init' }]);
    } catch {
      setMessages([{ sender_type: 'ai', content: '服务暂不可用，请稍后再试。', id: 'init' }]);
    }
  }, [isAuthenticated, token]);

  /* ── WebSocket lifecycle ── */
  useEffect(() => {
    if (!sessionId || !token) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat/${sessionId}?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        switch (data.event) {
          case 'stream_start':
            streamBufferRef.current = '';
            setMessages(prev => [...prev, { sender_type: 'ai', content: '', id: 'streaming', streaming: true }]);
            setAiTyping(true);
            break;
          case 'stream_token':
            streamBufferRef.current += data.data.token;
            setMessages(prev => prev.map(m =>
              m.id === 'streaming' ? { ...m, content: streamBufferRef.current } : m
            ));
            break;
          case 'stream_end':
            setMessages(prev => prev.map(m =>
              m.id === 'streaming' ? { ...m, id: Date.now(), streaming: false } : m
            ));
            clearLoadingTimer();
            loadingTimerRef.current = setTimeout(() => { setLoading(false); setAiTyping(false); }, 5000);
            break;
          case 'message_saved':
            clearLoadingTimer();
            setMessages(prev => prev.map(m =>
              m.id === 'streaming' ? { ...m, id: data.data?.id || m.id, streaming: false } : m
            ));
            setAiTyping(false); setLoading(false);
            break;
          case 'new_message':
            setMessages(prev => [...prev, { ...data.data, id: data.data.id || Date.now() }]);
            setAiTyping(false); setLoading(false);
            break;
          case 'ai_typing':
            setAiTyping(data.data.is_typing);
            break;
          case 'transfer_notify':
            setTransferring(true); setLoading(false);
            break;
          case 'error':
            clearLoadingTimer(); setAiTyping(false); setLoading(false);
            setMessages(prev => [...prev, { sender_type: 'ai', content: data.data?.message || '系统错误，请重试', id: Date.now() }]);
            break;
          case 'pong': break;
        }
      } catch { /* ignore parse errors */ }
    };
    ws.onclose = () => { wsRef.current = null; clearLoadingTimer(); setLoading(false); setAiTyping(false); };
    ws.onerror = () => { clearLoadingTimer(); setLoading(false); setAiTyping(false); };

    pingTimerRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ event: 'ping' }));
    }, 25000);

    return () => {
      clearLoadingTimer();
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      ws.onclose = null; ws.onerror = null;
      ws.close();
    };
  }, [sessionId, token]);

  const handleOpen = () => {
    setIsOpen(true);
    setJustOpened(true);
    if (messages.length === 0) initSession();
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const content = input.trim();
    setInput('');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'send_message', data: { content } }));
      setMessages(prev => [...prev, { sender_type: 'user', content, id: Date.now() }]);
      setLoading(true);
    } else if (!isAuthenticated) {
      setMessages(prev => [...prev, { sender_type: 'user', content, id: Date.now() }, { sender_type: 'ai', content: '请先登录后再使用客服功能。', id: Date.now() + 1 }]);
    } else {
      setMessages(prev => [...prev, { sender_type: 'user', content, id: Date.now() }]);
      setLoading(true);
      createChatSession().then(session => {
        setSessionId(session.id);
        setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ event: 'send_message', data: { content } }));
          } else {
            setMessages(prev => [...prev, { sender_type: 'ai', content: '连接失败，请刷新页面重试', id: Date.now() }]);
            setLoading(false);
          }
        }, 500);
      }).catch(() => {
        setMessages(prev => [...prev, { sender_type: 'ai', content: '服务暂不可用，请稍后再试', id: Date.now() }]);
        setLoading(false);
      });
    }
  };

  const handleTransfer = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'transfer_to_human', data: { reason: '用户请求转人工' } }));
      setTransferring(true);
    }
  };

  const handleQuickTap = (q: string) => {
    setInput(q);
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !loading) {
        wsRef.current.send(JSON.stringify({ event: 'send_message', data: { content: q } }));
        setMessages(prev => [...prev, { sender_type: 'user', content: q, id: Date.now() }]);
        setLoading(true);
        setInput('');
      }
    }, 100);
  };

  /* ──── RENDER ──── */

  return (
    <>
      {/* ═══════ FAB button ═══════ */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          aria-label="打开客服对话"
          className="fixed bottom-6 right-6 z-50 group"
          style={{
            width: 52, height: 52, border: 'none', borderRadius: '50%', cursor: 'pointer',
            background: `linear-gradient(135deg, ${T.accentDark}, ${T.accent})`,
            boxShadow: `0 2px 16px rgba(61,106,148,0.28)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = `0 4px 24px rgba(61,106,148,0.36)`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 2px 16px rgba(61,106,148,0.28)`; }}
        >
          <span style={{ color: '#FFFFFF', lineHeight: 0 }}><IconChat /></span>
          {/* pulse ring */}
          <span style={{
            position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid rgba(61,106,148,0.2)',
            animation: 'fabPulse 2.5s ease-in-out infinite', pointerEvents: 'none',
          }} />
        </button>
      )}
      <style>{`@keyframes fabPulse { 0%,100% { transform:scale(1); opacity:0.4; } 50% { transform:scale(1.08); opacity:0; } }`}</style>

      {/* ═══════ Chat panel ═══════ */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[400px] md:w-[440px] flex flex-col overflow-hidden"
          style={{
            borderRadius: 10, background: T.panelBg,
            border: `1px solid ${T.border}`, maxHeight: 'calc(100vh - 100px)', minHeight: 420,
            boxShadow: '0 8px 40px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)',
            animation: 'panelIn 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <style>{`
            @keyframes panelIn { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
            @media (prefers-reduced-motion:reduce) { @keyframes panelIn { from { opacity:0 } to { opacity:1 } } }
          `}</style>

          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: '#FFFFFF',
            borderBottom: `1px solid ${T.borderLight}`,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: `linear-gradient(135deg, ${T.accentDark}, ${T.accent})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, color: '#FFFFFF',
                fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                flexShrink: 0,
              }}>O</div>
              <div>
                <div style={{
                  fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                  fontSize: 14, fontWeight: 600, color: T.ink, lineHeight: 1.3,
                }}>oPhone 客服小 O</div>
                <div style={{
                  fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                  fontSize: 11, lineHeight: 1.3,
                  color: transferring ? T.accent : (aiTyping ? T.secondary : T.muted),
                  transition: 'color 0.2s ease',
                }}>
                  {transferring ? '已转接人工' : aiTyping ? '正在输入…' : '在线 · 通常秒回'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {isAuthenticated && !transferring && (
                <button onClick={handleTransfer} aria-label="转人工客服" style={{
                  fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                  fontSize: 11, fontWeight: 500, padding: '4px 10px',
                  border: `1px solid rgba(61,106,148,0.25)`, borderRadius: 6,
                  background: 'transparent', color: T.accent, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.accentDim; e.currentTarget.style.borderColor = T.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(61,106,148,0.25)'; }}
                >
                  <IconHeadset /> 转人工
                </button>
              )}
              <button onClick={() => setIsOpen(false)} aria-label="关闭客服" style={{
                width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent',
                color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = T.secondary; e.currentTarget.style.background = 'rgba(15,23,42,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.background = 'transparent'; }}
              >
                <IconClose />
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 14px', background: T.chatBg,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {messages.map((msg, idx) => {
              const isUser = msg.sender_type === 'user';
              return (
                <div key={msg.id || idx} style={{
                  display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
                  animation: 'msgIn 0.25s cubic-bezier(0.16,1,0.3,1)',
                }}>
                  <div style={{
                    maxWidth: '84%', padding: '9px 14px',
                    fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                    fontSize: 13.5, lineHeight: 1.55, wordBreak: 'break-word',
                    borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background: isUser ? `linear-gradient(135deg, ${T.accentDark}, ${T.accent})` : T.bubbleAI,
                    color: isUser ? '#FFFFFF' : T.ink,
                    border: isUser ? 'none' : `1px solid ${T.borderLight}`,
                  }}>
                    {isUser ? msg.content : (
                      <ReactMarkdown components={{
                        p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
                        strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                        li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
                        code: ({ children }) => (
                          <code style={{ background: 'rgba(15,23,42,0.06)', padding: '1px 4px', borderRadius: 3, fontSize: '0.92em', fontFamily: "'Space Mono','Courier New',monospace" }}>{children}</code>
                        ),
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: T.accent, textDecoration: 'underline' }}>{children}</a>
                        ),
                      }}>{msg.content}</ReactMarkdown>
                    )}
                    {msg.streaming && (
                      <span style={{ display: 'inline-block', width: 6, height: 15, marginLeft: 2, background: T.accent, verticalAlign: 'middle', borderRadius: 2, animation: 'cursorBlink 1s step-end infinite' }} />
                    )}
                  </div>
                </div>
              );
            })}

            {aiTyping && !messages.some(m => m.streaming) && <TypingIndicator />}

            <div ref={messagesEndRef} style={{ height: 0 }} />
          </div>
          <style>{`
            @keyframes msgIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
            @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
            @media (prefers-reduced-motion:reduce) { @keyframes msgIn { from { opacity:0 } to { opacity:1 } } }
          `}</style>

          {/* ── Quick questions (only when ≤1 message) ── */}
          {messages.length <= 1 && (
            <div style={{
              padding: '10px 14px', borderTop: `1px solid ${T.borderLight}`, background: T.panelBg, flexShrink: 0,
            }}>
              <div style={{
                fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                fontSize: 10.5, fontWeight: 500, color: T.muted, marginBottom: 6,
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                试试这些问题
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {QUICK_QUESTIONS.map(q => (
                  <button key={q} onClick={() => handleQuickTap(q)} style={{
                    fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                    fontSize: 12, fontWeight: 400, padding: '5px 12px',
                    border: `1px solid ${T.border}`, borderRadius: 6,
                    background: T.panelBg, color: T.secondary, cursor: 'pointer',
                    transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.accentDim; e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.panelBg; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary; }}
                  >{q}</button>
                ))}
              </div>
            </div>
          )}

          {/* ── Input ── */}
          <div style={{
            padding: '10px 14px', borderTop: `1px solid ${T.borderLight}`, background: T.panelBg, flexShrink: 0,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={loading ? '请等待回复…' : '输入问题后按 Enter 发送'}
                disabled={loading}
                aria-label="输入消息"
                style={{
                  flex: 1, padding: '10px 14px', fontSize: 13.5,
                  fontFamily: "'Inter','Noto Sans SC',system-ui,sans-serif",
                  background: T.chatBg, border: `1px solid ${T.border}`, borderRadius: 8,
                  color: T.ink, outline: 'none',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = T.accent;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentRing}`;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label="发送消息"
                style={{
                  width: 40, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: loading || !input.trim() ? `${T.bubbleAI}` : `linear-gradient(135deg, ${T.accentDark}, ${T.accent})`,
                  color: loading || !input.trim() ? T.muted : '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, opacity: loading || !input.trim() ? 0.3 : 1,
                  transition: 'background 0.15s ease, opacity 0.15s ease, transform 0.15s ease',
                }}
                onMouseEnter={e => { if (!loading && input.trim()) e.currentTarget.style.transform = 'scale(1.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <IconSend />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
