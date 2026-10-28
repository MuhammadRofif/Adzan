import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Toast } from '../ui/Toast';
import { hijriDateLabel } from '../../utils/prayerTimes';

const bocilNavItems = [
  { name: 'Beranda', href: '/', emoji: '🏠' },
  { name: 'Quiz', href: '/quiz', emoji: '🎮' },
  { name: 'Hadiah', href: '/redeem', emoji: '🎁' },
  { name: 'Juara', href: '/seasons', emoji: '🏆' },
];

export const BocilLayout: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const hijriDate = hijriDateLabel(currentTime);
  const timeString = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' });

  return (
    <div className="bocil-shell min-h-screen font-sans text-slate-800">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/95 border-b-2 border-sky-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 h-16">
          <NavLink to="/" className="flex items-center gap-2.5 min-w-0" aria-label="Beranda Adzan Challenge">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-mint-400 flex items-center justify-center shadow-toy shrink-0">
              <span className="text-xl" aria-hidden>🕌</span>
            </span>
            <span className="min-w-0">
              <span className="block font-heading font-extrabold text-lg leading-none text-slate-800">
                Adzan<span className="text-sky-500">Challenge</span>
              </span>
              <span className="block text-[11px] font-bold text-slate-500 truncate">{hijriDate || 'Bocil Masjid'}</span>
            </span>
          </NavLink>

          {/* Navigasi desktop/tablet */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Menu utama">
            {bocilNavItems.map(item => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) => cn(
                  'flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-extrabold transition-all duration-200',
                  isActive
                    ? 'bg-sky-500 text-white shadow-toy-sky'
                    : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                )}
              >
                <span className="text-lg" aria-hidden>{item.emoji}</span>
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-sun-100 text-sun-700 font-heading font-extrabold px-3 py-1.5 tabular-nums">
              🕐 {timeString}
            </span>
            <a
              href="/login"
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              🔒 Admin
            </a>
          </div>
        </div>
      </header>

      {/* Main Content — padding bawah memberi ruang untuk tab bar di HP */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-28 md:pb-10">
        <Outlet />
      </main>

      {/* Tab bar bawah (HP) — tombol besar mudah dijangkau jempol */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t-2 border-sky-100 pb-[env(safe-area-inset-bottom)]"
        aria-label="Menu utama"
      >
        <ul className="grid grid-cols-4">
          {bocilNavItems.map(item => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) => cn(
                  'flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] font-extrabold transition-colors',
                  isActive ? 'text-sky-600' : 'text-slate-500'
                )}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'text-2xl leading-none w-12 h-8 flex items-center justify-center rounded-full transition-all',
                        isActive ? 'bg-sky-100 scale-110' : ''
                      )}
                      aria-hidden
                    >
                      {item.emoji}
                    </span>
                    {item.name}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Toast Notifications */}
      <Toast />

      {/* Footer */}
      <footer className="hidden md:block border-t-2 border-sky-100 bg-white py-4">
        <p className="max-w-6xl mx-auto px-6 text-center text-xs font-bold text-slate-400">
          🕌 AdzanChallenge • Semangat beribadah, bocil hebat! 💪
        </p>
      </footer>
    </div>
  );
};
