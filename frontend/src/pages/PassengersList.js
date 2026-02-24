import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Download, FileSpreadsheet, FileText } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import { passengerAPI, exportAPI } from '../api';
import { formatDate } from '../utils/dateUtils';

function PassengersList() {
  const [passengers, setPassengers] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('booking_date');
  const [sortDir, setSortDir] = useState('desc');
  const [exporting, setExporting] = useState(false);

  const fetchPassengers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_dir: sortDir,
        ...filters
      };
      const response = await passengerAPI.search(params);
      // Handle Elasticsearch response format
      if (response.data.hits) {
        setPassengers(response.data.hits);
        setTotal(response.data.total);
      } else {
        // Fallback or legacy format
        setPassengers(response.data.data || []);
        setTotal(response.data.total || 0);
      }
    } catch (err) {
      setError('Failed to load passengers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, filters, sortBy, sortDir]);

  useEffect(() => {
    fetchPassengers();
  }, [fetchPassengers]);

  const handleSearch = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortDir === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this passenger?')) {
      try {
        await passengerAPI.delete(id);
        fetchPassengers();
      } catch (err) {
        alert('Failed to delete passenger');
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      setError('');
      await exportAPI.exportExcel({ ...filters });
    } catch (err) {
      setError('Failed to export Excel file');
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      booked: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    const key = status?.toLowerCase() === 'can/mod' ? 'cancelled' : status?.toLowerCase();
    return styles[key] || 'bg-secondary-100 text-secondary-800 border-secondary-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-dark-text-primary">Passengers</h1>
          <p className="text-secondary-500 dark:text-dark-text-secondary mt-1">Manage and track all passenger records</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface border border-secondary-200 dark:border-dark-border text-secondary-700 dark:text-dark-text-primary rounded-lg hover:bg-secondary-50 dark:hover:bg-dark-bg hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-secondary-400 border-t-primary-600 rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet size={18} />
            )}
            <span>Export Excel</span>
          </button>
          <Link
            to="/passengers/add"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
          >
            <Plus size={18} />
            <span>Add Passenger</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <SearchBar onSearch={handleSearch} />

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg text-red-700 dark:text-red-400 mb-6">
          {error}
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border overflow-hidden">
        {loading ? (
          <div className="animate-pulse">
            <div className="bg-secondary-50 dark:bg-dark-bg border-b border-secondary-200 dark:border-dark-border h-12 w-full"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center p-4 border-b border-secondary-100 dark:border-dark-border">
                <div className="w-1/4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary-200 dark:bg-dark-border"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-secondary-200 dark:bg-dark-border rounded w-32"></div>
                    <div className="h-3 bg-secondary-100 dark:bg-dark-border rounded w-16"></div>
                  </div>
                </div>
                <div className="w-1/6 h-4 bg-secondary-100 dark:bg-dark-border rounded mx-4"></div>
                <div className="w-1/6 h-4 bg-secondary-100 dark:bg-dark-border rounded mx-4"></div>
                <div className="w-1/6 h-6 bg-secondary-100 dark:bg-dark-border rounded-full mx-4"></div>
                <div className="w-1/6 h-6 bg-secondary-100 dark:bg-dark-border rounded-full mx-4"></div>
                <div className="w-1/12 h-4 bg-secondary-100 dark:bg-dark-border rounded mx-4"></div>
              </div>
            ))}
          </div>
        ) : passengers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <div className="w-16 h-16 bg-secondary-50 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4">
              <Download size={32} className="text-secondary-400 dark:text-dark-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">No passengers found</h3>
            <p className="text-secondary-500 dark:text-dark-text-secondary mt-1 max-w-sm">
              Try adjusting your search filters or add a new passenger to get started.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary-50 dark:bg-dark-bg border-b border-secondary-200 dark:border-dark-border">
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:text-secondary-700 dark:hover:text-dark-text-primary transition-colors"
                      onClick={() => handleSort('master_passenger_name')}
                    >
                      Passenger {renderSortIcon('master_passenger_name')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wider">Contact</th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:text-secondary-700 dark:hover:text-dark-text-primary transition-colors"
                      onClick={() => handleSort('state')}
                    >
                      Location {renderSortIcon('state')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wider">Type</th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:text-secondary-700 dark:hover:text-dark-text-primary transition-colors"
                      onClick={() => handleSort('booking_date')}
                    >
                      Date {renderSortIcon('booking_date')}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100 dark:divide-dark-border">
                  {passengers.map((passenger) => (
                    <tr key={passenger.id} className="hover:bg-secondary-50/50 dark:hover:bg-dark-bg/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs">
                            {passenger.master_passenger_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-secondary-900 dark:text-dark-text-primary">{passenger.master_passenger_name}</p>
                              {passenger.remarks && (
                                <div className="text-amber-500 dark:text-amber-400" title="Has Notes">
                                  <FileText size={14} />
                                </div>
                              )}
                            </div>
                            {passenger.age && <p className="text-xs text-secondary-500 dark:text-dark-text-secondary">{passenger.age} years</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-secondary-600 dark:text-dark-text-secondary">{passenger.email_id || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-secondary-900 dark:text-dark-text-primary">{passenger.city}</p>
                        <p className="text-xs text-secondary-500 dark:text-dark-text-secondary">{passenger.state}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(passenger.status)}`}>
                          {passenger.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${passenger.international_client
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30'
                          : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30'
                          }`}>
                          {passenger.international_client ? 'International' : 'Domestic'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary-600 dark:text-dark-text-secondary">
                        {formatDate(passenger.booking_date)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/passengers/${passenger.id}`}
                            className="p-1.5 text-secondary-400 dark:text-dark-text-secondary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </Link>
                          <Link
                            to={`/passengers/${passenger.id}/edit`}
                            className="p-1.5 text-secondary-400 dark:text-dark-text-secondary hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(passenger.id)}
                            className="p-1.5 text-secondary-400 dark:text-dark-text-secondary hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              perPage={perPage}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default PassengersList;
