import { GUESS_LIKE_DATA } from '../../utils/festivalConstants';

/** Module 5 — Brutalist editorial divider */
export default function GuessYouLikeAnchor() {
  return (
    <div style={{ padding: '28px 16px 20px' }}>
      <div className="fest-rule" />
      <div
        className="flex items-center justify-between mt-4"
        style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: 'var(--fest-concrete)', letterSpacing: '0.15em' }}
      >
        <span>{GUESS_LIKE_DATA.label}</span>
        <span>↓ 下滑探索</span>
      </div>
      <h2
        className="fest-display mt-1"
        style={{ fontSize: 48, lineHeight: 1, color: 'var(--fest-ink)' }}
      >
        {GUESS_LIKE_DATA.chinese}
      </h2>
    </div>
  );
}
