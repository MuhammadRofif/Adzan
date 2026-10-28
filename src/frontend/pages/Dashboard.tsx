import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Clock, Flag, Gift, Mic, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { cn } from '../utils/cn';
import { getPangkat } from '../../shared/types';
import { getPrayerTimes, masjidDayName, PRAYER_NAMES } from '../utils/prayerTimes';

/** YYYY-MM-DD di zona waktu masjid (WITA). */
const witaDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' });

export const Dashboard: React.FC = () => {
  const {
    participants, points, adzanLog, attendanceLog, quizAttempts, redeemHistory,
    schedule, activeSeason, seasonHistory, allSeasons, endSeason,
  } = useApp();

  const [showAll, setShowAll] = useState(false);
  const [endModal, setEndModal] = useState(false);
  const [nextName, setNextName] = useState('');
  const [ending, setEnding] = useState(false);

  const now = new Date();
  const today = witaDate(now);
  const pendingRedeem = redeemHistory.filter(r => r.status === 'pending');
  const active = participants.filter(p => p.status === 'aktif');

  // ── Jadwal petugas hari ini + apakah adzannya sudah dicatat ──
  const todayDuty = useMemo(() => {
    const times = getPrayerTimes(now);
    const day = masjidDayName(now);
    const adzanToday = new Set(adzanLog.filter(a => a.date === today).map(a => String(a.participantId)));
    return PRAYER_NAMES.map((prayer, i) => {
      const name = schedule[day]?.[prayer];
      const kid = participants.find(p => p.nama.toLowerCase() === name?.toLowerCase());
      return {
        prayer,
        time: times[i].label,
        passed: times[i].at.getTime() < now.getTime(),
        name: name && !['Kosong', 'LOCKED'].includes(name) ? name : null,
        done: kid ? adzanToday.has(String(kid.id)) : false,
      };
    });
  }, [adzanLog, schedule, participants, today]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ringkasan aktivitas season berjalan ──
  const stats = useMemo(() => {
    const days = (d: string) => Math.floor((new Date(today).getTime() - new Date(d).getTime()) / 86_400_000);
    const quizDates = quizAttempts.filter(q => q.earnedPoints > 0).map(q => witaDate(new Date(q.completedAt)));
    const all = [...adzanLog.map(a => a.date), ...attendanceLog.map(a => a.date), ...quizDates];
    const perDay = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now.getTime() - (13 - i) * 86_400_000);
      const key = witaDate(d);
      return {
        key,
        label: d.toLocaleDateString('id-ID', { day: 'numeric', timeZone: 'Asia/Makassar' }),
        weekday: d.toLocaleDateString('id-ID', { weekday: 'narrow', timeZone: 'Asia/Makassar' }),
        adzan: adzanLog.filter(a => a.date === key).length,
        latihan: attendanceLog.filter(a => a.date === key).length,
        quiz: quizDates.filter(q => q === key).length,
      };
    });
    const sum = (k: 'adzanCount' | 'sholawatIqomahCount' | 'attendanceCount' | 'quizCount') =>
      Object.values(points).reduce((s, p) => s + (p[k] || 0), 0);
    return {
      today: all.filter(d => d === today).length,
      week: all.filter(d => days(d) >= 0 && days(d) < 7).length,
      season: all.length,
      adzan: sum('adzanCount'),
      sholawat: sum('sholawatIqomahCount'),
      latihan: sum('attendanceCount'),
      quiz: sum('quizCount'),
      perDay,
      maxDay: Math.max(1, ...perDay.map(d => d.adzan + d.latihan + d.quiz)),
    };
  }, [adzanLog, attendanceLog, quizAttempts, points, today]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Klasemen season (saldo), plus juara season lalu ──
  const ranking = useMemo(() => [...active].sort((a, b) => (points[b.id]?.total ?? 0) - (points[a.id]?.total ?? 0)), [active, points]);
  const pastBadges = (id: string | number) => seasonHistory
    .filter(h => String(h.participantId) === String(id) && h.badge)
    .map(h => {
      const n = allSeasons.find(s => s.id === h.seasonId)?.name.match(/\d+/)?.[0] ?? '?';
      return { emoji: h.badge === 'gold' ? '🏆' : h.badge === 'silver' ? '🥈' : '🥉', label: `Juara ${h.rank} S${n}` };
    });

  const recent = useMemo(() => [...adzanLog, ...attendanceLog]
    .sort((a, b) => (b.createdAt?.getTime() ?? new Date(b.date).getTime()) - (a.createdAt?.getTime() ?? new Date(a.date).getTime()))
    .slice(0, 8), [adzanLog, attendanceLog]);

  const seasonDay = activeSeason ? Math.floor((now.getTime() - activeSeason.startDate.getTime()) / 86_400_000) + 1 : 0;

  const handleEndSeason = async () => {
    if (!nextName.trim() || ending) return;
    setEnding(true);
    const res = await endSeason(nextName.trim());
    setEnding(false);
    if (res.success) { setEndModal(false); setNextName(''); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Dashboard {activeSeason?.name ?? ''}</h1>
          <p className="page-subtitle">
            {activeSeason
              ? `Mulai ${activeSeason.startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · hari ke-${seasonDay} · ${active.length} anak aktif`
              : 'Belum ada season aktif'}
          </p>
        </div>
        <Button variant="outline" leftIcon={<Flag className="w-4 h-4" />} onClick={() => setEndModal(true)} disabled={!activeSeason}>
          Akhiri Season
        </Button>
      </div>

      {/* Perlu tindakan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/redeem"
          className={cn('card p-5 flex items-center gap-4', pendingRedeem.length > 0 ? 'border-amber-300 bg-amber-50' : '')}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><Gift className="w-6 h-6" /></div>
          <div className="min-w-0">
            <p className="text-sm text-gray-500">Permintaan hadiah menunggu</p>
            <p className="text-2xl font-black text-gray-900">{pendingRedeem.length}</p>
            {pendingRedeem.length > 0 && (
              <p className="text-xs text-amber-700 font-semibold truncate">
                Tertua: {pendingRedeem[pendingRedeem.length - 1].requestedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} → Proses
              </p>
            )}
          </div>
        </Link>
        <div className="card p-5 md:col-span-2">
          <p className="text-sm text-gray-500 mb-3">Absen cepat (bisa banyak anak sekaligus)</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { action: 'adzan', label: 'Adzan', icon: '📢', pts: '+10' },
              { action: 'sholawat_iqomah', label: 'Sholawat + Iqomah', icon: '📿', pts: '+8' },
              { action: 'attendance', label: 'Latihan', icon: '🏃', pts: '+1–5' },
            ].map(a => (
              <Link
                key={a.action}
                to={`/admin/participants?action=${a.action}`}
                className="rounded-xl border-2 border-gray-100 hover:border-primary-300 hover:bg-primary-50 p-3 text-center transition-colors"
              >
                <span className="block text-2xl" aria-hidden>{a.icon}</span>
                <span className="block text-sm font-bold text-gray-900">{a.label}</span>
                <span className="block text-xs text-gray-500">{a.pts} poin</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Jadwal hari ini */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 font-heading">Petugas Adzan Hari Ini · {masjidDayName(now)}</h2>
          <Link to="/admin/schedule" className="text-sm text-primary-600 font-semibold hover:underline">Ubah jadwal</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {todayDuty.map(d => (
            <div
              key={d.prayer}
              className={cn('rounded-xl border p-3',
                d.done ? 'border-emerald-200 bg-emerald-50'
                  : d.passed && d.name ? 'border-amber-200 bg-amber-50'
                    : 'border-gray-100 bg-gray-50')}
            >
              <p className="text-xs text-gray-500">{d.prayer} · {d.time}</p>
              <p className="font-bold text-gray-900 truncate">{d.name ?? '—'}</p>
              <p className={cn('text-xs font-semibold', d.done ? 'text-emerald-700' : d.passed && d.name ? 'text-amber-700' : 'text-gray-400')}>
                {!d.name ? 'Tidak ada petugas' : d.done ? '✅ Sudah adzan hari ini' : d.passed ? '⏳ Belum dicatat' : 'Belum waktunya'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Statistik season + grafik 14 hari */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Hari ini', value: stats.today },
              { label: '7 hari', value: stats.week },
              { label: 'Season ini', value: stats.season },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-gray-50 p-3">
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 text-sm">
            {[
              { label: '📢 Adzan', value: stats.adzan },
              { label: '📿 Sholawat', value: stats.sholawat },
              { label: '🏃 Latihan', value: stats.latihan },
              { label: '🎮 Quiz', value: stats.quiz },
            ].map(s => (
              <div key={s.label} className="flex justify-between gap-2 whitespace-nowrap rounded-lg border border-gray-100 px-3 py-2">
                <span className="text-gray-600">{s.label}</span>
                <span className="font-bold text-gray-900">{s.value}×</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grafik batang ringan (CSS) — menggantikan recharts ±110 KB */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 font-heading">Aktivitas 14 Hari Terakhir</h2>
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-sky-500" />Adzan</span>
              <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />Latihan</span>
              <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-amber-400" />Quiz</span>
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-40" role="img" aria-label="Grafik aktivitas 14 hari terakhir">
            {stats.perDay.map(d => {
              const total = d.adzan + d.latihan + d.quiz;
              const h = (n: number) => `${(n / stats.maxDay) * 100}%`;
              return (
                <div key={d.key} className="flex-1 h-full flex flex-col justify-end items-center gap-1" title={`${d.key}: adzan ${d.adzan}, latihan ${d.latihan}, quiz ${d.quiz}`}>
                  <span className="text-[10px] text-gray-500 font-semibold">{total || ''}</span>
                  <div className="w-full flex flex-col justify-end rounded-t-md overflow-hidden bg-gray-50" style={{ height: '100%' }}>
                    <div className="bg-amber-400" style={{ height: h(d.quiz) }} />
                    <div className="bg-emerald-400" style={{ height: h(d.latihan) }} />
                    <div className="bg-sky-500" style={{ height: h(d.adzan) }} />
                  </div>
                  <span className={cn('text-[10px]', d.key === today ? 'font-bold text-gray-900' : 'text-gray-400')}>{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Klasemen & aktivitas terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900 font-heading">Klasemen {activeSeason?.name ?? ''}</h2>
              <p className="text-xs text-gray-500">Saldo season berjalan (sudah dikurangi hadiah)</p>
            </div>
            <Award className="w-5 h-5 text-primary-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">#</th>
                  <th className="px-4 py-2.5 text-left">Anak</th>
                  <th className="px-4 py-2.5 text-center" title="Adzan / Sholawat / Latihan / Quiz">📢 📿 🏃 🎮</th>
                  <th className="px-4 py-2.5 text-right">Saldo</th>
                  <th className="px-4 py-2.5 text-right hidden sm:table-cell" title="Termasuk poin akhir season-season lalu">Sepanjang masa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(showAll ? ranking : ranking.slice(0, 10)).map((p, i) => {
                  const pt = points[p.id];
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-bold text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">{p.nama}</span>
                        <span className="block text-xs text-gray-500">
                          {getPangkat(pt?.total ?? 0).current.emoji} {getPangkat(pt?.total ?? 0).current.title}
                          {pastBadges(p.id).map((b, j) => <span key={j} title={b.label} className="ml-1">{b.emoji}</span>)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 tabular-nums whitespace-nowrap">
                        {pt?.adzanCount ?? 0} · {pt?.sholawatIqomahCount ?? 0} · {pt?.attendanceCount ?? 0} · {pt?.quizCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary-600 tabular-nums">{pt?.total ?? 0}</td>
                      <td className="px-4 py-3 text-right text-gray-500 tabular-nums hidden sm:table-cell">{pt?.grossTotal ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {ranking.length > 10 && (
            <button onClick={() => setShowAll(v => !v)} className="w-full py-3 text-sm font-semibold text-primary-600 bg-gray-50 border-t border-gray-100 hover:bg-gray-100">
              {showAll ? 'Tampilkan 10 besar saja' : `Lihat semua ${ranking.length} anak`}
            </button>
          )}
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 font-heading">Aktivitas Terbaru</h2>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <ul className="p-3 space-y-1">
            {recent.map(log => {
              const isAdzan = 'attitude' in log;
              const label = isAdzan ? ((log as any).adzanPoints === 8 ? 'Sholawat + Iqomah' : 'Adzan') : 'Latihan';
              return (
                <li key={`${label}-${log.id}`} className="flex gap-3 p-2 rounded-xl hover:bg-gray-50">
                  <span className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', isAdzan ? 'bg-sky-100 text-sky-600' : 'bg-emerald-100 text-emerald-600')}>
                    {isAdzan ? <Mic className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{log.participantName}</p>
                    <p className="text-xs text-gray-500">
                      {label}{log.prayerTime ? ` ${log.prayerTime}` : ''} · {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </li>
              );
            })}
            {recent.length === 0 && <li className="text-center text-gray-500 py-8 text-sm">Belum ada aktivitas di season ini</li>}
          </ul>
        </div>
      </div>

      {/* Akhiri season */}
      <Modal
        isOpen={endModal}
        onClose={() => setEndModal(false)}
        title={`Akhiri ${activeSeason?.name ?? 'season'}?`}
        footer={<>
          <Button onClick={handleEndSeason} disabled={!nextName.trim() || ending} className="w-full sm:w-auto sm:ml-3">
            {ending ? 'Menyimpan...' : 'Akhiri & mulai season baru'}
          </Button>
          <Button variant="ghost" onClick={() => setEndModal(false)} className="mt-3 sm:mt-0 w-full sm:w-auto">Batal</Button>
        </>}
      >
        <div className="space-y-4 text-sm">
          <p className="text-gray-600">
            Klasemen akhir disimpan ke Hall of Fame dan saldo semua anak mulai dari 0 di season baru.
            Poin season ini tetap terhitung di "sepanjang masa". Tindakan ini tidak bisa dibatalkan.
          </p>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
            <p className="font-semibold text-amber-900 mb-1">Juara saat ini</p>
            {ranking.slice(0, 3).map((p, i) => (
              <p key={p.id} className="text-amber-800">{['🥇', '🥈', '🥉'][i]} {p.nama} — {points[p.id]?.total ?? 0} poin</p>
            ))}
            {pendingRedeem.length > 0 && (
              <p className="text-amber-700 mt-2">⚠️ Masih ada {pendingRedeem.length} permintaan hadiah pending — sebaiknya diproses dulu.</p>
            )}
          </div>
          <div>
            <label htmlFor="next-season" className="label">Nama season baru</label>
            <input id="next-season" className="input" placeholder="mis. Season 3" value={nextName} onChange={e => setNextName(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
};
