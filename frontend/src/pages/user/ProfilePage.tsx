import { useAuthStore } from '../../stores/authStore';
import ParticleBackground from '../../components/ParticleBackground';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="relative min-h-screen"><ParticleBackground />
    <div className="page-content max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-xl tracking-[0.2em] text-gold-glow font-semibold mb-8">个人中心</h1>
      <div className="glass-card p-8" style={{ borderRadius: 20 }}>
        <div className="flex items-center gap-5 mb-8 pb-8" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{ background: 'linear-gradient(135deg, #2F5579, #3D6A94)', color: '#FFFFFF' }}>
            {user?.full_name?.[0] || user?.username?.[0] || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 tracking-wider">{user?.full_name || user?.username}</h3>
            <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs tracking-wider"
              style={{ background: 'rgba(61,106,148,0.06)', color: '#3D6A94', border: '1px solid rgba(61,106,148,0.12)' }}>
              {user?.role === 'admin' ? '管理员' : '用户'}
            </span>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          {[
            { label: '用户名', value: user?.username },
            { label: '邮箱', value: user?.email },
            { label: '手机', value: user?.phone || '未设置' },
            { label: '注册时间', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '' },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-2.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
              <span className="text-gray-400 tracking-wider">{row.label}</span>
              <span className="text-gray-600">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div></div>
  );
}
