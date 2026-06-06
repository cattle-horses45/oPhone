import { Outlet } from 'react-router-dom';

/** Brutalist festival layout — no particle bg, raw ink-on-paper aesthetic */
export default function FestivalLayout() {
  return (
    <div
      className="festival-body min-h-screen flex flex-col w-full"
      style={{ background: 'var(--fest-paper)', overflowX: 'hidden' }}
    >
      {/* Grain texture overlay */}
      <div
        className="noise-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
