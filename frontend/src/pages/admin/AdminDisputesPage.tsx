import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getDisputes, resolveDispute } from '../../lib/violation.api';
import { Dispute } from '../../types';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Resolution modal
  const [resolvingDispute, setResolvingDispute] = useState<{
    dispute: Dispute;
    decision: 'accepted' | 'rejected';
  } | null>(null);
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getDisputes();
      setDisputes(res || []);
    } catch (err) {
      console.error('Failed to load disputes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingDispute) return;

    setActionLoadingId(resolvingDispute.dispute.disputeId);
    setError('');
    setMessage('');

    try {
      await resolveDispute(resolvingDispute.dispute.disputeId, {
        decision: resolvingDispute.decision,
        notes,
      });

      setMessage(
        `Dispute ${resolvingDispute.dispute.disputeId} marked as ${resolvingDispute.decision} on-chain!`
      );
      setResolvingDispute(null);
      setNotes('');
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to resolve dispute');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-lora text-2xl sm:text-3xl font-bold text-ink-950">
            Citation Dispute Adjudication
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Review contested driver citations, examine evidence, and record binding on-chain dispute resolutions.
          </p>
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

        <div className="bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-ink-500">Loading disputes...</div>
          ) : disputes.length === 0 ? (
            <div className="py-12 text-center text-ink-500">
              No dispute appeals pending review.
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {disputes.map((d) => {
                const isSubmitted = d.status === 'submitted' || d.status === 'under_review';
                const isLoading = actionLoadingId === d.disputeId;

                return (
                  <div key={d._id} className="p-6 space-y-3 hover:bg-ink-50/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-ink-900">
                          {d.disputeId}
                        </span>
                        <span className="text-xs text-ink-500">
                          Citation ID: <strong className="font-mono">{d.violationId}</strong>
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            d.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>

                      {isSubmitted && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setResolvingDispute({ dispute: d, decision: 'accepted' })
                            }
                            disabled={isLoading}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                          >
                            Accept (Dismiss Fine)
                          </button>
                          <button
                            onClick={() =>
                              setResolvingDispute({ dispute: d, decision: 'rejected' })
                            }
                            disabled={isLoading}
                            className="px-3.5 py-1.5 border-2 border-red-300 bg-red-50 text-red-950 hover:bg-red-100 text-xs font-bold rounded-xl transition-colors"
                          >
                            Reject (Uphold Fine)
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="bg-ink-50/60 p-3.5 rounded-xl border border-ink-100 text-xs text-ink-800">
                      <span className="font-semibold text-ink-400 uppercase tracking-wider block mb-1">
                        Driver Appeal Statement
                      </span>
                      {d.reason}
                    </div>

                    {d.evidenceUrl && (
                      <div className="text-xs">
                        <span className="text-ink-500 font-semibold mr-2">Evidence:</span>
                        <a
                          href={d.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-600 underline font-mono"
                        >
                          {d.evidenceUrl}
                        </a>
                      </div>
                    )}

                    {d.resolutionNotes && (
                      <div className="text-xs text-ink-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                        <span className="font-semibold text-emerald-700 mr-2">Resolution Note:</span>
                        {d.resolutionNotes}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-ink-400 font-mono pt-1">
                      <span>Submitted: {new Date(d.submittedAt).toLocaleString()}</span>
                      {d.onChainHash && <span>Dispute Hash: {d.onChainHash.slice(0, 16)}…</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resolution Dialog */}
        {resolvingDispute && (
          <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-ink-100">
              <h2 className="font-lora text-lg font-bold text-ink-950 mb-1">
                {resolvingDispute.decision === 'accepted' ? 'Accept Appeal & Dismiss Citation' : 'Reject Appeal & Uphold Citation'}
              </h2>
              <p className="text-xs text-ink-500 mb-4">
                Dispute ID: {resolvingDispute.dispute.disputeId}
              </p>

              <form onSubmit={handleConfirmResolve} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                    Official Adjudication Note
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide justification for accepting or rejecting this dispute..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setResolvingDispute(null)}
                    className="px-4 py-2 border-2 border-ink-300 text-ink-950 text-xs font-bold rounded-xl hover:bg-ink-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-sm transition-colors ${
                      resolvingDispute.decision === 'accepted'
                        ? 'bg-emerald-700 hover:bg-emerald-800'
                        : 'bg-red-700 hover:bg-red-800'
                    }`}
                  >
                    Confirm Resolution
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
