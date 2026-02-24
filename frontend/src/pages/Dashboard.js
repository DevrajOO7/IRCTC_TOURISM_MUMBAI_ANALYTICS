import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Globe, MapPin, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { analyticsAPI } from '../api';

function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [cityTrends, setCityTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
    
    // Poll for real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const [kpisRes, citiesRes] = await Promise.all([
        analyticsAPI.getKPIs(),
        analyticsAPI.getCityTrends(5),
      ]);

      setKpis(kpisRes.data);
      setCityTrends(citiesRes.data.trends);
    } catch (err) {
      // Only show error if it's not a background refresh
      if (!isBackground) setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-secondary-200 dark:bg-dark-border rounded w-48"></div>
          <div className="h-4 bg-secondary-100 dark:bg-dark-border rounded w-96"></div>
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-100 dark:border-dark-border p-6 h-32">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="h-4 bg-secondary-100 dark:bg-dark-border rounded w-24"></div>
                  <div className="h-8 bg-secondary-200 dark:bg-dark-border rounded w-16"></div>
                </div>
                <div className="w-10 h-10 bg-secondary-100 dark:bg-dark-border rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-100 dark:border-dark-border p-6 h-64">
            <div className="h-6 bg-secondary-200 dark:bg-dark-border rounded w-32 mb-6"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-secondary-50 dark:bg-dark-bg rounded-lg"></div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-100 dark:border-dark-border p-6 h-64">
            <div className="h-6 bg-secondary-200 dark:bg-dark-border rounded w-32 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-secondary-100 dark:bg-dark-border rounded-full"></div>
                  <div className="flex-1 h-2 bg-secondary-100 dark:bg-dark-border rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-dark-text-primary">Overview</h2>
        <p className="text-secondary-500 dark:text-dark-text-secondary mt-1">Welcome back! Here's what's happening with your passengers.</p>
      </div>

      {kpis && (
        <>
          {/* Primary Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="Total Passengers"
              value={kpis.total_passengers}
              subtext="Active records"
              icon={Users}
              color="primary"
            />
            <StatCard
              label="Total Travelers"
              value={kpis.total_travelers}
              subtext="Across all bookings"
              icon={TrendingUp}
              color="success"
            />
            <StatCard
              label="International"
              value={kpis.international}
              subtext={`${((kpis.international / kpis.total_passengers) * 100).toFixed(1)}% of total`}
              icon={Globe}
              color="purple"
            />
            <StatCard
              label="Domestic"
              value={kpis.domestic}
              subtext={`${((kpis.domestic / kpis.total_passengers) * 100).toFixed(1)}% of total`}
              icon={MapPin}
              color="warning"
            />
          </div>

          {/* Secondary Stats & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Status Breakdown */}
            <div className="lg:col-span-2 bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary mb-6">Booking Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatusCard
                  label="Delivered"
                  value={kpis.status.delivered}
                  total={kpis.total_passengers}
                  icon={CheckCircle2}
                  color="text-emerald-600 dark:text-emerald-400"
                  bg="bg-emerald-50 dark:bg-emerald-900/20"
                />
                <StatusCard
                  label="Cancelled"
                  value={kpis.status.cancelled}
                  total={kpis.total_passengers}
                  icon={XCircle}
                  color="text-rose-600 dark:text-rose-400"
                  bg="bg-rose-50 dark:bg-rose-900/20"
                />
                <StatusCard
                  label="Pending"
                  value={kpis.status.pending}
                  total={kpis.total_passengers}
                  icon={Clock}
                  color="text-amber-600 dark:text-amber-400"
                  bg="bg-amber-50 dark:bg-amber-900/20"
                />
              </div>
            </div>

            {/* Top Cities */}
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary mb-6">Top Cities</h3>
              <div className="space-y-5">
                {cityTrends.map((city, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                          ${idx === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            idx === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                              idx === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-secondary-50 text-secondary-500 dark:bg-dark-bg dark:text-dark-text-secondary'}
                        `}>
                          {idx + 1}
                        </span>
                        <span className="font-medium text-secondary-700 dark:text-dark-text-primary">{city.city}</span>
                      </div>
                      <span className="text-sm font-semibold text-secondary-900 dark:text-dark-text-primary">{city.bookings}</span>
                    </div>
                    <div className="w-full bg-secondary-100 dark:bg-dark-bg rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary-600 dark:bg-primary-500 h-full rounded-full transition-all duration-500 ease-out group-hover:bg-primary-500 dark:group-hover:bg-primary-400"
                        style={{ width: `${(city.bookings / cityTrends[0].bookings) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Reusable Components for Dashboard
const StatCard = ({ label, value, subtext, icon: Icon, color }) => {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6 transition-transform hover:-translate-y-1 duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-secondary-500 dark:text-dark-text-secondary">{label}</p>
          <h3 className="text-3xl font-bold text-secondary-900 dark:text-dark-text-primary mt-1">{value.toLocaleString()}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      <p className="text-xs text-secondary-400 dark:text-dark-text-muted font-medium">{subtext}</p>
    </div>
  );
};

const StatusCard = ({ label, value, total, icon: Icon, color, bg }) => (
  <div className={`rounded-lg p-4 border border-secondary-100 dark:border-dark-border ${bg} bg-opacity-50`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon size={18} className={color} />
      <span className={`text-sm font-semibold ${color}`}>{label}</span>
    </div>
    <div className="text-2xl font-bold text-secondary-900 dark:text-dark-text-primary">{value.toLocaleString()}</div>
    <div className="text-xs text-secondary-500 dark:text-dark-text-secondary mt-1">
      {((value / total) * 100).toFixed(1)}% of total
    </div>
  </div>
);

export default Dashboard;
