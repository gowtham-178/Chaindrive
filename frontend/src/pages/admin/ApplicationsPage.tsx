import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  getApplications,
  reviewApplication,
  issueLicense,
  suspendLicense,
  revokeLicense,
} from '../../lib/license.api';
import { License } from '../../types';

export default function ApplicationsPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Reason prompt modal state
  const [modalAction, setModalAction] = useState<{
    type: 'reject' | 'suspend' | 'revoke';
    licenseId: string;
  } | null>(null);
  const [reasonText, setReasonText] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getApplications(statusFilter || undefined);
      setLicenses(res.licenses || []);
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    setError('');
    setMessage('');
    try {
      await reviewApplication(id, 'approved');
      setMessage('Application approved! You can now issue the license on-chain.');
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleIssue = async (id: string) => {
    setActionLoadingId(id);
    setError('');
    setMessage('');
    try {
      const lic = await issueLicense(id);
      setMessage(`License ${lic.licenseNumber} minted on-chain successfully!`);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'On-chain issuance failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const submitModalAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAction) return;

    setActionLoadingId(modalAction.licenseId);
    setError('');
    setMessage('');

    try {
      if (modalAction.type === 'reject') {
        await reviewApplication(modalAction.licenseId, 'rejected', reasonText);
        setMessage('Application rejected');
      } else if (modalAction.type === 'suspend') {
        await suspendLicense(modalAction.licenseId, reasonText);
        setMessage('License suspended on-chain');
      } else if (modalAction.type === 'revoke') {
        await revokeLicense(modalAction.licenseId, reasonText);
        setMessage('License revoked on-chain');
      }
      setModalAction(null);
      setReasonText('');
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-lora text-2xl sm:text-3xl font-bold text-ink-950">
              License Applications &amp; Registry
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              Review applicant details, approve applications, and mint verified credentials to the smart contract.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-ink-200 text-xs font-semibold focus:outline-none bg-white text-ink-800"
            >
              <option value="">All Statuses</option>
              <option value="applied">Applied (Pending Review)</option>
              <option value="approved">Approved (Ready to Issue)</option>
              <option value="issued">Issued (Active On-Chain)</option>
              <option value="suspended">Suspended</option>
              <option value="revoked">Revoked</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
            ✅ {message}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Applications List */}
        <div className="bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-ink-500">Loading applications...</div>
          ) : licenses.length === 0 ? (
            <div className="py-12 text-center text-ink-500">
              No applications matching the filter.
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {licenses.map((lic) => {
                const isApplied = lic.status === 'applied';
                const isApproved = lic.status === 'approved';
                const isIssued = lic.status === 'issued';
                const isLoading = actionLoadingId === lic._id;

                return (
                  <div key={lic._id} className="p-6 space-y-3 hover:bg-ink-50/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-base font-bold text-ink-900">{lic.fullName}</h2>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              isIssued
                                ? 'bg-emerald-100 text-emerald-800'
                                : isApproved
                                ? 'bg-teal-100 text-teal-800'
                                : isApplied
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-ink-100 text-ink-800'
                            }`}
                          >
                            {lic.status}
                          </span>
                        </div>
                        {lic.licenseNumber && (
                          <span className="text-xs font-mono text-teal-700 font-semibold block mt-0.5">
                            {lic.licenseNumber}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isApplied && (
                          <>
                            <button
                              onClick={() => handleApprove(lic._id)}
                              disabled={isLoading}
                              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                            >
                              {isLoading ? '...' : '✓ Approve'}
                            </button>
                            <button
                              onClick={() => setModalAction({ type: 'reject', licenseId: lic._id })}
                              disabled={isLoading}
                              className="px-4 py-2 border-2 border-red-300 text-red-800 bg-red-50 hover:bg-red-100 text-xs font-bold rounded-xl transition-all"
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => handleIssue(lic._id)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <span>⚡</span> {isLoading ? 'Minting...' : 'Issue On-Chain'}
                          </button>
                        )}

                        {isIssued && (
                          <>
                            <button
                              onClick={() => setModalAction({ type: 'suspend', licenseId: lic._id })}
                              disabled={isLoading}
                              className="px-4 py-2 border-2 border-amber-300 text-amber-950 bg-amber-50 hover:bg-amber-100 text-xs font-bold rounded-xl transition-all"
                            >
                              Suspend
                            </button>
                            <button
                              onClick={() => setModalAction({ type: 'revoke', licenseId: lic._id })}
                              disabled={isLoading}
                              className="px-4 py-2 border-2 border-red-300 text-red-950 bg-red-50 hover:bg-red-100 text-xs font-bold rounded-xl transition-all"
                            >
                              Revoke
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-ink-600 bg-ink-50/50 p-3 rounded-xl border border-ink-100">
                      <div>
                        <span className="text-ink-400 block font-semibold uppercase">DOB</span>
                        <span>{new Date(lic.dateOfBirth).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-ink-400 block font-semibold uppercase">Blood Group</span>
                        <span>{lic.bloodGroup}</span>
                      </div>
                      <div>
                        <span className="text-ink-400 block font-semibold uppercase">Categories</span>
                        <span>{lic.vehicleClasses.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-ink-400 block font-semibold uppercase">City / State</span>
                        <span>
                          {lic.address.city}, {lic.address.state}
                        </span>
                      </div>
                    </div>

                    {lic.onChainHash && (
                      <div className="text-xs font-mono text-ink-400 break-all">
                        On-Chain Hash: {lic.onChainHash}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal for Reject / Suspend / Revoke reason */}
        {modalAction && (
          <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-ink-100">
              <h2 className="font-lora text-lg font-bold text-ink-950 capitalize mb-2">
                {modalAction.type} Driving License
              </h2>
              <p className="text-xs text-ink-500 mb-4">
                Please enter official justification for this regulatory action.
              </p>

              <form onSubmit={submitModalAction} className="space-y-4">
                <textarea
                  required
                  rows={3}
                  placeholder={`Reason for ${modalAction.type}ing...`}
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalAction(null)}
                    className="px-4 py-2 border border-ink-200 text-ink-700 text-xs font-medium rounded-xl hover:bg-ink-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                  >
                    Confirm {modalAction.type}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
