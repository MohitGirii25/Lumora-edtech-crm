import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import InquiryPage from './pages/InquiryPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import InquiryDetailPage from './pages/InquiryDetailPage.jsx';
import { api } from './services/api.js';

function Guard({ children }) {
  const [access, setAccess] = useState('checking');

  useEffect(() => {
    let active = true;
    if (!localStorage.getItem('edtech-token')) {
      setAccess('denied');
      return () => { active = false; };
    }

    api.get('/auth/me')
      .then(() => { if (active) setAccess('allowed'); })
      .catch(() => { if (active) setAccess('denied'); });

    return () => { active = false; };
  }, []);

  if (access === 'checking') {
    return <main className="login-shell" role="status">Checking administrator access…</main>;
  }
  return access === 'allowed' ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<InquiryPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<Guard><DashboardPage /></Guard>} />
      <Route path="/admin/inquiries/:id" element={<Guard><InquiryDetailPage /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
