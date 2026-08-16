import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Target, LayoutDashboard, ListChecks, LogOut, Sun, Moon } from 'lucide-react';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const navLinkCls = ({ isActive }) =>
  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'text-primary bg-primary/10 border border-primary/20'
      : 'text-ink-2 hover:text-ink hover:bg-subtle border border-transparent'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="sticky top-0 z-50 border-b border-edge bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-6">

        {/* ── Brand ── */}
        <NavLink to="/dashboard" className="flex items-center gap-2 no-underline">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 text-white">
            <Target size={16} strokeWidth={2.5} />
          </div>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold text-base tracking-tight select-none">
            IssueTrack
          </span>
        </NavLink>

        {/* ── Nav links ── */}
        <div className="flex items-center gap-1">
          <NavLink to="/dashboard" className={navLinkCls}>
            <LayoutDashboard size={14} strokeWidth={2} />
            Dashboard
          </NavLink>
          <NavLink to="/issues" className={navLinkCls}>
            <ListChecks size={14} strokeWidth={2} />
            Issues
          </NavLink>
        </div>

        {/* ── User & Theme area ── */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-surface text-ink-2 transition-all duration-200 hover:border-edge-hover hover:bg-subtle hover:text-ink cursor-pointer"
          >
            {isDark ? (
              <Sun size={15} strokeWidth={2} className="text-warning transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon size={15} strokeWidth={2} className="text-primary transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>

          {user && (
            <>
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-edge select-none"
                  style={{ background: user.avatarColor }}
                >
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-ink">{user.name}</span>
                  <span className="text-xs capitalize text-ink-3">{user.role}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-xs font-medium text-ink-2 transition-all duration-200 hover:border-edge-hover hover:bg-subtle hover:text-ink cursor-pointer"
                title="Logout"
              >
                <LogOut size={13} strokeWidth={2} />
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
