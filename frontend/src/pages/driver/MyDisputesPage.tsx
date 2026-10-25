import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getDisputes } from '../../lib/violation.api';
import { Dispute } from '../../types';

export default function MyDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getDisputes();
        setDisputes(res || []);
      } catch (err) {
        console.error('Failed to load disputes', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-lora text-2xl sm:text-3xl font-bold text-ink-950">
            Citation Dispute Appeals
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Track status and administrative verdicts for your challenged citations.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-ink-500">Loading disputes...</div>
          ) : disputes.length === 0 ? (
            <div className="py-12 text-center text-ink-500">
              No disputes filed. You can dispute citations from your Violations page.
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {disputes.map((d) => (
                <div key={d._id} className="p-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-ink-900">
                        {d.disputeId}
                      </span>
                      <span className="text-xs text-ink-500">
                        Citation: <strong className="font-mono">{d.violationId}</strong>
                      </span>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider w-fit ${
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

                  <p className="text-sm text-ink-800 bg-ink-50/60 p-3 rounded-xl border border-ink-100">
                    <span className="text-xs text-ink-400 block font-semibold uppercase mb-0.5">
                      Your Reason
                    </span>
                    {d.reason}
                  </p>

                  {d.resolutionNotes && (
                    <div className="text-sm text-emerald-900 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                      <span className="text-xs text-emerald-600 block font-semibold uppercase mb-0.5">
                        Authority Resolution Notes
                      </span>
                      {d.resolutionNotes}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-ink-400 pt-1 font-mono">
                    <span>Filed: {new Date(d.submittedAt).toLocaleString()}</span>
                    {d.txHash && <span>Tx: {d.txHash.slice(0, 16)}…</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
