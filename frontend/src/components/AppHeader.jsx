import { useState } from 'react';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { useToast } from './Toast.jsx';

/** Slim bar above tabbed screens: who is signed in, plus log out. */
export default function AppHeader() {
  const { member, logout } = useAuth();
  const toast = useToast();
  const [leaving, setLeaving] = useState(false);

  async function handleLogout() {
    setLeaving(true);
    try {
      await logout();
    } catch {
      toast("Couldn't log out. Please try again.");
      setLeaving(false);
    }
  }

  return (
    <div className="app-header">
      <span className="app-header-who">
        Signed in as <strong>{member.display_name}</strong>
        {member.is_administrator && <span className="badge">ADMIN</span>}
      </span>
      <button type="button" className="link-btn" onClick={handleLogout} disabled={leaving}>
        {leaving ? 'Logging out…' : 'Log out'}
      </button>
    </div>
  );
}
