import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

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
      // We don't need to manually navigate. 
      // The state change in useAuth() will cause App.tsx to re-render 
      // and redirect automatically.
    } else {
      setError(res.message || 'Login gagal');
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="animate-fade-in" style={{ 
        minHeight: '100vh', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', background: '#0B0815' 
      }}>
        <div className="animate-scale" style={{ 
          width: '100px', height: '100px', borderRadius: '50%', background: 'var(--brand-yellow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 50px rgba(255, 204, 0, 0.4)', marginBottom: '24px'
        }}>
          <CheckCircle2 size={60} color="#000" />
        </div>
        <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 800 }}>Selamat Datang!</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: '8px' }}>Mempersiapkan dashboard Anda...</p>
      </div>
    );
  }

  return (
    <div className="login-page" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#0B0815',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255, 204, 0, 0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div className="login-container animate-scale shadow-premium" style={{ 
        width: '100%', 
        maxWidth: '420px', 
        background: 'rgba(255, 255, 255, 0.03)', 
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '40px',
        padding: '48px 32px',
        textAlign: 'center',
        zIndex: 10
      }}>
        <div style={{ 
          width: '120px', height: '120px', borderRadius: '32px', 
          background: '#fff', margin: '0 auto 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 15px 45px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          padding: '10px'
        }}>
          <img src="/assets/image/logo_ikt.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 950, letterSpacing: '-0.8px', marginBottom: '8px', lineHeight: 1.2 }}>
          PT. Industri Keluarga Timur
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '15px', fontWeight: 500, marginBottom: '40px' }}>
          Silakan masuk untuk melanjutkan
        </p>

        {error && (
          <div className="animate-fade-up" style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#fca5a5', padding: '12px', borderRadius: '16px',
            fontSize: '13px', fontWeight: 600, marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)', zIndex: 1 }} />
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
              style={{ 
                width: '100%', padding: '18px 20px 18px 52px', background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', color: '#fff',
                fontSize: '16px', fontWeight: 600, outline: 'none', transition: 'all 0.2s',
                position: 'relative', zIndex: 0
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--brand-yellow)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)', zIndex: 1 }} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                width: '100%', padding: '18px 20px 18px 52px', background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', color: '#fff',
                fontSize: '16px', fontWeight: 600, outline: 'none', transition: 'all 0.2s',
                position: 'relative', zIndex: 0
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--brand-yellow)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="tap-active"
            style={{ 
              width: '100%', padding: '18px', background: 'var(--brand-yellow)',
              borderRadius: '20px', color: '#000', fontSize: '16px', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              marginTop: '12px', boxShadow: '0 10px 20px rgba(255, 204, 0, 0.2)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              border: 'none'
            }}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '11px', marginTop: '32px', fontWeight: 600 }}>
          Sistem Keuntungan & Pelacakan Sales © 2026
        </p>
      </div>
    </div>
  );
}
