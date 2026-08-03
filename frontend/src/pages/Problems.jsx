import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const filters = ['All', 'Easy', 'Medium', 'Hard'];

export default function Problems() {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/problems', { params: { difficulty: filter, search } })
      .then((response) => setProblems(response.data))
      .finally(() => setLoading(false));
  }, [filter, search]);

  const summary = useMemo(() => ({
    total: problems.length,
    easy: problems.filter((problem) => problem.difficulty === 'Easy').length,
    medium: problems.filter((problem) => problem.difficulty === 'Medium').length,
    hard: problems.filter((problem) => problem.difficulty === 'Hard').length
  }), [problems]);

  return (
    <div className="page">
      <div className="container">
        <section className="section-banner">
          <div>
            <span className="eyebrow">Problem Bank</span>
            <h1>Browse, filter, and publish coding challenges.</h1>
            <p className="section-copy">The problem list now supports search, difficulty filters, and a basic creation route for verified users.</p>
          </div>
          {user && <Link to="/problems/new"><button className="btn btn-primary">Add problem</button></Link>}
        </section>

        <section className="summary-row">
          <div className="summary-pill"><strong>{summary.total}</strong><span>Total</span></div>
          <div className="summary-pill"><strong>{summary.easy}</strong><span>Easy</span></div>
          <div className="summary-pill"><strong>{summary.medium}</strong><span>Medium</span></div>
          <div className="summary-pill"><strong>{summary.hard}</strong><span>Hard</span></div>
        </section>

        <section className="card section-card">
          <div className="toolbar">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by problem name or code"
              className="search-input"
            />
            <div className="filter-row">
              {filters.map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setFilter(difficulty)}
                  className={`btn ${filter === difficulty ? 'btn-primary' : 'btn-outline'}`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading problems...</div>
          ) : problems.length === 0 ? (
            <div className="empty-state">No problems matched this filter.</div>
          ) : (
            <div className="list-grid">
              {problems.map((problem) => (
                <article key={problem._id} className="problem-card">
                  
                  <div className="problem-topline">
  <span className={`badge badge-${problem.difficulty?.toLowerCase()}`}>{problem.difficulty}</span>
  <span className="muted">{problem.code}</span>
  {problem.solved && (
    <span className="badge" style={{ background: '#1a7a5e', color: '#fff' }}>✓ Solved</span>
  )}
</div>
                  <h3>{problem.name}</h3>
                  <p className="problem-meta">
                    Created {new Date(problem.createdAt).toLocaleDateString()}
                    {problem.createdBy?.fullName ? ` by ${problem.createdBy.fullName}` : ''}
                  </p>
                  <Link to={`/problems/${problem._id}`} className="inline-link">Open challenge</Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
