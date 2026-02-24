import React, { useState } from 'react';
import { Lock, Save, User, Mail, Shield } from 'lucide-react';
import { authAPI } from '../api';

function ProfilePage() {
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleChange = (e) => {
        setPasswords({
            ...passwords,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwords.newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
            return;
        }

        try {
            setLoading(true);
            await authAPI.changePassword(passwords.currentPassword, passwords.newPassword);
            setMessage({ type: 'success', text: 'Password changed successfully' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.error || 'Failed to change password'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-secondary-900 dark:text-dark-text-primary">My Profile</h1>
                <p className="text-secondary-500 dark:text-dark-text-secondary mt-1">Manage your account settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Info Card */}
                <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6 h-fit">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-secondary-100 dark:border-dark-border">
                        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
                            <User size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">Account Info</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide mb-1">
                                <User size={14} /> Username
                            </label>
                            <div className="text-secondary-900 dark:text-dark-text-primary font-medium">{user.username}</div>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide mb-1">
                                <Shield size={14} /> Role
                            </label>
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 capitalize">
                                {user.role}
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide mb-1">
                                <Mail size={14} /> Email
                            </label>
                            <div className="text-secondary-900 dark:text-dark-text-primary font-medium">{user.email || 'Not set'}</div>
                        </div>
                    </div>
                </div>

                {/* Change Password Card */}
                <div className="md:col-span-2 bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-secondary-100 dark:border-dark-border">
                        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
                            <Lock size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">Change Password</h2>
                    </div>

                    {message.text && (
                        <div className={`p-4 rounded-lg mb-6 ${message.type === 'error'
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwords.currentPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwords.newPassword}
                                onChange={handleChange}
                                required
                                minLength="8"
                                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
                            />
                            <p className="text-xs text-secondary-500 dark:text-dark-text-secondary mt-1">Must be at least 8 characters long</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwords.confirmPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
                            />
                        </div>

                        <div className="pt-4 border-t border-secondary-100 dark:border-dark-border flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Update Password
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
