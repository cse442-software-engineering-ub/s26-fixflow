import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, X } from 'lucide-react';
import loginLogo from '../../assets/fflogo.jpeg';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  error?: string;
  variant?: 'page' | 'modal';
  onClose?: () => void;
  onRequestSignup?: () => void;
  onRequestForgotPassword?: () => void;
}

export function Login({
  onLogin,
  error,
  variant = 'page',
  onClose,
  onRequestSignup,
  onRequestForgotPassword,
}: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      onLogin(username, password);
    }
  };

  const inner = (
    <>
      <div className={`text-center ${variant === 'modal' ? 'mb-4' : 'mb-4 sm:mb-8'}`}>
        <div className="inline-flex items-center gap-4 sm:gap-5 bg-white rounded-3xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100/90 px-8 sm:px-10 py-5 sm:py-6">
          <span className="h-11 w-11 sm:h-16 sm:w-16 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-white">
            <img src={loginLogo} alt="" className="h-full w-full object-cover object-center scale-110" aria-hidden />
          </span>
          <span
            className="text-[#1e293b] font-bold text-2xl sm:text-3xl tracking-tight select-none"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            FixFlow
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg px-5 py-6 sm:p-12">
        <h1
          id={variant === 'modal' ? 'login-heading' : undefined}
          className={`font-bold text-center mb-6 sm:mb-12 ${variant === 'modal' ? 'text-3xl sm:text-4xl' : 'text-3xl sm:text-6xl'}`}
        >
          LOGIN
        </h1>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl sm:rounded-2xl text-center text-sm sm:text-base">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8">
          <div>
            <label className="block text-base sm:text-xl font-bold italic mb-2 sm:mb-3">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              placeholder="Enter Username"
              className={`w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-full outline-none transition-colors ${
                focusedField === 'username' ? 'border-blue-400 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 bg-white dark:bg-[#363d45]'
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-base sm:text-xl font-bold italic mb-2 sm:mb-3">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="Enter Password"
              className={`w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-full outline-none transition-colors ${
                focusedField === 'password' ? 'border-blue-400 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 bg-white dark:bg-[#363d45]'
              }`}
              required
            />
          </div>

          <div className="pt-2 sm:pt-4">
            <button
              type="submit"
              className="w-full py-3 sm:py-4 bg-white dark:bg-[#363d45] border-2 border-black dark:border-gray-500 dark:text-white rounded-full text-xl sm:text-2xl font-bold italic hover:bg-gray-50 dark:hover:bg-[#3e4650] transition-colors"
            >
              Continue
            </button>
          </div>

          <div className="text-center">
            {onRequestSignup ? (
              <button
                type="button"
                onClick={onRequestSignup}
                className="text-lg sm:text-2xl font-bold italic hover:underline"
              >
                New User? Sign Up
              </button>
            ) : (
              <Link to="/signup" className="text-lg sm:text-2xl font-bold italic hover:underline">
                New User? Sign Up
              </Link>
            )}
          </div>

          <div className="text-left pt-2 sm:pt-4">
            {onRequestForgotPassword ? (
              <button
                type="button"
                onClick={onRequestForgotPassword}
                className="text-base sm:text-xl font-bold italic hover:underline flex items-center gap-2"
              >
                Forgot Password? <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            ) : (
              <Link
                to="/forgot-password"
                className="text-base sm:text-xl font-bold italic hover:underline flex items-center gap-2"
              >
                Forgot Password? <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            )}
          </div>
        </form>
      </div>
    </>
  );

  if (variant === 'modal') {
    return (
      <div className="relative w-full max-w-lg mx-auto">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute -right-1 -top-1 z-10 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {inner}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-3xl">{inner}</div>
    </div>
  );
}
