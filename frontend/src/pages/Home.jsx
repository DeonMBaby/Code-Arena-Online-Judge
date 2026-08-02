import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    title: 'Verified access',
    text: 'JWT-backed login with an email verification step keeps profiles and submissions tied to real accounts.'
  },
  {
    title: 'Judge-ready workflow',
    text: 'Browse problems, code in Monaco, submit in C++, Python, or Java, and review verdicts in one pass.'
  },
  {
    title: 'Progress you can read',
    text: 'Profile stats, recent runs, and top-solver boards make momentum visible instead of hidden.'
  }
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <div className="container">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">Modern Online Judge</span>
            <h1>Auth, problems, submissions, profiles, and leaderboard in one polished coding arena.</h1>
            <p>
              CodeArena is set up for verified onboarding, practical CRUD flows, and
              a more expressive interface that feels like a product instead of a demo screen.
            </p>
            <div className="button-row">
              <Link to="/problems"><button className="btn btn-primary">Explore problems</button></Link>
              {user ? (
                <Link to="/profile"><button className="btn btn-outline">Open profile</button></Link>
              ) : (
                <Link to="/register"><button className="btn btn-outline">Create account</button></Link>
              )}
            </div>
          </div>

          <div className="hero-metrics">
            <div className="stat-card accent">
              <span>Flow</span>
              <strong>Sign up / Verify / Submit</strong>
              <p>No dead-end auth screens. The onboarding path is now complete.</p>
            </div>
            <div className="stat-card">
              <span>CRUD surface</span>
              <strong>Problems, submissions, profiles</strong>
              <p>Core routes are available now, with room to grow into a full admin layer later.</p>
            </div>
            <div className="stat-card warm">
              <span>Competition</span>
              <strong>Recent runs + top solvers</strong>
              <p>Leaderboard data is shaped for both overview metrics and per-user ranking.</p>
            </div>
          </div>
        </section>

        <section className="grid-three" style={{ marginTop: 28 }}>
          {features.map((feature) => (
            <article key={feature.title} className="card feature-card">
              <div className="feature-dot" />
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
