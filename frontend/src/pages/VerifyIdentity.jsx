import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.jsx';

export default function VerifyIdentity() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  if (!loading && !user) return <Navigate to="/login" replace />;
  if (!user) return <div className="auth-loading">Loading identity…</div>;

  async function chooseAnother() {
    await logout();
    navigate('/login');
  }

  return (
    <main className="auth-screen">
      <div>
        <div className="eyebrow">TU identity returned</div>
        <h1>Confirm your account</h1>
      </div>
      <section className="identity-card">
        <div className="identity-initial" aria-hidden="true">{user.displayName.charAt(0)}</div>
        <div>
          <strong>{user.displayName}</strong>
          <p>{user.universityEmail}</p>
          <span className="badge outline">{user.memberType}</span>
        </div>
      </section>
      <button type="button" className="btn-primary auth-primary" onClick={() => navigate('/host/new')}>
        <span>Continue and create activity</span><span aria-hidden="true">→</span>
      </button>
      <button type="button" className="btn-ghost auth-secondary" onClick={chooseAnother}>Choose another mock account</button>
    </main>
  );
}
