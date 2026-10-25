import React, { useEffect, useState } from 'react';
import { ethers, Contract } from 'ethers';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useWallet } from '../../contexts/WalletContext';
import { getViolations, payViolation, disputeViolation, verifyViolationIntegrity } from '../../lib/violation.api';
import { Violation } from '../../types';
import contractsJson from '../../../../shared/contracts.json';

export default function MyViolationsPage() {
  const { account, isConnected, connectWallet, getSigner } = useWallet();

  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<Record<string, boolean>>({});

  // Dispute Modal State
  const [disputingViolation, setDisputingViolation] = useState<Violation | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getViolations({ mine: true });
      setViolations(res.violations || []);
    } catch (err) {
      console.error('Failed to load violations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePay = async (v: Violation) => {
    setActionError('');
    setActionSuccess('');
    setPayingId(v._id);

    try {
      if (!isConnected || !account) {
        await connectWallet();
      }

      const signer = await getSigner();
      if (!signer) {
        throw new Error('MetaMask wallet signer could not be acquired');
      }

      // Instantiate FinePayment contract
      const finePaymentContract = new Contract(
        contractsJson.FinePayment.address,
        contractsJson.FinePayment.abi,
        signer
      );

      // On-chain payment transaction
      const fineWei = BigInt(v.fineAmountWei || '0');
      const onChainId = v.onChainViolationId ?? 0;

      const tx = await finePaymentContract['payFine'](onChainId, {
        value: fineWei,
      });

      const receipt = await tx.wait();

      // Update backend status with receipt
      await payViolation(v._id, {
        payerAddress: account || (await signer.getAddress()),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      setActionSuccess(`Payment completed! Tx: ${receipt.hash.slice(0, 10)}…`);
      await loadData();
    } catch (err: any) {
      console.error('Payment error:', err);
      setActionError(err?.reason || err?.message || 'Payment transaction failed');
    } finally {
      setPayingId(null);
    }
  };

  const handleVerify = async (v: Violation) => {
    setVerifyingId(v._id);
    try {
      const valid = await verifyViolationIntegrity(v._id);
      setIntegrityStatus((prev) => ({ ...prev, [v._id]: valid }));
    } catch (err) {
      console.error('Integrity check failed', err);
    } finally {
      setVerifyingId(null);
    }
  };

  const submitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputingViolation) return;
    setSubmittingDispute(true);
    setActionError('');

    try {
      await disputeViolation(disputingViolation._id, {
        reason: disputeReason,
        evidenceUrl: disputeEvidence || undefined,
      });
      setActionSuccess('Dispute submitted successfully! An administrative officer will review it.');
      setDisputingViolation(null);
      setDisputeReason('');
      setDisputeEvidence('');
      await loadData();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to submit dispute');
    } finally {
      setSubmittingDispute(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-lora text-2xl sm:text-3xl font-bold text-ink-950">
            Traffic Violations &amp; Fines
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Review citations, pay fines directly via MetaMask, or submit cryptographic dispute appeals.
          </p>
        </div>

        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
            ✅ {actionSuccess}
          </div>
        )}

        {actionError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            ⚠️ {actionError}
          </div>
        )}

        {/* Violations List */}
        <div className="bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-ink-500">Loading violations...</div>
          ) : violations.length === 0 ? (
            <div className="py-12 text-center text-ink-500">
              🎉 No traffic violations recorded against your license!
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {violations.map((v) => {
                const isPaid = v.status === 'paid';
                const isDisputed = v.status === 'disputed';
                const isResolved = v.status === 'resolved';

                return (
                  <div key={v._id} className="p-6 hover:bg-ink-50/40 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-ink-900">
                            {v.violationId}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : isDisputed
                                ? 'bg-blue-100 text-blue-800'
                                : isResolved
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {v.status}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-ink-100 text-ink-700 font-semibold">
                            {v.violationType}
                          </span>
                        </div>

                        <p className="text-sm text-ink-800 font-medium">{v.description}</p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                          <span>📍 {v.location}</span>
                          <span>🚘 Vehicle: {v.vehiclePlate}</span>
                          <span>📅 {new Date(v.occurredAt).toLocaleString()}</span>
                          <span>Due: {new Date(v.dueDate).toLocaleDateString()}</span>
                        </div>

                        {/* Cryptographic hash info */}
                        {v.onChainHash && (
                          <div className="text-xs font-mono text-ink-400 flex items-center gap-2 pt-1">
                            <span>Hash: {v.onChainHash.slice(0, 14)}…</span>
                            <button
                              onClick={() => handleVerify(v)}
                              disabled={verifyingId === v._id}
                              className="text-teal-600 hover:underline font-sans text-xs"
                            >
                              {verifyingId === v._id ? 'Verifying...' : 'Verify Hash'}
                            </button>
                            {integrityStatus[v._id] !== undefined && (
                              <span
                                className={`text-xs font-bold font-sans ${
                                  integrityStatus[v._id] ? 'text-emerald-600' : 'text-red-600'
                                }`}
                              >
                                {integrityStatus[v._id] ? '✓ Tamper-proof' : '✗ Tampered'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Fine & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-right">
                        <div>
                          <div className="text-lg font-bold text-ink-950">
                            ₹{v.fineAmountInr.toLocaleString()}
                          </div>
                          <div className="text-xs font-mono text-ink-400">
                            ≈ {ethers.formatEther(v.fineAmountWei || '0').slice(0, 7)} ETH
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isPaid && !isDisputed && !isResolved && (
                            <>
                              <button
                                onClick={() => handlePay(v)}
                                disabled={payingId === v._id}
                                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                              >
                                {payingId === v._id ? 'Processing...' : 'Pay with MetaMask'}
                              </button>
                              <button
                                onClick={() => setDisputingViolation(v)}
                                className="px-3.5 py-2 border-2 border-ink-300 bg-white text-black hover:bg-ink-100 text-xs font-bold rounded-xl transition-colors"
                              >
                                Dispute
                              </button>
                            </>
                          )}
                          {isPaid && (
                            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                              Paid ✓
                            </span>
                          )}
                          {isDisputed && (
                            <span className="text-xs text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
                              Under Review
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── DISPUTE MODAL ───────────────────────────────────────────── */}
        {disputingViolation && (
          <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-ink-100">
              <div className="flex items-center justify-between pb-4 border-b border-ink-100 mb-5">
                <h2 className="font-lora text-lg font-bold text-ink-950">
                  Dispute Citation {disputingViolation.violationId}
                </h2>
                <button
                  onClick={() => setDisputingViolation(null)}
                  className="text-ink-400 hover:text-ink-700 text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={submitDispute} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                    Reason for Dispute
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide detailed explanation (e.g. vehicle was sold prior to citation, incorrect plate recognized, emergency situation...)"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                    Evidence Link / Document URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://ipfs.io/... or https://..."
                    value={disputeEvidence}
                    onChange={(e) => setDisputeEvidence(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDisputingViolation(null)}
                    className="px-4 py-2 border-2 border-ink-300 text-ink-950 text-xs font-bold rounded-xl hover:bg-ink-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDispute}
                    className="px-5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                  >
                    {submittingDispute ? 'Submitting to Blockchain...' : 'Submit Dispute'}
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
