import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAuditLogs } from '../../lib/audit.api';
import { AuditLogItem } from '../../types';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [targetFilter, setTargetFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getAuditLogs({ targetType: targetFilter || undefined });
        setLogs(res.logs || []);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [targetFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-lora text-2xl sm:text-3xl font-bold text-ink-950">
              System Audit Trail &amp; Ledger
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              Immutable chronological record of administrative actions, license issuances, and payments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-ink-200 text-xs font-semibold focus:outline-none bg-white text-ink-800"
            >
              <option value="">All Entity Types</option>
              <option value="license">License Events</option>
              <option value="violation">Violation Events</option>
              <option value="dispute">Dispute Events</option>
              <option value="payment">Payment Events</option>
              <option value="user">User Events</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-ink-500">Loading audit trail...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-ink-500">No audit logs recorded yet.</div>
          ) : (
            <div className="divide-y divide-ink-100">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log._id;

                return (
                  <div key={log._id} className="p-5 hover:bg-ink-50/40 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-ink-900 bg-ink-100 px-2.5 py-1 rounded-md">
                          {log.action}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-semibold uppercase">
                          {log.targetType}
                        </span>
                        {log.targetId && (
                          <span className="text-xs text-ink-500 font-mono">
                            ID: {log.targetId}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-ink-400">
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                          className="text-teal-600 hover:underline font-semibold"
                        >
                          {isExpanded ? 'Hide Payload' : 'View Payload'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-ink-600">
                      <span>Actor: <strong className="text-ink-800">{log.actorRole || 'System'}</strong></span>
                      {log.actorEmail && <span>({log.actorEmail})</span>}
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    </div>

                    {isExpanded && log.details && (
                      <pre className="mt-3 p-3 bg-ink-950 text-teal-300 rounded-xl text-xs font-mono overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
