import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle2, Eye, EyeOff, ShoppingCart, BarChart3, PieChart, ShieldCheck, Clock, Globe } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Mohon isi username dan password');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await login(username, password);
    
    if (res.success) {
      setIsSuccess(true);
    } else {
      setError(res.message || 'Login gagal');
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="animate-fade-in" style={{ 
        minHeight: '100vh', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' 
      }}>
        <div className="animate-scale" style={{ 
          width: '100px', height: '100px', borderRadius: '50%', background: '#ec4899',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 50px rgba(236, 72, 153, 0.4)', marginBottom: '24px'
        }}>
          <CheckCircle2 size={60} color="#fff" />
        </div>
        <h2 style={{ color: '#1E293B', fontSize: '24px', fontWeight: 800 }}>Selamat Datang!</h2>
        <p style={{ color: '#64748B', marginTop: '8px' }}>Mempersiapkan dashboard Anda...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .login-container { display: flex; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .login-left { flex: 1.1; background: #0f172a; padding: 60px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; color: white; }
        .login-right { flex: 1; background: #ffffff; display: flex; align-items: center; justify-content: center; position: relative; padding: 40px; }
        
        /* Decoration for left */
        .login-left::before { content: ''; position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(15,23,42,0) 70%); border-radius: 50%; }
        .login-left::after { content: ''; position: absolute; bottom: -50px; left: -50px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(15,23,42,0) 70%); border-radius: 50%; }
        
        .feature-item { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; color: #cbd5e1; font-weight: 500; font-size: 15px; }
        .feature-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: #ec4899; }
        
        .login-input { width: 100%; padding: 14px 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; color: #1e293b; font-weight: 600; outline: none; transition: all 0.2s; font-size: 14px; }
        .login-input:focus { border-color: #ec4899; box-shadow: 0 0 0 3px rgba(236,72,153,0.1); background: #fff; }
        .login-btn { width: 100%; background: #ec4899; color: white; border: none; padding: 16px; border-radius: 12px; font-size: 15px; font-weight: 800; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .login-btn:hover { background: #db2777; transform: translateY(-1px); box-shadow: 0 10px 20px -10px rgba(236,72,153,0.5); }
        .login-btn:active { transform: translateY(0); }
        
        @media (max-width: 900px) {
          .login-container { flex-direction: column; }
          .login-left { display: none; }
          .login-right { width: 100%; min-height: 100vh; }
        }
      `}</style>

      <div className="login-container">
        {/* LEFT SIDE */}
        <div className="login-left">
          <div style={{ position: 'relative', zIndex: 10 }}>
            {/* Logo area */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '80px' }}>
              <div style={{ width: '48px', height: '48px', background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/assets/image/logo_ikt.png" alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>PT. Industri Keluarga Timur</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Sales Management System</div>
              </div>
            </div>

            {/* Main Heading */}
            <h1 style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1.2, margin: '0 0 24px', letterSpacing: '-1px' }}>
              Kelola Tim Sales Anda<br/>
              <span style={{ color: '#ec4899' }}>Lebih Cerdas</span>
            </h1>
            
            <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: 1.6, maxWidth: '480px', marginBottom: '48px' }}>
              Platform pemantauan aktivitas tim sales terintegrasi. Pantau data, laporan penjualan, dan performa tim secara real-time dalam satu sistem.
            </p>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="feature-item">
                <div className="feature-icon"><ShoppingCart size={18} /></div>
                Pesanan Penjualan Real-time
              </div>
              <div className="feature-item">
                <div className="feature-icon"><CheckCircle2 size={18} /></div>
                Manajemen Aktivitas Otomatis
              </div>
              <div className="feature-item">
                <div className="feature-icon"><BarChart3 size={18} /></div>
                Laporan Performa Instan
              </div>
              <div className="feature-item">
                <div className="feature-icon"><PieChart size={18} /></div>
                Dashboard Analitik Live
              </div>
            </div>
          </div>

          {/* Footer Left */}
          <div style={{ display: 'flex', gap: '40px', position: 'relative', zIndex: 10, marginTop: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 800, color: '#fff' }}><ShieldCheck size={20} color="#ec4899" /> 100%</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>Data Aman</div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 800, color: '#fff' }}><Clock size={20} color="#ec4899" /> Real-time</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>Update Data</div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 800, color: '#fff' }}><Globe size={20} color="#ec4899" /> 24/7</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>Akses Online</div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="login-right">
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-1px' }}>Masuk Akun</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '40px' }}>
              Selamat datang kembali! Silakan masuk untuk melanjutkan.
            </p>

            {error && (
              <div className="animate-shake" style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.5px' }}>USERNAME</label>
                <input
                  type="text"
                  placeholder="Masukkan username anda"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.5px' }}>PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                    required
                  />
                  <div 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <a href="#" style={{ color: '#ec4899', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>Lupa Password?</a>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="login-btn"
                style={{ marginTop: '8px' }}
              >
                {isSubmitting ? (
                  <div className="animate-spin" style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                ) : (
                  'Masuk'
                )}
              </button>
            </form>

            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                © 2026 PT. Industri Keluarga Timur. Semua hak dilindungi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
