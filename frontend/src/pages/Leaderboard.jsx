import { useEffect, useState } from 'react';
import api from '../api';

export default function Leaderboard() {
  const [data, setData] = useState({ overview: {}, recentSubmissions: [], topSolvers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboard')
      .then((response) => setData(response.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page"><div className="container empty-state">Loading leaderboard...</div></div>;
  }

  return (
    <div className="page">
      <div className="container">
        <section className="section-banner">
          <div>
            <span className="eyebrow">Leaderboard</span>
            <h1>Track the latest submission flow and top solver standings.</h1>
            <p className="section-copy">Overview metrics, recent runs, and ranked solvers are all fetched from the backend in one request.</p>
          </div>
        </section>

        <section className="summary-row">
          <div className="summary-pill"><strong>{data.overview.totalSubmissions || 0}</strong><span>Total submissions</span></div>
          <div className="summary-pill"><strong>{data.overview.acceptedSubmissions || 0}</strong><span>Accepted</span></div>
          <div className="summary-pill"><strong>{data.overview.activeUsers || 0}</strong><span>Active users</span></div>
          <div className="summary-pill"><strong>{data.overview.acceptanceRate || 0}%</strong><span>Acceptance rate</span></div>
        </section>

        <div className="leaderboard-grid">
          <section className="card section-card">
            <div className="section-heading">
              <h3>Top solvers</h3>
            </div>
            <div className="rank-list">
              {data.topSolvers.map((solver, index) => (
                <div key={solver.user?._id || index} className="rank-row">
                  <div className="rank-badge">#{index + 1}</div>
                  <div>
                    <strong>{solver.user?.fullName}</strong>
                    <div className="muted">{solver.solvedCount} solved problems</div>
                  </div>
                  <div className="rank-score">{solver.accepted} AC</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card section-card">
            <div className="section-heading">
              <h3>Recent submissions</h3>
            </div>
            <div className="submission-feed">
              {data.recentSubmissions.map((submission) => (
                <div key={submission._id} className="submission-item rich">
                  <div>
                    <strong>{submission.user?.fullName}</strong>
                    <div className="muted">{submission.problem?.name} · {submission.language.toUpperCase()}</div>
                  </div>
                  <div className="submission-side">
                    <span className={`badge ${submission.verdict === 'Accepted' ? 'badge-accepted' : 'badge-wrong'}`}>{submission.verdict}</span>
                    <span className="muted">{new Date(submission.submittedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
