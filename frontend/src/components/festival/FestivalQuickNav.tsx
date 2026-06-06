import { QUICK_NAV_ITEMS } from '../../utils/festivalConstants';

/** Module 2 — Brutalist icon nav with numbered blocks */
export default function FestivalQuickNav() {
  return (
    <div
      className="w-full flex items-center justify-evenly"
      style={{ padding: '16px 8px', background: 'var(--fest-white)', borderBottom: '1px solid var(--fest-ink)' }}
    >
      {QUICK_NAV_ITEMS.map((item, i) => (
        <div
          key={item.label}
          className="flex flex-col items-center gap-1.5 cursor-pointer"
          style={{ minWidth: 52 }}
        >
          {/* Numbered circle — brutalist index */}
          <div
            className="flex items-center justify-center font-bold"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: i % 2 === 0 ? 'var(--fest-ink)' : 'var(--fest-white)',
              color: i % 2 === 0 ? 'var(--fest-white)' : 'var(--fest-ink)',
              border: '2px solid var(--fest-ink)',
              fontSize: 16,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </div>
          <span className="text-xs font-bold tracking-wide" style={{ color: 'var(--fest-ink)' }}>
            {item.label}
          </span>
          <span className="text-[10px] tracking-wider" style={{ color: 'var(--fest-concrete)', marginTop: -4 }}>
            {item.desc}
          </span>
        </div>
      ))}
    </div>
  );
}
