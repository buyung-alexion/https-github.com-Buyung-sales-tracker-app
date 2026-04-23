import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import MobileShell from './pages/mobile/MobileShell';
import ManagerShell from './pages/manager/ManagerShell';
import LoginPage from './pages/LoginPage';

// Custom guard to manage the Root ('/') path behavior cleanly
function RootRedirector() {
  const { isLoggedIn, role } = useAuth();
  const normalizedRole = (role || '').toLowerCase();

  if (!isLoggedIn) return <LoginPage />;

  const isManager = (normalizedRole.includes('manager') || normalizedRole.includes('admin')) && !normalizedRole.includes('sales');
  
  return <Navigate to={isManager ? "/manager/activity" : "/mobile/home"} replace />;
}

export default function App() {
  const { isLoggedIn, role, loading } = useAuth();
  const normalizedRole = (role || '').toLowerCase();

  // Show a premium global loader during initial auth check
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', color: '#111827' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTopColor: 'var(--brand-yellow)', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <Routes>
      {/* 
          CLEAN ROOT HANDLING:
          The RootRedirector decides whether to show the Login page or 
          to "push" the user to their respective dashboard.
      */}
      <Route path="/" element={<RootRedirector />} />
      
      {/* 
          Prevent authenticated users from accidentally accessing the login page 
          without going through the root evaluation logic.
      */}
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* 
          DAHSBOARD ROUTES:
          Protected by simple auth checks.
      */}
      <Route path="/manager/*" element={
        (isLoggedIn && (normalizedRole.includes('manager') || normalizedRole.includes('admin'))) ? <ManagerShell /> : <Navigate to="/" replace />
      } />

      <Route path="/mobile/*" element={
        isLoggedIn ? <MobileShell /> : <Navigate to="/" replace />
      } />

      {/* Catch-all sends you back to the evaluation logic */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
