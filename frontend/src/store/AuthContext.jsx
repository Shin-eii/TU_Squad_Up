import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/auth/me')
      .then(({ member }) => setUser(member))
      .catch((error) => {
        if (error.status !== 401) console.error(error);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (memberId) => {
    const { member } = await apiRequest('/auth/mock-login', {
      method: 'POST',
      body: JSON.stringify({ memberId }),
    });
    setUser(member);
    return member;
  }, []);

  const logout = useCallback(async () => {
    await apiRequest('/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
