import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { DEMO_ACCOUNTS } from '../features/auth/mockAccounts.js';

const MEMBER_TYPE_LABEL = { STUDENT: 'Student', PROFESSOR: 'Professor', STAFF: 'Staff', EMPLOYEE: 'Employee' };

function redirectTarget(state) {
  const from = state?.from;
  if (!from || from.pathname === '/login') return '/';
  return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
}

/** Login · pick a mock account until TU SSO is connected. */
export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const [selectedId, setSelectedId] = useState(DEMO_ACCOUNTS[0].member_id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Already signed in (or just signed in): go to the page they wanted.
  if (isAuthenticated) return <Navigate to={redirectTarget(location.state)} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(selectedId);
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="screen">
      <header className="page-head">
        <div className="eyebrow">Thammasat members only</div>
        <h1>Sign in to TU Squad Up</h1>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div>
          <button type="button" className="btn-sso" disabled aria-describedby="sso-note">
            Sign in with TU SSO <span className="badge muted">COMING SOON</span>
          </button>
          <p id="sso-note" className="hint">
            TU SSO isn't connected yet. Use a demo account for now.
          </p>
        </div>

        <fieldset className="account-list" disabled={submitting}>
          <legend className="label">Demo accounts</legend>
          {DEMO_ACCOUNTS.map((account) => (
            <label key={account.member_id} className="account-option">
              <input
                type="radio"
                name="account"
                value={account.member_id}
                checked={selectedId === account.member_id}
                onChange={() => {
                  setSelectedId(account.member_id);
                  setError(null);
                }}
              />
              <span className="account-info">
                <span className="account-name">{account.display_name}</span>
                <span className="act-sub">{account.university_email}</span>
                <span className="act-eyebrow">
                  {MEMBER_TYPE_LABEL[account.member_type]} &middot; {account.demo_role}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        {error && (
          <div className="error-summary" role="alert">
            <h2>Couldn't sign in</h2>
            <p className="login-error">{error}</p>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={submitting} aria-busy={submitting}>
          {submitting ? 'Signing in…' : 'Continue with demo account'}
          <span className="arrow">&rarr;</span>
        </button>
      </form>
    </div>
  );
}
