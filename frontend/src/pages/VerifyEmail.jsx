import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    api.post('/auth/verify-email', { token })
      .then(({ data }) => {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully.');
        window.setTimeout(() => {
          navigate('/login', {
            state: { message: 'Email verified successfully. You can now log in.' }
          });
        }, 1800);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed.');
      });
  }, [navigate, searchParams]);

  return (
    <div className="page auth-page">
      <div className="verify-shell">
        <div className="auth-card">
          <span className="eyebrow">Verify Email</span>
          <h2>Confirming your account.</h2>
          <p className="section-copy">
            We are checking your verification link now.
          </p>

          <div className={`alert ${status === 'success' ? 'alert-success' : status === 'error' ? 'alert-error' : ''}`}>
            {message}
          </div>

          <div className="button-row">
            {status === 'error' && <Link to="/login"><button className="btn btn-outline">Back to login</button></Link>}
            {status === 'success' && <Link to="/login"><button className="btn btn-primary">Continue to login</button></Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
