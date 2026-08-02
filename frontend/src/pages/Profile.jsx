import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [submissionsData, setSubmissionsData] = useState({ submissions: [], stats: {} });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    api.get('/auth/profile').then((response) => {
      setProfile(response.data);
    });
    api.get('/submissions/my').then((response) => setSubmissionsData(response.data));
  }, [navigate, user]);

  if (!user) {
    return null;
  }

  return (
    <div className="page">
      <div className="container">
        <section className="profile-hero">
          <div className="profile-avatar">{user.fullName?.[0]?.toUpperCase()}</div>
          <div>
            <span className="eyebrow">Profile</span>
            <h1>{profile?.user?.fullName || user.fullName}</h1>
            <p className="section-copy">{profile?.user?.email || user.email}</p>
          </div>
          <div className="profile-badges">
            <span className={`badge ${profile?.user?.isVerified ? 'badge-accepted' : 'badge-pending'}`}>
              {profile?.user?.isVerified ? 'Verified account' : 'Pending verification'}
            </span>
            <span className="badge badge-medium">{profile?.user?.role || 'user'}</span>
          </div>
        </section>

        <section className="summary-row">
          <div className="summary-pill"><strong>{profile?.stats?.solvedProblems || 0}</strong><span>Solved problems</span></div>
          <div className="summary-pill"><strong>{submissionsData.stats?.totalSubmissions || 0}</strong><span>Total submissions</span></div>
          <div className="summary-pill"><strong>{submissionsData.stats?.acceptedSubmissions || 0}</strong><span>Accepted submissions</span></div>
          <div className="summary-pill"><strong>{submissionsData.stats?.accuracy || 0}%</strong><span>Accuracy</span></div>
        </section>

        <section className="card section-card">
          <div className="section-heading">
            <h3>Submission history</h3>
          </div>
          {submissionsData.submissions.length === 0 ? (
            <div className="empty-state">No submissions yet. Start solving to build your history.</div>
          ) : (
            <div className="submission-feed">
              {submissionsData.submissions.map((submission) => (
                <div key={submission._id} className="submission-item rich">
                  <div>
                    <strong>{submission.problem?.name}</strong>
                    <div className="muted">{submission.problem?.code} · {submission.language.toUpperCase()}</div>
                  </div>
                  <div className="submission-side">
                    <span className={`badge ${submission.verdict === 'Accepted' ? 'badge-accepted' : 'badge-wrong'}`}>{submission.verdict}</span>
                    <span className="muted">{new Date(submission.submittedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
