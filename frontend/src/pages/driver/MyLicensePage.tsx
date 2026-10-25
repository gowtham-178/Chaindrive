import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyLicense } from '../../lib/license.api';
import { License } from '../../types';

export default function MyLicensePage() {
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getMyLicense();
        setLicense(res);
      } catch (err) {
        console.error('Failed to load license', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center text-ink-500">Loading license data...</div>
      </DashboardLayout>
    );
  }

  if (!license) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12 bg-white rounded-2xl border border-ink-100 p-8 shadow-card">
          <span className="text-4xl block mb-4">🪪</span>
          <h2 className="font-lora text-2xl font-bold text-ink-950">No Driving License Found</h2>
          <p className="text-sm text-ink-600 mt-2 max-w-md mx-auto">
            You have not applied for a digital driving license yet. Submit an application to get verified on-chain.
          </p>
          <Link
            to="/driver/apply"
            className="inline-block mt-6 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
          >
            Apply for License Now →
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isIssued = license.status === 'issued';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="font-lora text-2xl sm:text-3xl font-bold text-ink-950">
            Digital Driving License
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Official cryptographically verifiable credential issued by ChainDrive Authority.
          </p>
        </div>

        {/* ── DIGITAL LICENSE CARD (Government Document Style) ─────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-ink-950 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-teal-500/30">
          {/* Subtle Background Pattern */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-teal-500/30 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center font-bold text-teal-300">
                CD
              </div>
              <div>
                <span className="text-xs tracking-widest uppercase font-semibold text-teal-300 block">
                  Union Transport Authority
                </span>
                <h2 className="font-lora text-lg font-bold tracking-tight text-white">
                  Smart Driving License
                </h2>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                  isIssued
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {license.status}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Details */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <span className="text-xs text-teal-300/70 uppercase tracking-wider block font-semibold">
                  License Number
                </span>
                <span className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-white">
                  {license.licenseNumber || 'PENDING ISSUANCE'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-teal-300/70 uppercase tracking-wider block font-semibold">
                    Holder Name
                  </span>
                  <span className="text-sm font-semibold text-white block mt-0.5">
                    {license.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-teal-300/70 uppercase tracking-wider block font-semibold">
                    Date of Birth
                  </span>
                  <span className="text-sm text-teal-100 block mt-0.5">
                    {new Date(license.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-teal-300/70 uppercase tracking-wider block font-semibold">
                    Blood Group
                  </span>
                  <span className="text-sm font-semibold text-white block mt-0.5">
                    {license.bloodGroup}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-teal-300/70 uppercase tracking-wider block font-semibold">
                    Issued Date
                  </span>
                  <span className="text-sm text-teal-100 block mt-0.5">
                    {license.issuedAt ? new Date(license.issuedAt).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-teal-300/70 uppercase tracking-wider block font-semibold">
                    Valid Until
                  </span>
                  <span className="text-sm text-teal-100 block mt-0.5">
                    {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-teal-300/70 uppercase tracking-wider block font-semibold">
                  Vehicle Authorizations
                </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {license.vehicleClasses.map((cls) => (
                    <span
                      key={cls}
                      className="px-2.5 py-1 rounded-md bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-mono font-bold"
                    >
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: QR Code */}
            <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              {license.licenseNumber ? (
                <>
                  <div className="bg-white p-2 rounded-xl shadow-lg">
                    <QRCodeSVG
                      value={`http://localhost:3000/verify?number=${license.licenseNumber}`}
                      size={120}
                    />
                  </div>
                  <span className="text-xs font-mono text-teal-300 mt-2 block">Scan to Verify</span>
                </>
              ) : (
                <div className="text-xs text-teal-300/70 py-8">
                  QR will be generated upon on-chain minting
                </div>
              )}
            </div>
          </div>

          {/* Cryptographic Footer */}
          {license.onChainHash && (
            <div className="mt-6 pt-4 border-t border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="text-teal-300/70 flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                On-Chain Hash: {license.onChainHash.slice(0, 16)}…{license.onChainHash.slice(-12)}
              </div>
              <Link
                to={`/verify?number=${license.licenseNumber}`}
                className="text-teal-300 hover:text-white underline font-medium"
              >
                Inspect Public Proof →
              </Link>
            </div>
          )}
        </div>

        {/* Audit & Lifecycle Timeline */}
        <div className="bg-white rounded-2xl p-6 border border-ink-100 shadow-card">
          <h2 className="font-lora text-lg font-semibold text-ink-900 mb-4">
            License Audit &amp; Event History
          </h2>
          <div className="space-y-4">
            {(license.history || []).map((ev, i) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-ink-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-900">{ev.action}</span>
                    <span className="text-xs text-ink-400">
                      {new Date(ev.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {ev.notes && <p className="text-xs text-ink-600 mt-1">{ev.notes}</p>}
                  {ev.txHash && (
                    <span className="text-xs font-mono text-teal-600 block mt-1 break-all">
                      Tx: {ev.txHash}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
