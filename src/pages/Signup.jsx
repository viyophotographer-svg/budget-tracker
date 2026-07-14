import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, UserPlus, MailCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../services/authService';

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await signUp(formData.email, formData.password);
      setSignupComplete(true);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Shown after a successful signup, since email confirmation is required
  // before the user can actually log in.
  if (signupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 mb-4">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">BudgetPro</h1>
            <p className="text-slate-400">Smart Finance Management</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 backdrop-blur-xl border border-slate-700 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
              <MailCheck className="w-7 h-7 text-blue-400" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-slate-400">
                We've sent a confirmation link to
              </p>
              <p className="text-white font-medium mt-1">{formData.email}</p>
            </div>

            <p className="text-sm text-slate-400">
              Click the link in that email to activate your account, then come back here to sign in. Don't forget to check your spam folder if it doesn't show up in a minute or two.
            </p>

            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 mb-4">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">BudgetPro</h1>
          <p className="text-slate-400">Smart Finance Management</p>
        </div>

        {/* Signup Card */}
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 backdrop-blur-xl border border-slate-700 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-slate-400">Join us and start managing your finances</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-12 pr-12 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-12 pr-12 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-3 text-slate-400 hover:text-slate-300"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Signup Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}