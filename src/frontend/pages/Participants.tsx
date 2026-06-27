import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, UserPlus, MoreVertical, Search, Mic, CheckCircle2, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge, Input, Select, SectionHeader, EmptyState, ConfirmDialog } from '../components/ui/index';
import { Participant, ParticipantStatus } from '../../shared/types';
import { cn } from '../utils/cn';

const statusLabels: Record<ParticipantStatus, string> = { aktif: 'Aktif', tidak_aktif: 'Tidak Aktif', baru: 'Baru' };
const statusVariants: Record<ParticipantStatus, 'active' | 'inactive' | 'new'> = { aktif: 'active', tidak_aktif: 'inactive', baru: 'new' };

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas blob is empty'));
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const Participants: React.FC = () => {
  const { participants, points, addParticipant, updateParticipantStatus, recordAttendance, recordAdzan, recordSholawatIqomah, uploadAvatar, updateParticipantAvatar } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [multiModal, setMultiModal] = useState(false);
  const [multiType, setMultiType] = useState<'attendance' | 'adzan' | 'sholawat_iqomah'>('attendance');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [attAttitude, setAttAttitude] = useState('Bagus');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [addModal, setAddModal] = useState(false);

  React.useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'attendance' || action === 'adzan' || action === 'sholawat_iqomah') {
      setMultiType(action as any);
      setSelectedIds([]);
      setAttAttitude('Bagus');
      setMultiModal(true);
      // Clear param after opening
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams);
    }
  }, [searchParams]);

  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; status: ParticipantStatus; name: string } | null>(null);
  const [detailModal, setDetailModal] = useState<Participant | null>(null);

  const filtered = participants
    .filter(p => {
      const matchSearch = p.nama.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const pointsA = points[String(a.id)]?.total ?? 0;
      const pointsB = points[String(b.id)]?.total ?? 0;
      return pointsB - pointsA;
    });

  const handleAdd = () => {
    if (!newName.trim()) { setNameError('Nama wajib diisi'); return; }
    if (newName.trim().length < 3) { setNameError('Nama minimal 3 karakter'); return; }
    addParticipant(newName.trim());
    setNewName('');
    setNameError('');
    setAddModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <SectionHeader
        title="Manajemen Peserta & Aktivitas"
        subtitle={`${participants.length} peserta terdaftar`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={() => { setMultiType('attendance'); setSelectedIds([]); setAttAttitude('Bagus'); setMultiModal(true); }}>
              Absen Latihan
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" leftIcon={<span className="text-sm">📿</span>} onClick={() => { setMultiType('sholawat_iqomah'); setSelectedIds([]); setAttAttitude('Bagus'); setMultiModal(true); }}>
              Absen Sholawat + Iqomah
            </Button>
            <Button variant="primary" leftIcon={<Mic className="w-4 h-4" />} onClick={() => { setMultiType('adzan'); setSelectedIds([]); setAttAttitude('Bagus'); setMultiModal(true); }}>
              Absen Adzan
            </Button>
            <Button variant="ghost" className="bg-gray-100" leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setAddModal(true)}>
              Tambah Peserta
            </Button>
          </div>
        }
      />



      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-10" placeholder="Cari nama peserta..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="tidak_aktif">Tidak Aktif</option>
          <option value="baru">Baru</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="w-16 h-16" />} title="Tidak ada peserta" description="Coba ubah filter atau tambahkan peserta baru." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60">
                <tr>
                  {['No', 'Nama Peserta', 'Status', 'Catat Aktivitas', 'Jumlah Peran', 'Poin', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p, i) => {
                  const pt = points[p.id] ?? { total: 0, adzanCount: 0, attendance: 0 };
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-500">{i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden border border-gray-100">
                            {p.avatar_url ? (
                              <img src={p.avatar_url} alt={p.nama} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            ) : (
                              p.nama.charAt(0)
                            )}
                          </div>
                          <div>
                            <button onClick={() => setDetailModal(p)} className="font-semibold text-gray-900 hover:text-primary-600 transition-colors text-left">{p.nama}</button>
                            <p className="text-xs text-gray-400">ID: {p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><Badge variant={statusVariants[p.status]}>{statusLabels[p.status]}</Badge></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 italic">
                          Klik grid di atas untuk absen cepat
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">Adzan: {pt.adzanCount}×</span>
                          <span className="text-xs text-gray-500">Sholawat + Iqomah: {pt.sholawatIqomahCount ?? 0}×</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-primary-600">{pt.total} <span className="text-[10px] text-gray-400 font-normal">pts</span></span>
                          <span className="text-[10px] text-gray-500">Latihan: {pt.attendanceCount}×</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <Button variant="ghost" className="p-1.5" onClick={() => setActionMenu(actionMenu === p.id ? null : p.id)}>
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </Button>
                          {actionMenu === p.id && (
                            <div className="absolute right-0 top-8 z-10 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1" onMouseLeave={() => setActionMenu(null)}>
                              <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700" onClick={() => { setDetailModal(p); setActionMenu(null); }}>Lihat Detail</button>
                              {p.status !== 'aktif' && <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-emerald-600" onClick={() => { setConfirmDialog({ id: p.id, status: 'aktif', name: p.nama }); setActionMenu(null); }}>Aktifkan</button>}
                              {p.status !== 'tidak_aktif' && <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600" onClick={() => { setConfirmDialog({ id: p.id, status: 'tidak_aktif', name: p.nama }); setActionMenu(null); }}>Nonaktifkan</button>}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={addModal} onClose={() => { setAddModal(false); setNewName(''); setNameError(''); }} title="Tambah Peserta Baru" size="sm"
        footer={<>
          <Button onClick={handleAdd} className="w-full sm:w-auto sm:ml-3">Tambah</Button>
          <Button variant="ghost" onClick={() => { setAddModal(false); setNewName(''); setNameError(''); }} className="mt-3 sm:mt-0 w-full sm:w-auto">Batal</Button>
        </>}
      >
        <Input label="Nama Lengkap Peserta" placeholder="cth: Ahmad Faiz" value={newName} onChange={e => { setNewName(e.target.value); setNameError(''); }} error={nameError} onKeyDown={e => e.key === 'Enter' && handleAdd()} autoFocus />
        <p className="mt-2 text-xs text-gray-400">{participants.length} peserta terdaftar</p>
      </Modal>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog isOpen={!!confirmDialog} onClose={() => setConfirmDialog(null)}
          onConfirm={() => updateParticipantStatus(confirmDialog.id, confirmDialog.status)}
          title={confirmDialog.status === 'aktif' ? 'Aktifkan Peserta' : 'Nonaktifkan Peserta'}
          message={`Apakah kamu yakin ingin ${confirmDialog.status === 'aktif' ? 'mengaktifkan' : 'menonaktifkan'} peserta "${confirmDialog.name}"?`}
          confirmText={confirmDialog.status === 'aktif' ? 'Aktifkan' : 'Nonaktifkan'}
          variant={confirmDialog.status === 'aktif' ? 'primary' : 'danger'}
        />
      )}

      {/* Multi Select Modal */}
      <Modal isOpen={multiModal} onClose={() => { setMultiModal(false); setSelectedIds([]); setAttAttitude('Bagus'); }} 
        title={multiType === 'attendance' ? 'Absen Massal Latihan' : multiType === 'sholawat_iqomah' ? 'Absen Massal Sholawat + Iqomah' : 'Absen Massal Adzan'} 
        size="lg"
        footer={<>
          <Button onClick={() => {
            selectedIds.forEach(id => {
              if (multiType === 'attendance') {
                recordAttendance(id, '', attAttitude, customDate);
              } else if (multiType === 'sholawat_iqomah') {
                recordSholawatIqomah(id, '', 'Bagus', customDate);
              } else {
                recordAdzan(id, '', 'Bagus', customDate);
              }
            });
            setSelectedIds([]);
            setAttAttitude('Bagus');
            setMultiModal(false);
          }} className="w-full sm:w-auto sm:ml-3" disabled={selectedIds.length === 0}>
            Simpan {selectedIds.length} Peserta
          </Button>
          <Button variant="ghost" onClick={() => { setMultiModal(false); setSelectedIds([]); setAttAttitude('Bagus'); }} className="mt-3 sm:mt-0 w-full sm:w-auto">Batal</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-primary-600" 
                checked={selectedIds.length === participants.filter(p => p.status === 'aktif').length}
                onChange={(e) => {
                  if (e.target.checked) setSelectedIds(participants.filter(p => p.status === 'aktif').map(p => p.id));
                  else setSelectedIds([]);
                }}
              />
              <span className="font-bold text-gray-700">Pilih Semua</span>
            </div>
            <Button variant="ghost" size="sm" leftIcon={<UserPlus className="w-3 h-3" />} onClick={() => setAddModal(true)}>
              Tambah Peserta Baru
            </Button>
          </div>

          {multiType === 'attendance' && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <label className="label text-emerald-700 mb-2">Penilaian Sikap Latihan (untuk semua yang dipilih)</label>
              <div className="grid grid-cols-3 gap-2">
                {['Bagus', 'Cukup Bagus', 'Ribut'].map(label => (
                  <button key={label} onClick={() => setAttAttitude(label)}
                    className={cn('px-3 py-2 rounded-xl text-xs font-bold transition-all border-2', 
                    attAttitude === label ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-emerald-100 text-emerald-600 hover:border-emerald-200')}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label">Tanggal (Untuk Rapel)</label>
            <input type="date" className="input w-full" value={customDate} onChange={e => setCustomDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto p-1">
            {participants.filter(p => p.status === 'aktif').map(p => (
              <label key={p.id} className={cn(
                "flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all",
                selectedIds.includes(p.id) ? "border-primary-500 bg-primary-50" : "border-gray-100 bg-white hover:border-gray-200"
              )}>
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-primary-600" 
                  checked={selectedIds.includes(p.id)}
                  onChange={() => {
                    setSelectedIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]);
                  }}
                />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs">{p.nama.charAt(0)}</div>
                  <span className="font-bold text-gray-800">{p.nama}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {detailModal && (
        <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Detail Peserta" size="lg"
          footer={<Button variant="ghost" onClick={() => setDetailModal(null)} className="w-full sm:w-auto">Tutup</Button>}
        >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-gray-50 rounded-3xl border border-gray-100">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-4xl overflow-hidden shadow-inner border-2 border-white">
                  {detailModal.avatar_url ? (
                    <img src={detailModal.avatar_url} alt={detailModal.nama} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    detailModal.nama.charAt(0)
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:bg-primary-50 transition-colors group-hover:scale-110">
                  <Input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          // Compress image on client-side before upload
                          const compressedBlob = await compressImage(file);
                          const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                          });

                          const url = await uploadAvatar(compressedFile, detailModal.id);
                          await updateParticipantAvatar(detailModal.id, url);
                          setDetailModal(prev => prev ? { ...prev, avatar_url: url } : null);
                        } catch (err) {
                          console.error('Compression or upload error:', err);
                        }
                      }
                    }}
                  />
                  <Users className="w-4 h-4 text-primary-600" />
                </label>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-2xl font-black text-gray-900 font-heading mb-1">{detailModal.nama}</h3>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <Badge variant={statusVariants[detailModal.status]}>{statusLabels[detailModal.status]}</Badge>
                  <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">ID: {detailModal.id}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Poin', value: `${points[detailModal.id]?.total ?? 0} pts`, color: 'text-primary-600' },
                { label: 'Poin Adzan & Peran', value: `${points[detailModal.id]?.adzan ?? 0} pts`, color: 'text-emerald-600' },
                { label: 'Poin Kehadiran', value: `${points[detailModal.id]?.attendance ?? 0} pts`, color: 'text-blue-600' },
                { label: 'Poin Quiz', value: `${points[detailModal.id]?.quiz ?? 0} pts`, color: 'text-indigo-600' },
                { label: 'Jumlah Adzan', value: `${points[detailModal.id]?.adzanCount ?? 0}×`, color: 'text-gray-900' },
                { label: 'Jumlah Sholawat + Iqomah', value: `${points[detailModal.id]?.sholawatIqomahCount ?? 0}×`, color: 'text-blue-900' },
                { label: 'Jumlah Latihan', value: `${points[detailModal.id]?.attendanceCount ?? 0}×`, color: 'text-emerald-900' },
                { label: 'Jumlah Quiz', value: `${points[detailModal.id]?.quizCount ?? 0}×`, color: 'text-indigo-900' },
              ].map(item => (
                <div key={item.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
