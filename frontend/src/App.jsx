import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import TabBar from './components/TabBar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import MyActivities from './pages/MyActivities.jsx';
import Login from './pages/Login.jsx';
import NewActivity from './pages/NewActivity.jsx';
import VerifyIdentity from './pages/VerifyIdentity.jsx';
import Welcome from './pages/Welcome.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function WithTabs({ children }) {
  return (
    <div className="screen">
      <main className="screen-body">{children}</main>
      <TabBar />
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<VerifyIdentity />} />
        <Route path="/host/new" element={<ProtectedRoute><NewActivity /></ProtectedRoute>} />
        <Route path="/host/:id/edit" element={<ProtectedRoute><NewActivity /></ProtectedRoute>} />
        <Route path="/mine" element={<ProtectedRoute><WithTabs><MyActivities /></WithTabs></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
