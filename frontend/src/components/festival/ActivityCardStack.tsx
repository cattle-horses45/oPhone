import { useNavigate } from 'react-router-dom';
import { ACTIVITY_CARDS } from '../../utils/festivalConstants';

/** Module 4 Right — Stacked brutalist activity cards */
export default function ActivityCardStack() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2 flex-shrink-0" style={{ width: 100 }}>
      {ACTIVITY_CARDS.map((card, i) => (
        <div
          key={i}
          onClick={() => navigate('/products')}
          className="flex-1 cursor-pointer flex flex-col justify-between p-2 relative overflow-hidden"
          style={{
            minHeight: 64,
            border: '2px solid var(--fest-ink)',
            background: 'var(--fest-white)',
            boxShadow: '2px 2px 0px rgba(0,0,0,0.08)',
          }}
        >
          {/* Accent line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 3,
              background: card.accent,
            }}
          />

          <div className="relative z-10">
            <span
              className="font-bold tracking-tight block"
              style={{ fontSize: 16, color: 'var(--fest-ink)', lineHeight: 1.1 }}
            >
              {card.title}
            </span>
            <span
              className="text-xs font-bold block mt-0.5"
              style={{ color: card.accent, fontFamily: "'Space Mono',monospace" }}
            >
              {card.sub}
            </span>
          </div>

          {/* Geometric marker */}
          <div
            className="self-end"
            style={{
              width: 16,
              height: 16,
              border: `2px solid ${card.accent}`,
              transform: 'rotate(45deg)',
              opacity: 0.3,
            }}
          />
        </div>
      ))}
    </div>
  );
}
