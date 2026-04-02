import { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('spendly_user')); } catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token, ...userData } = res.data.data;
    localStorage.setItem('spendly_token', token);
    localStorage.setItem('spendly_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    const { token, ...userData } = res.data.data;
    localStorage.setItem('spendly_token', token);
    localStorage.setItem('spendly_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('spendly_token');
    localStorage.removeItem('spendly_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
