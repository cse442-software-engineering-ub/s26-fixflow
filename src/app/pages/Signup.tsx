import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import loginLogo from '../../assets/fflogo.jpeg';

interface SignupProps {
  onSignup: (email: string, username: string, password: string) => void;
  error?: string;
}

export function Signup({ onSignup, error }: SignupProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'username' | 'password' | 'confirm' | null>(null);
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !username || !password || !confirmPassword) {
      setLocalError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    onSignup(email, username, password);
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-4 sm:mb-8">
          <div className="inline-flex items-center gap-4 sm:gap-5 bg-white rounded-3xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100/90 px-8 sm:px-10 py-5 sm:py-6">
            <span className="h-11 w-11 sm:h-16 sm:w-16 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-white">
            <img src={loginLogo} alt="" className="h-full w-full object-cover object-center scale-110" aria-hidden />
          </span>
            <span className="text-[#1e293b] font-bold text-2xl sm:text-3xl tracking-tight select-none" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>FixFlow</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg px-5 py-6 sm:p-12">
          <h1 className="text-3xl sm:text-6xl font-bold text-center mb-6 sm:mb-12">SIGN UP</h1>

          {(error || localError) && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl sm:rounded-2xl text-center text-sm sm:text-base">
              {error || localError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8">
            <div>
              <label className="block text-base sm:text-xl font-bold italic mb-2 sm:mb-3">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter Email"
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-full outline-none transition-colors ${
                  focusedField === 'email'
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 bg-white'
                }`}
                required
              />
            </div>

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
                  focusedField === 'username'
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 bg-white'
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
                  focusedField === 'password'
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 bg-white'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-base sm:text-xl font-bold italic mb-2 sm:mb-3">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                placeholder="Confirm Password"
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-full outline-none transition-colors ${
                  focusedField === 'confirm'
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 bg-white'
                }`}
                required
              />
            </div>

            <div className="pt-2 sm:pt-4">
              <button
                type="submit"
                className="w-full py-3 sm:py-4 bg-white border-2 border-black rounded-full text-xl sm:text-2xl font-bold italic hover:bg-gray-50 transition-colors"
              >
                Sign Up
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="text-lg sm:text-2xl font-bold italic hover:underline"
              >
                Already have an account? Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
