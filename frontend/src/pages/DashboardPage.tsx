import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { getMyLicense } from '../lib/license.api';
import { getViolations } from '../lib/violation.api';
import { getDashboardStats } from '../lib/audit.api';
import { License, Violation, DashboardStats } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();

  const [license, setLicense] = useState<License | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (user?.role === 'driver') {
          const [lic, vios] = await Promise.all([
            getMyLicense().catch(() => null),
            getViolations({ mine: true, limit: 5 }).catch(() => ({ violations: [] })),
          ]);
          setLicense(lic);
          setViolations(vios.violations || []);
        } else if (user?.role === 'officer') {
          const [vios, st] = await Promise.all([
            getViolations({ mine: true, limit: 10 }).catch(() => ({ violations: [] })),
            getDashboardStats().catch(() => null),
          ]);
          setViolations(vios.violations || []);
          setStats(st);
        } else if (user?.role === 'admin') {
          const st = await getDashboardStats().catch(() => null);
          setStats(st);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-lora text-2xl sm:text-3xl font-bold text-ink-950">
              Welcome back, {user?.profile?.fullName || user?.email}
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              Role:{' '}
              <span className="capitalize font-semibold text-teal-700">{user?.role}</span> ·
              ChainDrive Central Authority
            </p>
          </div>

          {/* System Status Banner */}
          <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Blockchain Verified Network
          </div>
        </div>

        {/* ── DRIVER DASHBOARD ────────────────────────────────────────── */}
        {user?.role === 'driver' && (
          <div className="space-y-6">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* License Card */}
              <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">🪪</span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      license?.status === 'issued'
                        ? 'bg-emerald-100 text-emerald-800'
                        : license?.status === 'applied'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-ink-100 text-ink-700'
                    }`}
                  >
                    {license?.status || 'No License'}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider">
                  Driving License
                </h3>
                <p className="text-xl font-bold text-ink-900 mt-1 font-mono">
                  {license?.licenseNumber || 'Not Issued Yet'}
                </p>
                <div className="mt-4">
                  {license ? (
                    <Link
                      to="/driver/license"
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                    >
                      View Digital License Card →
                    </Link>
                  ) : (
                    <Link
                      to="/driver/apply"
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                    >
                      Submit License Application →
                    </Link>
                  )}
                </div>
              </div>

              {/* Pending Fines Card */}
              <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">⚠️</span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-rose-100 text-rose-800 uppercase tracking-wider">
                    {violations.filter((v) => v.status === 'pending').length} Unpaid
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider">
                  Outstanding Violations
                </h3>
                <p className="text-xl font-bold text-ink-900 mt-1">
                  ₹
                  {violations
                    .filter((v) => v.status === 'pending')
                    .reduce((acc, v) => acc + (v.fineAmountInr || 0), 0)
                    .toLocaleString()}
                </p>
                <div className="mt-4">
                  <Link
                    to="/driver/violations"
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                  >
                    Manage &amp; Pay Citations →
                  </Link>
                </div>
              </div>

              {/* Dispute Support Card */}
              <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">⚖️</span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                    Dispute Center
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider">
                  Contest Citations
                </h3>
                <p className="text-sm text-ink-600 mt-1">
                  Dispute citations with photo evidence recorded to the blockchain ledger.
                </p>
                <div className="mt-4">
                  <Link
                    to="/driver/disputes"
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                  >
                    View Filed Disputes →
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Violations Table */}
            <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-card">
              <h2 className="font-lora text-lg font-semibold text-ink-900 mb-4">
                Recent Traffic Citations
              </h2>
              {violations.length === 0 ? (
                <p className="text-sm text-ink-500 py-6 text-center">
                  🎉 Clean driving record! No violations issued to your license.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-ink-100 text-xs text-ink-400 uppercase tracking-wider">
                        <th className="pb-3">Citation ID</th>
                        <th className="pb-3">Violation Type</th>
                        <th className="pb-3">Location</th>
                        <th className="pb-3">Fine (INR)</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-50">
                      {violations.slice(0, 5).map((v) => (
                        <tr key={v._id} className="hover:bg-ink-50/50">
                          <td className="py-3 font-mono font-semibold text-ink-900">
                            {v.violationId}
                          </td>
                          <td className="py-3 text-ink-800">{v.violationType}</td>
                          <td className="py-3 text-ink-600">{v.location}</td>
                          <td className="py-3 font-semibold text-ink-900">
                            ₹{v.fineAmountInr?.toLocaleString()}
                          </td>
                          <td className="py-3">
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
                          </td>
                          <td className="py-3 text-right">
                            <Link
                              to="/driver/violations"
                              className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                            >
                              Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── OFFICER DASHBOARD ───────────────────────────────────────── */}
        {user?.role === 'officer' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-card">
                <div className="text-2xl mb-4">✍️</div>
                <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider">
                  Quick Action
                </h3>
                <p className="text-sm text-ink-600 mt-1 mb-4">
                  Issue a new citation with license verification and cryptographic on-chain proof.
                </p>
                <Link
                  to="/officer/record"
                  className="inline-block px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  Record Violation →
                </Link>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-card">
                <div className="text-2xl mb-4">📁</div>
                <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider">
                  My Citations
                </h3>
                <p className="text-2xl font-bold text-ink-900 mt-1">{violations.length}</p>
                <Link
                  to="/officer/violations"
                  className="text-xs text-teal-600 hover:text-teal-700 font-semibold block mt-4"
                >
                  View All Issued Citations →
                </Link>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-card">
                <div className="text-2xl mb-4">🔍</div>
                <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider">
                  Verify License
                </h3>
                <p className="text-sm text-ink-600 mt-1 mb-4">
                  Check roadside validity and verify if driver's on-chain license is active.
                </p>
                <Link
                  to="/verify"
                  className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                >
                  Open Verification Tool →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── ADMIN DASHBOARD ─────────────────────────────────────────── */}
        {user?.role === 'admin' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-card">
                <span className="text-xs text-ink-500 uppercase tracking-wider font-semibold block">
                  Pending Applications
                </span>
                <span className="text-3xl font-bold text-ink-950 mt-2 block">
                  {stats?.licenses?.pending ?? 0}
                </span>
                <Link
                  to="/admin/applications"
                  className="text-xs text-teal-600 hover:text-teal-700 font-semibold mt-3 block"
                >
                  Review Applications →
                </Link>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-card">
                <span className="text-xs text-ink-500 uppercase tracking-wider font-semibold block">
                  Active Issued Licenses
                </span>
                <span className="text-3xl font-bold text-emerald-600 mt-2 block">
                  {stats?.licenses?.issued ?? 0}
                </span>
                <span className="text-xs text-ink-400 mt-3 block">
                  Total in system: {stats?.licenses?.total ?? 0}
                </span>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-card">
                <span className="text-xs text-ink-500 uppercase tracking-wider font-semibold block">
                  Active Disputes
                </span>
                <span className="text-3xl font-bold text-amber-600 mt-2 block">
                  {stats?.disputes?.pending ?? 0}
                </span>
                <Link
                  to="/admin/disputes"
                  className="text-xs text-teal-600 hover:text-teal-700 font-semibold mt-3 block"
                >
                  Resolve Disputes →
                </Link>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-card">
                <span className="text-xs text-ink-500 uppercase tracking-wider font-semibold block">
                  Fine Revenue Settled
                </span>
                <span className="text-3xl font-bold text-purple-600 mt-2 block">
                  ₹{(stats?.financials?.totalRevenueInr ?? 0).toLocaleString()}
                </span>
                <span className="text-xs text-ink-400 mt-3 block">
                  {stats?.financials?.totalTransactions ?? 0} on-chain payments
                </span>
              </div>
            </div>

            {/* Quick Management Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                to="/admin/applications"
                className="bg-white p-6 rounded-2xl border border-ink-100 shadow-card hover:border-teal-500 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  📋
                </div>
                <div>
                  <h3 className="font-semibold text-ink-900">License Approvals</h3>
                  <p className="text-xs text-ink-500 mt-0.5">Approve, reject, and mint on-chain</p>
                </div>
              </Link>

              <Link
                to="/admin/disputes"
                className="bg-white p-6 rounded-2xl border border-ink-100 shadow-card hover:border-teal-500 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  ⚖️
                </div>
                <div>
                  <h3 className="font-semibold text-ink-900">Dispute Resolution</h3>
                  <p className="text-xs text-ink-500 mt-0.5">Adjudicate driver citation appeals</p>
                </div>
              </Link>

              <Link
                to="/admin/audit"
                className="bg-white p-6 rounded-2xl border border-ink-100 shadow-card hover:border-teal-500 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  📜
                </div>
                <div>
                  <h3 className="font-semibold text-ink-900">System Audit Trail</h3>
                  <p className="text-xs text-ink-500 mt-0.5">Immutable activity logs &amp; security</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
