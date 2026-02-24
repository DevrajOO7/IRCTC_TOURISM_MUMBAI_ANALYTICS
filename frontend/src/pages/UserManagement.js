import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Edit, Check, X, User } from 'lucide-react';
import { adminAPI } from '../api';
import { formatDate } from '../utils/dateUtils';

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();

    const fetchUsers = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminAPI.getUsers();
            setUsers(response.data.data || []);
        } catch (err) {
            setError('Failed to load users');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers, location]);

    const handleDeactivate = async (userId, currentStatus) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;

        try {
            if (currentStatus) {
                await adminAPI.deactivateUser(userId);
            } else {
                await adminAPI.activateUser(userId);
            }
            fetchUsers();
        } catch (err) {
            alert('Failed to update user status');
        }
    };

    const getRoleBadge = (role) => {
        const styles = {
            admin: 'bg-amber-100 text-amber-800 border-amber-200',
            manager: 'bg-blue-100 text-blue-800 border-blue-200',
            viewer: 'bg-secondary-100 text-secondary-800 border-secondary-200',
        };
        return styles[role] || styles.viewer;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="w-8 h-8 border-4 border-secondary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <span className="ml-3 text-secondary-600 font-medium">Loading users...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900 dark:text-dark-text-primary">User Management</h1>
                    <p className="text-secondary-500 dark:text-dark-text-secondary mt-1">Manage system access and user roles</p>
                </div>
                <Link
                    to="/users/add"
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
                >
                    <Plus size={18} />
                    <span>Add User</span>
                </Link>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border overflow-hidden">
                {users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <div className="w-16 h-16 bg-secondary-50 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4">
                            <User size={32} className="text-secondary-400 dark:text-dark-text-muted" />
                        </div>
                        <h3 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">No users found</h3>
                        <p className="text-secondary-500 dark:text-dark-text-secondary mt-1">
                            Get started by adding a new user to the system.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-secondary-50 dark:bg-dark-bg border-b border-secondary-200 dark:border-dark-border">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100 dark:divide-dark-border">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-secondary-50/50 dark:hover:bg-dark-bg/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold text-xs">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-secondary-900 dark:text-dark-text-primary">{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-secondary-600 dark:text-dark-text-secondary">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.is_active
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                                : 'bg-secondary-100 text-secondary-600 border-secondary-200 dark:bg-secondary-800 dark:text-secondary-400 dark:border-secondary-700'
                                                }`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-secondary-600 dark:text-dark-text-secondary">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/users/${user.id}/edit`}
                                                    className="p-1.5 text-secondary-400 dark:text-dark-text-secondary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeactivate(user.id, user.is_active)}
                                                    className={`p-1.5 rounded-lg transition-colors ${user.is_active
                                                        ? 'text-secondary-400 dark:text-dark-text-secondary hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                                                        : 'text-secondary-400 dark:text-dark-text-secondary hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                                        }`}
                                                    title={user.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {user.is_active ? <X size={18} /> : <Check size={18} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserManagement;
