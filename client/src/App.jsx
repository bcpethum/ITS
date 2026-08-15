import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Navbar      from './components/Navbar';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Dashboard   from './pages/Dashboard';
import IssueList   from './pages/IssueList';
import IssueDetail from './pages/IssueDetail';

/**
 * ProtectedRoute — Redirects unauthenticated users to /login.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg text-ink-2">
        <span className="spinner spinner-lg" style={{ borderTopColor: '#6C63FF' }} />
        <p className="text-sm">Loading your workspace…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/**
 * GuestRoute — Redirects logged-in users away from auth pages.
 */
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

/** Shared layout wrapper for protected pages */
function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
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
        <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
      } />
      <Route path="/issues" element={
        <ProtectedRoute><AppLayout><IssueList /></AppLayout></ProtectedRoute>
      } />
      {/* Phase 4 — Issue Detail */}
      <Route path="/issues/:id" element={
        <ProtectedRoute><AppLayout><IssueDetail /></AppLayout></ProtectedRoute>
      } />

      {/* ── Default redirect ── */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
