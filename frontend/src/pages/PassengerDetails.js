import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, User, Phone, MapPin, Calendar, Briefcase, Users, FileText } from 'lucide-react';
import { passengerAPI } from '../api';
import { formatDate } from '../utils/dateUtils';

function PassengerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [passenger, setPassenger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPassenger = async () => {
      try {
        setLoading(true);
        const response = await passengerAPI.getById(id);
        setPassenger(response.data);
      } catch (err) {
        setError('Failed to load passenger details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPassenger();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this passenger?')) {
      try {
        await passengerAPI.delete(id);
        navigate('/passengers');
      } catch (err) {
        alert('Failed to delete passenger');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-secondary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <span className="ml-3 text-secondary-600 font-medium">Loading details...</span>
      </div>
    );
  }

  if (error || !passenger) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="text-secondary-400 mb-4">
          <User size={48} />
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">{error || 'Passenger not found'}</h3>
        <Link to="/passengers" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2">
          <ArrowLeft size={16} />
          Back to Passengers
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/passengers"
            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-dark-surface text-secondary-500 dark:text-dark-text-secondary hover:text-secondary-900 dark:hover:text-dark-text-primary transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-dark-text-primary">{passenger.master_passenger_name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${passenger.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                passenger.status === 'Cancelled' ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' :
                  'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                }`}>
                {passenger.status}
              </span>
              <span className="text-sm text-secondary-500 dark:text-dark-text-secondary">ID: {passenger.id}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to={`/passengers/${id}/edit`}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface border border-secondary-200 dark:border-dark-border text-secondary-700 dark:text-dark-text-primary rounded-lg hover:bg-secondary-50 dark:hover:bg-dark-bg hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Edit2 size={18} />
            <span>Edit</span>
          </Link>
          <button
            onClick={handleDelete}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface border border-secondary-200 dark:border-dark-border text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 dark:hover:border-rose-800 transition-colors"
          >
            <Trash2 size={18} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-secondary-100 dark:border-dark-border">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
              <User size={20} />
            </div>
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">Personal Information</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Age</label>
                <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">{passenger.age || '-'}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Gender</label>
                <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">{passenger.gender || '-'}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">DOB</label>
                <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">
                  {formatDate(passenger.dob)}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Anniversary</label>
                <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">
                  {formatDate(passenger.anniversary_date)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-secondary-100 dark:border-dark-border">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
              <Phone size={20} />
            </div>
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">Contact Details</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Email</label>
              <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">{passenger.email_id || '-'}</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Phone</label>
              <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">{passenger.contact_number || '-'}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">City</label>
                <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">{passenger.city}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">State</label>
                <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">{passenger.state}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Info */}
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-secondary-100 dark:border-dark-border">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
              <Calendar size={20} />
            </div>
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">Booking Details</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Transaction ID</label>
              <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1 font-mono bg-secondary-50 dark:bg-dark-bg px-2 py-1 rounded inline-block">
                {passenger.transcation_id || '-'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Booking Date</label>
                <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">
                  {formatDate(passenger.booking_date)}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Journey Date</label>
                <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">
                  {formatDate(passenger.journey_date)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Boarding Point</label>
                <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1 flex items-center gap-2">
                  <MapPin size={16} className="text-secondary-400 dark:text-dark-text-secondary" />
                  {passenger.boarding_point || '-'}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Dropping Point</label>
                <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1 flex items-center gap-2">
                  <MapPin size={16} className="text-secondary-400 dark:text-dark-text-secondary" />
                  {passenger.destination_point || '-'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Package Info */}
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-secondary-100 dark:border-dark-border">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
              <Briefcase size={20} />
            </div>
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">Package Information</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Package Code</label>
                <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">{passenger.package_code || '-'}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Class</label>
                <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">{passenger.package_class || '-'}</div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Package Name</label>
              <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">{passenger.package_name || '-'}</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Client Type</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${passenger.international_client
                  ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
                  : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                  }`}>
                  {passenger.international_client ? 'International' : 'Domestic'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Remarks Section */}
        <div className="md:col-span-2 bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-secondary-100 dark:border-dark-border">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
              <FileText size={20} />
            </div>
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">Remarks & Notes</h2>
          </div>
          <div className="space-y-4">
            <div>
              {passenger.remarks ? (
                <>
                  <p className="text-secondary-700 dark:text-dark-text-secondary whitespace-pre-line leading-relaxed">
                    {passenger.remarks}
                  </p>
                  {(passenger.remarks_updated_by || passenger.remarks_updated_at) && (
                    <p className="text-xs text-secondary-400 dark:text-dark-text-muted mt-2">
                      Updated: {passenger.remarks_updated_at ? formatDate(passenger.remarks_updated_at) : '-'}
                      {passenger.remarks_updated_by && ` by ${passenger.remarks_updated_by}`}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-secondary-400 dark:text-dark-text-muted italic">No remarks available for this passenger.</p>
              )}
            </div>
          </div>
        </div>

        {/* Nominee Info (Conditional) */}
        {(passenger.nominee_name || passenger.nominee_relation || passenger.nominee_contact) && (
          <div className="md:col-span-2 bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-secondary-100 dark:border-dark-border">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
                <Users size={20} />
              </div>
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">Nominee Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Name</label>
                <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">{passenger.nominee_name || '-'}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Relation</label>
                <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">{passenger.nominee_relation || '-'}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-secondary-500 dark:text-dark-text-secondary uppercase tracking-wide">Contact</label>
                <div className="text-secondary-900 dark:text-dark-text-primary font-medium mt-1">{passenger.nominee_contact || '-'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PassengerDetails;
