import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import { verifyLicensePublic } from '../../lib/license.api';

export default function VerifyLicensePage() {
  const [searchParams] = useSearchParams();
  const [licenseNumber, setLicenseNumber] = useState(searchParams.get('number') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    isValid: boolean;
    licenseNumber: string;
    fullName: string;
    vehicleClasses: string[];
    status: string;
    issuedAt?: string;
    expiresAt?: string;
    isIntegrityVerified: boolean;
    onChainHash?: string;
  } | null>(null);

  useEffect(() => {
    const num = searchParams.get('number');
    if (num) {
      setLicenseNumber(num);
      handleVerify(num);
    }
  }, [searchParams]);

  const handleVerify = async (queryNum?: string) => {
    const num = queryNum || licenseNumber;
    if (!num.trim()) return;
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const data = await verifyLicensePublic(num.trim());
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'License verification failed or license not found');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify();
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="font-lora text-3xl font-bold text-ink-950">Public License Verification</h1>
          <p className="text-sm text-ink-500 mt-2">
            Verify the authenticity and on-chain hash integrity of any ChainDrive driving license.
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-ink-100 max-w-2xl mx-auto">
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              placeholder="Enter License Number (e.g. DL-IND-2026-123456)"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-ink-200 text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-md active:scale-95"
            >
              {loading ? 'Verifying...' : 'Verify License'}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-medium">Verification Failed</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Verification Result Card */}
        {result && (
          <div className="mt-8 bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-ink-100 max-w-2xl mx-auto animate-fade-in">
            {/* Status Banner */}
            <div
              className={`p-4 rounded-xl flex items-center justify-between mb-6 ${
                result.isValid
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{result.isValid ? '✅' : '⚠️'}</span>
                <div>
                  <h3 className="font-semibold text-base">
                    {result.isValid ? 'Valid & Cryptographically Verified' : 'Attention: License Inactive or Suspended'}
                  </h3>
                  <p className="text-xs opacity-90">
                    Status: <strong className="uppercase">{result.status}</strong>
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/80 shadow-xs">
                {result.isIntegrityVerified ? 'Hash Matched' : 'Hash Mismatch'}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-ink-100">
                <div>
                  <span className="text-xs text-ink-400 block mb-0.5 uppercase tracking-wider font-semibold">
                    License Number
                  </span>
                  <span className="text-sm font-mono font-bold text-ink-900">{result.licenseNumber}</span>
                </div>
                <div>
                  <span className="text-xs text-ink-400 block mb-0.5 uppercase tracking-wider font-semibold">
                    Full Legal Name
                  </span>
                  <span className="text-sm font-semibold text-ink-900">{result.fullName}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-ink-100">
                <div>
                  <span className="text-xs text-ink-400 block mb-0.5 uppercase tracking-wider font-semibold">
                    Authorized Vehicle Classes
                  </span>
                  <div className="flex gap-1.5 mt-1">
                    {result.vehicleClasses.map((cls) => (
                      <span
                        key={cls}
                        className="px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-ink-400 block mb-0.5 uppercase tracking-wider font-semibold">
                    Expiry Date
                  </span>
                  <span className="text-sm text-ink-700">
                    {result.expiresAt ? new Date(result.expiresAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Blockchain Proof Info */}
              {result.onChainHash && (
                <div className="bg-ink-50 p-4 rounded-xl border border-ink-100">
                  <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider block mb-1">
                    On-Chain Keccak256 Data Hash
                  </span>
                  <span className="text-xs font-mono break-all text-ink-800">
                    {result.onChainHash}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
