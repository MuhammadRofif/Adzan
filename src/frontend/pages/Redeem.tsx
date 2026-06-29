import React, { useState } from 'react';
import { Gift, Diamond, Clock, Check, X, AlertTriangle, Coins, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge, SectionHeader, Select, ProgressBar, ConfirmDialog } from '../components/ui/index';
import { RedeemHistory } from '../../shared/types';
import { cn } from '../utils/cn';

const getRealMoney = (diamonds: number) => {
  switch (diamonds) {
    case 5: return 2000;
    case 12: return 3000;
    case 50: return 8000;
    case 70: return 10000;
    case 140: return 20000;
    default: return 0;
  }
};

export const Redeem: React.FC = () => {
  const { participants, points, redeemPackages, redeemHistory, requestRedeem, processRedeem, budgetStatus } = useApp();

  const [activeTab, setActiveTab] = useState<'packages' | 'requests' | 'history'>('packages');
  const [redeemModal, setRedeemModal] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [redeemConfirm, setRedeemConfirm] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [processConfirm, setProcessConfirm] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPkg = redeemPackages.find(p => p.id === redeemModal);
  const participantPts = selectedParticipant ? (points[selectedParticipant]?.total ?? 0) : 0;
  const canAfford = selectedPkg ? participantPts >= selectedPkg.pointsRequired : false;

  const handleRedeemSubmit = async () => {
    if (!redeemModal || !selectedParticipant || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await requestRedeem(selectedParticipant, redeemModal);
      if (!res.success) { 
        setRedeemError(res.message); 
        return; 
      }
      setRedeemModal(null); 
      setSelectedParticipant(''); 
      setRedeemConfirm(false); 
      setRedeemError('');
    } catch (err) {
      setRedeemError("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingRequests = redeemHistory.filter(r => r.status === 'pending');
  const filteredHistory = redeemHistory.filter(r => {
    const p = participants.find(x => x.id === r.participantId);
    return !filterSearch || p?.nama.toLowerCase().includes(filterSearch.toLowerCase()) || r.packageName.toLowerCase().includes(filterSearch.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <SectionHeader
        title="Redeem Hadiah"
        subtitle="Kelola paket hadiah dan permintaan penukaran poin"
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 bg-indigo-50 border border-indigo-100">
          <div className="text-indigo-500 text-sm font-semibold mb-1">Total Redeem Disetujui</div>
          <div className="text-2xl font-bold text-indigo-900">{redeemHistory.filter(r => r.status === 'approved').length}x</div>
        </div>
        <div className="card p-4 bg-emerald-50 border border-emerald-100">
          <div className="text-emerald-600 text-sm font-semibold mb-1">Total Setara Uang</div>
          <div className="text-2xl font-bold text-emerald-900">
            Rp {(redeemHistory.filter(r => r.status === 'approved').reduce((acc, r) => {
              const pkg = redeemPackages.find(p => p.id === r.packageId);
              return acc + (pkg ? getRealMoney(pkg.diamond) : 0);
            }, 0) / 1000).toFixed(0)}k
          </div>
        </div>
        <div className="card p-4 bg-amber-50 border border-amber-100">
          <div className="text-amber-600 text-sm font-semibold mb-1">Total Harga Budget</div>
          <div className="text-2xl font-bold text-amber-900">
            Rp {(redeemHistory.filter(r => r.status === 'approved').reduce((acc, r) => {
              const pkg = redeemPackages.find(p => p.id === r.packageId);
              return acc + (pkg ? pkg.budgetCost : 0);
            }, 0) / 1000).toFixed(0)}k
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {[
          { key: 'packages', label: 'Paket Hadiah' },
          { key: 'requests', label: `Permintaan${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ''}` },
          { key: 'history', label: 'Riwayat' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={cn('px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200', activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Packages */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {redeemPackages.map(pkg => (
            <div key={pkg.id} className={cn('card p-5 flex flex-col', !pkg.isAvailable && 'opacity-60')}>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <Diamond className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="font-bold text-gray-900 font-heading mb-1">{pkg.name}</h3>
              <p className="text-xs text-gray-500 mb-3 flex-1">{pkg.description}</p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Biaya Poin</span>
                  <span className="font-bold text-primary-600">{pkg.pointsRequired} pts</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Harga Budget</span>
                  <span className="font-medium text-gray-700">Rp {(pkg.budgetCost / 1000).toFixed(0)}k</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Setara Uang</span>
                  <span className="font-medium text-emerald-600">Rp {(getRealMoney(pkg.diamond) / 1000).toFixed(0)}k</span>
                </div>
              </div>
              <Button onClick={() => { setRedeemModal(pkg.id); setRedeemError(''); }}
                variant={pkg.isAvailable ? 'primary' : 'secondary'} className="w-full" disabled={!pkg.isAvailable}>
                {pkg.isAvailable ? 'Redeem' : 'Tidak Tersedia'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Pending Requests */}
      {activeTab === 'requests' && (
        <div>
          {pendingRequests.length === 0 ? (
            <div className="card p-12 text-center">
              <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Tidak ada permintaan pending</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map(req => {
                const p = participants.find(x => x.id === req.participantId);
                return (
                  <div key={req.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center">{p?.nama.charAt(0)}</div>
                        <div>
                          <p className="font-semibold text-gray-900">{p?.nama}</p>
                          <p className="text-xs text-gray-500">{req.requestedAt.toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium text-gray-700">📦 {req.packageName}</span>
                        <span className="text-primary-600 font-bold">-{req.pointsSpent} pts</span>
                        <Badge variant="pending">Pending</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" leftIcon={<Check className="w-4 h-4" />} onClick={() => setProcessConfirm({ id: req.id, action: 'approved' })}>Setujui</Button>
                      <Button variant="danger" size="sm" leftIcon={<X className="w-4 h-4" />} onClick={() => setProcessConfirm({ id: req.id, action: 'rejected' })}>Tolak</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {activeTab === 'history' && (
        <div>
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-10" placeholder="Cari peserta atau paket..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} />
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/60">
                  <tr>{['Peserta', 'Paket', 'Poin', 'Status', 'Tanggal', 'Diproses Oleh'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredHistory.map(r => {
                    const p = participants.find(x => x.id === r.participantId);
                    return (
                      <tr key={r.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 font-medium text-gray-900">{p?.nama ?? '—'}</td>
                        <td className="px-5 py-3 text-gray-700">{r.packageName}</td>
                        <td className="px-5 py-3 font-bold text-red-500">-{r.pointsSpent}</td>
                        <td className="px-5 py-3"><Badge variant={r.status as any}>{r.status === 'approved' ? 'Disetujui' : r.status === 'rejected' ? 'Ditolak' : 'Pending'}</Badge></td>
                        <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{r.requestedAt.toLocaleDateString('id-ID')}</td>
                        <td className="px-5 py-3 text-gray-500">{r.processedBy ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Redeem Modal */}
      {redeemModal && selectedPkg && (
        <Modal isOpen={!!redeemModal} onClose={() => { setRedeemModal(null); setSelectedParticipant(''); setRedeemError(''); }} title={`Redeem: ${selectedPkg.name}`}
          footer={<>
            <Button onClick={handleRedeemSubmit} className="w-full sm:w-auto sm:ml-3" disabled={!selectedParticipant || !canAfford || isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Redeem'}
            </Button>
            <Button variant="ghost" onClick={() => { setRedeemModal(null); setSelectedParticipant(''); setRedeemError(''); }} className="mt-3 sm:mt-0 w-full sm:w-auto" disabled={isSubmitting}>Batal</Button>
          </>}
        >
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-4">
              <Diamond className="w-8 h-8 text-indigo-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-indigo-900">{selectedPkg.diamond} Diamond</p>
                <p className="text-sm text-indigo-600">Biaya: {selectedPkg.pointsRequired} poin</p>
              </div>
            </div>
            <Select label="Nama Peserta" value={selectedParticipant} onChange={e => { setSelectedParticipant(e.target.value); setRedeemError(''); }}>
              <option value="">Pilih peserta...</option>
              {participants.filter(p => p.status === 'aktif').map(p => (
                <option key={p.id} value={p.id}>{p.nama} ({points[p.id]?.total ?? 0} poin)</option>
              ))}
            </Select>
            {selectedParticipant && (
              <div className={cn('text-sm rounded-xl p-3 flex items-center gap-2', canAfford ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200')}>
                {canAfford ? <Check className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
                <span>{canAfford ? `Poin cukup (${participantPts}/${selectedPkg.pointsRequired})` : `Poin kurang! Punya ${participantPts}, butuh ${selectedPkg.pointsRequired}`}</span>
              </div>
            )}
            {redeemError && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{redeemError}</p>}
          </div>
        </Modal>
      )}

      {/* Process Confirm */}
      {processConfirm && (
        <ConfirmDialog isOpen={!!processConfirm} onClose={() => setProcessConfirm(null)}
          onConfirm={() => processRedeem(processConfirm.id, processConfirm.action)}
          title={processConfirm.action === 'approved' ? 'Setujui Permintaan' : 'Tolak Permintaan'}
          message={`Yakin ingin ${processConfirm.action === 'approved' ? 'menyetujui' : 'menolak'} permintaan redeem ini?`}
          confirmText={processConfirm.action === 'approved' ? 'Setujui' : 'Tolak'}
          variant={processConfirm.action === 'approved' ? 'primary' : 'danger'}
        />
      )}
    </div>
  );
};
