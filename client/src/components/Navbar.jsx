import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar — Top navigation bar
 *
 * Shows:
 * - Brand logo + name
 * - Navigation links (Dashboard, Issues)
 * - User avatar + name + role
 * - Logout button
 *
 * Uses NavLink from React Router so the active link gets the "active" class
 * automatically, which is styled in index.css.
 */

// Helper: Get the first two initials from a full name
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Brand */}
        <NavLink to="/dashboard" className="navbar-brand">
          <div className="navbar-logo">🔍</div>
          <span className="navbar-brand-name">IssueTrack</span>
        </NavLink>

        {/* Main Navigation */}
        <div className="navbar-nav">
          <NavLink to="/dashboard" className="navbar-link">
            {/* Dashboard icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </NavLink>
          <NavLink to="/issues" className="navbar-link">
            {/* Issues icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            Issues
          </NavLink>
        </div>

        {/* User Menu + Logout */}
        <div className="navbar-right">
          {user && (
            <>
              <div className="user-menu">
                {/* Avatar */}
                <div
                  className="avatar avatar-sm"
                  style={{ background: user.avatarColor, color: '#fff' }}
                >
                  {getInitials(user.name)}
                </div>
                {/* Name + Role */}
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{user.role}</span>
                </div>
              </div>

              {/* Logout */}
              <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
