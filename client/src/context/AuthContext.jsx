import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('connectify_token'));

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      if (!token) { if (active) setLoading(false); return; }
      try {
        const { data } = await api.get('/auth/me');
        if (active) setUser(data.user);
      } catch {
        localStorage.removeItem('connectify_token');
        if (active) { setToken(null); setUser(null); }
      } finally { if (active) setLoading(false); }
    };
    bootstrap();
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('connectify:unauthorized', onUnauthorized);
    return () => window.removeEventListener('connectify:unauthorized', onUnauthorized);
  }, []);

  const signIn = async (credentials, mode = 'login') => {
    const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
    const { data } = await api.post(endpoint, credentials);
    localStorage.setItem('connectify_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };
  const logout = () => {
    localStorage.removeItem('connectify_token');
    setToken(null); setUser(null);
  };
  const refreshUser = async () => {
    const { data } = await api.get('/auth/me'); setUser(data.user); return data.user;
  };
  const value = useMemo(() => ({ user, token, loading, signIn, logout, refreshUser, setUser }), [user, token, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
