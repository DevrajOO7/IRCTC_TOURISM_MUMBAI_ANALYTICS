import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../api';
import { useTheme } from '../context/ThemeContext';
import logoLight from '../assets/Irctc_tourism_light.png';
import logoDark from '../assets/Irctc_tourism_dark.png';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (onLogin) onLogin(user, token);
      toast.success('Welcome');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-dark-bg flex items-center justify-center p-4 transition-colors duration-200 relative">
      {/* Developer Credits */}
      <div className="absolute top-4 right-4 animate-fade-in">
        <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 border border-white/20 shadow-lg backdrop-blur-md bg-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-medium text-secondary-600 dark:text-gray-300 tracking-wide">
            Developed by <span className="font-bold text-primary-600 dark:text-primary-400">DEVRAJ</span>
          </span>
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-8 border border-secondary-100 dark:border-dark-border">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src={theme === 'dark' ? logoDark : logoLight}
                alt="IRCTC Logo"
                className={`h-22 w-28 object-contain ${theme === 'dark' ? 'mix-blend-screen' : 'mix-blend-multiply'}`}
              />
            </div>
            <h2 className="text-xl font-bold text-primary-600 dark:text-primary-500 mb-2">IRCTC TOURISM MUMBAI</h2>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-dark-text-primary mb-2">Welcome</h1>
            <p className="text-secondary-500 dark:text-dark-text-secondary">Sign in to access your dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Username</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 dark:text-dark-text-secondary" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary dark:placeholder-dark-text-muted transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 dark:text-dark-text-secondary" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary dark:placeholder-dark-text-muted transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-secondary-100 dark:border-dark-border">
            <p className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide mb-3 text-center">Demo Credentials use admin</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div className="p-2 bg-secondary-50 dark:bg-dark-bg rounded border border-secondary-200 dark:border-dark-border">
                <div className="font-medium text-secondary-900 dark:text-dark-text-primary">admin</div>
                <div className="font-medium text-secondary-900 dark:text-dark-text-primary">admin123</div>
              </div>
              <div className="p-2 bg-secondary-50 dark:bg-dark-bg rounded border border-secondary-200 dark:border-dark-border">
                <div className="font-medium text-secondary-900 dark:text-dark-text-primary">Manager</div>
                <div className="text-secondary-500 dark:text-dark-text-secondary">manager</div>
              </div>
              <div className="p-2 bg-secondary-50 dark:bg-dark-bg rounded border border-secondary-200 dark:border-dark-border">
                <div className="font-medium text-secondary-900 dark:text-dark-text-primary">Viewer</div>
                <div className="text-secondary-500 dark:text-dark-text-secondary">viewer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
