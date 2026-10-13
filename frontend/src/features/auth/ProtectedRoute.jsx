import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

/**
 * Lets signed-in members through. Everyone else goes to /login, which sends them
 * back to the page they wanted after signing in. `requireAdmin` also checks
 * is_administrator. This only hides screens; the backend must still check permissions.
 */
export default function ProtectedRoute({ requireAdmin = false, children }) {
  const { member, isAuthenticated, loggedOut } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // After "Log out" the next person starts fresh instead of returning to this page.
    return <Navigate to="/login" replace state={loggedOut ? null : { from: location }} />;
  }
  if (requireAdmin && !member.is_administrator) {
    return (
      <div className="empty">
        <h1 className="status-title">Administrators only</h1>
        <p>{member.display_name} doesn't have access to this page.</p>
        <Link className="btn-primary" to="/mine">
          Back to my activities <span className="arrow">&rarr;</span>
        </Link>
      </div>
    );
  }
  return children ?? <Outlet />;
}
