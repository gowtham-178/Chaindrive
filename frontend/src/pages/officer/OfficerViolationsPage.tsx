import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getViolations } from '../../lib/violation.api';
import { Violation } from '../../types';

export default function OfficerViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getViolations({ mine: true });
        setViolations(res.violations || []);
      } catch (err) {
        console.error('Failed to load officer citations', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-lora text-2xl sm:text-3xl font-bold text-ink-950">
              Citations Issued by You
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              Log of all traffic violations recorded under your badge and on-chain account.
            </p>
          </div>

          <Link
            to="/officer/record"
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            + Record New Violation
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-ink-500">Loading citations...</div>
          ) : violations.length === 0 ? (
            <div className="py-12 text-center text-ink-500">
              No citations issued yet. Use "Record New Violation" above to log an incident.
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {violations.map((v) => (
                <div key={v._id} className="p-6 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-ink-900">
                        {v.violationId}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-ink-100 text-ink-800">
                        {v.violationType}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          v.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.status === 'disputed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-ink-900">₹{v.fineAmountInr.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-sm text-ink-700">{v.description}</p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500 pt-1">
                    <span>License: <strong className="font-mono">{v.licenseNumber}</strong></span>
                    <span>Plate: <strong className="font-mono">{v.vehiclePlate}</strong></span>
                    <span>Location: {v.location}</span>
                    <span>Date: {new Date(v.occurredAt).toLocaleString()}</span>
                  </div>

                  {v.onChainHash && (
                    <div className="text-xs font-mono text-ink-400 pt-1 break-all">
                      Hash: {v.onChainHash}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
