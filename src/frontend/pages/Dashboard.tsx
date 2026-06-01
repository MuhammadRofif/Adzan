import React, { useState } from 'react';
import { Users, Target, Award, Coins, CheckCircle2, PlusCircle, Mic, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/index';
import { cn } from '../utils/cn';

// Prayer times removed as per user request
const ATTITUDES = [
  { label: 'Bagus', points: 5, color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { label: 'Cukup Bagus', points: 3, color: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
  { label: 'Ribut', points: 1, color: 'border-red-300 bg-red-50 text-red-700' },
];

export const Dashboard: React.FC = () => {
  const { participants, points, transactions, adzanLog, attendanceLog, recordAttendance, recordAdzan, budgetStatus } = useApp();

  const [attendanceModal, setAttendanceModal] = useState(false);
  const [adzanModal, setAdzanModal] = useState(false);
  const [attParticipant, setAttParticipant] = useState('');
  const [adzParticipant, setAdzParticipant] = useState('');
  const [adzAttitude, setAdzAttitude] = useState('Bagus');

  // Stats
  const totalAdzan = Object.values(points).reduce((s, p) => s + p.adzanCount, 0);
  const avgPoints = participants.length ? Math.round(Object.values(points).reduce((s, p) => s + p.total, 0) / participants.length) : 0;
  const topFive = [...participants].sort((a, b) => (points[b.id]?.total ?? 0) - (points[a.id]?.total ?? 0)).slice(0, 5);

  const stats = [
    { name: 'Total Peserta Aktif', value: participants.filter(p => p.status === 'aktif').length.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', change: `${participants.length} total` },
    { name: 'Adzan Bulan Ini', value: totalAdzan.toString(), icon: Mic, color: 'text-primary-500', bg: 'bg-primary-50', change: '+12% vs bulan lalu' },
    { name: 'Rata-rata Poin', value: avgPoints.toString(), icon: Award, color: 'text-orange-500', bg: 'bg-orange-50', change: 'per peserta' },
    { name: 'Sisa Budget', value: `Rp ${((budgetStatus.totalBudget - budgetStatus.usedBudget) / 1000).toFixed(0)}k`, icon: Coins, color: budgetStatus.usagePercent >= 80 ? 'text-red-500' : 'text-indigo-500', bg: budgetStatus.usagePercent >= 80 ? 'bg-red-50' : 'bg-indigo-50', change: `${budgetStatus.usagePercent}% terpakai` },
  ];

  const recentActivity = [...adzanLog.slice(0, 3), ...attendanceLog.slice(0, 2)]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Pantau statistik adzan dan kehadiran peserta</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-400 italic">Gunakan tombol "Absen Cepat" di atas atau menu Manajemen Peserta</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 stagger">
        {stats.map(stat => (
          <div key={stat.name} className="card p-6 animate-fade-in group">
            <div className="flex items-center justify-between mb-4">
              <div className={cn('p-3 rounded-xl transition-transform duration-300 group-hover:scale-110', stat.bg)}>
                <stat.icon className={cn('w-6 h-6', stat.color)} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">{stat.name}</p>
            <p className="text-3xl font-bold font-heading text-gray-900 mb-2">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-heading">Top Performers</h2>
              <p className="text-sm text-gray-500">Peringkat berdasarkan total poin bulan ini</p>
            </div>
            <TrendingUp className="w-5 h-5 text-primary-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Peserta</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Adzan</th>
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
                    <td className="px-6 py-4 text-gray-600">{points[p.id]?.adzanCount ?? 0}×</td>
                    <td className="px-6 py-4 font-bold text-primary-600">{points[p.id]?.total ?? 0} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 font-heading">Aktivitas Terbaru</h3>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentActivity.slice(0, 4).map((a: any, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                    {'attitude' in a ? <Mic className="w-4 h-4 text-primary-600" /> : <CheckCircle2 className="w-4 h-4 text-primary-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 font-medium truncate">{a.participantName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{'attitude' in a ? `Adzan ${a.prayerTime} - ${a.attitude} (+${a.total})` : `Latihan ${a.prayerTime} (+5 poin)`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className={cn('p-6 rounded-2xl text-white shadow-sm', budgetStatus.usagePercent >= 80 ? 'gradient-primary' : 'bg-gradient-to-br from-indigo-500 to-indigo-700')}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold font-heading">Status Budget</h3>
              <Coins className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold font-heading mb-1">{budgetStatus.usagePercent}%</p>
            <p className="text-sm opacity-80 mb-4">Rp {(budgetStatus.usedBudget / 1000).toFixed(0)}k / Rp {(budgetStatus.totalBudget / 1000).toFixed(0)}k terpakai</p>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${budgetStatus.usagePercent}%` }} />
            </div>
            {budgetStatus.warning && <p className="text-xs mt-3 opacity-90 bg-white/20 rounded-lg px-3 py-1.5">⚠️ Budget sudah melebihi 80%!</p>}
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
    </div>
  );
};
