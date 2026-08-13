import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Login Page
 *
 * Handles email/password login with:
 * - Client-side validation before hitting the API
 * - Descriptive field-level error messages
 * - Loading state on the submit button
 * - Server error display
 * - Auto-redirect to dashboard on success
 */
export default function Login() {
  const [formData, setFormData]   = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading]     = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  // ─── Field change handler ─────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error as user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  // ─── Client-side validation ───────────────────────────────────────────────
  const validate = () => {
    const errors = {};
    if (!formData.email.trim())  errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Enter a valid email address';
    if (!formData.password)      errors.password = 'Password is required';
    return errors;
  };

  // ─── Submit handler ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-slideUp">

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🔍</div>
          <span className="auth-logo-text">IssueTrack</span>
        </div>

        {/* Heading */}
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {/* Server Error */}
        {serverError && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {serverError}
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div className="form-group">
            <label className="form-label required" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              className={`form-input ${fieldErrors.email ? 'error' : ''}`}
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange}
            />
            {fieldErrors.email && (
              <span className="form-error">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><text x="12" y="16" textAnchor="middle" fontSize="14" fill="white">!</text></svg>
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label required" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              className={`form-input ${fieldErrors.password ? 'error' : ''}`}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
            />
            {fieldErrors.password && (
              <span className="form-error">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><text x="12" y="16" textAnchor="middle" fontSize="14" fill="white">!</text></svg>
                {fieldErrors.password}
              </span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="login-submit"
            className={`btn btn-primary btn-lg btn-full ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ borderTopColor: '#fff' }} />
                Signing in...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
