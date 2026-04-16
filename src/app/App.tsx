//Added DarkMode Fam//
import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import { ForgotPassword } from './pages/ForgotPassword';
import { Landing } from './pages/Landing';
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
import {
  DEFAULT_AVATAR_GRADIENT_ID,
  displayNameForSelf,
} from './lib/user-display';
import { AdminUsers } from './pages/AdminUsers';
import { DarkModeProvider, useDarkMode } from './lib/DarkModeContext';


export default function App() {
  return (
    <DarkModeProvider>
      <AppInner />
    </DarkModeProvider>
  );
}

function AppInner() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [sessionFullName, setSessionFullName] = useState<string | null>(null);
  const [sessionAvatarGradient, setSessionAvatarGradient] = useState(DEFAULT_AVATAR_GRADIENT_ID);
  const [sessionAvatarImage, setSessionAvatarImage] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<'admin' | 'developer'>('developer');
  const [isLoading, setIsLoading] = useState(true);
  const { syncFromServer } = useDarkMode();

  const applyMeResponse = (res: Awaited<ReturnType<typeof api.me>>) => {
    if (res.authenticated && res.username) {
      setCurrentUser(res.username);
      setSessionFullName(res.full_name ?? null);
      setSessionAvatarGradient(
        res.avatar_gradient?.trim() ? res.avatar_gradient.trim() : DEFAULT_AVATAR_GRADIENT_ID
      );
      setSessionAvatarImage(res.avatar_image ?? null);
      setCurrentRole(res.role === 'admin' ? 'admin' : 'developer');
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', res.username);

      syncFromServer(res.theme_preference ?? 'light');
    } else {
      setIsAuthenticated(false);
      setCurrentUser('');
      setSessionFullName(null);
      setSessionAvatarGradient(DEFAULT_AVATAR_GRADIENT_ID);
      setSessionAvatarImage(null);
      setCurrentRole('developer');
      localStorage.removeItem('currentUser');
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.me();
        if (cancelled) return;
        applyMeResponse(res);
      } catch {
        if (cancelled) return;
        setIsAuthenticated(false);
        setCurrentUser('');
        setSessionFullName(null);
        setSessionAvatarGradient(DEFAULT_AVATAR_GRADIENT_ID);
        setSessionAvatarImage(null);
        setCurrentRole('developer');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshSession = async () => {
    try {
      const res = await api.me();
      applyMeResponse(res);
    } catch {
      /* keep prior session */
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser('');
    setSessionFullName(null);
    setSessionAvatarGradient(DEFAULT_AVATAR_GRADIENT_ID);
    setSessionAvatarImage(null);
    setCurrentRole('developer');
    localStorage.removeItem('currentUser');
    api.logout().catch(() => {});
  };

  const handleUserUpdate = (newUsername: string) => {
    setCurrentUser(newUsername);
    localStorage.setItem('currentUser', newUsername);
  };

  const sessionDisplayName = displayNameForSelf(sessionFullName, currentUser);

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
          path="/forgot-password"
          element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Landing onAuthed={handleAuthed} />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Landing onAuthed={handleAuthed} />}
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Dashboard
                currentUser={currentUser}
                sessionDisplayName={sessionDisplayName}
                sessionAvatarGradient={sessionAvatarGradient}
                sessionAvatarImage={sessionAvatarImage}
                currentRole={currentRole}
                onLogout={handleLogout}
                onUserUpdate={handleUserUpdate}
                onSessionRefresh={refreshSession}
              />
            ) : (
              <Landing onAuthed={handleAuthed} />
            )
          }
        >
          {isAuthenticated ? (
            <>
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
            </>
          ) : null}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}