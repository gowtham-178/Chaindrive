import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';

export default function LandingPage() {
  const [quickSearch, setQuickSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/verify?number=${encodeURIComponent(quickSearch.trim())}`);
    }
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              Powered by Ethereum Smart Contracts
            </div>
            <h1 className="font-lora text-4xl sm:text-5xl lg:text-6xl font-bold text-ink-950 tracking-tight leading-[1.15]">
              Decentralized Driving License &amp; Traffic Authority
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-ink-600 leading-relaxed">
              ChainDrive marries blockchain data integrity with privacy-preserving off-chain storage.
              Instant license verification, tamper-proof violation logs, and transparent Web3 fine settlements.
            </p>

            {/* Quick License Verification Search */}
            <div className="mt-10 max-w-xl mx-auto">
              <form onSubmit={handleSearch} className="flex gap-2 p-2 bg-white rounded-2xl shadow-xl border border-ink-200">
                <input
                  type="text"
                  placeholder="Enter License Number (e.g. DL-IND-2026-102938)"
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none text-ink-900 placeholder:text-ink-400 font-mono"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  Verify Now
                </button>
              </form>
              <p className="text-xs text-ink-400 mt-2">
                Public verification does not require wallet connection or account sign-in
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl bg-ink-900 hover:bg-ink-800 text-white text-sm font-semibold transition-all shadow-md"
              >
                Create Driver Account
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl bg-white hover:bg-ink-50 border border-ink-200 text-ink-800 text-sm font-semibold transition-all shadow-sm"
              >
                Sign In to Portal
              </Link>
            </div>
          </div>

          {/* Pillars Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-ink-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-2xl mb-5">
                🪪
              </div>
              <h2 className="font-lora text-xl font-semibold text-ink-900 mb-2">
                Tamper-Proof License Registry
              </h2>
              <p className="text-sm text-ink-600 leading-relaxed">
                Personal identity remains strictly off-chain in encrypted MongoDB, while cryptographic keccak256 hashes are permanently minted on-chain for instant zero-trust verification.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-ink-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl mb-5">
                ⚡
              </div>
              <h2 className="font-lora text-xl font-semibold text-ink-900 mb-2">
                MetaMask Fine Payments
              </h2>
              <p className="text-sm text-ink-600 leading-relaxed">
                Pay traffic fines straight through your Web3 wallet in real-time. Automated ReentrancyGuard contracts ensure exact amounts, no double charges, and instant receipt generation.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-ink-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl mb-5">
                ⚖️
              </div>
              <h2 className="font-lora text-xl font-semibold text-ink-900 mb-2">
                On-Chain Dispute Mechanism
              </h2>
              <p className="text-sm text-ink-600 leading-relaxed">
                Drivers can dispute unjust citations with photographic evidence. Admin resolution decisions are recorded on-chain in an immutable audit ledger.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
