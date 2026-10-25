import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { recordViolation } from '../../lib/violation.api';
import { getLicenseByNumber } from '../../lib/license.api';

const VIOLATION_PRESETS: Record<string, number> = {
  SPEEDING: 2000,
  RED_LIGHT: 1500,
  NO_HELMET: 1000,
  NO_SEATBELT: 1000,
  DRUNK_DRIVING: 10000,
  RECKLESS_DRIVING: 5000,
  WRONG_SIDE: 2000,
  EXPIRED_INSURANCE: 2000,
};

export default function RecordViolationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verifyingLicense, setVerifyingLicense] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<{ fullName: string; status: string } | null>(null);

  const [form, setForm] = useState({
    licenseNumber: '',
    vehiclePlate: '',
    violationType: 'SPEEDING',
    fineAmountInr: 2000,
    location: '',
    description: '',
    evidenceUrl: '',
  });

  const checkLicense = async () => {
    if (!form.licenseNumber.trim()) return;
    setVerifyingLicense(true);
    setLicenseInfo(null);
    try {
      const lic = await getLicenseByNumber(form.licenseNumber.trim());
      setLicenseInfo({ fullName: lic.fullName, status: lic.status });
    } catch {
      setLicenseInfo(null);
    } finally {
      setVerifyingLicense(false);
    }
  };

  const handleTypeChange = (type: string) => {
    setForm((f) => ({
      ...f,
      violationType: type,
      fineAmountInr: VIOLATION_PRESETS[type] || f.fineAmountInr,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await recordViolation({
        licenseNumber: form.licenseNumber.trim(),
        vehiclePlate: form.vehiclePlate.trim().toUpperCase(),
        violationType: form.violationType,
        fineAmountInr: Number(form.fineAmountInr),
        location: form.location,
        description: form.description,
        evidenceUrl: form.evidenceUrl || undefined,
      });

      setSuccess(`Violation ${res.violationId} recorded and minted on-chain successfully!`);
      setTimeout(() => navigate('/officer/violations'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to record violation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-lora text-2xl sm:text-3xl font-bold text-ink-950">
            Record Traffic Violation
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Issue an on-chain cryptographically verifiable citation with automated fine calculation.
          </p>
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
            ✅ {success}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-ink-100 shadow-card space-y-6">
          {/* License Number Input + Quick Verification */}
          <div>
            <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
              Driver License Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="DL-IND-2026-102938"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase"
              />
              <button
                type="button"
                onClick={checkLicense}
                disabled={verifyingLicense}
                className="px-4 py-2.5 bg-ink-100 hover:bg-ink-200 text-black text-xs font-bold rounded-xl border border-ink-300"
              >
                {verifyingLicense ? 'Checking...' : 'Lookup'}
              </button>
            </div>

            {licenseInfo && (
              <div className="mt-2 p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs flex items-center justify-between text-teal-900">
                <span>
                  Driver: <strong>{licenseInfo.fullName}</strong>
                </span>
                <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-200/60">
                  {licenseInfo.status}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                Vehicle Plate Number
              </label>
              <input
                type="text"
                required
                placeholder="KA-01-AB-1234"
                value={form.vehiclePlate}
                onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                Violation Classification
              </label>
              <select
                value={form.violationType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
              >
                <option value="SPEEDING">Speeding (₹2,000)</option>
                <option value="RED_LIGHT">Red Light Violation (₹1,500)</option>
                <option value="NO_HELMET">No Helmet (₹1,000)</option>
                <option value="NO_SEATBELT">No Seatbelt (₹1,000)</option>
                <option value="DRUNK_DRIVING">Drunk Driving / DUI (₹10,000)</option>
                <option value="RECKLESS_DRIVING">Dangerous / Reckless Driving (₹5,000)</option>
                <option value="WRONG_SIDE">Driving on Wrong Side (₹2,000)</option>
                <option value="EXPIRED_INSURANCE">Expired Vehicle Insurance (₹2,000)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                Fine Amount (INR)
              </label>
              <input
                type="number"
                required
                min={100}
                value={form.fineAmountInr}
                onChange={(e) => setForm({ ...form, fineAmountInr: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                Location of Infraction
              </label>
              <input
                type="text"
                required
                placeholder="MG Road Junction, Bangalore"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
              Incident Description &amp; Officer Remarks
            </label>
            <textarea
              required
              rows={3}
              placeholder="Vehicle clocked at 84 km/h in a 50 km/h zone. Recorded on speed radar unit #04..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
              Photo / Radar Evidence URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://radar.traffic.gov.in/evidence/img_8943.jpg"
              value={form.evidenceUrl}
              onChange={(e) => setForm({ ...form, evidenceUrl: e.target.value })}
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
              {loading ? 'Recording On-Chain...' : 'Record Violation'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
