import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', dob: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data } = await api.post('/auth/register', form);
      setMessage(data.message || 'Verification email sent. Please check your inbox.');
      window.setTimeout(() => navigate('/login', {
        state: {
          message: data.message || 'Verification email sent. Please check your inbox.',
          email: form.email
        }
      }), 1200);
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      if (err.response?.status === 409 && serverMessage) {
        setError(serverMessage);
      } else {
        setError(serverMessage || err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-grid">
        <section className="auth-promo">
          <span className="eyebrow">Launch Your Arena Profile</span>
          <h1>Build a verified account and start shipping accepted runs.</h1>
          <p>
            Sign up once, verify your email, then track submissions, solve streaks,
            and leaderboard progress from one place.
          </p>
          <div className="feature-stack">
            <div className="feature-chip">JWT Sessions</div>
            <div className="feature-chip">Email Verification</div>
            <div className="feature-chip">Submission Analytics</div>
          </div>
        </section>

        <section className="auth-card">
          <h2>Create account</h2>
          <p className="section-copy">A verified identity unlocks problem creation, submissions, and your profile dashboard.</p>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <div className="form-grid">
            <label>
              <span>Full name</span>
              <input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Aarav Sharma" />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="you@example.com" />
            </label>
            <label>
              <span>Password</span>
              <input type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="Choose a strong password" />
            </label>
            <label>
              <span>Date of birth</span>
              <input type="date" value={form.dob} onChange={(e) => updateField('dob', e.target.value)} />
            </label>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="auth-switch">
            Already registered? <Link to="/login">Login</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
