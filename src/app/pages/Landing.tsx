//Added DarkMode Fam//
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
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-white dark:bg-[#282d33] text-slate-900 dark:text-white">
      <header className="sticky top-0 z-40 border-b border-gray-200/80 dark:border-[#3e4650] bg-white/95 dark:bg-[#282d33]/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-gray-100 shadow-sm">
              <img src={loginLogo} alt="" className="h-full w-full object-cover scale-110" aria-hidden />
            </span>
            <span className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">FixFlow</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={goLogin}
              className="px-3.5 py-1.5 rounded-full text-sm font-semibold border-2 border-gray-300 dark:border-gray-500 text-slate-800 dark:text-white hover:bg-gray-50 dark:hover:bg-[#363d45] transition-colors"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={goSignup}
              className="inline-flex items-center gap-1 sm:gap-2 pl-3.5 pr-3 py-1.5 rounded-full text-sm font-bold text-black border-2 border-black transition-colors hover:opacity-95"
              style={{ backgroundColor: ffYellow }}
            >
              Sign Up
              <span className="hidden sm:inline w-px h-4 bg-black/25" aria-hidden />
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="lg:h-[calc(100vh-4rem)] lg:flex lg:flex-col">
      <section className="relative overflow-hidden bg-slate-900 text-white lg:flex-[1.2]">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:pt-4 lg:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-4xl xl:text-5xl font-bold leading-tight mb-4 sm:mb-6 lg:mb-4">
              Welcome to FixFlow
            </h1>
            <p className="text-lg sm:text-xl lg:text-lg text-slate-300 mb-3 sm:mb-4 lg:mb-3">
              Track, prioritize, and resolve bugs with clarity and speed.
            </p>
            <p className="text-slate-400 mb-8 sm:mb-10 lg:mb-6 text-sm sm:text-base leading-relaxed">
              FixFlow helps teams manage bug reports, prioritize issues, and keep projects running smoothly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-3">
              <button
                type="button"
                onClick={goSignup}
                className="inline-flex items-center justify-center px-8 py-3 lg:py-2.5 rounded-full font-bold text-black text-lg lg:text-base border-2 border-black shadow-lg hover:brightness-105 transition-all"
                style={{ backgroundColor: ffYellow }}
              >
                Get Started
              </button>
              <button
                type="button"
                onClick={goLogin}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 lg:py-2.5 rounded-full font-bold text-slate-900 bg-white border-2 border-white hover:bg-slate-100 transition-colors text-lg lg:text-base"
              >
                Log In
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:pt-11 lg:pb-1 lg:flex-1">
        <h2 className="text-2xl sm:text-3xl lg:text-2xl font-bold text-slate-900 mb-8 sm:mb-9 lg:mb-4 text-center sm:text-left">
          What you can do with FixFlow
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-2xl border p-5 sm:p-6 lg:p-4 bg-gradient-to-br shadow-sm hover:shadow-md transition-shadow ${f.bg}`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`rounded-xl bg-white/80 p-3 shadow-sm shrink-0 ${f.iconClass}`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg lg:text-base font-bold text-slate-900 mb-1.5 sm:mb-2 lg:mb-1 leading-snug">
                      {f.title}
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm lg:text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-gray-200 dark:border-[#3e4650] bg-gray-50 dark:bg-[#2f353c] lg:flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl lg:text-2xl font-bold text-slate-900 mb-4 lg:mb-2">How FixFlow helps your team</h2>
            <p className="text-slate-600 leading-relaxed">
              FixFlow gives teams a clear, organized way to report, prioritize, and resolve software issues. With
              real-time visibility into bug status and assignments, everyone stays aligned and accountable.
            </p>
          </div>
          <div
            className="rounded-2xl border-2 border-amber-200/80 dark:border-[#3e4650] p-8 sm:p-10 lg:p-6 shadow-sm w-full lg:max-w-md bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] dark:from-[#282d33] dark:to-[#282d33]"
          >
            <p className="font-semibold text-slate-900 dark:text-white text-lg mb-6">Ready to streamline your bug tracking?</p>
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
      </main>

      <footer className="lg:hidden border-t border-gray-200 dark:border-[#3e4650] py-8 text-center text-sm text-slate-500 dark:text-gray-400">
        FixFlow - bug tracking for clearer delivery.
      </footer>

      {authModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
          role="presentation"
          onClick={closeAuthModal}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
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
