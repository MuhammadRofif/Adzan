import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { getNextPrayer, hijriDateLabel } from '../../utils/prayerTimes';

interface HeaderProps {
  setIsMobileOpen: (isOpen: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ setIsMobileOpen }) => {
  const { redeemHistory } = useApp();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const pending = redeemHistory.filter(r => r.status === 'pending').length;
  const next = getNextPrayer(now);

  return (
    <header className="bg-white/95 sticky top-0 z-30 border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <Button
          variant="ghost"
          className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Buka menu"
        >
          <Menu className="w-6 h-6" />
        </Button>

        <div className="flex items-center gap-4 ml-auto">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 leading-none mb-1">{hijriDateLabel(now)}</p>
            <p className="text-xs text-primary-600 font-medium">Berikutnya: {next.name} {next.label} WITA</p>
          </div>

          <div className="border-l border-gray-200 h-6" />

          <Link
            to="/admin/redeem"
            className="relative p-2 rounded-full hover:bg-gray-100"
            aria-label={pending > 0 ? `${pending} permintaan hadiah menunggu` : 'Tidak ada permintaan hadiah'}
            title={pending > 0 ? `${pending} permintaan hadiah menunggu` : 'Tidak ada permintaan hadiah'}
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {pending > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                {pending > 99 ? '99+' : pending}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};
