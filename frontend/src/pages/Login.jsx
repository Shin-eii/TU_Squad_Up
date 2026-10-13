import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.jsx';

const MOCK_MEMBERS = [
  { memberId: 1, name: 'Nont P.', email: 'nont.p@dome.tu.ac.th', type: 'Student' },
  { memberId: 2, name: 'Mali S.', email: 'mali.s@dome.tu.ac.th', type: 'Student' },
  { memberId: 3, name: 'Ananda K.', email: 'ananda.k@tu.ac.th', type: 'Professor' },
  { memberId: 4, name: 'Somchai R.', email: 'somchai.r@tu.ac.th', type: 'Staff / administrator' },
];

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/verify" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(selected);
      navigate('/verify');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <button type="button" className="icon-btn auth-back" aria-label="Back" onClick={() => navigate('/')}>←</button>
      <div>
        <div className="eyebrow">Development authentication</div>
        <h1>Sign in with TU SSO</h1>
        <p className="hint">Choose a seeded identity. The authentication adapter can later be replaced by real TU SSO.</p>
      </div>
      <form className="account-list" onSubmit={handleSubmit}>
        {MOCK_MEMBERS.map((member) => (
          <label className={`account-card${selected === member.memberId ? ' selected' : ''}`} key={member.memberId}>
            <input
              type="radio"
              name="member"
              value={member.memberId}
              checked={selected === member.memberId}
              onChange={() => setSelected(member.memberId)}
            />
            <span>
              <strong>{member.name}</strong>
              <small>{member.email} · {member.type}</small>
            </span>
          </label>
        ))}
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="btn-primary auth-primary" disabled={submitting}>
          <span>{submitting ? 'Signing in…' : 'Sign in as selected member'}</span><span aria-hidden="true">→</span>
        </button>
      </form>
    </main>
  );
}
