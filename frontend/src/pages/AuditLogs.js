
import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { auditAPI, adminAPI } from '../api';
import { Line, Bar, ComposedChart, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Search, Clock, Activity, FileText, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const AuditLogs = () => {
    const [activeTab, setActiveTab] = useState('logs'); // logs, history, analytics
    // const [stats, setStats] = useState(null); // REMOVED: Unused state causing warning

    return (
        <div className="p-6 dark:bg-dark-bg min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary">Audit Center</h1>
                {activeTab === 'logs' && (
                    <button
                        onClick={() => document.getElementById('export-btn')?.click()}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        <Download size={18} /> Export CSV
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <AuditStats />

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-dark-border mb-6">
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`pb-2 px-4 font-medium ${activeTab === 'logs'
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                        : 'text-gray-500 dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-dark-text-primary'
                        }`}
                >
                    <FileText size={18} className="inline mr-2" /> Audit Trail
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 px-4 font-medium ${activeTab === 'history'
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                        : 'text-gray-500 dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-dark-text-primary'
                        }`}
                >
                    <Clock size={18} className="inline mr-2" /> User History
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`pb-2 px-4 font-medium ${activeTab === 'analytics'
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                        : 'text-gray-500 dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-dark-text-primary'
                        }`}
                >
                    <Activity size={18} className="inline mr-2" /> User Analytics
                </button>
                <button
                    onClick={() => setActiveTab('traffic')}
                    className={`pb-2 px-4 font-medium ${activeTab === 'traffic'
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                        : 'text-gray-500 dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-dark-text-primary'
                        }`}
                >
                    <Users size={18} className="inline mr-2" /> Traffic
                </button>
            </div>



            <div className="bg-white dark:bg-dark-surface rounded-lg shadow dark:border dark:border-dark-border p-6">
                {activeTab === 'logs' && <AuditTrail />}
                {activeTab === 'history' && <UserHistory />}
                {activeTab === 'analytics' && <UserAnalytics />}
                {activeTab === 'traffic' && <TrafficAnalysis />}
            </div>
        </div >
    );
};

const AuditStats = () => {
    const [stats, setStats] = useState({ logs_today: 0, active_users_today: 0, top_actions: [] });

    useEffect(() => {
        auditAPI.getStats().then(res => setStats(res.data)).catch(console.error);
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow border-l-4 border-blue-500 dark:border-blue-400">
                <div className="text-gray-500 dark:text-dark-text-secondary text-sm font-medium">Logs Today</div>
                <div className="text-3xl font-bold text-gray-800 dark:text-dark-text-primary mt-2">{stats.logs_today}</div>
            </div>
            <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow border-l-4 border-green-500 dark:border-green-400">
                <div className="text-gray-500 dark:text-dark-text-secondary text-sm font-medium">Active Users Today</div>
                <div className="text-3xl font-bold text-gray-800 dark:text-dark-text-primary mt-2">{stats.active_users_today}</div>
            </div>
            <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow border-l-4 border-purple-500 dark:border-purple-400">
                <div className="text-gray-500 dark:text-dark-text-secondary text-sm font-medium">Top Action</div>
                <div className="text-xl font-bold text-gray-800 dark:text-dark-text-primary mt-2">
                    {stats.top_actions?.[0]?.action || 'None'}
                    <span className="text-sm font-normal text-gray-500 dark:text-dark-text-muted ml-2">({stats.top_actions?.[0]?.count || 0})</span>
                </div>
            </div>
        </div>
    );
};

const AuditTrail = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ page: 1, per_page: 10, action: '', user_id: '', start_date: '', end_date: '' });
    const [totalPages, setTotalPages] = useState(1);
    const [users, setUsers] = useState([]);
    const [isLive, setIsLive] = useState(false);

    // Fetch users for dropdown
    useEffect(() => {
        adminAPI.getUsers({ per_page: 100 }).then(res => setUsers(res.data.data || [])).catch(console.error);
    }, []);

    const fetchLogs = useCallback(() => {
        if (!isLive) setLoading(true); // Don't show loading spinner in live mode to avoid flicker
        auditAPI.getLogs(filters)
            .then(res => {
                setLogs(res.data.logs);
                setTotalPages(res.data.pages);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [filters, isLive]);

    useEffect(() => {
        fetchLogs();
    }, [filters.page, filters.user_id, filters.start_date, filters.end_date, fetchLogs]); // Refetch on filter change

    // Live Mode Effect
    useEffect(() => {
        let interval;
        if (isLive) {
            interval = setInterval(() => {
                fetchLogs();
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isLive, fetchLogs]);

    const handleSearch = (e) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, page: 1 })); // Reset page
        fetchLogs();
    };

    const handleExport = () => {
        toast.promise(auditAPI.exportLogs(filters), {
            loading: 'Exporting...',
            success: 'Export downloaded',
            error: 'Export failed'
        });
    };

    return (
        <div>
            {/* Hidden export button for header trigger */}
            <button id="export-btn" className="hidden" onClick={handleExport} />

            <div className="flex flex-wrap gap-4 mb-6 items-end justify-between">
                <form onSubmit={handleSearch} className="flex gap-4 flex-wrap items-end flex-grow">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Search Action</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="border rounded px-3 py-2 pl-9 w-64 dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
                                value={filters.action}
                                onChange={e => setFilters({ ...filters, action: e.target.value })}
                            />
                            <Search size={16} className="absolute left-3 top-3 text-gray-400 dark:text-dark-text-secondary" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1">User</label>
                        <select
                            className="border rounded px-3 py-2 w-48 dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
                            value={filters.user_id}
                            onChange={(e) => setFilters({ ...filters, user_id: e.target.value, page: 1 })}
                        >
                            <option value="">All Users</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.username}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Date Range</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                className="border rounded px-3 py-2 dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary dark:[color-scheme:dark]"
                                value={filters.start_date}
                                onChange={(e) => setFilters({ ...filters, start_date: e.target.value, page: 1 })}
                            />
                            <span className="self-center text-gray-400">-</span>
                            <input
                                type="date"
                                className="border rounded px-3 py-2 dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary dark:[color-scheme:dark]"
                                value={filters.end_date}
                                onChange={(e) => setFilters({ ...filters, end_date: e.target.value, page: 1 })}
                            />
                        </div>
                    </div>

                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 mb-[1px]">
                        Apply
                    </button>

                    {filters.action || filters.user_id || filters.start_date || filters.end_date ? (
                        <button
                            type="button"
                            onClick={() => setFilters({ page: 1, action: '', user_id: '', start_date: '', end_date: '' })}
                            className="text-gray-500 text-sm hover:text-gray-700 underline mb-2 ml-2"
                        >
                            Clear
                        </button>
                    ) : null}
                </form>

                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-medium ${isLive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-dark-text-secondary'}`}>
                        {isLive ? '● Live Mode On' : 'Live Mode Off'}
                    </span>
                    <button
                        onClick={() => setIsLive(!isLive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isLive ? 'bg-green-600 dark:bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${isLive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            {loading && !isLive ? <p className="text-center py-8 text-gray-500 dark:text-dark-text-secondary">Loading logs...</p> : (
                <div className="overflow-x-auto border rounded-lg dark:border-dark-border">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-dark-bg/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">IP</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                            {logs.length > 0 ? logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary">
                                        {new Date(log.timestamp + (log.timestamp.endsWith('Z') ? '' : 'Z')).toLocaleString('en-IN', {
                                            timeZone: 'Asia/Kolkata',
                                            year: 'numeric', month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit', hour12: true
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                                        {log.user_email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-dark-text-secondary max-w-xs truncate" title={log.details ? JSON.stringify(log.details) : ''}>
                                        {log.resource_type && <span className="mr-2 font-mono text-xs bg-gray-100 dark:bg-dark-bg p-1 rounded dark:text-dark-text-primary">{log.resource_type}:{log.resource_id}</span>}
                                        {log.details && (
                                            <span className="text-gray-400 dark:text-dark-text-muted">
                                                {JSON.stringify(log.details).substring(0, 30)}...
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary">
                                        {log.ip_address}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-dark-text-secondary">
                                        No logs found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
                <button
                    disabled={filters.page === 1}
                    onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                    className="px-3 py-1 border rounded disabled:opacity-50 text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Page {filters.page} of {totalPages}</span>
                <button
                    disabled={filters.page >= totalPages}
                    onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                    className="px-3 py-1 border rounded disabled:opacity-50 text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

const UserHistory = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        adminAPI.getUsers({ per_page: 100 }).then(res => setUsers(res.data.data || [])).catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedUser) {
            auditAPI.getUserHistory(selectedUser).then(res => setSessions(res.data.sessions)).catch(console.error);
        }
    }, [selectedUser]);

    return (
        <div>
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Select User to View History</label>
                <select
                    className="border rounded px-3 py-2 w-full max-w-md dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                >
                    <option value="">-- Select User --</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                    ))}
                </select>
            </div>

            {selectedUser && (
                <div className="overflow-x-auto border rounded-lg dark:border-dark-border">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-dark-bg/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Login Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Logout Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Duration (min)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Device</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                            {sessions.map(s => (
                                <tr key={s.id}>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-dark-text-secondary">
                                        {new Date(s.login_at + (s.login_at.endsWith('Z') ? '' : 'Z')).toLocaleString('en-IN', {
                                            timeZone: 'Asia/Kolkata',
                                            year: 'numeric', month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit', hour12: true
                                        })}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-dark-text-secondary">
                                        {s.logout_at ? new Date(s.logout_at + (s.logout_at.endsWith('Z') ? '' : 'Z')).toLocaleString('en-IN', {
                                            timeZone: 'Asia/Kolkata',
                                            year: 'numeric', month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit', hour12: true
                                        }) : <span className="text-green-600 dark:text-green-400 font-medium">Active</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-dark-text-secondary">{s.duration_minutes || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-dark-text-secondary truncate max-w-xs" title={s.user_agent}>{s.user_agent}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const UserAnalytics = () => {
    const { resolvedTheme } = useTheme();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [chartData, setChartData] = useState([]);
    const [remarksOnly, setRemarksOnly] = useState(false);
    const [timeFrame, setTimeFrame] = useState('day'); // 'day' or 'month' renamed to avoid conflict with global setInterval

    useEffect(() => {
        adminAPI.getUsers({ per_page: 100 }).then(res => setUsers(res.data.data || [])).catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedUser) {
            const action = remarksOnly ? 'Update Remarks' : '';
            auditAPI.getUserActivityChart(selectedUser, action, timeFrame)
                .then(res => setChartData(res.data))
                .catch(console.error);
        }
    }, [selectedUser, remarksOnly, timeFrame]);

    // Helper to format date to local user time
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
        return new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: 'numeric',
            month: 'short',
            year: timeFrame === 'month' ? 'numeric' : undefined
        }).format(date);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-dark-surface p-3 border dark:border-dark-border shadow-lg rounded">
                    <p className="font-bold text-gray-700 dark:text-dark-text-primary mb-2">{formatDate(label)}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="font-medium text-sm">
                            {entry.name}: {entry.value} {entry.name.includes('Mins') ? 'mins' : ''}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <div className="mb-6 flex flex-wrap gap-6 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Select User</label>
                    <select
                        className="border rounded px-3 py-2 w-64 dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                    >
                        <option value="">-- Select User --</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 mb-2">
                    <input
                        type="checkbox"
                        id="remarksOnly"
                        checked={remarksOnly}
                        onChange={(e) => setRemarksOnly(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded"
                    />
                    <label htmlFor="remarksOnly" className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                        Show Remarks Productivity Only
                    </label>
                </div>

                <div className="flex bg-gray-100 dark:bg-dark-bg rounded p-1 mb-1">
                    <button
                        onClick={() => setTimeFrame('day')}
                        className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${timeFrame === 'day' ? 'bg-white dark:bg-dark-surface shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-dark-text-primary'}`}
                    >
                        Daily
                    </button>
                    <button
                        onClick={() => setTimeFrame('month')}
                        className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${timeFrame === 'month' ? 'bg-white dark:bg-dark-surface shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-dark-text-primary'}`}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            {selectedUser && chartData.length > 0 && (
                <div className="h-80 w-full mt-8 bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-100 dark:border-dark-border shadow-sm">
                    <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-dark-text-primary">
                        {remarksOnly ? 'Productivity Analysis' : 'Activity Overview'}
                        <span className="text-sm font-normal text-gray-500 dark:text-dark-text-muted ml-2">
                            ({timeFrame === 'day' ? 'Daily' : 'Monthly'})
                        </span>
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={remarksOnly ? "#10B981" : "#6366F1"} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={remarksOnly ? "#10B981" : "#6366F1"} stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={resolvedTheme === 'dark' ? '#374151' : '#E5E7EB'} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                tick={{ fill: resolvedTheme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            {/* Left Axis: Count */}
                            <YAxis
                                yAxisId="left"
                                tick={{ fill: resolvedTheme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            {/* Right Axis: Duration Minutes */}
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fill: '#F59E0B', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                unit="m"
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Legend />
                            <Bar
                                yAxisId="left"
                                dataKey="count"
                                fill="url(#colorCount)"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                                name={remarksOnly ? "Remarks Updates" : "Actions Count"}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="duration_minutes"
                                stroke="#F59E0B"
                                strokeWidth={3}
                                dot={{ fill: '#F59E0B', r: 4 }}
                                name="Active Duration (Mins)"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div >
            )}
            {
                selectedUser && chartData.length === 0 && (
                    <div className="mt-8 p-8 text-center bg-gray-50 dark:bg-dark-bg rounded-lg border border-dashed border-gray-300 dark:border-dark-border">
                        <p className="text-gray-500 dark:text-dark-text-secondary">No activity data found for the selected usage filters.</p>
                    </div>
                )
            }
        </div >
    );
};

export default AuditLogs;

const TrafficAnalysis = () => {
    const { resolvedTheme } = useTheme();
    const [data, setData] = useState({ live_count: 0, live_users: [], daily_trend: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTraffic = () => {
            auditAPI.getTrafficStats()
                .then(res => setData(res.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        };

        fetchTraffic();
        const interval = setInterval(fetchTraffic, 15000); // Poll every 15 seconds
        return () => clearInterval(interval);
    }, []);

    // Helper to format date to local user time (IST enforced as per user preference)
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
        return new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: 'numeric',
            month: 'short',
        }).format(date);
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
        return new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit', minute: '2-digit', hour12: true
        }).format(date);
    };

    if (loading) return <p className="text-center py-8 text-gray-500">Loading traffic data...</p>;

    return (
        <div>
            {/* Live Users Section */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                        <Users size={24} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text-primary">Live Users</h3>
                        <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Active in last 15 minutes</p>
                    </div>
                    <div className="ml-auto text-3xl font-bold text-green-600">
                        {data.live_count}
                    </div>
                </div>

                {data.live_users.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.live_users.map(u => (
                            <div key={u.id} className="border rounded p-3 flex justify-between items-center bg-gray-50 dark:bg-dark-bg dark:border-dark-border">
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-dark-text-primary">{u.username}</p>
                                    <p className="text-xs text-gray-500 dark:text-dark-text-secondary">{u.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-green-600 dark:text-green-400 font-bold">● Online</p>
                                    <p className="text-xs text-gray-400 dark:text-dark-text-muted">Active: {formatTime(u.last_active_at)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-dark-text-secondary italic">No users currently active.</p>
                )}
            </div>

            <hr className="my-8 border-gray-100 dark:border-dark-border" />

            {/* Historical Traffic Section */}
            <div>
                <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-dark-text-primary">Traffic Trend (30 Days)</h3>
                <div className="h-80 w-full bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-100 dark:border-dark-border shadow-sm">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.daily_trend}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={resolvedTheme === 'dark' ? '#374151' : '#E5E7EB'} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                tick={{ fill: resolvedTheme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fill: resolvedTheme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                labelFormatter={formatDate}
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#fff',
                                    color: resolvedTheme === 'dark' ? '#fff' : '#000'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="users"
                                stroke="#8884d8"
                                fillOpacity={1}
                                fill="url(#colorUsers)"
                                name="Active Users"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
