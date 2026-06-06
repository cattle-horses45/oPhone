import { useState, useEffect, useRef } from 'react';
import { CAROUSEL_SLIDES } from '../../utils/festivalConstants';

/** Module 4 Center — Brutalist editorial carousel */
export default function FestivalCarousel() {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const len = CAROUSEL_SLIDES.length;

  useEffect(() => {
    const timer = setInterval(() => setCurrent((p) => (p + 1) % len), 3500);
    return () => clearInterval(timer);
  }, [len]);

  const go = (idx: number) => setCurrent(((idx % len) + len) % len);

  const slide = CAROUSEL_SLIDES[current];

  return (
    <div
      className="flex-1 mx-1.5 relative overflow-hidden"
      style={{
        minWidth: 0,
        height: 290,
        background: 'var(--fest-paper)',
        border: '2px solid var(--fest-ink)',
        boxShadow: 'var(--fest-shadow)',
      }}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) go(diff > 0 ? current + 1 : current - 1);
      }}
    >
      {/* Halftone overlay */}
      <div className="fest-halftone absolute inset-0 z-0" />

      {/* Tag pill */}
      <span
        className="absolute top-3 left-3 z-10 fest-label"
        style={{ color: 'var(--fest-vermillion)', borderColor: 'var(--fest-vermillion)' }}
      >
        {slide.tag}
      </span>

      {/* Diagonal accent block */}
      <div
        className="absolute z-0"
        style={{
          top: -20,
          right: -40,
          width: 180,
          height: 200,
          background: 'var(--fest-cerulean)',
          opacity: 0.06,
          transform: 'rotate(-15deg)',
        }}
      />

      {/* Editorial typography */}
      <div className="absolute left-4 bottom-24 z-10">
        <div className="fest-num mb-1">0{current + 1} / 0{len}</div>
        <h2
          className="fest-display"
          style={{ fontSize: 64, lineHeight: 0.85, color: 'var(--fest-ink)' }}
        >
          {slide.title}
        </h2>
        <h3
          className="fest-display"
          style={{ fontSize: 36, color: 'var(--fest-vermillion)', marginTop: -4 }}
        >
          {slide.subtitle}
        </h3>
        <p className="text-xs mt-2 tracking-wide" style={{ color: 'var(--fest-concrete)' }}>
          {slide.detail}
        </p>
      </div>

      {/* Big geometric accent */}
      <div
        className="absolute right-4 bottom-4"
        style={{
          width: 80,
          height: 80,
          border: '4px solid var(--fest-ink)',
          opacity: 0.15,
          transform: 'rotate(30deg)',
        }}
      />

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {CAROUSEL_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            style={{
              width: i === current ? 24 : 6,
              height: 6,
              background: i === current ? 'var(--fest-ink)' : 'var(--fest-concrete)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
