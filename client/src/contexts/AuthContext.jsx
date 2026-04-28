import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { apiRequest } from '../api/http.js';

const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    apiRequest(api.get('/auth/me'))
      .then((profile) => {
        setUser(profile);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persistAuth = (payload) => {
    localStorage.setItem(TOKEN_KEY, payload.token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    setUser(payload.user);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      async login(credentials) {
        const data = await apiRequest(api.post('/auth/login', credentials));
        persistAuth(data);
        return data.user;
      },
      async register(payload) {
        const data = await apiRequest(api.post('/auth/register', payload));
        persistAuth(data);
        return data.user;
      },
      async refreshProfile() {
        const profile = await apiRequest(api.get('/auth/me'));
        setUser(profile);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
        return profile;
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      },
      setUser(profile) {
        setUser(profile);
        if (profile) {
          localStorage.setItem(USER_KEY, JSON.stringify(profile));
        }
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
