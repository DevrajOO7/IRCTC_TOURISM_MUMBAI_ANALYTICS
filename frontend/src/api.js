import axios from 'axios';

import { getBaseUrl } from './urlHelper';

const API_URL = getBaseUrl();
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '30000');

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),

  login: (username, password) =>
    api.post('/auth/login', { username, password }),

  getMe: () =>
    api.get('/auth/me'),

  changePassword: (oldPassword, newPassword) =>
    api.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword }),

  logout: () =>
    api.post('/auth/logout'),
};

// Passenger endpoints
export const passengerAPI = {
  search: (filters) => {
    // Transform filters for Elasticsearch
    const payload = {
      query: filters.name || '',
      filters: {
        city: filters.city,
        state: filters.state,
        status: filters.status === 'All' ? undefined : filters.status,
        international: filters.international === 'all' ? undefined : (filters.international === 'yes')
      },
      size: filters.per_page || 50,
      from: ((filters.page || 1) - 1) * (filters.per_page || 50),
      sort: filters.sort_by ? [{ [filters.sort_by]: filters.sort_dir || 'asc' }] : undefined
    };
    return api.post('/search/search', payload);
  },

  getAll: (page = 1, perPage = 50) =>
    api.get('/passengers', { params: { page, per_page: perPage } }),

  getById: (id) =>
    api.get(`/passengers/${id}`),

  create: (data) =>
    api.post('/passengers', data),

  update: (id, data) =>
    api.put(`/passengers/${id}`, data),

  delete: (id) =>
    api.delete(`/passengers/${id}`),

  getStats: () =>
    api.get('/passengers/stats/summary'),
};

// Analytics endpoints
export const analyticsAPI = {
  getRealtimeDashboard: () =>
    api.get('/analytics/advanced/realtime'),

  getPackageAnalytics: (params) =>
    api.get('/analytics/advanced/packages', { params }),

  getPassengerBehavior: () =>
    api.get('/analytics/advanced/passenger-behavior'),

  getAgentAnalytics: (params) =>
    api.get('/analytics/advanced/agents', { params }),

  getForecast: (params) =>
    api.get('/analytics/advanced/forecast', { params }),

  getKPIs: (filters = {}) =>
    api.get('/analytics/kpis', { params: filters }),

  getStatusBreakdown: (filters = {}) =>
    api.get('/analytics/status-breakdown', { params: filters }),

  getCityTrends: (limit = 10, filters = {}) =>
    api.get('/analytics/city-trends', { params: { limit, ...filters } }),

  getMonthlyTrends: (year, filters = {}) =>
    api.get(`/analytics/monthly-trends/${year}`, { params: filters }),

  getFrequentTravelers: (minTrips, limit = 20, filters = {}) =>
    api.get(`/analytics/frequent-travelers/${minTrips}`, { params: { limit, ...filters } }),

  getPackagePopularity: (limit = 10, filters = {}) =>
    api.get('/analytics/package-popularity', { params: { limit, ...filters } }),

  getAdvancedInsights: (filters = {}) =>
    api.get('/analytics/advanced-insights', { params: filters }),
};

// Targeting endpoints
export const targetingAPI = {
  getPredictions: (month, year) =>
    api.get('/targeting/predictions', { params: { month, year } }),

  getKPIs: (month, year) =>
    api.get('/targeting/kpis', { params: { month, year } }),

  updatePassengerInfo: (data) =>
    api.post('/targeting/update-info', data),
};

// Export endpoints
export const exportAPI = {
  exportCSV: async (filters = {}) => {
    try {
      const response = await api.get('/export/csv', {
        params: filters,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `passengers_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export CSV failed:', error);
      throw error;
    }
  },

  exportJSON: async (filters = {}) => {
    try {
      const response = await api.get('/export/json', {
        params: filters,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `passengers_export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export JSON failed:', error);
      throw error;
    }
  },

  exportExcel: async (filters = {}) => {
    try {
      const response = await api.get('/export/excel', {
        params: filters,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `passenger_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export Excel failed:', error);
      throw error;
    }
  },
};

// Admin endpoints
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users/create', data),
  updateUser: (id, data) => api.post(`/admin/users/${id}/update`, data),
  deactivateUser: (id) => api.post(`/admin/users/${id}/deactivate`),
  activateUser: (id) => api.post(`/admin/users/${id}/activate`),
  resetPassword: (id, password) => api.post(`/admin/users/${id}/reset-password`, { new_password: password }),
  getUserPermissions: (id) => api.get(`/admin/users/${id}/permissions`),
  updateUserPermissions: (id, permissions) => api.post(`/admin/users/${id}/permissions/update`, permissions),
};

// Reports endpoints
export const reportsAPI = {
  getNotTraveledPassengers: (params) =>
    api.get('/reports/not-traveled', { params }),

  exportNotTraveledPassengers: (filters = {}) => {
    const params = new URLSearchParams(filters);
    const token = localStorage.getItem('token');

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${API_URL}/reports/not-traveled/export?${params.toString()}`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.responseType = 'blob';

    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `not_traveled_${filters.package_name || 'report'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to export file');
      }
    };

    xhr.onerror = () => {
      throw new Error('Export request failed');
    };

    xhr.send();
  },

  getPackages: () =>
    api.get('/reports/packages'),

  getMergedPassengers: (params) =>
    api.get('/reports/merged-passengers', { params }),

  mergePassengers: (data) =>
    api.post('/reports/merged-passengers/merge', data),
};

// Audit endpoints
export const auditAPI = {
  getLogs: (filters = {}) =>
    api.get('/audit/logs', { params: filters }),

  getStats: () =>
    api.get('/audit/stats'),

  getTrafficStats: () =>
    api.get('/audit/stats/traffic'),

  getUserActivityChart: (userId, action, interval) =>
    api.get(`/audit/stats/user/${userId}`, { params: { action, interval } }),

  getUserHistory: (userId, params = {}) =>
    api.get(`/audit/history/${userId}`, { params }),

  exportLogs: (filters = {}) => {
    // Handle file download
    const params = new URLSearchParams(filters);
    const url = `${API_URL}/audit/export?${params.toString()}`;

    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    // Add auth header if needed? usually fetch/XHR needed for auth header. 
    // api.get supports blob but let's use the XHR pattern from reportsAPI or just api.get with blob responseType
    return api.get('/audit/export', { params: filters, responseType: 'blob' }).then(response => {
      const blob = new Blob([response.data], { type: 'text/csv' });
      const objectUrl = window.URL.createObjectURL(blob);
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    });
  }
};




export default api;
