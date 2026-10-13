import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.jsx';

export default function Welcome() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/mine" replace />;

  return (
    <main className="auth-screen welcome-screen">
      <div className="brand-mark" aria-hidden="true">TU</div>
      <div>
        <div className="eyebrow">Thammasat community activities</div>
        <h1>TU Squad Up</h1>
        <p>Create an activity, find enough people, and make it happen.</p>
      </div>
      <Link className="btn-primary auth-primary" to="/login">
        <span>Continue with TU account</span><span aria-hidden="true">→</span>
      </Link>
      <p className="auth-footnote">Development build: login uses seeded mock TU identities. No password is stored.</p>
    </main>
  );
}
