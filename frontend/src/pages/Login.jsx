import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  // NEW: track whether the last failure was specifically "wrong credentials"
  // so we can offer a Forgot Password link right where the user needs it.
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setForm((current) => ({ ...current, email: location.state.email }));
    }
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location.state]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    setShowResend(false);
    setShowForgotPassword(false);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      navigate('/problems');
    } catch (err) {
      const payload = err.response?.data;
      if (err.response?.status === 403) {
        setError('Your email is not verified.');
        setShowResend(Boolean(form.email));
      } else if (err.response?.status === 400) {
        // Backend intentionally returns a generic "Invalid credentials" for
        // both "no such user" and "wrong password", so we can't tell which
        // one it was — but either way, Forgot Password is the right next
        // step to offer, so surface it any time login fails this way.
        setError(payload?.message || 'Invalid credentials');
        setShowForgotPassword(true);
      } else {
        setError(payload?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/auth/resend-verification', { email: form.email });
      setMessage(data.message || 'Verification email sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-grid">
        <section className="auth-promo warm">
          <span className="eyebrow">Welcome Back</span>
          <h1>Pick up your next solve with your history and rank intact.</h1>
          <p>
            Login returns you to your submission trail, accepted count, and the latest leaderboard movement.
          </p>
        </section>

        <section className="auth-card">
          <h2>Login</h2>
          <p className="section-copy">Use your verified account to submit code and unlock profile insights.</p>

          {error && (
            <div className="alert alert-error">
              {error}
              {showForgotPassword && (
                <>
                  {' '}
                  <Link to="/forgot-password" state={{ email: form.email }}>
                    Forgot password?
                  </Link>
                </>
              )}
            </div>
          )}
          {message && <div className="alert alert-success">{message}</div>}

          <div className="form-grid">
            <label>
              <span>Email</span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Your password"
              />
            </label>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Logging in...' : 'Login to CodeArena'}
          </button>

          {showResend && (
            <button className="btn btn-outline" style={{ width: '100%', marginTop: 12 }} onClick={handleResend} disabled={resendLoading}>
              {resendLoading ? 'Sending verification email...' : 'Resend Verification Email'}
            </button>
          )}

          <p className="auth-switch">
            Need an account? <Link to="/register">Sign up</Link>
          </p>
          <p className="auth-switch">
            <Link to="/forgot-password">Forgot your password?</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
