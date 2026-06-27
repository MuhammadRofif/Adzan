import React, { useState, useEffect, useMemo } from 'react';
import { Users, Target, Award, Clock, ArrowUpRight, ArrowDownRight, TrendingUp, CalendarDays, Mic, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/index';
import { cn } from '../utils/cn';
import { supabase } from '../services/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const ATTITUDES = [
  { label: 'Bagus', points: 5, color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { label: 'Cukup Bagus', points: 3, color: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
  { label: 'Ribut', points: 1, color: 'border-red-300 bg-red-50 text-red-700' },
];

export const Dashboard: React.FC = () => {
  const { participants, points, adzanLog, attendanceLog, recordAttendance, recordAdzan, endSeason, quizAttempts } = useApp();

  const [attendanceModal, setAttendanceModal] = useState(false);
  const [adzanModal, setAdzanModal] = useState(false);
  const [attParticipant, setAttParticipant] = useState('');
  const [adzParticipant, setAdzParticipant] = useState('');
  const [adzAttitude, setAdzAttitude] = useState('Bagus');
  const [showAllPerformers, setShowAllPerformers] = useState(false);

  // --- NEW AGGREGATED STATS LOGIC ---
  const [chartFilter, setChartFilter] = useState<'semua'|'adzan'|'sholawat'|'attendance'|'quiz'>('semua');

  // Gunakan data real dari context (sesuai season yang aktif)
  const allLogs = useMemo(() => {
    return [
      ...adzanLog.map(d => ({ date: d.date, type: d.adzanPoints === 8 ? 'sholawat' as const : 'adzan' as const })),
      ...attendanceLog.map(d => ({ date: d.date, type: 'attendance' as const })),
      ...quizAttempts.map(d => ({ date: new Date(d.completedAt).toISOString(), type: 'quiz' as const }))
    ];
  }, [adzanLog, attendanceLog, quizAttempts]);

  const filteredLogs = useMemo(() => {
    if (chartFilter === 'semua') return allLogs;
    return allLogs.filter(log => log.type === chartFilter);
  }, [allLogs, chartFilter]);

  const { counts, last30DaysData, monthlyData } = useMemo(() => {
    const now = new Date();
    const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
    const getStartOfWeek = (d: Date) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setHours(0,0,0,0) + diff * 86400000);
    };

    const today = now;
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = getStartOfWeek(now);
    const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart); lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
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
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d30.push({ name: d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }), fullDate: d, jumlah: 0 });
    }

    const mDataMap = new Map<string, number>();

    filteredLogs.forEach(log => {
      const d = new Date(log.date);
      
      if (isSameDay(d, today)) cnts.today++;
      if (isSameDay(d, yesterday)) cnts.yesterday++;
      
      if (d >= thisWeekStart) cnts.thisWeek++;
      if (d >= lastWeekStart && d <= lastWeekEnd) cnts.lastWeek++;
      
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) cnts.thisMonth++;
      if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) cnts.lastMonth++;
      
      if (d.getFullYear() === thisYear) cnts.thisYear++;
      if (d.getFullYear() === lastYear) cnts.lastYear++;

      // 30 Days chart
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) {
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

    return { counts: cnts, last30DaysData: d30, monthlyData: mData };
  }, [filteredLogs]);

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
    .sort((a, b) => getFilterCount(b.id) - getFilterCount(a.id));
  const topFive = allPerformers.slice(0, 5);
  const recentActivity = [...adzanLog.slice(0, 3), ...attendanceLog.slice(0, 2)]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const statCards = [
    { title: 'Hari Ini', current: counts.today, prev: counts.yesterday, prevLabel: 'Kemarin' },
    { title: 'Pekan Ini', current: counts.thisWeek, prev: counts.lastWeek, prevLabel: 'Pekan Lalu' },
    { title: 'Bulan Ini', current: counts.thisMonth, prev: counts.lastMonth, prevLabel: 'Bulan Lalu' },
    { title: 'Tahun Ini', current: counts.thisYear, prev: counts.lastYear, prevLabel: 'Tahun Lalu' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Pantau statistik adzan dan kehadiran peserta</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              if (window.confirm("Yakin ingin mengakhiri season ini?")) {
                const nextName = window.prompt("Masukkan nama untuk Season baru:", "Season 2");
                if (nextName) endSeason(nextName);
              }
            }}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >Akhiri Season</Button>
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

          {/* Comparative Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statCards.map(s => {
              return (
                <div key={s.title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-gray-500 mb-1">{s.title}</p>
                  <p className="text-3xl font-black text-gray-900 mb-2">{s.current}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                      {s.prev} <span className="font-normal text-gray-400">{s.prevLabel.toLowerCase()}</span>
                    </span>
                  </div>
                </div>
              );
            })}
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
                        <span className="font-medium text-gray-900">{p.nama}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{getFilterCount(p.id)}×</td>
                    <td className="px-6 py-4 font-bold text-primary-600">{points[p.id]?.total ?? 0} pts</td>
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
                <p className="text-sm text-gray-500">Bulan ini</p>
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
                  <td className="px-6 py-4 font-bold text-primary-600">{points[p.id]?.total ?? 0} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};
