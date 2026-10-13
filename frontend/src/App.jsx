import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import TabBar from './components/TabBar.jsx';
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
        <Route path="/host/new" element={<NewActivity />} />
        <Route path="/host/:id/edit" element={<NewActivity />} />
        <Route path="/mine" element={<WithTabs><MyActivities /></WithTabs>} />
        <Route path="*" element={<Navigate to="/mine" replace />} />
      </Routes>
    </div>
  );
}
