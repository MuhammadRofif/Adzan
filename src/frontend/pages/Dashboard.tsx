import React, { useState, useEffect, useMemo } from 'react';
import { Users, Target, Award, Clock, ArrowUpRight, ArrowDownRight, TrendingUp, CalendarDays, Mic, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/index';
import { cn } from '../utils/cn';
import { supabase } from '../services/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getPangkat } from '../../shared/types';

const ATTITUDES = [
  { label: 'Bagus', points: 5, color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { label: 'Cukup Bagus', points: 3, color: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
  { label: 'Ribut', points: 1, color: 'border-red-300 bg-red-50 text-red-700' },
];

export const Dashboard: React.FC = () => {
  const { participants, points, adzanLog, attendanceLog, recordAttendance, recordAdzan, endSeason, quizAttempts, seasonHistory, allSeasons } = useApp();

  const getPastSeasonBadges = (participantId: string | number) => {
    const pastWins = seasonHistory.filter(h => String(h.participantId) === String(participantId));
    if (pastWins.length === 0) return [];
    return pastWins.map(w => {
      const season = allSeasons.find(s => s.id === w.seasonId);
      const match = season?.name?.match(/\d+/);
      const seasonNum = match ? `S${match[0]}` : 'S1';
      const pLevel = getPangkat(w.finalPoints);
      const title = pLevel.current.title;
      if (w.badge === 'gold') return { emoji: '🏆', label: `${title} (${seasonNum})` };
      if (w.badge === 'silver') return { emoji: '🥈', label: `${title} (${seasonNum})` };
      if (w.badge === 'bronze') return { emoji: '🥉', label: `${title} (${seasonNum})` };
      return null;
    }).filter(Boolean) as { emoji: string; label: string }[];
  };

  const [attendanceModal, setAttendanceModal] = useState(false);
  const [adzanModal, setAdzanModal] = useState(false);
  const [attParticipant, setAttParticipant] = useState('');
  const [adzParticipant, setAdzParticipant] = useState('');
  const [adzAttitude, setAdzAttitude] = useState('Bagus');
  const [showAllPerformers, setShowAllPerformers] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('semua');

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    [...adzanLog, ...attendanceLog].forEach(log => {
      if (log.date) {
        months.add(log.date.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(months).sort(); // Ascending (May, June, July)
  }, [adzanLog, attendanceLog]);

  const formatMonth = (yyyyMM: string) => {
    const [y, m] = yyyyMM.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  };

  // --- NEW AGGREGATED STATS LOGIC ---
  const [chartFilter, setChartFilter] = useState<'semua'|'adzan'|'sholawat'|'attendance'|'quiz'>('semua');

  // Gunakan data real dari context
  const allLogs = useMemo(() => {
    let logs = [
      ...adzanLog.map(d => ({ date: d.date, type: d.adzanPoints === 8 ? 'sholawat' as const : 'adzan' as const })),
      ...attendanceLog.map(d => ({ date: d.date, type: 'attendance' as const })),
      ...quizAttempts.map(d => ({ date: new Date(d.completedAt).toISOString(), type: 'quiz' as const }))
    ];
    if (selectedMonth !== 'semua') {
      logs = logs.filter(log => log.date && log.date.startsWith(selectedMonth));
    }
    return logs;
  }, [adzanLog, attendanceLog, quizAttempts, selectedMonth]);

  const filteredLogs = useMemo(() => {
    if (chartFilter === 'semua') return allLogs;
    return allLogs.filter(log => log.type === chartFilter);
  }, [allLogs, chartFilter]);

  const { counts, last30DaysData, monthlyData } = useMemo(() => {
    let refDate = new Date();
    if (selectedMonth !== 'semua') {
      const [y, m] = selectedMonth.split('-');
      // Akhir dari bulan yang dipilih
      refDate = new Date(parseInt(y), parseInt(m), 0);
      
      const now = new Date();
      // Jika bulan yang dipilih adalah bulan ini, gunakan tanggal hari ini
      if (refDate.getMonth() === now.getMonth() && refDate.getFullYear() === now.getFullYear()) {
        refDate = now;
      }
    }

    const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
    const getStartOfWeek = (d: Date) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setHours(0,0,0,0) + diff * 86400000);
    };

    const today = refDate;
    const yesterday = new Date(refDate); yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = getStartOfWeek(refDate);
    const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart); lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    
    const thisMonth = refDate.getMonth();
    const thisYear = refDate.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    const lastYear = thisYear - 1;

    let cnts = {
      today: 0, yesterday: 0,
      thisWeek: 0, lastWeek: 0,
      thisMonth: 0, lastMonth: 0,
      thisYear: 0, lastYear: 0,
      allTime: filteredLogs.length
    };

    const d30: { name: string, fullDate: Date, jumlah: number }[] = [];
    let chartStartDate = new Date(refDate);
    chartStartDate.setDate(chartStartDate.getDate() - 29); // Default 30 days

    if (selectedMonth === 'semua' || selectedMonth.startsWith('2026-07')) {
      const julyFirst = new Date(2026, 6, 1); // 1 Juli 2026
      if (julyFirst < refDate) {
        chartStartDate = julyFirst;
      }
    } else {
      const [y, m] = selectedMonth.split('-');
      chartStartDate = new Date(parseInt(y), parseInt(m) - 1, 1);
    }

    const currentDay = new Date(chartStartDate);
    while (currentDay <= refDate) {
      d30.push({
        name: currentDay.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        fullDate: new Date(currentDay),
        jumlah: 0
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }

    const mDataMap = new Map<string, number>();

    filteredLogs.forEach(log => {
      const d = new Date(log.date);
      
      if (isSameDay(d, today)) cnts.today++;
      if (isSameDay(d, yesterday)) cnts.yesterday++;
      
      if (d >= thisWeekStart && d <= today) cnts.thisWeek++;
      if (d >= lastWeekStart && d <= lastWeekEnd) cnts.lastWeek++;
      
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear && d <= today) cnts.thisMonth++;
      if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) cnts.lastMonth++;
      
      if (d.getFullYear() === thisYear && d <= today) cnts.thisYear++;
      if (d.getFullYear() === lastYear) cnts.lastYear++;

      // 30 Days chart relative to refDate
      const diffTime = refDate.getTime() - d.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        const target = d30.find(item => isSameDay(item.fullDate, d));
        if (target) target.jumlah++;
      }

      // Monthly chart
      const monthKey = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });
      mDataMap.set(monthKey, (mDataMap.get(monthKey) || 0) + 1);
    });

    const mData = Array.from(mDataMap.entries())
      .map(([name, jumlah]) => {
         const [mStr, yStr] = name.split(' ');
         return { name, jumlah, timestamp: new Date(`1 ${mStr} ${yStr}`).getTime() };
      })
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-12);

    // If a specific month is selected, the "monthlyData" chart will only have 1 bar natively.
    // That's correct since we only have data for that month in filteredLogs.
    return { counts: cnts, last30DaysData: d30, monthlyData: mData };
  }, [filteredLogs, selectedMonth]);

  const getFilterCount = (id: string) => {
    const p = points[id];
    if (!p) return 0;
    switch (chartFilter) {
      case 'adzan': return p.adzanCount || 0;
      case 'sholawat': return p.sholawatIqomahCount || 0;
      case 'attendance': return p.attendanceCount || 0;
      case 'quiz': return p.quizCount || 0;
      default: return (p.adzanCount || 0) + (p.sholawatIqomahCount || 0) + (p.attendanceCount || 0) + (p.quizCount || 0);
    }
  };

  const allPerformers = [...participants]
    .filter(p => p.status === 'aktif')
    .sort((a, b) => {
      if (chartFilter === 'semua') {
        return (points[b.id]?.grossTotal ?? 0) - (points[a.id]?.grossTotal ?? 0);
      }
      return getFilterCount(b.id) - getFilterCount(a.id);
    });
  const topFive = allPerformers.slice(0, 5);
  const recentActivity = useMemo(() => {
    let combined = [...adzanLog, ...attendanceLog];
    if (selectedMonth !== 'semua') {
      combined = combined.filter(log => log.date && log.date.startsWith(selectedMonth));
    }
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [adzanLog, attendanceLog, selectedMonth]);

  const statCards = [
    { title: 'Hari Ini', current: counts.today, prev: counts.yesterday, prevLabel: 'Kemarin' },
    { title: 'Pekan Ini', current: counts.thisWeek, prev: counts.lastWeek, prevLabel: 'Pekan Lalu' },
    { title: 'Bulan Ini', current: counts.thisMonth, prev: counts.lastMonth, prevLabel: 'Bulan Lalu' },
    { title: 'Tahun Ini', current: counts.thisYear, prev: counts.lastYear, prevLabel: 'Tahun Lalu' },
  ];

  // Cek apakah bulan yang dipilih adalah bulan saat ini
  const isCurrentMonth = useMemo(() => {
    if (selectedMonth === 'semua') return true;
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return selectedMonth === currentYM;
  }, [selectedMonth]);

  // Rekap per jenis aktivitas untuk bulan yang dipilih
  const monthlyRecap = useMemo(() => {
    let adzanCount = 0, sholawatCount = 0, attendanceCount = 0, quizCount = 0;
    allLogs.forEach(log => {
      if (log.type === 'adzan') adzanCount++;
      else if (log.type === 'sholawat') sholawatCount++;
      else if (log.type === 'attendance') attendanceCount++;
      else if (log.type === 'quiz') quizCount++;
    });
    return { adzanCount, sholawatCount, attendanceCount, quizCount };
  }, [allLogs]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Dashboard Season 1</h1>
          <p className="page-subtitle">Pantau statistik adzan dan kehadiran peserta untuk Season 1</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="input text-sm py-2 px-3 pr-8 min-w-[140px] font-medium"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          >
            <option value="semua">Semua Waktu</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{formatMonth(m)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 bg-gray-100/80 p-1.5 rounded-xl w-full sm:w-fit border border-gray-200/50">
            {(['semua', 'adzan', 'sholawat', 'attendance', 'quiz'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setChartFilter(tab)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-bold transition-all capitalize",
                  chartFilter === tab ? "bg-white text-primary-600 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                )}
              >
                {tab === 'attendance' ? 'Latihan' : tab === 'sholawat' ? 'Sholawat+Iqomah' : tab === 'quiz' ? 'Quiz' : tab}
              </button>
            ))}
          </div>

          {/* Stat Cards - Rekap bulan lalu vs hari ini/pekan/bulan */}
          {isCurrentMonth ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {statCards.map(s => (
                <div key={s.title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-gray-500 mb-1">{s.title}</p>
                  <p className="text-3xl font-black text-gray-900 mb-2">{s.current}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                      {s.prev} <span className="font-normal text-gray-400">{s.prevLabel.toLowerCase()}</span>
                    </span>
                  </div>
                </div>
              ))}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 shadow-sm text-white md:col-span-1 col-span-2 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80 mb-1">Semua Waktu</p>
                  <p className="text-3xl font-black mb-2">{counts.allTime}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/70">
                  <Target className="w-4 h-4" /> Total Aktivitas
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { title: 'Adzan', count: monthlyRecap.adzanCount, icon: '📢', color: 'from-blue-500 to-blue-600' },
                { title: 'Sholawat+Iqomah', count: monthlyRecap.sholawatCount, icon: '📿', color: 'from-purple-500 to-purple-600' },
                { title: 'Latihan Hadir', count: monthlyRecap.attendanceCount, icon: '✅', color: 'from-emerald-500 to-emerald-600' },
                { title: 'Quiz', count: monthlyRecap.quizCount, icon: '🧠', color: 'from-amber-500 to-amber-600' },
              ].map(s => (
                <div key={s.title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-2xl mb-1">{s.icon}</p>
                  <p className="text-sm font-medium text-gray-500 mb-1">{s.title}</p>
                  <p className="text-3xl font-black text-gray-900">{s.count}×</p>
                </div>
              ))}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 shadow-sm text-white md:col-span-1 col-span-2 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80 mb-1">Total Aktivitas</p>
                  <p className="text-3xl font-black mb-2">{counts.allTime}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/70">
                  <Target className="w-4 h-4" /> {formatMonth(selectedMonth)}
                </div>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 font-heading">Grafik Aktivitas</h3>
                  <p className="text-xs text-gray-500">30 Hari Terakhir</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last30DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorJumlah" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={20} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="jumlah" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorJumlah)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 font-heading">Grafik Per Bulan</h3>
                  <p className="text-xs text-gray-500">12 Bulan Terakhir</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="jumlah" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      {/* Main grid (Old layout for Leaderboard & Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-heading">Top Performers</h2>
              <p className="text-sm text-gray-500">Musim Ini</p>
            </div>
            <Award className="w-5 h-5 text-primary-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Peserta</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Aktivitas</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topFive.map((p, i) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={cn('w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold',
                        i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'text-gray-400'
                      )}>{i + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">{p.nama.charAt(0)}</div>
                        <span className="font-medium text-gray-900 flex items-center gap-1.5">
                          {p.nama}
                          {getPastSeasonBadges(p.id).map((b, idx) => (
                           <span key={idx} title={b.label} className="inline-flex items-center text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded-md font-bold shadow-sm select-none">
                             {b.emoji} {b.label}
                           </span>
                         ))}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{getFilterCount(p.id)}×</td>
                    <td className="px-6 py-4 font-bold text-primary-600">{points[p.id]?.grossTotal ?? 0} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-center">
              <Button onClick={() => setShowAllPerformers(true)} variant="outline" className="text-sm">
                Lihat Keseluruhan Peserta
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="space-y-6">
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 font-heading">Aktivitas Terbaru</h3>
                <p className="text-sm text-gray-500">{selectedMonth === 'semua' ? 'Season 1' : formatMonth(selectedMonth)}</p>
              </div>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            <div className="p-4 space-y-4">
              {recentActivity.map((log: any, idx: number) => (
                <div key={idx} className="flex gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                    'attitude' in log ? 'bg-primary-100 text-primary-600' : 'bg-emerald-100 text-emerald-600'
                  )}>
                    {'attitude' in log ? <Mic className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{log.participantName}</p>
                    <p className="text-xs text-gray-500 mb-1">
                      {'attitude' in log ? `Adzan ${log.prayerTime} • Sikap: ${log.attitude}` : `Absen ${log.prayerTime}`}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-center text-gray-500 py-8 text-sm">Belum ada aktivitas</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Modal */}
      <Modal isOpen={attendanceModal} onClose={() => { setAttendanceModal(false); setAttParticipant(''); }} title="Catat Latihan & Sikap Bagus"
        footer={<>
          <Button onClick={() => { if (attParticipant) { recordAttendance(attParticipant, ''); setAttendanceModal(false); setAttParticipant(''); } }} className="w-full sm:w-auto sm:ml-3" disabled={!attParticipant}>Simpan</Button>
          <Button variant="ghost" onClick={() => { setAttendanceModal(false); setAttParticipant(''); }} className="mt-3 sm:mt-0 w-full sm:w-auto">Batal</Button>
        </>}
      >
        <div className="space-y-4">
          <Select label="Nama Peserta" value={attParticipant} onChange={e => setAttParticipant(e.target.value)}>
            <option value="">Pilih Peserta...</option>
            {participants.filter(p => p.status === 'aktif').map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </Select>
        </div>
      </Modal>

      {/* Adzan Modal */}
      <Modal isOpen={adzanModal} onClose={() => { setAdzanModal(false); setAdzParticipant(''); setAdzAttitude('Bagus'); }} title="Catat Adzan"
        footer={<>
          <Button onClick={() => { if (adzParticipant) { recordAdzan(adzParticipant, '', adzAttitude); setAdzanModal(false); setAdzParticipant(''); setAdzAttitude('Bagus'); } }} className="w-full sm:w-auto sm:ml-3" disabled={!adzParticipant}>Simpan (+10 Poin)</Button>
          <Button variant="ghost" onClick={() => { setAdzanModal(false); setAdzParticipant(''); setAdzAttitude('Bagus'); }} className="mt-3 sm:mt-0 w-full sm:w-auto">Batal</Button>
        </>}
      >
        <div className="space-y-4">
          <Select label="Nama Peserta" value={adzParticipant} onChange={e => setAdzParticipant(e.target.value)}>
            <option value="">Pilih Peserta...</option>
            {participants.filter(p => p.status === 'aktif').map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </Select>
          <div>
            <label className="label">Penilaian Sikap</label>
            <div className="grid grid-cols-3 gap-3">
              {ATTITUDES.map(att => (
                <button key={att.label} onClick={() => setAdzAttitude(att.label)}
                  className={cn('border-2 rounded-xl p-3 text-center transition-all duration-200', att.label === adzAttitude ? att.color + ' border-opacity-100' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300')}>
                  <span className="block text-sm font-semibold">{att.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
      <Modal isOpen={showAllPerformers} onClose={() => setShowAllPerformers(false)} title="Semua Peserta (Peringkat)" size="lg">
        <div className="overflow-x-auto max-h-[60vh] custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/60 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Peserta</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Aktivitas</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total Poin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allPerformers.map((p, i) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={cn('w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold',
                      i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'text-gray-400'
                    )}>{i + 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">{p.nama.charAt(0)}</div>
                      <span className="font-medium text-gray-900">{p.nama}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{getFilterCount(p.id)}×</td>
                  <td className="px-6 py-4 font-bold text-primary-600">{points[p.id]?.grossTotal ?? 0} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};
