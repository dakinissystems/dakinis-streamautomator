/**
 * Global authentication store using Context API
 * Provides centralized auth state management
 * Copyright © 2024-2026 Dakinis Systems. All rights reserved.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { isTokenExpired, getStoredAuth, clearAuth as clearStoredAuth, persistAuthUser, persistAuthToken } from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const { user: storedUser, token: storedToken } = getStoredAuth();
    if (storedToken && isTokenExpired(storedToken)) {
      clearStoredAuth();
      return null;
    }
    return storedUser;
  });

  const [token, setToken] = useState(() => {
    const { token: storedToken } = getStoredAuth();
    if (storedToken && isTokenExpired(storedToken)) {
      return null;
    }
    return storedToken;
  });

  useEffect(() => {
    persistAuthUser(user);
  }, [user]);

  useEffect(() => {
    persistAuthToken(token);
  }, [token]);

  const setAuth = useCallback((newUser, newToken) => {
    setUser(newUser);
    setToken(newToken);
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    clearStoredAuth();
  }, []);

  const isAuthenticated = useCallback(() => {
    return !!token && !isTokenExpired(token);
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      setAuth,
      clearAuth,
      isAuthenticated,
      setUser,
      setToken,
    }),
    [user, token, setAuth, clearAuth, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
