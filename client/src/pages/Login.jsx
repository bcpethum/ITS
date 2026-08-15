import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Target, LogIn, AlertCircle, Sun, Moon } from 'lucide-react';

export default function Login() {
  const [formData,    setFormData]    = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading,     setLoading]     = useState(false);

  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate  = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const errors = {};
    if (!formData.email.trim())  errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Enter a valid email address';
    if (!formData.password) errors.password = 'Password is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setLoading(true);
    setServerError('');
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      {/* Theme toggle in top right */}
      <button
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
        title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
        className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-xl border border-edge bg-surface text-ink-2 shadow-md transition-all duration-200 hover:border-edge-hover hover:bg-subtle hover:text-ink cursor-pointer"
      >
        {isDark ? (
          <Sun size={16} strokeWidth={2} className="text-warning transition-transform duration-200 hover:rotate-45" />
        ) : (
          <Moon size={16} strokeWidth={2} className="text-primary transition-transform duration-200 hover:-rotate-12" />
        )}
      </button>

      <div className="w-full max-w-md animate-slideUp">
        <div className="rounded-2xl border border-edge bg-surface p-8 shadow-2xl shadow-black/10 dark:shadow-black/40">

          {/* Logo */}
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30">
              <Target size={24} strokeWidth={2} />
            </div>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-xl font-bold tracking-tight">
              IssueTrack
            </span>
          </div>

          <h1 className="mb-1 text-center text-2xl font-extrabold text-ink tracking-tight">Welcome back</h1>
          <p className="mb-7 text-center text-sm text-ink-2">Sign in to your account to continue</p>

          {serverError && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              <AlertCircle size={15} strokeWidth={2} className="shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-ink-2">
                Email address <span className="text-danger">*</span>
              </label>
              <input
                id="login-email" name="email" type="email" autoComplete="email"
                placeholder="you@company.com"
                value={formData.email} onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-elevated text-ink placeholder:text-ink-3 outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                  fieldErrors.email ? 'border-danger ring-2 ring-danger/20' : 'border-edge'
                }`}
              />
              {fieldErrors.email && <p className="text-xs text-danger">{fieldErrors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-sm font-medium text-ink-2">
                Password <span className="text-danger">*</span>
              </label>
              <input
                id="login-password" name="password" type="password" autoComplete="current-password"
                placeholder="Enter your password"
                value={formData.password} onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-elevated text-ink placeholder:text-ink-3 outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                  fieldErrors.password ? 'border-danger ring-2 ring-danger/20' : 'border-edge'
                }`}
              />
              {fieldErrors.password && <p className="text-xs text-danger">{fieldErrors.password}</p>}
            </div>

            <button
              type="submit" id="login-submit" disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:bg-primary-dark disabled:opacity-60 cursor-pointer"
            >
              {loading
                ? <><span className="spinner" style={{ borderTopColor: '#fff' }} />Signing in…</>
                : <><LogIn size={15} strokeWidth={2} />Sign In</>
              }
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-2">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:text-primary-dark transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
