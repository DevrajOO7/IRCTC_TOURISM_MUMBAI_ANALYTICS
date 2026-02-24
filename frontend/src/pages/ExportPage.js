import React, { useState } from 'react';
import { Download, FileText, FileJson, FileSpreadsheet, Filter, Check, RefreshCw, RotateCcw } from 'lucide-react';
import { exportAPI } from '../api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from 'date-fns';

function ExportPage() {
  const [filters, setFilters] = useState({
    name: '',
    city: '',
    state: '',
    status: 'All',
    international: 'all',
    date_from: '',
    date_to: ''
  });

  const [exporting, setExporting] = useState(false);
  const [activeExport, setActiveExport] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({
      name: '',
      city: '',
      state: '',
      status: 'All',
      international: 'all',
      date_from: '',
      date_to: ''
    });
  };

  const handleExport = async (type) => {
    try {
      setExporting(true);
      setActiveExport(type);

      if (type === 'excel') await exportAPI.exportExcel(filters);
      else if (type === 'csv') await exportAPI.exportCSV(filters);
      else if (type === 'json') await exportAPI.exportJSON(filters);
    } catch (err) {
      alert(`Failed to export ${type.toUpperCase()}`);
      console.error(err);
    } finally {
      setExporting(false);
      setActiveExport(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-dark-text-primary">Export Data</h1>
        <p className="text-secondary-500 dark:text-dark-text-secondary mt-1">Filter and download passenger records in your preferred format</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar - Filters */}
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6 h-fit">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-secondary-100 dark:border-dark-border">
            <div className="flex items-center gap-2 font-semibold text-secondary-900 dark:text-dark-text-primary">
              <Filter size={20} className="text-primary-600 dark:text-primary-400" />
              <h2>Filters</h2>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs font-medium text-secondary-500 dark:text-dark-text-secondary hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide mb-1">Passenger Name</label>
              <input
                type="text"
                name="name"
                value={filters.name}
                onChange={handleInputChange}
                placeholder="Search..."
                className="w-full px-3 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Booked">Booked</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={filters.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="w-full px-3 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={filters.state}
                  onChange={handleInputChange}
                  placeholder="State"
                  className="w-full px-3 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide mb-1">Client Type</label>
              <select
                name="international"
                value={filters.international}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary outline-none"
              >
                <option value="all">All Clients</option>
                <option value="no">Domestic</option>
                <option value="yes">International</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide mb-1">From</label>
                <div className="w-full">
                  <DatePicker
                    selected={filters.date_from ? parseISO(filters.date_from) : null}
                    onChange={(date) => handleInputChange({ target: { name: 'date_from', value: date ? format(date, 'yyyy-MM-dd') : '' } })}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-3 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary outline-none"
                    placeholderText="DD/MM/YYYY"
                    showYearDropdown
                    scrollableYearDropdown
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide mb-1">To</label>
                <div className="w-full">
                  <DatePicker
                    selected={filters.date_to ? parseISO(filters.date_to) : null}
                    onChange={(date) => handleInputChange({ target: { name: 'date_to', value: date ? format(date, 'yyyy-MM-dd') : '' } })}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-3 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary outline-none"
                    placeholderText="DD/MM/YYYY"
                    showYearDropdown
                    scrollableYearDropdown
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Export Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Excel Card */}
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6 relative overflow-hidden group hover:border-green-200 dark:hover:border-green-900/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileSpreadsheet size={120} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                <FileSpreadsheet size={24} />
              </div>
              <h3 className="text-lg font-bold text-secondary-900 dark:text-dark-text-primary mb-2">Excel Export</h3>
              <p className="text-secondary-500 dark:text-dark-text-secondary text-sm mb-6 max-w-md">Best for reporting and detailed data analysis. Includes formatted columns, headers, and auto-filters enabled by default.</p>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-xs font-medium text-secondary-600 dark:text-dark-text-secondary bg-secondary-50 dark:bg-dark-bg px-2 py-1 rounded">
                  <Check size={14} className="text-green-600 dark:text-green-400" /> Formatted
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-secondary-600 dark:text-dark-text-secondary bg-secondary-50 dark:bg-dark-bg px-2 py-1 rounded">
                  <Check size={14} className="text-green-600 dark:text-green-400" /> Auto-filters
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-secondary-600 dark:text-dark-text-secondary bg-secondary-50 dark:bg-dark-bg px-2 py-1 rounded">
                  <Check size={14} className="text-green-600 dark:text-green-400" /> All Columns
                </div>
              </div>

              <button
                onClick={() => handleExport('excel')}
                disabled={exporting}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-sm transition-colors disabled:opacity-50"
              >
                {exporting && activeExport === 'excel' ? (
                  <><RefreshCw size={18} className="animate-spin" /> Exporting...</>
                ) : (
                  <><Download size={18} /> Download Excel</>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CSV Card */}
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6 hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <FileText size={20} />
              </div>
              <h3 className="text-base font-bold text-secondary-900 dark:text-dark-text-primary mb-2">CSV Export</h3>
              <p className="text-secondary-500 dark:text-dark-text-secondary text-xs mb-4">Raw data format compatible with all spreadsheet software and data tools.</p>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-secondary-200 dark:border-dark-border text-secondary-700 dark:text-dark-text-primary font-medium rounded-lg hover:bg-secondary-50 dark:hover:bg-dark-bg hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
              >
                {exporting && activeExport === 'csv' ? 'Exporting...' : 'Download CSV'}
              </button>
            </div>

            {/* JSON Card */}
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6 hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                <FileJson size={20} />
              </div>
              <h3 className="text-base font-bold text-secondary-900 dark:text-dark-text-primary mb-2">JSON Export</h3>
              <p className="text-secondary-500 dark:text-dark-text-secondary text-xs mb-4">Structured data format ideal for developers, API integrations, and backups.</p>
              <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-secondary-200 dark:border-dark-border text-secondary-700 dark:text-dark-text-primary font-medium rounded-lg hover:bg-secondary-50 dark:hover:bg-dark-bg hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:opacity-50"
              >
                {exporting && activeExport === 'json' ? 'Exporting...' : 'Download JSON'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportPage;
