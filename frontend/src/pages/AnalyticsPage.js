import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  LayoutDashboard, Users, Filter, MapPin,
  Package, TrendingUp, RefreshCw, AlertCircle, Activity,
  Clock, Globe, Briefcase
} from 'lucide-react';
import { analyticsAPI } from '../api';

const COLORS = {
  primary: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'],
  status: {
    delivered: '#22c55e',
    cancelled: '#ef4444',
    pending: '#eab308',
    others: '#94a3b8'
  },
  gender: ['#3b82f6', '#ec4899'],
  clientType: ['#8b5cf6', '#06b6d4'],
  leadTime: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm ${className}`}>
    {children}
  </div>
);

const StatCard = ({ title, value, subValue, icon: Icon, colorClass, trend }) => (
  <Card className="p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3>
        {subValue && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
        <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        <span className={`font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
        <span className="text-gray-400 ml-2">vs last period</span>
      </div>
    )}
  </Card>
);

const CustomTooltip = ({ active, payload, label, exclude = [] }) => {
  if (active && payload && payload.length) {
    const filteredPayload = payload.filter(entry => !exclude.includes(entry.name));
    if (filteredPayload.length === 0) return null;

    return (
      <div className="bg-gray-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-xl border border-gray-700 text-sm z-50">
        <p className="font-semibold mb-2 border-b border-gray-700 pb-1">{label}</p>
        {filteredPayload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 py-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="capitalize text-gray-200">{entry.name}:</span>
            <span className="font-mono font-bold">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsPage = () => {
  // State
  const [year, setYear] = useState(new Date().getFullYear());
  const [clientType, setClientType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Data States
  const [kpis, setKpis] = useState(null);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);

  const [packagePopularity, setPackagePopularity] = useState([]);
  const [advancedInsights, setAdvancedInsights] = useState(null);

  const years = Array.from({ length: 2028 - 2015 + 1 }, (_, i) => 2028 - i);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = { year, clientType };

      const [
        kpiRes,
        monthlyRes,
        statusRes,
        , // cityRes skipped
        packageRes,
        advancedRes
      ] = await Promise.all([
        analyticsAPI.getKPIs(filters),
        analyticsAPI.getMonthlyTrends(year, filters),
        analyticsAPI.getStatusBreakdown(filters),
        analyticsAPI.getCityTrends(10, filters),
        analyticsAPI.getPackagePopularity(10, filters),
        analyticsAPI.getAdvancedInsights(filters)
      ]);

      setKpis(kpiRes.data);
      setMonthlyTrends(monthlyRes.data.trends);
      setStatusBreakdown(statusRes.data.breakdown);
      setPackagePopularity(packageRes.data.packages);
      setAdvancedInsights(advancedRes.data);

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [year, clientType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-gray-500 animate-pulse">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur py-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="text-indigo-500" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Real-time insights for {year} • Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1.5 shadow-sm">
            <Filter size={16} className="text-gray-400 ml-2 mr-2" />

            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-transparent border-none text-sm font-semibold text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-2" />

            <select
              value={clientType}
              onChange={(e) => setClientType(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <option value="all">All Clients</option>
              <option value="international">International</option>
              <option value="domestic">Domestic</option>
            </select>
          </div>

          <button
            onClick={fetchData}
            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-800">
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bookings"
          value={kpis?.total_bookings?.toLocaleString() || 0}
          subValue="Confirmed reservations"
          icon={Package}
          colorClass="text-blue-600 bg-blue-50"
        />
        <StatCard
          title="Total Travelers"
          value={kpis?.total_travelers?.toLocaleString() || 0}
          subValue="Passengers served"
          icon={Users}
          colorClass="text-indigo-600 bg-indigo-50"
        />
        <StatCard
          title="Avg Lead Time"
          value={`${advancedInsights?.lead_time?.average_days || 0} Days`}
          subValue="Booking in advance"
          icon={Clock}
          colorClass="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          title="International"
          value={kpis?.international?.toLocaleString() || 0}
          subValue={`${((kpis?.international / (kpis?.total_bookings || 1)) * 100).toFixed(1)}% of total`}
          icon={Globe}
          colorClass="text-orange-600 bg-orange-50"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trends - Wide Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-500" />
              Monthly Booking Trends
            </h3>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>

                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <Tooltip content={<CustomTooltip exclude={['Travelers']} />} />
                <Legend
                  payload={[
                    { value: 'Bookings', type: 'rect', color: '#6366f1' }
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  name="Bookings"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorBookings)"
                  strokeWidth={3}
                />

              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Activity size={20} className="text-green-500" />
            Booking Status
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                  stroke="none"
                >
                  {statusBreakdown.map((entry, index) => {
                    let color = COLORS.status.others;
                    const status = entry.status.toLowerCase();
                    if (status.includes('delivered')) color = COLORS.status.delivered;
                    else if (status.includes('cancel')) color = COLORS.status.cancelled;
                    else if (status.includes('pending')) color = COLORS.status.pending;

                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-900 dark:fill-white font-bold text-2xl">
                  {kpis?.total_bookings || 0}
                </text>
                <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-500 text-sm">
                  Total
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Advanced Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Booking Lead Time */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Clock size={20} className="text-blue-500" />
            Booking Lead Time
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={advancedInsights?.lead_time?.distribution || []} margin={{ top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Bookings" radius={[4, 4, 0, 0]}>
                  {advancedInsights?.lead_time?.distribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.leadTime[index % COLORS.leadTime.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Age Demographics */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Users size={20} className="text-purple-500" />
            Age Demographics
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={advancedInsights?.age_groups || []} margin={{ top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Travelers" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Package Class Preference */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Briefcase size={20} className="text-amber-500" />
            Class Preference
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={advancedInsights?.package_classes || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {advancedInsights?.package_classes?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Geographic & Package Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top States */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <MapPin size={20} className="text-red-500" />
            Top States
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={advancedInsights?.top_states || []} margin={{ top: 20 }}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  interval={0}
                  tickFormatter={(value) => value.length > 6 ? `${value.substring(0, 6)}...` : value}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Bookings" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Popular Packages */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Package size={20} className="text-indigo-500" />
            Top Packages
          </h3>
          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {packagePopularity.map((pkg, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1" title={pkg.name}>
                      {pkg.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {pkg.code}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">{pkg.bookings}</p>
                  <p className="text-xs text-gray-500">bookings</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
