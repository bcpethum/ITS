import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

/**
 * AuthContext — Global Authentication State
 *
 * Provides the entire app with:
 * - `user`       — the currently logged-in user object (or null)
 * - `loading`    — true while checking if a saved session exists
 * - `login()`    — logs in and saves user to localStorage
 * - `register()` — registers and auto-logs-in the new user
 * - `logout()`   — clears state and redirects to login
 *
 * User data is persisted in localStorage so sessions survive page refreshes.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // Start true: checking for saved session

  // ─── On Mount: Restore session from localStorage ──────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(savedUser);
        // Verify the token is still valid by hitting /me endpoint
        const response = await authAPI.getMe();
        // Merge fresh user data with the stored token
        setUser({ ...response.data.data, token: parsed.token });
      } catch {
        // Token is invalid or expired — clear it
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const response = await authAPI.login({ email, password });
    const userData = response.data.data;

    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));

    return userData;
  }, []);

  // ─── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(async ({ name, email, password, role }) => {
    const response = await authAPI.register({ name, email, password, role });
    const userData = response.data.data;

    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));

    return userData;
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    // Navigation is handled by the Navbar component (useNavigate hook)
  }, []);

  const value = { user, loading, login, register, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth — Custom hook to consume AuthContext.
 * Throws a helpful error if used outside AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
}
