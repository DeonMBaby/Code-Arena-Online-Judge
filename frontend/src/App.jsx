import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Problems from './pages/Problems';
import ProblemDetail from './pages/ProblemDetail';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import CreateProblem from './pages/CreateProblem';
import './index.css';

function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/problems" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/problems" replace /> : <Login />} />
        <Route
          path="/login"
          element={(
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          )}
        />
        <Route
          path="/register"
          element={(
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          )}
        />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/problems"
          element={(
            <ProtectedRoute>
              <Problems />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/problems/new"
          element={(
            <ProtectedRoute>
              <CreateProblem />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/problems/:id"
          element={(
            <ProtectedRoute>
              <ProblemDetail />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/leaderboard"
          element={(
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/profile"
          element={(
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to={user ? '/problems' : '/login'} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
