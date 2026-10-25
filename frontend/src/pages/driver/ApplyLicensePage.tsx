import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { applyLicense } from '../../lib/license.api';

const VEHICLE_OPTIONS = [
  { id: 'MCWG', label: 'Motor Cycle With Gear (MCWG)' },
  { id: 'LMV', label: 'Light Motor Vehicle (LMV / Car)' },
  { id: 'HMV', label: 'Heavy Motor Vehicle (HMV)' },
  { id: 'TRANS', label: 'Commercial Transport Vehicle' },
];

export default function ApplyLicensePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: 'O+',
    street: '',
    city: '',
    state: 'Karnataka',
    postalCode: '',
    vehicleClasses: ['LMV'] as string[],
    applicationNotes: '',
  });

  const toggleClass = (cls: string) => {
    setForm((f) => ({
      ...f,
      vehicleClasses: f.vehicleClasses.includes(cls)
        ? f.vehicleClasses.filter((c) => c !== cls)
        : [...f.vehicleClasses, cls],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.vehicleClasses.length === 0) {
      setError('Please select at least one vehicle category');
      return;
    }

    setLoading(true);
    try {
      await applyLicense({
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
        },
        vehicleClasses: form.vehicleClasses,
        applicationNotes: form.applicationNotes,
      });
      setSuccess(true);
      setTimeout(() => navigate('/driver/license'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit application. Please check fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-lora text-2xl sm:text-3xl font-bold text-ink-950">
            Apply for Driving License
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Submit your application details for administrative verification and blockchain issuance.
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
            <span className="text-4xl block mb-3">✅</span>
            <h2 className="text-lg font-bold text-emerald-800">Application Submitted Successfully!</h2>
            <p className="text-sm text-emerald-600 mt-1">
              Your application is now pending admin review. Redirecting to your license overview...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-ink-100 shadow-card space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  required
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                  Blood Group
                </label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="pt-2 border-t border-ink-100">
              <h3 className="text-sm font-bold text-ink-900 mb-3">Residential Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123 Palm Avenue, Indiranagar"
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Bangalore"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Karnataka"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                      Postal Code / PIN
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="560038"
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Classes */}
            <div className="pt-2 border-t border-ink-100">
              <h3 className="text-sm font-bold text-ink-900 mb-2">Requested Vehicle Classes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VEHICLE_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.vehicleClasses.includes(opt.id)
                        ? 'bg-teal-50 border-teal-500 text-teal-900'
                        : 'bg-white border-ink-200 text-ink-700 hover:bg-ink-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.vehicleClasses.includes(opt.id)}
                      onChange={() => toggleClass(opt.id)}
                      className="rounded border-ink-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs font-semibold">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                Additional Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Any past learner permit numbers, RTO center preference..."
                value={form.applicationNotes}
                onChange={(e) => setForm({ ...form, applicationNotes: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2.5 rounded-xl border-2 border-ink-300 text-ink-950 text-sm font-bold hover:bg-ink-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-md active:scale-95"
              >
                {loading ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
