import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Login Page — Tailwind v4
 */
export default function Login() {
  const [formData,    setFormData]    = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading,     setLoading]     = useState(false);

  const { login } = useAuth();
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-md animate-slideUp">

        {/* Card */}
        <div className="rounded-2xl border border-edge bg-surface p-8 shadow-2xl shadow-black/40">

          {/* Logo */}
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-2xl shadow-lg shadow-primary/30">
              🔍
            </div>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-xl font-bold tracking-tight">
              IssueTrack
            </span>
          </div>

          <h1 className="mb-1 text-center text-2xl font-extrabold text-ink tracking-tight">Welcome back</h1>
          <p className="mb-7 text-center text-sm text-ink-2">Sign in to your account to continue</p>

          {/* Server error */}
          {serverError && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Email */}
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

            {/* Password */}
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

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:bg-primary-dark disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <><span className="spinner" style={{ borderTopColor: '#fff' }} />Signing in…</>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Sign In
                </>
              )}
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
