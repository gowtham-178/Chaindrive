import { Link } from 'react-router-dom';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="border-b border-ink-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
              CD
            </div>
            <span className="font-lora font-semibold text-ink-900 text-lg group-hover:text-teal-600 transition-colors">
              ChainDrive
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/verify"
              className="text-sm text-ink-600 hover:text-teal-600 transition-colors font-medium"
            >
              Verify License
            </Link>
            <Link
              to="/login"
              className="text-sm px-4 py-2 rounded-lg border border-teal-600 text-teal-600 hover:bg-teal-50 transition-colors font-medium"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-ink-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-ink-500">
          © 2024 ChainDrive · Blockchain-powered traffic management
        </div>
      </footer>
    </div>
  );
}
