import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type Step = 'account' | 'profile';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('account');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'driver' as 'admin' | 'officer' | 'driver',
    fullName: '',
    phone: '',
    dateOfBirth: '',
  });

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setStep('profile');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        role: form.role,
        fullName: form.fullName,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth || undefined,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg">
            CD
          </div>
          <h1 className="font-lora text-2xl font-semibold text-ink-900">Create an account</h1>
          <p className="text-ink-500 mt-1 text-sm">Join ChainDrive to manage your driving records</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {(['account', 'profile'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 ${step === s ? 'text-teal-600' : 'text-ink-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? 'bg-teal-600 text-white' : step === 'profile' && i === 0 ? 'bg-teal-100 text-teal-600' : 'bg-ink-100 text-ink-400'}`}>
                  {step === 'profile' && i === 0 ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium capitalize hidden sm:block">{s}</span>
              </div>
              {i === 0 && <div className="flex-1 h-px bg-ink-200" />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-ink-100 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 'account' ? (
            <form onSubmit={nextStep} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
                <input
                  type="email" required value={form.email} onChange={(e) => update('email', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Role</label>
                <select
                  value={form.role} onChange={(e) => update('role', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-white"
                >
                  <option value="driver">Driver / Citizen</option>
                  <option value="officer">Traffic Officer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Password</label>
                <input
                  type="password" required value={form.password} onChange={(e) => update('password', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm transition-colors"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Confirm Password</label>
                <input
                  type="password" required value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm transition-colors"
                  placeholder="Repeat password"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors text-sm"
              >
                Continue →
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Full Name</label>
                <input
                  type="text" required value={form.fullName} onChange={(e) => update('fullName', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm transition-colors"
                  placeholder="As on government ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Phone Number</label>
                <input
                  type="tel" required value={form.phone} onChange={(e) => update('phone', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm transition-colors"
                  placeholder="10-digit mobile number"
                />
              </div>
              {form.role === 'driver' && (
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Date of Birth</label>
                  <input
                    type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm transition-colors"
                  />
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button" onClick={() => setStep('account')}
                  className="flex-1 py-2.5 border border-ink-200 text-ink-700 hover:bg-ink-50 font-medium rounded-xl transition-colors text-sm"
                >
                  ← Back
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-xl transition-colors text-sm"
                >
                  {loading ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 hover:text-teal-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
