import React, { useState } from 'react';
import { Mic, CheckCircle2, PlusCircle, Search, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SectionHeader, Select, Badge } from '../components/ui/index';
import { cn } from '../utils/cn';

const PRAYER_TIMES = ['Subuh', 'Duhur', 'Ashar', 'Maghrib', 'Isya'];
const ATTITUDES = [
  { label: 'Bagus', points: 5, bg: 'border-emerald-400 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  { label: 'Cukup Bagus', points: 3, bg: 'border-yellow-400 bg-yellow-50 text-yellow-700', dot: 'bg-yellow-500' },
  { label: 'Ribut', points: 1, bg: 'border-red-300 bg-red-50 text-red-700', dot: 'bg-red-500' },
];

export const Tracking: React.FC = () => {
  const { participants, adzanLog, attendanceLog, recordAttendance, recordAdzan, recordSholawatIqomah } = useApp();

  const [activeTab, setActiveTab] = useState<'adzan' | 'attendance'>('adzan');
  const [search, setSearch] = useState('');
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [adzanModal, setAdzanModal] = useState(false);
  const [attParticipant, setAttParticipant] = useState('');
  const [attPrayer, setAttPrayer] = useState('Ashar');
  const [adzParticipant, setAdzParticipant] = useState('');
  const [adzPrayer, setAdzPrayer] = useState('Ashar');
  const [adzAttitude, setAdzAttitude] = useState('Bagus');
  const [adzRole, setAdzRole] = useState<'adzan' | 'sholawat_iqomah'>('adzan');

  const filteredAdzan = adzanLog.filter(a => a.participantName.toLowerCase().includes(search.toLowerCase()));
  const filteredAttendance = attendanceLog.filter(a => a.participantName.toLowerCase().includes(search.toLowerCase()));

  const attitudeStyle = (attitude: string) => ATTITUDES.find(a => a.label === attitude);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <SectionHeader
        title="Sikap Bagus & Adzan"
        subtitle="Log pencatatan kehadiran dan adzan peserta"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setAttendanceModal(true)}>Catat Sikap Bagus</Button>
            <Button leftIcon={<PlusCircle className="w-4 h-4" />} onClick={() => { setAdzRole('adzan'); setAdzanModal(true); }}>Catat Peran Masjid</Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {[{ key: 'adzan', label: 'Log Adzan', icon: Mic }, { key: 'attendance', label: 'Log Kehadiran', icon: CheckCircle2 }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={cn('flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-10" placeholder="Cari nama peserta..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Adzan Log */}
      {activeTab === 'adzan' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary-500" />
              <span className="font-bold text-gray-900 font-heading">Log Adzan</span>
              <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">{filteredAdzan.length}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60">
                <tr>{['Tanggal', 'Peserta', 'Waktu Shalat', 'Sikap Adzan', 'Poin Adzan', 'Poin Sikap', 'Total Poin'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAdzan.map(a => {
                  const att = attitudeStyle(a.attitude);
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{a.date}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">{a.participantName.charAt(0)}</div>
                          <span className="font-medium text-gray-900">{a.participantName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-700 font-medium">
                        {a.prayerTime}
                        <span className="text-xs text-gray-400 block font-normal mt-0.5">
                          {a.adzanPoints === 10 ? '📢 Adzan' : '📿 Sholawat + Iqomah'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border', att?.bg)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', att?.dot)} />{a.attitude}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900">+{a.adzanPoints}</td>
                      <td className="px-5 py-4 font-medium text-gray-900">+{a.attitudePoints}</td>
                      <td className="px-5 py-4 font-bold text-primary-600">+{a.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Log */}
      {activeTab === 'attendance' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary-500" />
            <span className="font-bold text-gray-900 font-heading">Log Kehadiran</span>
            <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">{filteredAttendance.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60">
                <tr>{['Tanggal', 'Peserta', 'Waktu Shalat', 'Poin'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAttendance.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-gray-500">{a.date}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">{a.participantName.charAt(0)}</div>
                        <span className="font-medium text-gray-900">{a.participantName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{a.prayerTime}</td>
                    <td className="px-5 py-4 font-bold text-primary-600">+{a.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={attendanceModal} onClose={() => { setAttendanceModal(false); setAttParticipant(''); }} title="Catat Latihan & Sikap Bagus" size="sm"
        footer={<>
          <Button onClick={() => { if (attParticipant) { recordAttendance(attParticipant, attPrayer); setAttendanceModal(false); setAttParticipant(''); } }} className="w-full sm:w-auto sm:ml-3" disabled={!attParticipant}>Simpan</Button>
          <Button variant="ghost" onClick={() => { setAttendanceModal(false); setAttParticipant(''); }} className="mt-3 sm:mt-0 w-full sm:w-auto">Batal</Button>
        </>}
      >
        <div className="space-y-4">
          <Select label="Nama Peserta" value={attParticipant} onChange={e => setAttParticipant(e.target.value)}>
            <option value="">Pilih Peserta...</option>
            {participants.filter(p => p.status === 'aktif').map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </Select>
          <Select label="Waktu Shalat" value={attPrayer} onChange={e => setAttPrayer(e.target.value)}>
            {PRAYER_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
      </Modal>

      <Modal isOpen={adzanModal} onClose={() => { setAdzanModal(false); setAdzParticipant(''); setAdzAttitude('Bagus'); }} title="Catat Peran / Tugas Masjid"
        footer={<>
          <Button onClick={() => { 
            if (adzParticipant) { 
              if (adzRole === 'adzan') {
                recordAdzan(adzParticipant, adzPrayer, adzAttitude); 
              } else {
                recordSholawatIqomah(adzParticipant, adzPrayer, adzAttitude);
              }
              setAdzanModal(false); 
              setAdzParticipant(''); 
              setAdzAttitude('Bagus');
            } 
          }} className="w-full sm:w-auto sm:ml-3" disabled={!adzParticipant}>Simpan</Button>
          <Button variant="ghost" onClick={() => { setAdzanModal(false); setAdzParticipant(''); setAdzAttitude('Bagus'); }} className="mt-3 sm:mt-0 w-full sm:w-auto">Batal</Button>
        </>}
      >
        <div className="space-y-4">
          <Select label="Nama Peserta" value={adzParticipant} onChange={e => setAdzParticipant(e.target.value)}>
            <option value="">Pilih Peserta...</option>
            {participants.filter(p => p.status === 'aktif').map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </Select>
          <Select label="Tugas / Peran" value={adzRole} onChange={e => setAdzRole(e.target.value as any)}>
            <option value="adzan">Kumandangkan Adzan (+10 Poin)</option>
            <option value="sholawat_iqomah">Sholawat + Iqomah (+8 Poin)</option>
          </Select>
          <Select label="Waktu Shalat" value={adzPrayer} onChange={e => setAdzPrayer(e.target.value)}>
            {PRAYER_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          <div>
            <label className="label">Penilaian Sikap</label>
            <div className="grid grid-cols-3 gap-3">
              {ATTITUDES.map(att => (
                <button key={att.label} onClick={() => setAdzAttitude(att.label)}
                  className={cn('border-2 rounded-xl p-3 text-center transition-all duration-200 text-sm', att.label === adzAttitude ? att.bg : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300')}>
                  <span className="block font-semibold">{att.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
