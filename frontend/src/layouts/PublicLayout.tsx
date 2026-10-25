import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="border-b border-ink-200 bg-white/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              CD
            </div>
            <span className="font-lora font-bold text-ink-950 text-xl group-hover:text-teal-700 transition-colors">
              ChainDrive
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/verify"
              className="text-sm text-ink-900 hover:text-teal-700 transition-colors font-bold"
            >
              Verify License
            </Link>
            {user ? (
              <Link
                to="/dashboard"
                className="text-sm px-4 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-all font-bold shadow-xs flex items-center gap-2"
              >
                <span>◈</span> Dashboard ({user.profile?.fullName?.split(' ')[0] || user.email})
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-sm px-4 py-2 rounded-xl border-2 border-teal-600 text-teal-900 hover:bg-teal-50 transition-colors font-bold"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-ink-200 py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-ink-600 font-medium">
          © 2024 ChainDrive · Blockchain-powered traffic management
        </div>
      </footer>
    </div>
  );
}
