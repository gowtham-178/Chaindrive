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
    admin: 'bg-purple-100 text-purple-700',
    officer: 'bg-blue-100 text-blue-700',
    driver: 'bg-teal-100 text-teal-700',
  }[user?.role ?? 'driver'];

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-ink-950 text-white flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 px-6 flex items-center border-b border-ink-800">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0">
            CD
          </div>
          <span className="font-lora font-semibold text-white text-lg">ChainDrive</span>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-ink-800">
          <p className="text-sm font-medium text-white truncate">{user?.profile.fullName}</p>
          <p className="text-xs text-ink-400 truncate mt-0.5">{user?.email}</p>
          <span className={`mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${roleColor}`}>
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-teal-600 text-white'
                        : 'text-ink-300 hover:bg-ink-800 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-ink-800 space-y-2">
          <Link
            to="/verify"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-400 hover:text-white hover:bg-ink-800 transition-colors"
          >
            <span>🔍</span> Verify License
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-400 hover:text-white hover:bg-red-900/50 transition-colors"
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
            className="lg:hidden p-2 rounded-lg text-ink-600 hover:bg-ink-100"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="flex-1" />

          {/* Wallet button */}
          {isConnected ? (
            <div className="flex items-center gap-2">
              {!isCorrectNetwork && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-medium">
                  ⚠️ Wrong network
                </span>
              )}
              <span className="text-xs font-mono bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full border border-teal-200">
                {formatAddress(account!)}
              </span>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="text-sm px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors font-medium flex items-center gap-2"
            >
              🦊 Connect Wallet
            </button>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
