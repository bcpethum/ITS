import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Navbar     from './components/Navbar';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Dashboard  from './pages/Dashboard';
import IssueList  from './pages/IssueList';

/**
 * ProtectedRoute — Redirects unauthenticated users to /login.
 * Shows a full-screen spinner while auth state is being restored from localStorage.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg text-ink-2">
        <span className="spinner spinner-lg text-primary" style={{ borderTopColor: '#6C63FF' }} />
        <p className="text-sm">Loading your workspace…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/**
 * GuestRoute — Redirects already-logged-in users away from auth pages.
 */
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

/**
 * App — Root component with React Router v6 routes.
 */
export default function App() {
  return (
    <Routes>
      {/* ── Guest routes ── */}
      <Route path="/login"    element={<GuestRoute><Login    /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* ── Protected routes ── */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <div className="flex min-h-screen flex-col bg-bg">
            <Navbar />
            <main className="flex-1"><Dashboard /></main>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/issues" element={
        <ProtectedRoute>
          <div className="flex min-h-screen flex-col bg-bg">
            <Navbar />
            <main className="flex-1"><IssueList /></main>
          </div>
        </ProtectedRoute>
      } />

      {/* IssueDetail — Phase 4 */}
      {/* <Route path="/issues/:id" element={...} /> */}

      {/* ── Default redirect ── */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
