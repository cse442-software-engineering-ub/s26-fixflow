import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router';
import { Toaster } from 'sonner';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';
import { AllBugs } from './pages/AllBugs';
import { ActiveBugs } from './pages/ActiveBugs';
import { FixedBugs } from './pages/FixedBugs';
import { UpcomingBugs } from './pages/UpcomingBugs';
import { OverdueBugs } from './pages/OverdueBugs';
import { AssignedBugs } from './pages/AssignedBugs';
import { BugHistory } from './pages/BugHistory';
import { BrowseAllBugs } from './pages/BrowseAllBugs';
import { PrioritizedBugs } from './pages/PrioritizedBugs';
import { DeletedBugs } from './pages/DeletedBugs';
import { api } from './lib/api';
import { AdminUsers } from './pages/AdminUsers';

function LoginWrapper({ onAuthed }: { onAuthed: (username: string) => void }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (username: string, password: string) => {
    setError('');
    setIsSubmitting(true);
    try {
      const result = await api.login(username, password);
      if (!result.success || !result.username) {
        setError(result.message || 'Login failed');
        return;
      }

      localStorage.setItem('currentUser', result.username);
      onAuthed(result.username);
      // Force a full reload so the protected route reads the new session reliably.
      window.location.href = import.meta.env.BASE_URL;
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <Login onLogin={handleLogin} error={isSubmitting ? 'Signing in…' : error} />;
}

function SignupWrapper({ onAuthed }: { onAuthed: (username: string) => void }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (email: string, username: string, password: string) => {
    setError('');
    setIsSubmitting(true);
    try {
      // Backend expects a "name" field; default to username.
      const signupRes = await api.signup(username, email, username, password);
      if (!signupRes.success) {
        setError(signupRes.message || 'Signup failed');
        return;
      }

      const loginRes = await api.login(username, password);
      if (!loginRes.success || !loginRes.username) {
        navigate('/login', { replace: true });
        return;
      }

      localStorage.setItem('currentUser', loginRes.username);
      onAuthed(loginRes.username);
      // Force a full reload so the protected route reads the new session reliably.
      window.location.href = import.meta.env.BASE_URL;
    } catch (e: any) {
      setError(e?.message || 'Signup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <Signup onSignup={handleSignup} error={isSubmitting ? 'Creating account…' : error} />;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [currentRole, setCurrentRole] = useState<'admin' | 'developer'>('developer');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.me();
        if (cancelled) return;
        if (res.authenticated && res.username) {
          setCurrentUser(res.username);
          setCurrentRole(res.role === 'admin' ? 'admin' : 'developer');
          setIsAuthenticated(true);
          localStorage.setItem('currentUser', res.username);
        } else {
          setIsAuthenticated(false);
          setCurrentUser('');
          setCurrentRole('developer');
          localStorage.removeItem('currentUser');
        }
      } catch {
        if (cancelled) return;
        setIsAuthenticated(false);
        setCurrentUser('');
        setCurrentRole('developer');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser('');
    setCurrentRole('developer');
    localStorage.removeItem('currentUser');
    api.logout().catch(() => {});
  };

  const handleUserUpdate = (newUsername: string) => {
    setCurrentUser(newUsername);
  };

  const handleAuthed = (username: string) => {
    setCurrentUser(username);
    setIsAuthenticated(true);
  };

  const isAdmin = currentRole === 'admin';

  // Don't render until we've checked authentication
  if (isLoading) {
    return null;
  }

  return (
    <HashRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginWrapper onAuthed={handleAuthed} />} 
        />
        <Route 
          path="/signup" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <SignupWrapper onAuthed={handleAuthed} />} 
        />
        <Route 
          path="/forgot-password" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />} 
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Dashboard
                currentUser={currentUser}
                currentRole={currentRole}
                onLogout={handleLogout}
                onUserUpdate={handleUserUpdate}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Home />} />
          <Route path="all" element={<AllBugs />} />
          <Route path="active" element={<ActiveBugs />} />
          <Route path="fixed" element={<FixedBugs />} />
          <Route path="upcoming" element={<UpcomingBugs />} />
          <Route path="overdue" element={<OverdueBugs />} />
          <Route path="assigned" element={<AssignedBugs />} />
          <Route path="history" element={<BugHistory />} />
          <Route path="browse" element={<BrowseAllBugs />} />
          <Route path="prioritized" element={<PrioritizedBugs />} />
          <Route path="deleted" element={<DeletedBugs />} />
          <Route
            path="admin/users"
            element={isAdmin ? <AdminUsers currentUser={currentUser} /> : <Navigate to="/" replace />}
          />
        </Route>
      </Routes>
    </HashRouter>
  );
}