import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FestivalTopBanner from '../../components/festival/FestivalTopBanner';
import FestivalQuickNav from '../../components/festival/FestivalQuickNav';
import FestivalHeader from '../../components/festival/FestivalHeader';
import CategorySidebar from '../../components/festival/CategorySidebar';
import FestivalCarousel from '../../components/festival/FestivalCarousel';
import ActivityCardStack from '../../components/festival/ActivityCardStack';
import GuessYouLikeAnchor from '../../components/festival/GuessYouLikeAnchor';
import WaterfallProductList from '../../components/festival/WaterfallProductList';

/** oPhone Festival — Brutalist Editorial H5 */
export default function FestivalPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Staggered reveal on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reveals = container.querySelectorAll('.fest-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -30px 0px' }
    );

    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full"
      style={{
        background: 'var(--fest-paper)',
      }}
    >
      {/* M1: Banner */}
      <div className="fest-reveal" style={{ animationDelay: '0ms' }}>
        <FestivalTopBanner />
      </div>

      {/* M2: Quick Nav */}
      <div className="fest-reveal" style={{ animationDelay: '100ms' }}>
        <FestivalQuickNav />
      </div>

      {/* M3: Logo + Search */}
      <div className="fest-reveal" style={{ animationDelay: '200ms' }}>
        <FestivalHeader />
      </div>

      {/* M4: 3-column layout */}
      <div className="fest-reveal" style={{ animationDelay: '300ms' }}>
        <div className="flex gap-2 px-2.5 py-3">
          <CategorySidebar />
          <FestivalCarousel />
          <ActivityCardStack />
        </div>
      </div>

      {/* M5: Anchor */}
      <div className="fest-reveal" style={{ animationDelay: '400ms' }}>
        <GuessYouLikeAnchor />
      </div>

      {/* Waterfall */}
      <WaterfallProductList />

      {/* Floating action bar */}
      <div className="fest-float">
        {[
          { char: '♥', label: '收藏' },
          { char: '◎', label: '购物车' },
          { char: '⬒', label: '复制' },
          { char: '?', label: '客服' },
        ].map((item) => (
          <button
            key={item.label}
            className="fest-float-btn"
            title={item.label}
            onClick={() => {
              if (item.label === '购物车') navigate('/cart');
            }}
          >
            {item.char}
          </button>
        ))}
      </div>
    </div>
  );
}
