import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Target, UserPlus, AlertCircle, Sun, Moon } from 'lucide-react';

const ROLES = [
  { value: 'developer', label: '💻 Developer' },
  { value: 'tester',    label: '🧪 Tester'    },
  { value: 'manager',   label: '📋 Manager'   },
];

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'developer',
  });
  const [fieldErrors,  setFieldErrors]  = useState({});
  const [serverError,  setServerError]  = useState('');
  const [serverErrors, setServerErrors] = useState([]);
  const [loading,      setLoading]      = useState(false);

  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate     = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError(''); setServerErrors([]);
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim())     errors.name = 'Name is required';
    else if (formData.name.trim().length < 2) errors.name = 'At least 2 characters';
    if (!formData.email.trim())    errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Enter a valid email address';
    if (!formData.password)        errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'At least 6 characters';
    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    return errors;
  };

  const getStrength = (pw) => {
    let s = 0;
    if (pw.length >= 6)  s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9!@#$%^&*]/.test(pw)) s++;
    return s;
  };
  const strength      = getStrength(formData.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#FF4757', '#F7B731', '#00D9C0', '#26de81'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setLoading(true); setServerError('');
    try {
      await register({ name: formData.name.trim(), email: formData.email.trim(), password: formData.password, role: formData.role });
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length > 0) setServerErrors(data.errors);
      else setServerError(data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const inputCls = (field) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm bg-elevated text-ink placeholder:text-ink-3 outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
      fieldErrors[field] ? 'border-danger ring-2 ring-danger/20' : 'border-edge'
    }`;

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

      <div className="w-full max-w-lg animate-slideUp">
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

          <h1 className="mb-1 text-center text-2xl font-extrabold text-ink tracking-tight">Create an account</h1>
          <p className="mb-7 text-center text-sm text-ink-2">Join your team and start tracking issues</p>

          {serverError && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              <AlertCircle size={15} strokeWidth={2} className="shrink-0" />{serverError}
            </div>
          )}
          {serverErrors.length > 0 && (
            <div className="mb-5 flex flex-col gap-1 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {serverErrors.map((e, i) => <span key={i}>• {e.message}</span>)}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-name" className="text-sm font-medium text-ink-2">Full name <span className="text-danger">*</span></label>
              <input id="reg-name" name="name" type="text" autoComplete="name" placeholder="Jane Smith" value={formData.name} onChange={handleChange} className={inputCls('name')} />
              {fieldErrors.name && <p className="text-xs text-danger">{fieldErrors.name}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-email" className="text-sm font-medium text-ink-2">Email address <span className="text-danger">*</span></label>
              <input id="reg-email" name="email" type="email" autoComplete="email" placeholder="you@company.com" value={formData.email} onChange={handleChange} className={inputCls('email')} />
              {fieldErrors.email && <p className="text-xs text-danger">{fieldErrors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-role" className="text-sm font-medium text-ink-2">Role</label>
              <select id="reg-role" name="role" value={formData.role} onChange={handleChange}
                className="w-full rounded-lg border border-edge bg-elevated px-3 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer">
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-password" className="text-sm font-medium text-ink-2">Password <span className="text-danger">*</span></label>
              <input id="reg-password" name="password" type="password" autoComplete="new-password" placeholder="At least 6 characters" value={formData.password} onChange={handleChange} className={inputCls('password')} />
              {formData.password && (
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div key={level} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: strength >= level ? strengthColor : 'var(--color-edge)' }} />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold min-w-[38px]" style={{ color: strengthColor }}>{strengthLabel}</span>
                </div>
              )}
              {fieldErrors.password && <p className="text-xs text-danger">{fieldErrors.password}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-confirm" className="text-sm font-medium text-ink-2">Confirm password <span className="text-danger">*</span></label>
              <input id="reg-confirm" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat your password" value={formData.confirmPassword} onChange={handleChange} className={inputCls('confirmPassword')} />
              {fieldErrors.confirmPassword && <p className="text-xs text-danger">{fieldErrors.confirmPassword}</p>}
            </div>

            <button type="submit" id="register-submit" disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:bg-primary-dark disabled:opacity-60 cursor-pointer">
              {loading
                ? <><span className="spinner" style={{ borderTopColor: '#fff' }} />Creating account…</>
                : <><UserPlus size={15} strokeWidth={2} />Create Account</>
              }
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-2">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary-dark transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
