import { useEffect, useState } from 'react';
import { getCategories } from '../../api/products';
import type { Category } from '../../types/product';

/** Module 4 Left — Category sidebar, brutalist checkbox list */
export default function CategorySidebar() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => []);
  }, []);

  return (
    <div
      className="flex-shrink-0 overflow-hidden"
      style={{
        width: 190,
        background: 'var(--fest-white)',
        border: '2px solid var(--fest-ink)',
      }}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{
          background: 'var(--fest-ink)',
          color: 'var(--fest-white)',
          borderBottom: '2px solid var(--fest-ink)',
        }}
      >
        <span className="font-bold text-xs tracking-widest" style={{ fontFamily: "'Space Mono',monospace" }}>
          CATEGORIES
        </span>
        <span className="text-[10px] opacity-60">5件起</span>
      </div>

      {/* List */}
      <div>
        {categories.length === 0 ? (
          <div className="px-3 py-6 text-xs text-center" style={{ color: 'var(--fest-concrete)' }}>
            — 加载中 —
          </div>
        ) : (
          categories.map((cat, i) => (
            <div
              key={cat.id}
              className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors"
              style={{
                borderBottom: i < categories.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--fest-ink)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  border: '2px solid var(--fest-ink)',
                  background: 'transparent',
                  flexShrink: 0,
                }}
              />
              <span>{cat.name}</span>
              {i < 3 && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5"
                  style={{ background: 'var(--fest-vermillion)', color: '#fff', fontFamily: "'Space Mono',monospace" }}>
                  HOT
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
