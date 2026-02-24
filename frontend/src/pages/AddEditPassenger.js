import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Phone, Calendar, Briefcase, Users, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { passengerAPI } from '../api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO, differenceInYears } from 'date-fns';

function AddEditPassenger() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    master_passenger_name: '',
    age: '',
    gender: '',
    email_id: '',
    contact_number: '',
    city: '',
    state: '',
    booking_date: '',
    journey_date: '',
    boarding_point: '',
    destination_point: '',
    no_of_passenger: '1',
    package_code: '',
    package_name: '',
    package_class: '',
    status: 'Pending',
    nominee_name: '',
    nominee_relation: '',
    nominee_contact: '',
    international_client: false,
    dob: '',
    anniversary_date: '',
    remarks: '',
  });

  useEffect(() => {
    const fetchPassenger = async () => {
      try {
        const response = await passengerAPI.getById(id);
        const p = response.data;
        setFormData({
          master_passenger_name: p.master_passenger_name,
          age: p.age || '',
          gender: p.gender || '',
          email_id: p.email_id || '',
          contact_number: p.contact_number || '',
          city: p.city,
          state: p.state,
          booking_date: p.booking_date ? p.booking_date.split('T')[0] : '',
          journey_date: p.journey_date ? p.journey_date.split('T')[0] : '',
          boarding_point: p.boarding_point || '',
          destination_point: p.destination_point || '',
          no_of_passenger: p.no_of_passenger || '1',
          package_code: p.package_code || '',
          package_name: p.package_name || '',
          package_class: p.package_class || '',
          status: p.status,
          nominee_name: p.nominee_name || '',
          nominee_relation: p.nominee_relation || '',
          nominee_contact: p.nominee_contact || '',
          international_client: p.international_client,
          dob: p.dob ? p.dob.split('T')[0] : '',
          anniversary_date: p.anniversary_date ? p.anniversary_date.split('T')[0] : '',
          remarks: p.remarks || '',
        });
      } catch (err) {
        toast.error('Failed to load passenger');
      } finally {
        setLoading(false);
      }
    };

    if (isEdit) fetchPassenger();
  }, [id, isEdit]);

  // Update age when DOB changes
  useEffect(() => {
    if (formData.dob) {
      const age = differenceInYears(new Date(), parseISO(formData.dob));
      setFormData((prev) => ({
        ...prev,
        age: age.toString(),
      }));
    }
  }, [formData.dob]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Helper to convert YYYY-MM-DD to DD/MM/YYYY
    const formatDateForBackend = (dateStr) => {
      if (!dateStr) return null;
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    const submitData = {
      ...formData,
      dob: formatDateForBackend(formData.dob),
      anniversary_date: formatDateForBackend(formData.anniversary_date),
      booking_date: formatDateForBackend(formData.booking_date),
      journey_date: formatDateForBackend(formData.journey_date),
    };

    try {
      if (isEdit) {
        await passengerAPI.update(id, submitData);
        toast.success('Passenger updated successfully');
      } else {
        await passengerAPI.create(submitData);
        toast.success('Passenger created successfully');
      }
      navigate('/passengers');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save passenger');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-secondary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <span className="ml-3 text-secondary-600 font-medium">Loading passenger data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/passengers"
          className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-dark-surface text-secondary-500 dark:text-dark-text-secondary hover:text-secondary-900 dark:hover:text-dark-text-primary transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-dark-text-primary">{isEdit ? 'Edit Passenger' : 'Add New Passenger'}</h1>
          <p className="text-secondary-500 dark:text-dark-text-secondary text-sm mt-1">Fill in the details below to {isEdit ? 'update the' : 'create a new'} record.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-surface rounded-xl shadow-soft border border-secondary-200 dark:border-dark-border overflow-hidden">

        {/* Personal Info */}
        <div className="p-8 border-b border-secondary-100 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
              <User size={20} />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Full Name *</label>
              <input
                type="text"
                name="master_passenger_name"
                value={formData.master_passenger_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="0"
                max="150"
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none appearance-none"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Date of Birth</label>
              <div className="w-full">
                <DatePicker
                  selected={formData.dob ? parseISO(formData.dob) : null}
                  onChange={(date) => handleChange({ target: { name: 'dob', value: date ? format(date, 'yyyy-MM-dd') : '' } })}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
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
                  selected={formData.anniversary_date ? parseISO(formData.anniversary_date) : null}
                  onChange={(date) => handleChange({ target: { name: 'anniversary_date', value: date ? format(date, 'yyyy-MM-dd') : '' } })}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
                  placeholderText="DD/MM/YYYY"
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={50}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="p-8 border-b border-secondary-100 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
              <Phone size={20} />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">Contact Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Email Address</label>
              <input
                type="email"
                name="email_id"
                value={formData.email_id}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Phone Number</label>
              <input
                type="tel"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">State *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Booking Info */}
        <div className="p-8 border-b border-secondary-100 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
              <Calendar size={20} />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">Booking Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Booking Date</label>
              <div className="w-full">
                <DatePicker
                  selected={formData.booking_date ? parseISO(formData.booking_date) : null}
                  onChange={(date) => handleChange({ target: { name: 'booking_date', value: date ? format(date, 'yyyy-MM-dd') : '' } })}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
                  placeholderText="DD/MM/YYYY"
                  showYearDropdown
                  scrollableYearDropdown
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Journey Date</label>
              <div className="w-full">
                <DatePicker
                  selected={formData.journey_date ? parseISO(formData.journey_date) : null}
                  onChange={(date) => handleChange({ target: { name: 'journey_date', value: date ? format(date, 'yyyy-MM-dd') : '' } })}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
                  placeholderText="DD/MM/YYYY"
                  showYearDropdown
                  scrollableYearDropdown
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none appearance-none"
              >
                <option value="Pending">Pending</option>
                <option value="Booked">Booked</option>
                <option value="Delivered">Delivered</option>
                <option value="Can/Mod">Cancelled/Modified</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Boarding Point</label>
              <input
                type="text"
                name="boarding_point"
                value={formData.boarding_point}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Dropping Point</label>
              <input
                type="text"
                name="destination_point"
                value={formData.destination_point}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">No. of Passengers</label>
              <input
                type="number"
                name="no_of_passenger"
                value={formData.no_of_passenger}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Package Info */}
        <div className="p-8 border-b border-secondary-100 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
              <Briefcase size={20} />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">Package Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Package Name</label>
              <input
                type="text"
                name="package_name"
                value={formData.package_name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Package Code</label>
              <input
                type="text"
                name="package_code"
                value={formData.package_code}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Package Class</label>
              <select
                name="package_class"
                value={formData.package_class}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none appearance-none"
              >
                <option value="">Select Class</option>
                <option value="STANDARD">Standard</option>
                <option value="COMFORT">Comfort</option>
                <option value="DELUXE">Deluxe</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 p-4 border border-secondary-200 dark:border-dark-border rounded-lg cursor-pointer hover:bg-secondary-50 dark:hover:bg-dark-bg transition-colors">
                <input
                  type="checkbox"
                  name="international_client"
                  checked={formData.international_client}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 rounded border-secondary-300 dark:border-dark-border focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-secondary-900 dark:text-dark-text-primary">International Client</span>
              </label>
            </div>
          </div>
        </div>

        {/* Nominee Info */}
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
              <Users size={20} />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">Nominee Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Nominee Name</label>
              <input
                type="text"
                name="nominee_name"
                value={formData.nominee_name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Relation</label>
              <input
                type="text"
                name="nominee_relation"
                value={formData.nominee_relation}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Nominee Contact</label>
              <input
                type="tel"
                name="nominee_contact"
                value={formData.nominee_contact}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none"
              />
            </div>

          </div>
        </div>

        {/* Remarks */}
        <div className="p-8 border-t border-secondary-100 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
              <FileText size={20} />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-dark-text-primary">Remarks & Notes</h3>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-secondary-700 dark:text-dark-text-primary mb-1">Remarks</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="4"
              placeholder="Add any special notes or remarks about this passenger..."
              className="w-full px-4 py-2 bg-secondary-50 dark:bg-dark-bg border border-secondary-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text-primary transition-all outline-none resize-y"
            ></textarea>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-secondary-50 dark:bg-dark-surface border-t border-secondary-200 dark:border-dark-border flex justify-end gap-4">
          <Link
            to="/passengers"
            className="px-6 py-2.5 border border-secondary-300 dark:border-dark-border text-secondary-700 dark:text-dark-text-primary font-medium rounded-lg hover:bg-white dark:hover:bg-dark-bg hover:text-secondary-900 dark:hover:text-dark-text-primary transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                {isEdit ? 'Update Passenger' : 'Create Passenger'}
              </>
            )}
          </button>
        </div>
      </form>
    </div >
  );
}

export default AddEditPassenger;
