import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Register Page
 *
 * New user registration form with:
 * - Name, email, password, confirm password, role fields
 * - Client-side validation for all fields
 * - Password strength indicator
 * - Server validation error display
 * - Auto-login after successful registration
 */

const ROLES = [
  { value: 'developer', label: '💻 Developer' },
  { value: 'tester',    label: '🧪 Tester'    },
  { value: 'manager',   label: '📋 Manager'   },
];

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'developer',
  });
  const [fieldErrors, setFieldErrors]   = useState({});
  const [serverError, setServerError]   = useState('');
  const [serverErrors, setServerErrors] = useState([]); // field-level from server
  const [loading, setLoading]           = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
    setServerErrors([]);
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim())          errors.name = 'Name is required';
    else if (formData.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';

    if (!formData.email.trim())         errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Enter a valid email address';

    if (!formData.password)             errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';

    if (!formData.confirmPassword)      errors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';

    return errors;
  };

  // Password strength: 0–4
  const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 6)  score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9!@#$%^&*]/.test(password)) score++;
    return score;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels   = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors   = ['', '#FF4757', '#F7B731', '#00D9C0', '#26de81'];

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
      await register({
        name:     formData.name.trim(),
        email:    formData.email.trim(),
        password: formData.password,
        role:     formData.role,
      });
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length > 0) {
        setServerErrors(data.errors);
      } else {
        setServerError(data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-slideUp" style={{ maxWidth: '500px' }}>

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🔍</div>
          <span className="auth-logo-text">IssueTrack</span>
        </div>

        <h1 className="auth-title">Create an account</h1>
        <p className="auth-subtitle">Join your team and start tracking issues</p>

        {/* Server error */}
        {serverError && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {serverError}
          </div>
        )}
        {serverErrors.length > 0 && (
          <div className="alert alert-error" style={{ marginBottom: '20px', flexDirection: 'column', alignItems: 'flex-start' }}>
            {serverErrors.map((e, i) => <span key={i}>• {e.message}</span>)}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Name */}
          <div className="form-group">
            <label className="form-label required" htmlFor="reg-name">Full name</label>
            <input
              id="reg-name" name="name" type="text" autoComplete="name"
              className={`form-input ${fieldErrors.name ? 'error' : ''}`}
              placeholder="Jane Smith"
              value={formData.name} onChange={handleChange}
            />
            {fieldErrors.name && <span className="form-error">{fieldErrors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label required" htmlFor="reg-email">Email address</label>
            <input
              id="reg-email" name="email" type="email" autoComplete="email"
              className={`form-input ${fieldErrors.email ? 'error' : ''}`}
              placeholder="you@company.com"
              value={formData.email} onChange={handleChange}
            />
            {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
          </div>

          {/* Role */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-role">Role</label>
            <select
              id="reg-role" name="role"
              className="form-select"
              value={formData.role} onChange={handleChange}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label required" htmlFor="reg-password">Password</label>
            <input
              id="reg-password" name="password" type="password" autoComplete="new-password"
              className={`form-input ${fieldErrors.password ? 'error' : ''}`}
              placeholder="At least 6 characters"
              value={formData.password} onChange={handleChange}
            />
            {/* Strength bar */}
            {formData.password && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                  {[1, 2, 3, 4].map((level) => (
                    <div key={level} style={{
                      flex: 1, height: '4px', borderRadius: '2px',
                      background: passwordStrength >= level ? strengthColors[passwordStrength] : 'var(--color-border)',
                      transition: 'background 0.3s ease',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: strengthColors[passwordStrength], fontWeight: 600, minWidth: '40px' }}>
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
            )}
            {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label className="form-label required" htmlFor="reg-confirm">Confirm password</label>
            <input
              id="reg-confirm" name="confirmPassword" type="password" autoComplete="new-password"
              className={`form-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
              placeholder="Repeat your password"
              value={formData.confirmPassword} onChange={handleChange}
            />
            {fieldErrors.confirmPassword && <span className="form-error">{fieldErrors.confirmPassword}</span>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="register-submit"
            className={`btn btn-primary btn-lg btn-full ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ borderTopColor: '#fff' }} />
                Creating account...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
