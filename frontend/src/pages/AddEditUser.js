import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, User, Mail, Lock, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../api';

function AddEditUser() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'viewer',
        is_active: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await adminAPI.getUser(id);
                const user = response.data;
                setFormData({
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    is_active: user.is_active,
                    password: '' // Don't populate password
                });
            } catch (err) {
                toast.error('Failed to load user details');
            }
        };

        if (isEditMode) {
            fetchUser();
        }
    }, [id, isEditMode]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditMode) {
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password;
                await adminAPI.updateUser(id, updateData);
                toast.success('User updated successfully');
            } else {
                await adminAPI.createUser(formData);
                toast.success('User created successfully');
            }
            navigate('/users');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/users')}
                    className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-dark-surface text-secondary-500 dark:text-dark-text-secondary hover:text-secondary-900 dark:hover:text-dark-text-primary transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900 dark:text-dark-text-primary">{isEditMode ? 'Edit User' : 'Add New User'}</h1>
                    <p className="text-secondary-500 dark:text-dark-text-secondary text-sm mt-1">
                        {isEditMode ? 'Update user details and permissions' : 'Create a new user account'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border overflow-hidden">
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Username</label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 dark:text-dark-text-secondary" />
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
                                placeholder="johndoe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Email Address</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 dark:text-dark-text-secondary" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">
                            {isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}
                        </label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 dark:text-dark-text-secondary" />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required={!isEditMode}
                                minLength="8"
                                className="w-full pl-10 pr-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                        <p className="text-xs text-secondary-500 dark:text-dark-text-secondary mt-1">Must be at least 8 characters long</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Role</label>
                        <div className="relative">
                            <Shield size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 dark:text-dark-text-secondary" />
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none appearance-none"
                            >
                                <option value="viewer">Viewer (View Only)</option>
                                <option value="manager">Manager (Edit Passengers)</option>
                                <option value="admin">Admin (Full Access)</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="flex items-center gap-3 p-4 border border-secondary-200 dark:border-dark-border rounded-lg cursor-pointer hover:bg-secondary-50 dark:hover:bg-dark-bg transition-colors">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.is_active ? 'bg-primary-600 border-primary-600' : 'border-secondary-300 dark:border-dark-border bg-white dark:bg-dark-bg'}`}>
                                {formData.is_active && <CheckCircle size={14} className="text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="hidden"
                            />
                            <div>
                                <span className="block text-sm font-medium text-secondary-900 dark:text-dark-text-primary">Active Account</span>
                                <span className="block text-xs text-secondary-500 dark:text-dark-text-secondary">Allow this user to log in to the system</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="p-6 bg-secondary-50 dark:bg-dark-surface border-t border-secondary-200 dark:border-dark-border flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/users')}
                        className="px-6 py-2.5 border border-secondary-300 dark:border-dark-border text-secondary-700 dark:text-dark-text-primary font-medium rounded-lg hover:bg-white dark:hover:bg-dark-bg hover:text-secondary-900 dark:hover:text-dark-text-primary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                {isEditMode ? 'Update User' : 'Create User'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddEditUser;
