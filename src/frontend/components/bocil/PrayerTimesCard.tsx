import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '../../utils/cn';
import {
  MASJID_LOCATION,
  formatCountdown,
  getNextPrayer,
  getPrayerTimes,
  masjidDayName,
} from '../../utils/prayerTimes';

const PRAYER_EMOJI: Record<string, string> = {
  Shubuh: '🌅', Zhuhur: '☀️', Ashar: '🌤️', Magrib: '🌇', Isya: '🌙',
};

/**
 * Jadwal salat hari ini + hitung mundur adzan berikutnya.
 * Detik berdetak hanya di komponen ini, jadi halaman lain tidak ikut re-render.
 */
export const PrayerTimesCard: React.FC<{
  schedule: Record<string, Record<string, string>>;
  className?: string;
}> = ({ schedule, className }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Jadwal hanya dihitung ulang saat tanggal berganti (bukan tiap detik).
  const dayKey = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' });
  const times = useMemo(() => getPrayerTimes(now), [dayKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = getNextPrayer(now);
  const msLeft = next.at.getTime() - now.getTime();
  const soon = msLeft <= 10 * 60_000;
  const muadzin = schedule[masjidDayName(next.at)]?.[next.name];
  const hasMuadzin = muadzin && !['Kosong', 'LOCKED'].includes(muadzin);

  return (
    <section
      className={cn('bocil-prayer-card', className)}
      aria-label="Jadwal salat hari ini"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-sky-700/80">Adzan berikutnya</p>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-800 leading-tight">
            {PRAYER_EMOJI[next.name]} {next.name} <span className="text-sky-600">{next.label}</span>
          </p>
          {hasMuadzin && (
            <p className="text-sm font-bold text-slate-600 mt-0.5">
              Petugas: <span className="text-mint-700">{muadzin}</span> 🎙️
            </p>
          )}
        </div>
        <div
          className={cn(
            'shrink-0 rounded-2xl px-3 py-2 text-center min-w-[104px]',
            soon ? 'bg-sun-300 text-sun-700 animate-gentle-pulse' : 'bg-sky-500 text-white',
          )}
          role="timer"
          aria-live="off"
        >
          <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">{soon ? 'Siap-siap!' : 'Hitung mundur'}</p>
          <p className="font-heading text-xl font-extrabold tabular-nums leading-tight">{formatCountdown(msLeft)}</p>
        </div>
      </div>

      <ol className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {times.map((p) => {
          const isNext = p.name === next.name && p.at.getTime() === next.at.getTime();
          const passed = p.at.getTime() <= now.getTime();
          return (
            <li
              key={p.name}
              className={cn(
                'rounded-2xl py-2 px-1 text-center border-2 transition-colors',
                isNext
                  ? 'bg-white border-sky-400 shadow-toy'
                  : passed
                    ? 'bg-white/50 border-transparent text-slate-400'
                    : 'bg-white/80 border-transparent',
              )}
              aria-current={isNext ? 'true' : undefined}
            >
              <span className="block text-lg leading-none" aria-hidden>{PRAYER_EMOJI[p.name]}</span>
              <span className={cn('block text-[11px] sm:text-xs font-extrabold mt-1', isNext ? 'text-sky-700' : '')}>{p.name}</span>
              <span className={cn('block font-heading text-sm sm:text-base font-extrabold tabular-nums', isNext ? 'text-slate-800' : '')}>{p.label}</span>
            </li>
          );
        })}
      </ol>
      <p className="text-[10px] text-slate-500 mt-3 text-center">
        📍 {MASJID_LOCATION.name} · {MASJID_LOCATION.tzLabel} · perkiraan metode Kemenag
      </p>
    </section>
  );
};
