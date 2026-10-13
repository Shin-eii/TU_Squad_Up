import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppHeader from './components/AppHeader.jsx';
import TabBar from './components/TabBar.jsx';
import { useAuth } from './features/auth/AuthContext.jsx';
import ProtectedRoute from './features/auth/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import MyActivities from './pages/MyActivities.jsx';
import NewActivity from './pages/NewActivity.jsx';

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
      <AppHeader />
      <main className="screen-body">{children}</main>
      <TabBar />
    </div>
  );
}

function NotBuilt({ title }) {
  return <div className="empty">{title} isn't built yet.</div>;
}

export default function App() {
  const { checking } = useAuth();

  // Wait for the saved-session check so /login doesn't flash for signed-in members.
  if (checking) {
    return (
      <div className="app-shell">
        <div className="empty" role="status" aria-live="polite">Checking your session…</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Everything else needs a signed-in member, including routes not built yet
            (/activities/*, /payments, /notifications, /profile), which fall through to "*". */}
        <Route element={<ProtectedRoute />}>
          <Route path="/host/new" element={<NewActivity />} />
          <Route path="/host/:id/edit" element={<NewActivity />} />
          <Route path="/mine" element={<WithTabs><MyActivities /></WithTabs>} />
          <Route
            path="/admin/*"
            element={<WithTabs><ProtectedRoute requireAdmin><NotBuilt title="Admin reports" /></ProtectedRoute></WithTabs>}
          />
          <Route path="*" element={<Navigate to="/mine" replace />} />
        </Route>
      </Routes>
    </div>
  );
}
