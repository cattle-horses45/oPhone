import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** Module 3 — Logo + Search with brutalist edge */
export default function FestivalHeader() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    const q = query.trim();
    if (q) navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  return (
    <div
      className="w-full flex items-center gap-3 px-4"
      style={{ padding: '14px 16px', background: 'var(--fest-paper)' }}
    >
      {/* Logo mark — geometric O */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div
          className="flex items-center justify-center font-bold"
          style={{
            width: 34,
            height: 34,
            background: 'var(--fest-ink)',
            color: 'var(--fest-white)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16,
          }}
        >
          O
        </div>
        <span className="text-[11px] font-bold tracking-wider hidden sm:inline" style={{ color: 'var(--fest-ink)' }}>
          oPhone
        </span>
      </div>

      {/* Search bar — brutalist border */}
      <div
        className="flex-1 flex items-center h-9 overflow-hidden"
        style={{ border: '1.5px solid var(--fest-ink)', background: 'var(--fest-white)' }}
      >
        <div
          className="flex items-center gap-1 px-2.5 text-[11px] font-bold font-mono flex-shrink-0 h-full border-r"
          style={{ borderColor: 'var(--fest-ink)', color: 'var(--fest-ink)' }}
        >
          宝贝 ▾
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="搜索..."
          className="flex-1 px-2.5 text-sm outline-none h-full"
          style={{
            background: 'transparent',
            color: 'var(--fest-ink)',
            fontFamily: "'DM Sans','Noto Sans SC',sans-serif",
          }}
        />
        <button
          onClick={handleSearch}
          className="h-full px-4 flex-shrink-0 font-bold text-xs tracking-widest"
          style={{ background: 'var(--fest-ink)', color: 'var(--fest-white)' }}
        >
          搜索
        </button>
      </div>
    </div>
  );
}
