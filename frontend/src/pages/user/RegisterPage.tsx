import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { register } from '../../api/auth';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      setError('请填写所有必填字段');
      return;
    }
    if (form.username.trim().length < 3) {
      setError('用户名至少需要3个字符');
      return;
    }
    if (form.password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }
    setLoading(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim() || undefined,
      });
      await login({ username: form.username.trim(), password: form.password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div
      className="min-h-[85vh] flex items-center justify-center p-4 md:p-8"
      style={{ background: '#F4F6F9' }}
    >
      {/* Card container — split layout */}
      <div
        className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden"
        style={{
          borderRadius: 12,
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04)',
          animation: 'fadeInUp 0.6s ease-out',
        }}
      >
        {/* ========== Left: Brand Panel ========== */}
        <div
          className="hidden md:flex md:w-[42%] flex-col justify-between p-10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #2F5579 0%, #3D6A94 40%, #5C8DB8 100%)',
          }}
        >
          {/* Precision crosshair — top right */}
          <div className="absolute top-8 right-8 opacity-20">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="0.5" />
              <circle cx="24" cy="24" r="4" stroke="white" strokeWidth="0.5" />
              <line x1="24" y1="0" x2="24" y2="12" stroke="white" strokeWidth="0.5" />
              <line x1="24" y1="36" x2="24" y2="48" stroke="white" strokeWidth="0.5" />
              <line x1="0" y1="24" x2="12" y2="24" stroke="white" strokeWidth="0.5" />
              <line x1="36" y1="24" x2="48" y2="24" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Grid texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(white 0.5px, transparent 0.5px), linear-gradient(90deg, white 0.5px, transparent 0.5px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Top: Logo + Brand */}
          <div className="relative z-10">
            <div
              className="inline-flex items-center justify-center w-12 h-12 mb-8"
              style={{
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 8,
                backdropFilter: 'blur(8px)',
              }}
            >
              <span
                className="text-xl font-bold"
                style={{ fontFamily: "'Space Mono', 'Courier New', monospace", color: '#FFFFFF' }}
              >
                O
              </span>
            </div>
            <h2
              className="text-white font-semibold mb-3"
              style={{ fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1.2 }}
            >
              加入 oPhone
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              创建你的账户，<br />
              开启精密科技之旅。
            </p>
          </div>

          {/* Bottom: decorative line + tagline */}
          <div className="relative z-10">
            <div className="w-16 h-px mb-4" style={{ background: 'rgba(255,255,255,0.2)' }} />
            <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Space Mono', 'Courier New', monospace" }}>
              The Precision Instrument
            </p>
          </div>
        </div>

        {/* ========== Right: Form Panel ========== */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          {/* Mobile-only logo */}
          <div className="md:hidden text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4"
              style={{
                background: 'linear-gradient(135deg, #2F5579, #3D6A94)',
              }}
            >
              <span className="text-xl font-bold text-white" style={{ fontFamily: "'Space Mono', monospace" }}>O</span>
            </div>
            <h1 className="text-xl font-semibold" style={{ color: '#15181B', letterSpacing: '-0.01em' }}>
              注册 oPhone
            </h1>
          </div>

          {/* Desktop title */}
          <div className="hidden md:block mb-8">
            <h1 className="text-2xl font-semibold mb-1" style={{ color: '#15181B', letterSpacing: '-0.01em' }}>
              创建账号
            </h1>
            <p className="text-sm" style={{ color: '#8B95A5' }}>
              已有账号？{' '}
              <Link to="/login" className="font-medium hover:underline" style={{ color: '#3D6A94' }}>
                立即登录
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error banner */}
            {error && (
              <div
                className="text-sm text-center py-3 px-4 rounded-md"
                style={{
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.12)',
                  color: '#DC2626',
                }}
              >
                {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#5F6B7A' }}
              >
                用户名 <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => update('username', e.target.value)}
                required
                minLength={3}
                placeholder="至少3个字符"
                autoComplete="username"
                className="w-full px-4 py-3 text-[15px] rounded-md outline-none transition-all duration-200"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(15,23,42,0.12)',
                  color: '#15181B',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#3D6A94';
                  e.target.style.boxShadow = '0 0 0 3px rgba(61,106,148,0.10)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(15,23,42,0.12)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#5F6B7A' }}
              >
                邮箱 <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
                placeholder="example@email.com"
                autoComplete="email"
                className="w-full px-4 py-3 text-[15px] rounded-md outline-none transition-all duration-200"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(15,23,42,0.12)',
                  color: '#15181B',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#3D6A94';
                  e.target.style.boxShadow = '0 0 0 3px rgba(61,106,148,0.10)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(15,23,42,0.12)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Full name */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#5F6B7A' }}
              >
                昵称 <span className="text-xs ml-1" style={{ color: '#8B95A5' }}>(选填)</span>
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => update('full_name', e.target.value)}
                placeholder="你的昵称"
                autoComplete="name"
                className="w-full px-4 py-3 text-[15px] rounded-md outline-none transition-all duration-200"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(15,23,42,0.12)',
                  color: '#15181B',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#3D6A94';
                  e.target.style.boxShadow = '0 0 0 3px rgba(61,106,148,0.10)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(15,23,42,0.12)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#5F6B7A' }}
              >
                密码 <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                  minLength={6}
                  placeholder="至少6个字符"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-12 text-[15px] rounded-md outline-none transition-all duration-200"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(15,23,42,0.12)',
                    color: '#15181B',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#3D6A94';
                    e.target.style.boxShadow = '0 0 0 3px rgba(61,106,148,0.10)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(15,23,42,0.12)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors duration-150"
                  style={{ color: '#8B95A5' }}
                  aria-label={showPwd ? '隐藏密码' : '显示密码'}
                  tabIndex={-1}
                >
                  {showPwd ? (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-base font-medium rounded-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none"
              style={{
                background: '#3D6A94',
                color: '#FFFFFF',
                marginTop: 8,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2F5579'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#3D6A94'; }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  注册中...
                </span>
              ) : '注 册'}
            </button>
          </form>

          {/* Mobile login link */}
          <p className="md:hidden text-center text-sm mt-6" style={{ color: '#8B95A5' }}>
            已有账号？{' '}
            <Link to="/login" className="font-medium hover:underline" style={{ color: '#3D6A94' }}>
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
