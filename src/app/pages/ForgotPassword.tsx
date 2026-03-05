import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import loginLogo from '../../assets/fflogo.jpeg';
import { api } from '../lib/api';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const sendVerificationCode = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await api.sendVerificationCode(email);
      if (!res.success) {
        setError(res.message || 'Failed to send verification code');
        return;
      }
      setStep('code');
      setCodeInput('');
      const demo = res.demo_code ? ` (Demo code: ${String(res.demo_code)})` : '';
      setSuccess((res.message || 'Verification code sent.') + demo);
    } catch (e: any) {
      setError(e?.message || 'Failed to send verification code');
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendVerificationCode();
  };

  const handleCodeContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!codeInput.trim()) {
      setError('Please enter the verification code');
      return;
    }
    setStep('reset');
    setSuccess('');
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    
    try {
      const res = await api.resetPassword(email, codeInput.trim(), newPassword);
      if (!res.success) {
        setError(res.message || 'Failed to reset password');
        return;
      }
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (e: any) {
      setError(e?.message || 'Failed to reset password');
    }
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
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
            <h1 className="text-2xl sm:text-5xl font-bold">
              {step === 'email' && 'FORGOT PASSWORD'}
              {step === 'code' && 'VERIFY EMAIL'}
              {step === 'reset' && 'RESET PASSWORD'}
            </h1>
          </div>

          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl sm:rounded-2xl text-center text-sm sm:text-base">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-100 border border-green-400 text-green-700 rounded-xl sm:rounded-2xl text-center text-sm sm:text-base">
              {success}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-5 sm:space-y-8">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-lg">
                <p className="text-gray-700 text-sm sm:text-base">
                  <strong>Enter your email address</strong> and we'll send you a verification code to reset your password.
                </p>
              </div>

              <div>
                <label className="block text-base sm:text-xl font-bold italic mb-2 sm:mb-3">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your email"
                    className={`w-full pl-11 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-full outline-none transition-colors ${
                      focusedField === 'email'
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="pt-2 sm:pt-4">
                <button
                  type="submit"
                  className="w-full py-3 sm:py-4 bg-white border-2 border-black rounded-full text-xl sm:text-2xl font-bold italic hover:bg-gray-50 transition-colors"
                >
                  Send verification code
                </button>
              </div>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleCodeContinue} className="space-y-5 sm:space-y-8">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-lg">
                <p className="text-gray-700 text-sm sm:text-base">
                  Enter the 6-digit verification code sent to your email.
                </p>
              </div>

              <div>
                <label className="block text-base sm:text-xl font-bold italic mb-2 sm:mb-3">Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
                  onFocus={() => setFocusedField('code')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter 6-digit code"
                  className={`w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-full outline-none transition-colors text-center tracking-widest ${
                    focusedField === 'code' ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full py-3 sm:py-4 bg-white border-2 border-black rounded-full text-xl sm:text-2xl font-bold italic hover:bg-gray-50 transition-colors"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  className="text-base sm:text-lg font-bold italic hover:underline"
                >
                  Didn't receive email? Re-send
                </button>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handlePasswordReset} className="space-y-5 sm:space-y-8">
              <div className="bg-green-50 border-l-4 border-green-500 p-3 sm:p-4 rounded-lg">
                <p className="text-gray-700 text-sm sm:text-base">
                  <strong>Email verified!</strong> Now create a new password for your account.
                </p>
              </div>

              <div>
                <label className="block text-base sm:text-xl font-bold italic mb-2 sm:mb-3">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => setFocusedField('newPassword')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter new password"
                    className={`w-full pl-11 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-full outline-none transition-colors ${
                      focusedField === 'newPassword'
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-base sm:text-xl font-bold italic mb-2 sm:mb-3">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Confirm new password"
                    className={`w-full pl-11 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-full outline-none transition-colors ${
                      focusedField === 'confirmPassword'
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="pt-2 sm:pt-4">
                <button
                  type="submit"
                  className="w-full py-3 sm:py-4 bg-white border-2 border-black rounded-full text-xl sm:text-2xl font-bold italic hover:bg-gray-50 transition-colors"
                >
                  Reset Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}