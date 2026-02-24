import { format, parseISO, isValid } from 'date-fns';

/**
 * Formats a date string or object to 'dd/MM/yyyy'
 * @param {string|Date} date - The date to format
 * @param {string} [fallback='-'] - Fallback string if date is invalid
 * @returns {string} Formatted date string
 */
export const formatDate = (date, fallback = '-') => {
    if (!date) return fallback;

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) return fallback;
        return format(dateObj, 'dd/MM/yyyy');
    } catch (error) {
        console.error('Error formatting date:', error);
        return fallback;
    }
};
