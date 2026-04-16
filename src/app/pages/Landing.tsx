import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BarChart2,
  Bug,
  ChevronRight,
  UserPlus,
  Activity,
} from 'lucide-react';
import loginLogo from '../../assets/fflogo.jpeg';
import { Login } from './Login';
import { Signup } from './Signup';
import { api } from '../lib/api';

const ffYellow = '#facc15';

interface LandingProps {
  onAuthed: (username: string) => void;
}

export function Landing({ onAuthed }: LandingProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null);
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    if (location.pathname === '/login') setAuthModal('login');
    else if (location.pathname === '/signup') setAuthModal('signup');
    else setAuthModal(null);
  }, [location.pathname]);

  const closeAuthModal = useCallback(() => {
    setLoginError('');
    setSignupError('');
    setAuthModal(null);
    if (location.pathname === '/login' || location.pathname === '/signup') {
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!authModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authModal, closeAuthModal]);

  const goLogin = () => navigate('/login');
  const goSignup = () => navigate('/signup');

  const handleLogin = async (username: string, password: string) => {
    setLoginError('');
    setAuthBusy(true);
    try {
      const result = await api.login(username, password);
      if (!result.success || !result.username) {
        setLoginError(result.message || 'Login failed');
        return;
      }
      localStorage.setItem('currentUser', result.username);
      onAuthed(result.username);
      window.location.href = import.meta.env.BASE_URL;
    } catch (e: unknown) {
      setLoginError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignup = async (email: string, username: string, password: string) => {
    setSignupError('');
    setAuthBusy(true);
    try {
      const signupRes = await api.signup(username, email, username, password);
      if (!signupRes.success) {
        setSignupError(signupRes.message || 'Signup failed');
        return;
      }
      const loginRes = await api.login(username, password);
      if (!loginRes.success || !loginRes.username) {
        navigate('/login', { replace: true });
        return;
      }
      localStorage.setItem('currentUser', loginRes.username);
      onAuthed(loginRes.username);
      window.location.href = import.meta.env.BASE_URL;
    } catch (e: unknown) {
      setSignupError(e instanceof Error ? e.message : 'Signup failed');
    } finally {
      setAuthBusy(false);
    }
  };

  const openForgotPassword = () => {
    setAuthModal(null);
    setLoginError('');
    navigate('/forgot-password', { replace: true });
  };

  const features = [
    {
      title: 'Create and track bugs',
      desc: 'Log issues with priority, description, and due dates.',
      icon: Bug,
      bg: 'from-amber-50 to-yellow-50 border-amber-100',
      iconClass: 'text-amber-700',
    },
    {
      title: 'View bug status',
      desc: 'Instantly see high, medium, low, and overdue bugs.',
      icon: BarChart2,
      bg: 'from-rose-50 to-pink-50 border-rose-100',
      iconClass: 'text-rose-700',
    },
    {
      title: 'Assign bugs',
      desc: 'Assign issues to teammates for accountability.',
      icon: UserPlus,
      bg: 'from-emerald-50 to-green-50 border-emerald-100',
      iconClass: 'text-emerald-700',
    },
    {
      title: 'Monitor progress',
      desc: 'Keep the team aligned from triage to resolution.',
      icon: Activity,
      bg: 'from-sky-50 to-blue-50 border-sky-100',
      iconClass: 'text-sky-800',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#282d33] text-slate-900 dark:text-white">
      <header className="sticky top-0 z-40 border-b border-gray-200/80 dark:border-[#3e4650] bg-white/95 dark:bg-[#282d33]/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-gray-100 shadow-sm">
              <img src={loginLogo} alt="" className="h-full w-full object-cover scale-110" aria-hidden />
            </span>
            <span className="font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">FixFlow</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={goLogin}
              className="px-4 py-2 rounded-full text-sm sm:text-base font-semibold border-2 border-gray-300 dark:border-gray-500 text-slate-800 dark:text-white hover:bg-gray-50 dark:hover:bg-[#363d45] transition-colors"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={goSignup}
              className="inline-flex items-center gap-1 sm:gap-2 pl-4 pr-3 py-2 rounded-full text-sm sm:text-base font-bold text-black border-2 border-black transition-colors hover:opacity-95"
              style={{ backgroundColor: ffYellow }}
            >
              Sign Up
              <span className="hidden sm:inline w-px h-4 bg-black/25" aria-hidden />
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
              Welcome to FixFlow
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 mb-3 sm:mb-4">
              Track, prioritize, and resolve bugs with clarity and speed.
            </p>
            <p className="text-slate-400 mb-8 sm:mb-10 text-sm sm:text-base leading-relaxed">
              FixFlow helps teams manage bug reports, prioritize issues, and keep projects running smoothly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={goSignup}
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-black text-lg border-2 border-black shadow-lg hover:brightness-105 transition-all"
                style={{ backgroundColor: ffYellow }}
              >
                Get Started
              </button>
              <button
                type="button"
                onClick={goLogin}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-slate-900 bg-white border-2 border-white hover:bg-slate-100 transition-colors text-lg"
              >
                Log In
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10 sm:mb-12 text-center sm:text-left">
          What you can do with FixFlow
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-2xl border p-5 sm:p-6 lg:p-5 bg-gradient-to-br shadow-sm hover:shadow-md transition-shadow ${f.bg}`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`rounded-xl bg-white/80 p-3 shadow-sm shrink-0 ${f.iconClass}`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 sm:mb-2 leading-snug">
                      {f.title}
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-gray-200 dark:border-[#3e4650] bg-gray-50 dark:bg-[#2f353c]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">How FixFlow helps your team</h2>
            <p className="text-slate-600 leading-relaxed">
              FixFlow gives teams a clear, organized way to report, prioritize, and resolve software issues. With
              real-time visibility into bug status and assignments, everyone stays aligned and accountable.
            </p>
          </div>
          <div
            className="rounded-2xl border-2 border-amber-200/80 p-8 sm:p-10 shadow-sm w-full lg:max-w-md"
            style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}
          >
            <p className="font-semibold text-slate-900 text-lg mb-6">Ready to streamline your bug tracking?</p>
            <button
              type="button"
              onClick={goSignup}
              className="w-full py-3.5 rounded-full font-bold text-black border-2 border-black hover:brightness-105 transition-all"
              style={{ backgroundColor: ffYellow }}
            >
              Create your free account
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 dark:border-[#3e4650] py-8 text-center text-sm text-slate-500 dark:text-gray-400">
        FixFlow — bug tracking for clearer delivery.
      </footer>

      {authModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
          role="presentation"
          onClick={closeAuthModal}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-gray-200 dark:bg-[#282d33] p-4 sm:p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={authModal === 'login' ? 'login-heading' : 'signup-heading'}
            onClick={(e) => e.stopPropagation()}
          >
            {authModal === 'login' && (
              <Login
                key="login-modal"
                variant="modal"
                onLogin={handleLogin}
                error={authBusy ? 'Signing in…' : loginError}
                onClose={closeAuthModal}
                onRequestSignup={() => navigate('/signup', { replace: true })}
                onRequestForgotPassword={openForgotPassword}
              />
            )}
            {authModal === 'signup' && (
              <Signup
                key="signup-modal"
                variant="modal"
                onSignup={handleSignup}
                error={authBusy ? 'Creating account…' : signupError}
                onClose={closeAuthModal}
                onRequestLogin={() => navigate('/login', { replace: true })}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
