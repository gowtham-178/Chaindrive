import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

interface NavItem {
  label: string;
  to: string;
  icon: string;
  roles: string[];
}

const navItems: NavItem[] = [
  // Admin
  { label: 'Dashboard', to: '/dashboard', icon: '◈', roles: ['admin', 'officer', 'driver'] },
  { label: 'Applications', to: '/admin/applications', icon: '📋', roles: ['admin'] },
  { label: 'All Disputes', to: '/admin/disputes', icon: '⚖️', roles: ['admin'] },
  { label: 'Audit Log', to: '/admin/audit', icon: '📜', roles: ['admin'] },
  // Officer
  { label: 'Record Violation', to: '/officer/record', icon: '✍️', roles: ['officer'] },
  { label: 'My Records', to: '/officer/violations', icon: '📁', roles: ['officer'] },
  // Driver
  { label: 'My License', to: '/driver/license', icon: '🪪', roles: ['driver'] },
  { label: 'My Violations', to: '/driver/violations', icon: '⚠️', roles: ['driver'] },
  { label: 'Disputes', to: '/driver/disputes', icon: '🔄', roles: ['driver'] },
  { label: 'Apply for License', to: '/driver/apply', icon: '📝', roles: ['driver'] },
];

function formatAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { account, isConnected, isCorrectNetwork, connectWallet } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNav = navItems.filter((item) => item.roles.includes(user?.role ?? ''));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleColor = {
    admin: 'bg-purple-100 text-purple-900 border border-purple-300 font-bold',
    officer: 'bg-blue-100 text-blue-900 border border-blue-300 font-bold',
    driver: 'bg-teal-100 text-teal-900 border border-teal-300 font-bold',
  }[user?.role ?? 'driver'];

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white text-ink-950 border-r border-ink-200 flex flex-col shadow-sm transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 px-6 flex items-center border-b border-ink-200 bg-white">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0 shadow-xs">
            CD
          </div>
          <span className="font-lora font-bold text-ink-950 text-xl tracking-tight">ChainDrive</span>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-ink-200 bg-ink-50/70">
          <p className="text-sm font-bold text-black truncate">{user?.profile.fullName || user?.email}</p>
          <p className="text-xs text-ink-700 font-semibold truncate mt-0.5">{user?.email}</p>
          <span className={`mt-2 inline-block text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-full ${roleColor}`}>
            {user?.role}
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {visibleNav.map((item) => {
              const active = location.pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                      active
                        ? 'bg-teal-600 text-white font-bold shadow-xs'
                        : 'text-ink-900 hover:text-black hover:bg-ink-100 font-bold'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-ink-200 space-y-1.5 bg-ink-50/40">
          <Link
            to="/verify"
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-bold text-ink-900 hover:bg-ink-100 hover:text-black transition-colors"
          >
            <span>🔍</span> Verify License
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-bold text-red-700 hover:bg-red-50 hover:text-red-900 transition-colors"
          >
            <span>🚪</span> Sign out
          </button>
        </div>
      </aside>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-ink-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <button
            className="lg:hidden p-2 rounded-lg text-ink-800 hover:bg-ink-100 text-xl font-bold"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="flex-1" />

          {/* Wallet button */}
          {isConnected ? (
            <div className="flex items-center gap-2">
              {!isCorrectNetwork && (
                <span className="text-xs text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full font-bold">
                  ⚠️ Wrong network
                </span>
              )}
              <span className="text-xs font-mono font-bold bg-teal-50 text-teal-900 px-3.5 py-1.5 rounded-full border border-teal-300">
                {formatAddress(account!)}
              </span>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="text-xs sm:text-sm px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-black transition-all font-bold flex items-center gap-2 shadow-xs"
            >
              <span>🦊</span> Connect Wallet
            </button>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
