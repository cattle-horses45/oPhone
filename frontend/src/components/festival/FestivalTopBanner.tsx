import { useNavigate } from 'react-router-dom';

/** Module 1 — Brutalist top banner with ink-on-vermillion urgency */
export default function FestivalTopBanner() {
  const navigate = useNavigate();
  return (
    <div
      className="w-full relative overflow-hidden fest-halftone"
      style={{ background: 'var(--fest-vermillion)', padding: '18px 16px' }}
    >
      <div className="flex items-center justify-between relative z-10">
        {/* Left: geometric decor */}
        <div className="flex gap-1.5 flex-shrink-0">
          <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.5)', transform: 'rotate(45deg)' }} />
          <div style={{ width: 14, height: 14, background: 'rgba(255,255,255,0.3)' }} />
        </div>

        {/* Center: bold mono label + display text */}
        <div className="flex flex-col items-center">
          <span className="fest-label" style={{ color: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
            LIMITED EVENT
          </span>
          <span className="text-white font-bold tracking-widest" style={{ fontSize: 15 }}>
            oPhone 限时特惠 · 精选好物低至5折
          </span>
        </div>

        {/* Right: brutalist button */}
        <button
          onClick={() => navigate('/products')}
          className="flex-shrink-0 text-sm font-bold tracking-widest px-4 py-1.5"
          style={{
            background: 'var(--fest-white)',
            color: 'var(--fest-ink)',
            border: '2px solid rgba(255,255,255,0.6)',
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
          }}
        >
          去逛逛 →
        </button>
      </div>

      {/* Close button — brutal */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-2 right-3 z-20 text-white font-bold"
        style={{ fontSize: 16, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}
      >
        [×]
      </button>
    </div>
  );
}
