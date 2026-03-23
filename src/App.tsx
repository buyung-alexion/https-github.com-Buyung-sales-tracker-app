import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MobileShell from './pages/mobile/MobileShell';
import ManagerShell from './pages/manager/ManagerShell';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/mobile" replace />} />
        <Route path="/mobile/*" element={<MobileShell />} />
        <Route path="/manager/*" element={<ManagerShell />} />
      </Routes>
    </BrowserRouter>
  );
}
