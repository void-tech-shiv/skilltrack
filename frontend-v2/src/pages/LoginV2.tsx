import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Lock,
  Mail,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export const LoginV2: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      if (res.token && res.user) {
        login(res.token, res.user);
      } else {
        throw new Error('Authentication returned an invalid response.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-gov-navy to-brand-700 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Government of Maharashtra
            </h1>
            <p className="text-xs text-slate-500 font-semibold">
              Maharashtra State Innovation Society (MSInS) • Outcomes Intelligence Platform
            </p>
          </div>
        </div>

        <Link
          to="/verify"
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-subtle"
        >
          <Award className="w-4 h-4 text-brand-600" />
          <span className="hidden sm:inline">Verify Certificate</span>
        </Link>
      </header>

      {/* Main Login Canvas */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
        {/* Title */}
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
            Skill & Employment Ecosystem
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign In to Your Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
            Enter your official credentials to access your designated portal workspace.
          </p>
        </div>

        {/* Clean Form Card */}
        <div className="w-full bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-elevated">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Enter Credentials</h3>
          <p className="text-xs text-slate-500 mb-6">Use your registered email and password to proceed</p>

          {error && (
            <div className="p-3.5 mb-5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                  placeholder="user@maha.gov.in"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-brand-700 hover:text-gov-navy hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-brand-900 hover:bg-brand-800 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Options */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500">Need to register a new account?</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-bold text-brand-700">
              <Link to="/register-learner" className="hover:underline p-1">
                Learner Registration →
              </Link>
              <span className="hidden sm:inline text-slate-300">•</span>
              <Link to="/register-employer" className="hover:underline p-1">
                Employer Registration →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-500">
        © 2026 Maharashtra State Innovation Society (MSInS), Government of Maharashtra. All rights reserved.
      </footer>
    </div>
  );
};
