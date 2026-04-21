import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Lock, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
          width: '100px', height: '100px', borderRadius: '50%', background: 'var(--brand-yellow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 50px rgba(255, 204, 0, 0.4)', marginBottom: '24px'
        }}>
          <CheckCircle2 size={60} color="#000" />
        </div>
        <h2 style={{ color: '#1E293B', fontSize: '24px', fontWeight: 800 }}>Selamat Datang!</h2>
        <p style={{ color: '#64748B', marginTop: '8px' }}>Mempersiapkan dashboard Anda...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#FFFFFF',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255, 204, 0, 0.1)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.05)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div className="login-card animate-fade-up" style={{ width: '100%', maxWidth: '400px', zIndex: 10, background: '#FFFFFF', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)', borderRadius: '32px', border: '1px solid #f1f5f9', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '80px', height: '80px', background: '#fff', borderRadius: '24px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            boxShadow: '0 12px 24px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9'
          }}>
            <img src="/assets/image/logo_ikt.png" alt="Logo IKT" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 950, color: '#1E293B', margin: 0, letterSpacing: '-1px' }}>Log Masuk</h1>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '8px', fontWeight: 600 }}>Smart Monitoring System — PT IKT</p>
        </div>

        {error && (
          <div className="animate-shake" style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', padding: '16px', borderRadius: '16px', marginBottom: '24px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px' }}>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 800, color: '#475569', marginLeft: '4px' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <User size={18} strokeWidth={2.5} />
              </div>
              <input
                type="text"
                placeholder="Masukkan username anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', background: '#F8FAFC', border: '2px solid #F1F5F9', color: '#1E293B', fontWeight: 700, outline: 'none' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 800, color: '#475569', marginLeft: '4px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <Lock size={18} strokeWidth={2.5} />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', background: '#F8FAFC', border: '2px solid #F1F5F9', color: '#1E293B', fontWeight: 700, outline: 'none' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="tap-active"
            style={{
              width: '100%',
              background: 'var(--brand-yellow)',
              color: '#111827',
              border: 'none',
              padding: '18px',
              borderRadius: '20px',
              fontSize: '16px',
              fontWeight: 950,
              cursor: 'pointer',
              marginTop: '10px',
              boxShadow: '0 12px 24px rgba(255, 204, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.3s'
            }}
          >
            {isSubmitting ? (
              <div className="animate-spin" style={{ width: '20px', height: '20px', border: '3px solid rgba(17,24,39,0.15)', borderTopColor: '#111827', borderRadius: '50%' }} />
            ) : (
              'Masuk Sekarang'
            )}
          </button>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>
            Butuh bantuan? <span style={{ color: 'var(--brand-yellow)', fontWeight: 800 }}>Hubungi IT Support</span>
          </p>
        </div>
      </div>

      {/* Version Info Footer */}
      <div style={{ 
        marginTop: '32px', 
        fontSize: '11px', 
        fontWeight: 800, 
        color: '#94a3b8', 
        letterSpacing: '0.05em' 
      }}>
        vDeploy 1.0.24.0417
      </div>
    </div>
  );
}
