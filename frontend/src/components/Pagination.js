import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function Pagination({ page, perPage, total, onPageChange }) {
  const totalPages = Math.ceil(total / perPage);

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-between border-t border-secondary-200 dark:border-dark-border px-6 py-4">
      <div className="text-sm text-secondary-500 dark:text-dark-text-secondary">
        Showing <span className="font-medium text-secondary-900 dark:text-dark-text-primary">{((page - 1) * perPage) + 1}</span> to{' '}
        <span className="font-medium text-secondary-900 dark:text-dark-text-primary">{Math.min(page * perPage, total)}</span> of{' '}
        <span className="font-medium text-secondary-900 dark:text-dark-text-primary">{total}</span> results
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg border border-secondary-200 dark:border-dark-border text-secondary-600 dark:text-dark-text-secondary hover:bg-secondary-50 dark:hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p, idx) => (
            <button
              key={idx}
              onClick={() => typeof p === 'number' && onPageChange(p)}
              disabled={p === '...'}
              className={`
                min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors
                ${page === p
                  ? 'bg-primary-600 text-white shadow-sm'
                  : p === '...'
                    ? 'text-secondary-400 dark:text-dark-text-muted cursor-default'
                    : 'text-secondary-600 dark:text-dark-text-secondary hover:bg-secondary-50 dark:hover:bg-dark-bg border border-transparent hover:border-secondary-200 dark:hover:border-dark-border'}
              `}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg border border-secondary-200 dark:border-dark-border text-secondary-600 dark:text-dark-text-secondary hover:bg-secondary-50 dark:hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
