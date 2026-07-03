import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      await signIn(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

        {/* Login Card */}
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 backdrop-blur-xl border border-slate-700 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-slate-400">Sign in to your account</p>
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

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Signup Link */}
          <div className="text-center">
            <p className="text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <p className="text-xs text-blue-300 mb-2">📝 Demo Credentials:</p>
          <p className="text-xs text-blue-300">Email: demo@example.com</p>
          <p className="text-xs text-blue-300">Password: demo123</p>
        </div>
      </div>
    </div>
  );
}