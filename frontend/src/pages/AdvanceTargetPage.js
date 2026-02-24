import React, { useState } from 'react';
import {
    Target, Calendar, TrendingUp, Users, Phone,
    CheckCircle2, Clock, Edit2
} from 'lucide-react';
import UpdatePassengerModal from '../components/UpdatePassengerModal';
import Pagination from '../components/Pagination';
import { targetingAPI } from '../api';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/dateUtils';

function AdvanceTargetPage() {
    const [predictions, setPredictions] = useState([]);
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() + 1);
    const [filterProbability, setFilterProbability] = useState('all'); // all, high, medium

    // Pagination State
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [hasSearched, setHasSearched] = useState(false);

    // Update Info State
    const [editingPassenger, setEditingPassenger] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setHasSearched(true);
            const [predRes, kpiRes] = await Promise.all([
                targetingAPI.getPredictions(selectedMonth, selectedYear),
                targetingAPI.getKPIs(selectedMonth, selectedYear)
            ]);
            setPredictions(predRes.data.predictions);
            setKpis(kpiRes.data);
            setPage(1); // Reset to first page on new search
        } catch (err) {
            console.error(err);
            toast.error('Failed to load targeting data');
        } finally {
            setLoading(false);
        }
    };

    // Removed auto-fetch useEffect

    const handleEditClick = (passenger) => {
        setEditingPassenger(passenger);
    };

    const filteredPredictions = predictions.filter(p => {
        if (filterProbability === 'all') return true;
        return p.probability.toLowerCase() === filterProbability;
    });

    // Pagination Logic
    const totalItems = filteredPredictions.length;
    const paginatedPredictions = filteredPredictions.slice((page - 1) * perPage, page * perPage);

    const getProbabilityBadge = (prob) => {
        const styles = {
            high: 'bg-green-100 text-green-800 border-green-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${styles[prob.toLowerCase()]}`}>
                {prob} Match
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900 dark:text-dark-text-primary flex items-center gap-2">
                        <Target className="text-primary-600 dark:text-primary-400" />
                        Advance Target Intelligence
                    </h1>
                    <p className="text-secondary-500 dark:text-dark-text-secondary mt-1">Predict and target passengers likely to travel</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-dark-surface p-2 rounded-lg border border-secondary-200 dark:border-dark-border shadow-sm">
                    <div className="flex items-center gap-2 px-2 text-secondary-500 dark:text-dark-text-secondary">
                        <Calendar size={18} />
                        <span className="text-sm font-medium">Targeting For:</span>
                    </div>

                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="px-3 py-1.5 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-dark-text-primary"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="px-3 py-1.5 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-dark-text-primary"
                    >
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <div className="h-6 w-px bg-secondary-200 dark:bg-dark-border hidden md:block"></div>

                    <select
                        value={filterProbability}
                        onChange={(e) => setFilterProbability(e.target.value)}
                        className="px-3 py-1.5 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-dark-text-primary"
                    >
                        <option value="all">All Probabilities</option>
                        <option value="high">High Probability Only</option>
                        <option value="medium">Medium Probability Only</option>
                    </select>

                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors shadow-sm ml-2"
                    >
                        <Target size={16} />
                        Search Predictions
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            {hasSearched && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-secondary-500 dark:text-dark-text-secondary">Total Leads</p>
                                <h3 className="text-3xl font-bold text-secondary-900 dark:text-dark-text-primary mt-1">{kpis?.total_leads || 0}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                <Users size={24} />
                            </div>
                        </div>
                        <p className="text-xs text-secondary-400 dark:text-dark-text-muted mt-2">Passengers found for this period</p>
                    </div>

                    <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-secondary-500 dark:text-dark-text-secondary">Hot Leads</p>
                                <h3 className="text-3xl font-bold text-secondary-900 dark:text-dark-text-primary mt-1">{kpis?.hot_leads || 0}</h3>
                            </div>
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                                <Target size={24} />
                            </div>
                        </div>
                        <p className="text-xs text-secondary-400 dark:text-dark-text-muted mt-2">High probability targets</p>
                    </div>

                    <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-secondary-500 dark:text-dark-text-secondary">Potential Pax</p>
                                <h3 className="text-3xl font-bold text-secondary-900 dark:text-dark-text-primary mt-1">{kpis?.potential_pax || 0}</h3>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                        <p className="text-xs text-secondary-400 dark:text-dark-text-muted mt-2">Estimated total travelers</p>
                    </div>

                    <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6">
                        <div className="flex justify-between items-start">
                            <div className="w-full">
                                <p className="text-sm font-medium text-secondary-500 dark:text-dark-text-secondary mb-2">Top Predicted Destinations</p>
                                <div className="space-y-2">
                                    {kpis?.top_destinations?.map((d, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-secondary-700 dark:text-dark-text-primary font-medium truncate">{d.city}</span>
                                            <span className="text-secondary-500 dark:text-dark-text-secondary">{d.count}</span>
                                        </div>
                                    ))}
                                    {!kpis?.top_destinations?.length && <span className="text-sm text-secondary-400 dark:text-dark-text-muted">No data available</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Prediction List */}
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border overflow-hidden">
                <div className="p-6 border-b border-secondary-200 dark:border-dark-border">
                    <h2 className="text-lg font-bold text-secondary-900 dark:text-dark-text-primary">Target List</h2>
                </div>

                {!hasSearched ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-secondary-50 dark:bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="text-secondary-400 dark:text-dark-text-muted" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-secondary-900 dark:text-dark-text-primary">Ready to Predict</h3>
                        <p className="text-secondary-500 dark:text-dark-text-secondary mt-1">Select a month and year, then click "Search Predictions" to start.</p>
                    </div>
                ) : loading ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-4 border-secondary-200 dark:border-dark-border border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-secondary-500 dark:text-dark-text-secondary">Analyzing passenger history...</p>
                    </div>
                ) : filteredPredictions.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-secondary-50 dark:bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="text-secondary-400 dark:text-dark-text-muted" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-secondary-900 dark:text-dark-text-primary">No targets found</h3>
                        <p className="text-secondary-500 dark:text-dark-text-secondary mt-1">Try selecting a different month or year.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-secondary-50 dark:bg-dark-bg border-b border-secondary-200 dark:border-dark-border">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase">Passenger</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase">Prediction</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase">Why Target?</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase">History</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase">Remarks</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase">Action Plan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-100 dark:divide-dark-border">
                                    {paginatedPredictions.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-secondary-50/50 dark:hover:bg-dark-bg/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold">
                                                        {p.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-secondary-900 dark:text-dark-text-primary">{p.name}</p>
                                                        <div className="flex items-center gap-2 text-xs text-secondary-500 dark:text-dark-text-secondary mt-0.5">
                                                            <Phone size={12} /> {p.mobile || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    {getProbabilityBadge(p.probability)}
                                                    <span className="text-xs text-secondary-500 dark:text-dark-text-secondary font-medium">Score: {p.score}/100</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <ul className="space-y-1">
                                                    {p.reasons.map((r, i) => (
                                                        <li key={i} className="text-sm text-secondary-700 dark:text-dark-text-secondary flex items-start gap-2">
                                                            <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                                                            {r}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-secondary-600 dark:text-dark-text-secondary">
                                                    <p>Visits: <span className="font-medium text-secondary-900 dark:text-dark-text-primary">{p.history.visits}</span></p>
                                                    <p>Last: <span className="font-medium text-secondary-900 dark:text-dark-text-primary">{p.history.last_visit_year}</span></p>
                                                    <p>Avg Pax: <span className="font-medium text-secondary-900 dark:text-dark-text-primary">{p.history.avg_pax}</span></p>
                                                    {p.personal?.dob && <p className="text-xs mt-1 text-secondary-500 dark:text-dark-text-muted">DOB: {formatDate(p.personal.dob)}</p>}
                                                    {p.personal?.anniversary && <p className="text-xs text-secondary-500 dark:text-dark-text-muted">Anniv: {formatDate(p.personal.anniversary)}</p>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    {p.personal?.remarks ? (
                                                        <>
                                                            <p className="text-secondary-700 dark:text-dark-text-secondary line-clamp-2 mb-1">
                                                                {p.personal.remarks.length > 100
                                                                    ? `${p.personal.remarks.substring(0, 100)}...`
                                                                    : p.personal.remarks}
                                                            </p>
                                                            {p.personal.remarks_updated_at && (
                                                                <p className="text-xs text-secondary-400 dark:text-dark-text-muted">
                                                                    Updated: {formatDate(p.personal.remarks_updated_at)}
                                                                    {p.personal.remarks_updated_by && ` by ${p.personal.remarks_updated_by}`}
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-secondary-400 dark:text-dark-text-muted italic">No remarks</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-100 dark:border-amber-900/30">
                                                        <Clock size={14} />
                                                        <span>Call by: <strong>{formatDate(p.insight.ideal_call_date)}</strong></span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button className="flex-1 py-1.5 px-2 bg-white dark:bg-dark-bg border border-secondary-300 dark:border-dark-border rounded text-sm font-medium text-secondary-700 dark:text-dark-text-primary hover:bg-secondary-50 dark:hover:bg-dark-surface hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center justify-center gap-1">
                                                            <Phone size={14} /> Call
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditClick(p)}
                                                            className="py-1.5 px-2 bg-white dark:bg-dark-bg border border-secondary-300 dark:border-dark-border rounded text-sm font-medium text-secondary-700 dark:text-dark-text-primary hover:bg-secondary-50 dark:hover:bg-dark-surface hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center justify-center"
                                                            title="Update Info"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    </div>
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
                            total={totalItems}
                            onPageChange={setPage}
                        />
                    </>
                )}
            </div>

            {/* Update Info Modal */}
            {/* Update Info Modal */}
            {editingPassenger && (
                <UpdatePassengerModal
                    passenger={editingPassenger}
                    onClose={() => setEditingPassenger(null)}
                    onUpdate={fetchData}
                />
            )}
        </div>
    );
}

export default AdvanceTargetPage;
