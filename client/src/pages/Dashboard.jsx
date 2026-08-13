/**
 * Dashboard Page — Placeholder for Phase 1
 * This will be fully implemented in Phase 3.
 */
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="main-content animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="page-subtitle">
          Your issue tracking dashboard will appear here in Phase 3.
        </p>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
        <div className="empty-state-icon">🚧</div>
        <h3 style={{ marginBottom: '8px' }}>Dashboard Coming in Phase 3</h3>
        <p style={{ marginBottom: '24px' }}>
          Authentication is working! The full dashboard with stats, charts, and recent issues will be built next.
        </p>
        <Link to="/issues" className="btn btn-primary">
          View Issues
        </Link>
      </div>
    </div>
  );
}
