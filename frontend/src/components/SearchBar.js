import React, { useState } from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';

function SearchBar({ onSearch }) {
  const [filters, setFilters] = useState({
    name: '',
    city: '',
    state: '',
    status: 'All',
    international: 'all',
  });

  // Manual search mode - no debounce effect
  // useEffect(() => { ... }, ...);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchClick = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    const initialFilters = {
      name: '',
      city: '',
      state: '',
      status: 'All',
      international: 'all',
    };
    setFilters(initialFilters);
    onSearch(initialFilters);
  };

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-secondary-900 dark:text-dark-text-primary">
          <Filter size={20} className="text-primary-600 dark:text-primary-400" />
          <h3 className="font-semibold text-lg">Filters</h3>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSearchClick}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Search size={16} />
            Search
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface border border-secondary-200 dark:border-dark-border text-secondary-700 dark:text-dark-text-primary text-sm font-medium rounded-lg hover:bg-secondary-50 dark:hover:bg-dark-bg transition-colors shadow-sm"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Name</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 dark:text-dark-text-muted" />
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleInputChange}
              placeholder="Search name..."
              className="w-full pl-9 pr-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary dark:placeholder-dark-text-muted transition-all outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">City</label>
          <input
            type="text"
            name="city"
            value={filters.city}
            onChange={handleInputChange}
            placeholder="City..."
            className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary dark:placeholder-dark-text-muted transition-all outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">State</label>
          <input
            type="text"
            name="state"
            value={filters.state}
            onChange={handleInputChange}
            placeholder="State..."
            className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary dark:placeholder-dark-text-muted transition-all outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none appearance-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Delivered">Delivered</option>
            <option value="Can/Mod">Cancelled/Modified</option>
            <option value="Pending">Pending</option>
            <option value="Booked">Booked</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Client Type</label>
          <select
            name="international"
            value={filters.international}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="yes">International</option>
            <option value="no">Domestic</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
