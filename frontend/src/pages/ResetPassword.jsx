import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');
    setMessage('');

    if (!token) {
      setError('Missing or invalid reset link. Please request a new one.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password });
      setMessage(data.message || 'Password reset successful. You can now log in.');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successful. Please log in with your new password.' } });
      }, 1500);
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
          <span className="eyebrow">New Password</span>
          <h1>Choose a new password for your account.</h1>
          <p>Pick something secure that you haven't used before.</p>
        </section>

        <section className="auth-card">
          <h2>Reset Password</h2>
          <p className="section-copy">Enter and confirm your new password below.</p>

          {!token && (
            <div className="alert alert-error">
              This link is missing a reset token. <Link to="/forgot-password">Request a new one</Link>.
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <div className="form-grid">
            <label>
              <span>New Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </label>
            <label>
              <span>Confirm New Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Re-enter your new password"
              />
            </label>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSubmit} disabled={loading || !token}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <p className="auth-switch">
            <Link to="/login">Back to login</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
