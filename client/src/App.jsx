import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Navbar    from './components/Navbar';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import IssueList from './pages/IssueList';

// Placeholders for pages built in later phases
// import IssueDetail from './pages/IssueDetail'; // Phase 4

/**
 * ProtectedRoute — Wrapper that redirects unauthenticated users to /login.
 *
 * While the auth state is still loading (checking localStorage + verifying token),
 * it shows a centered spinner so the page doesn't flash incorrectly.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" style={{ color: 'var(--color-primary)' }} />
        <p>Loading your workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * GuestRoute — Redirects already-logged-in users away from auth pages.
 * If you're logged in, visiting /login redirects you to /dashboard.
 */
function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // Don't render anything while checking

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * App — Root component with React Router route definitions.
 *
 * Structure:
 * - Guest routes: /login, /register (redirect to dashboard if already logged in)
 * - Protected routes: /dashboard, /issues, /issues/:id (require JWT)
 * - Default: / redirects to /dashboard
 */
export default function App() {
  return (
    <Routes>
      {/* ── Guest routes (no auth required, redirect if already logged in) ── */}
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* ── Protected routes (require authentication) ───────────────────── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <div className="app-layout">
              <Navbar />
              <Dashboard />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/issues"
        element={
          <ProtectedRoute>
            <div className="app-layout">
              <Navbar />
              <IssueList />
            </div>
          </ProtectedRoute>
        }
      />

      {/* IssueDetail will be added in Phase 4 */}
      {/* <Route path="/issues/:id" element={...} /> */}

      {/* ── Default redirect ─────────────────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
