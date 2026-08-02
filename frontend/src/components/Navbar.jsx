import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="nav-shell">
      <div className="container nav-row">
        <Link to="/" className="brand-mark">
          <div className="brand-icon">CA</div>
          <div>
            <div className="brand-title">CodeArena</div>
            <div className="brand-subtitle">Compete with clarity</div>
          </div>
        </Link>

        <div className="nav-links">
          <Link to="/problems" className="nav-link">Problems</Link>
          <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
          {user && <Link to="/problems/new" className="nav-link">Add Problem</Link>}

          {user ? (
            <>
              <Link to="/profile" className="nav-profile-pill">
                <span className="nav-avatar">{user.fullName?.[0]?.toUpperCase()}</span>
                <span>{user.fullName?.split(' ')[0]}</span>
              </Link>
              <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login"><button className="btn btn-outline" style={{ fontSize: 13 }}>Login</button></Link>
              <Link to="/register"><button className="btn btn-primary" style={{ fontSize: 13 }}>Sign Up</button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
