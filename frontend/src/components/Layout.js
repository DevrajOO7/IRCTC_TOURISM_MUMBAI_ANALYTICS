import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import {
    LayoutDashboard,
    Users,
    BarChart3,
    Download,
    Shield,
    LogOut,
    Menu,
    X,
    User,
    Target,
    FileText,
    Linkedin
} from 'lucide-react';

import { authAPI } from '../api';
import logoLight from '../assets/Irctc_tourism_light.png';
import logoDark from '../assets/Irctc_tourism_dark.png';

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const { resolvedTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleLogout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    const navItems = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'viewer'] },
        { label: 'Passengers', path: '/passengers', icon: Users, roles: ['admin', 'manager', 'viewer'] },
        { label: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['admin', 'manager', 'viewer'] },
        { label: 'Advance Target', path: '/advance-target', icon: Target, roles: ['admin', 'manager', 'viewer'] },
        { label: 'Export Data', path: '/export', icon: Download, roles: ['admin', 'manager'] },
        { label: 'User Management', path: '/users', icon: Shield, roles: ['admin'] },
        { label: 'Audit Logs', path: '/audit-logs', icon: FileText, roles: ['admin'] },
    ];


    // Filter items based on user role
    const filteredNavItems = navItems.filter(item =>
        user && item.roles.includes(user.role)
    );

    return (
        <div className="min-h-screen bg-background dark:bg-dark-bg font-sans text-secondary-900 dark:text-dark-text-primary flex transition-colors duration-200">

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-surface border-r border-secondary-200 dark:border-dark-border transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-secondary-100 dark:border-dark-border">
                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-500">
                        <span className="text-xl font-bold tracking-tight">IRCTC TOURISM MUMBAI</span>
                    </div>
                    <button
                        className="ml-auto lg:hidden text-secondary-500 dark:text-dark-text-secondary"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {filteredNavItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                                        ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                                        : 'text-secondary-600 dark:text-dark-text-secondary hover:bg-secondary-50 dark:hover:bg-dark-bg hover:text-secondary-900 dark:hover:text-dark-text-primary'}
                `}
                            >
                                <Icon size={20} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-400 dark:text-dark-text-secondary'} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile (Bottom) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-secondary-100 dark:border-dark-border bg-white dark:bg-dark-surface">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-secondary-900 dark:text-dark-text-primary truncate">{user?.username}</p>
                            <p className="text-xs text-secondary-500 dark:text-dark-text-secondary capitalize">{user?.role}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-secondary-400 dark:text-dark-text-secondary hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Top Header */}
                <header className="h-16 bg-white dark:bg-dark-surface border-b border-secondary-200 dark:border-dark-border flex items-center justify-between px-4 lg:px-8 transition-colors duration-200">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden text-secondary-500 dark:text-dark-text-secondary hover:text-secondary-700 dark:hover:text-dark-text-primary"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-semibold text-secondary-800 dark:text-dark-text-primary">
                            {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Developer Credits Pill */}
                        <a
                            href="https://www.linkedin.com/in/devraj007/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50/50 dark:bg-primary-900/10 backdrop-blur-md border border-primary-200/50 dark:border-primary-700/30 shadow-sm hover:bg-primary-100/50 dark:hover:bg-primary-900/20 hover:scale-105 transition-all duration-300 text-xs font-semibold text-primary-700 dark:text-primary-400 group relative overflow-hidden"
                            title="Connect with the Developer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                            <span>© 2026 Developed by DEVRAJ</span>
                            <Linkedin size={14} className="text-[#0A66C2] dark:text-[#388bff]" />
                        </a>

                        <img
                            src={resolvedTheme === 'dark' ? logoDark : logoLight}
                            alt="IRCTC Logo"
                            className={`h-16 w-10.5 object-contain ${resolvedTheme === 'dark' ? 'mix-blend-screen' : 'mix-blend-multiply'}`}
                        />
                        <ThemeToggle />

                        <Link
                            to="/profile"
                            className="flex items-center gap-2 text-sm font-medium text-secondary-600 dark:text-dark-text-secondary hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-secondary-100 dark:bg-dark-bg flex items-center justify-center">
                                <User size={16} />
                            </div>
                            <span className="hidden sm:block">My Profile</span>
                        </Link>

                        <div className="h-6 w-px bg-secondary-200 dark:bg-dark-border mx-2 hidden sm:block"></div>

                        <button
                            onClick={handleLogout}
                            className="p-2 text-secondary-500 dark:text-dark-text-secondary hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-background dark:bg-dark-bg transition-colors duration-200">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="py-4 text-center text-xs text-secondary-400 dark:text-dark-text-muted border-t border-secondary-200 dark:border-dark-border bg-white dark:bg-dark-surface transition-colors duration-200">
                    <p>© {new Date().getFullYear()} IRCTC TOURISM MUMBAI. Confidential & Protected Property.</p>
                </footer>
            </div>
        </div>
    );
};

export default Layout;
