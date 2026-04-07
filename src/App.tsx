import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import MobileShell from './pages/mobile/MobileShell';
import ManagerShell from './pages/manager/ManagerShell';
import LoginPage from './pages/LoginPage';

export default function App() {
  const { isLoggedIn, role, loading } = useAuth();
  const normalizedRole = (role || '').toLowerCase();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0815', color: '#fff' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,204,0,0.1)', borderTopColor: 'var(--brand-yellow)', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Main Entry Point Logic */}
        <Route path="/" element={
          !isLoggedIn ? <LoginPage /> : 
          (normalizedRole === 'manager' || normalizedRole === 'admin') ? <Navigate to="/manager" replace /> : 
          normalizedRole === 'sales' ? <Navigate to="/mobile" replace /> :
          <LoginPage /> // Fallback for unknown roles to prevent loops
        } />

        {/* Protected Manager Routes */}
        <Route path="/manager/*" element={
          isLoggedIn && (normalizedRole === 'manager' || normalizedRole === 'admin') ? <ManagerShell /> : <Navigate to="/" replace />
        } />

        {/* Protected Mobile/Sales Routes */}
        <Route path="/mobile/*" element={
          isLoggedIn && normalizedRole === 'sales' ? <MobileShell /> : <Navigate to="/" replace />
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
