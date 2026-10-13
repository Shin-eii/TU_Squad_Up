import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from './authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [member, setMember] = useState(null);
  const [checking, setChecking] = useState(true); // true until the startup session check finishes
  const [loggedOut, setLoggedOut] = useState(false); // true after "Log out", so /login starts fresh

  useEffect(() => {
    let cancelled = false;
    authService
      .getCurrentMember()
      .catch(() => null) // Treat a failed check as logged out.
      .then((current) => {
        if (cancelled) return;
        setMember(current);
        setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (accountId) => {
    const signedIn = await authService.login(accountId);
    setLoggedOut(false);
    setMember(signedIn);
    return signedIn;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setLoggedOut(true);
    setMember(null);
  }, []);

  const value = useMemo(
    () => ({ member, checking, loggedOut, isAuthenticated: member !== null, login, logout }),
    [member, checking, loggedOut, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
