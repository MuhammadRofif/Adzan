import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Toast } from '../ui/Toast';

const bocilNavItems = [
  { name: 'Dashboard', href: '/', emoji: '🏠' },
  { name: 'Quiz', href: '/quiz', emoji: '📝' },
  { name: 'Hadiah', href: '/redeem', emoji: '🎁' },
];

export const BocilLayout: React.FC = () => {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const hijriDate = '24 Syaban 1445 H'; // mock
  const timeString = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40 font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-emerald-100 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <span className="text-white text-lg sm:text-xl">🕌</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-heading font-bold text-lg text-gray-900 leading-tight">
                Adzan<span className="text-emerald-600">Challenge</span>
              </h1>
              <p className="text-[10px] text-gray-400">Dashboard Bocil Masjid</p>
            </div>
            <h1 className="sm:hidden font-heading font-bold text-base text-gray-900">
              Adzan<span className="text-emerald-600">C</span>
            </h1>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {bocilNavItems.map(item => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) => cn(
                  'flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                )}
              >
                <span className="text-base sm:text-lg">{item.emoji}</span>
                <span className="hidden sm:inline">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-gray-900">{hijriDate}</p>
              <p className="text-[10px] text-emerald-600 font-medium">{timeString}</p>
            </div>
            <a
              href="/login"
              className="text-[10px] sm:text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              🔒 Admin
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Toast Notifications */}
      <Toast />

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-4 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-gray-400">
            🕌 AdzanChallenge • Semangat beribadah, bocil hebat! 💪
          </p>
        </div>
      </footer>
    </div>
  );
};
