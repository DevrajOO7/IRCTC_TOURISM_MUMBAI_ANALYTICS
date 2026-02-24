import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { targetingAPI } from '../api';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from 'date-fns';

function UpdatePassengerModal({ passenger, onClose, onUpdate }) {
    const [form, setForm] = useState({
        dob: '',
        anniversary_date: '',
        remarks: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (passenger) {
            setForm({
                dob: passenger.personal?.dob ? passenger.personal.dob.split('T')[0] : '',
                anniversary_date: passenger.personal?.anniversary ? passenger.personal.anniversary.split('T')[0] : '',
                remarks: passenger.personal?.remarks || ''
            });
        }
    }, [passenger]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await targetingAPI.updatePassengerInfo({
                email: passenger.email,
                dob: form.dob || null,
                anniversary_date: form.anniversary_date || null,
                remarks: form.remarks || null
            });
            toast.success('Passenger info updated successfully');
            onUpdate(); // Refresh parent data
            onClose();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Failed to update info');
        } finally {
            setLoading(false);
        }
    };

    if (!passenger) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg max-w-md w-full p-6 border border-secondary-200 dark:border-dark-border">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-dark-text-primary">Update Passenger Info</h3>
                    <button onClick={onClose} className="text-secondary-400 dark:text-dark-text-secondary hover:text-secondary-600 dark:hover:text-dark-text-primary">
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-sm text-secondary-600 dark:text-dark-text-secondary mb-1">Updating info for:</p>
                    <p className="font-medium text-secondary-900 dark:text-dark-text-primary">{passenger.name}</p>
                    <p className="text-xs text-secondary-500 dark:text-dark-text-secondary">{passenger.email}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Date of Birth</label>
                        <div className="w-full">
                            <DatePicker
                                selected={form.dob ? parseISO(form.dob) : null}
                                onChange={(date) => setForm({ ...form, dob: date ? format(date, 'yyyy-MM-dd') : '' })}
                                dateFormat="dd/MM/yyyy"
                                className="w-full px-3 py-2 border border-secondary-300 dark:border-dark-border bg-white dark:bg-dark-bg text-secondary-900 dark:text-dark-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholderText="DD/MM/YYYY"
                                showYearDropdown
                                scrollableYearDropdown
                                yearDropdownItemNumber={100}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Anniversary Date</label>
                        <div className="w-full">
                            <DatePicker
                                selected={form.anniversary_date ? parseISO(form.anniversary_date) : null}
                                onChange={(date) => setForm({ ...form, anniversary_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                dateFormat="dd/MM/yyyy"
                                className="w-full px-3 py-2 border border-secondary-300 dark:border-dark-border bg-white dark:bg-dark-bg text-secondary-900 dark:text-dark-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholderText="DD/MM/YYYY"
                                showYearDropdown
                                scrollableYearDropdown
                                yearDropdownItemNumber={50}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Remarks/Notes</label>
                        <textarea
                            value={form.remarks}
                            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                            rows="4"
                            placeholder="Add notes about this passenger (e.g., interested in packages, follow-up dates, preferences...)"
                            className="w-full px-3 py-2 border border-secondary-300 dark:border-dark-border bg-white dark:bg-dark-bg text-secondary-900 dark:text-dark-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none placeholder-secondary-400 dark:placeholder-dark-text-muted"
                        />
                        <p className="text-xs text-secondary-500 dark:text-dark-text-secondary mt-1">These notes will be visible in the Advance Target list</p>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-secondary-300 dark:border-dark-border text-secondary-700 dark:text-dark-text-primary rounded-lg hover:bg-secondary-50 dark:hover:bg-dark-bg font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Info'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UpdatePassengerModal;
