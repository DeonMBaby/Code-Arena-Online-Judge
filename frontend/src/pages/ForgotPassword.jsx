import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      // Backend always returns the same generic message whether or not the
      // email exists, by design (prevents leaking which emails are
      // registered) — so we just show whatever it says.
      setMessage(data.message || 'If an account exists for that email, a password reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-grid">
        <section className="auth-promo warm">
          <span className="eyebrow">Reset Access</span>
          <h1>Forgot your password? Let's get you back in.</h1>
          <p>Enter the email on your account and we'll send a link to reset your password.</p>
        </section>

        <section className="auth-card">
          <h2>Forgot Password</h2>
          <p className="section-copy">We'll email you a link to reset your password.</p>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <div className="form-grid">
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="you@example.com"
              />
            </label>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSubmit} disabled={loading || !email}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <p className="auth-switch">
            Remembered it? <Link to="/login">Back to login</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
