import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/cn';

export const BocilRedeem: React.FC = () => {
  const { participants, points, redeemPackages, redeemHistory, requestRedeem } = useApp();
  const [selectedParticipant, setSelectedParticipant] = useState(() => localStorage.getItem('bocil_id') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmPkg, setConfirmPkg] = useState<RedeemPackage | null>(null);
  const [successPopup, setSuccessPopup] = useState<string | null>(null);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('bocil_id');
    if (saved) setSelectedParticipant(saved);
  }, []);

  const activeParticipants = participants.filter(p => p.status === 'aktif');
  const participantPts = selectedParticipant ? (points[selectedParticipant]?.total ?? 0) : 0;
  const participantName = activeParticipants.find(p => p.id === selectedParticipant)?.nama;

  const handleRedeem = async (packageId: string) => {
    if (!selectedParticipant || isSubmitting) return;
    
    setIsSubmitting(true);
    setConfirmPkg(null);
    try {
      const res = await requestRedeem(selectedParticipant, packageId);
      if (res.success) {
        setSuccessPopup(res.message);
        setTimeout(() => setSuccessPopup(null), 3000);
      } else {
        setErrorPopup(res.message);
        setTimeout(() => setErrorPopup(null), 3000);
      }
    } catch (err) {
      setErrorPopup("Terjadi kesalahan sistem.");
      setTimeout(() => setErrorPopup(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recent redeems for display
  const myRedeems = selectedParticipant
    ? redeemHistory.filter(r => String(r.participantId) === String(selectedParticipant)).slice(0, 5)
    : [];

  return (
    <div className="bocil-page">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-heading mb-2">
          🎁 Tukar Hadiah
        </h1>
        <p className="text-gray-500 text-base sm:text-lg">Tukarkan poin kamu dengan Diamond!</p>
      </div>

      {/* Select Participant */}
      <div className="max-w-md mx-auto mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">👤 Pilih Nama Kamu:</label>
        <select
          value={selectedParticipant}
          onChange={e => setSelectedParticipant(e.target.value)}
          className="bocil-select"
        >
          <option value="">Pilih nama...</option>
          {activeParticipants.map(p => (
            <option key={p.id} value={p.id}>{p.nama} ({points[p.id]?.total ?? 0} poin)</option>
          ))}
        </select>
      </div>

      {/* Points Display */}
      {selectedParticipant && (
        <div className="max-w-md mx-auto mb-8 animate-fade-in">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-center text-white shadow-lg shadow-emerald-200">
            <p className="text-sm text-white/80 mb-1">Poin kamu saat ini, {participantName}:</p>
            <p className="text-4xl font-extrabold font-heading">{participantPts}</p>
            <p className="text-sm text-white/70">poin tersedia</p>
          </div>
        </div>
      )}

      {/* Packages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5 mb-10">
        {redeemPackages.map((pkg, i) => {
          const canAfford = participantPts >= pkg.pointsRequired;
          const diamondEmoji = pkg.diamond <= 5 ? '💎' : pkg.diamond <= 12 ? '💎💎' : pkg.diamond <= 50 ? '💎💎💎' : '👑';
          return (
            <div key={pkg.id} className={cn(
              'bocil-quiz-card text-center animate-fade-in',
              !pkg.isAvailable && 'opacity-50'
            )} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="text-4xl mb-3">{diamondEmoji}</div>
              <h3 className="font-bold text-gray-900 font-heading text-lg mb-1">{pkg.name}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{pkg.description}</p>

              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Diamond</span>
                  <span className="font-bold text-indigo-600">{pkg.diamond} 💎</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Biaya</span>
                  <span className="font-bold text-primary-600">{pkg.pointsRequired} poin</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Kuota/minggu</span>
                  <span className="font-medium text-gray-700">{pkg.weeklyQuota}×</span>
                </div>
              </div>

              {selectedParticipant ? (
                <button
                  onClick={() => setConfirmPkg(pkg)}
                  disabled={!pkg.isAvailable || !canAfford || isSubmitting}
                  className={cn(
                    'w-full py-3 rounded-xl font-bold text-sm transition-all duration-200',
                    pkg.isAvailable && canAfford
                      ? 'bocil-btn-primary'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {!pkg.isAvailable ? 'Tidak Tersedia' :
                    !canAfford ? `Kurang ${pkg.pointsRequired - participantPts} poin` :
                    'Tukar! 🎉'}
                </button>
              ) : (
                <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold">
                  Pilih nama dulu 👆
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* My Redeem History */}
      {selectedParticipant && myRedeems.length > 0 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-gray-900 font-heading mb-4">📋 Riwayat Tukar Kamu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {myRedeems.map((r, i) => {
              const statusEmoji = r.status === 'approved' ? '✅' : r.status === 'rejected' ? '❌' : '⏳';
              const statusText = r.status === 'approved' ? 'Disetujui' : r.status === 'rejected' ? 'Ditolak' : 'Menunggu';
              const statusColor = r.status === 'approved' ? 'bg-emerald-50 border-emerald-200' :
                r.status === 'rejected' ? 'bg-red-50 border-red-200' :
                'bg-yellow-50 border-yellow-200';
              return (
                <div key={r.id} className={cn('rounded-2xl border p-4 animate-fade-in', statusColor)} style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800">{r.packageName}</span>
                    <span className="text-lg">{statusEmoji}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">-{r.pointsSpent} poin</span>
                    <span className="font-semibold text-gray-600">{statusText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmPkg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => !isSubmitting && setConfirmPkg(null)}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🤔</div>
              <h3 className="text-xl font-bold text-gray-900 font-heading mb-2">Konfirmasi Tukar</h3>
              <p className="text-gray-500 text-sm">
                Kamu akan menukar <span className="font-bold text-primary-600">{confirmPkg.pointsRequired} poin</span> untuk <span className="font-bold text-indigo-600">{confirmPkg.diamond} Diamond</span>. Yakin?
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmPkg(null)} 
                disabled={isSubmitting}
                className="bocil-btn-secondary flex-1"
              >
                Batal
              </button>
              <button 
                onClick={() => handleRedeem(confirmPkg.id)} 
                disabled={isSubmitting}
                className="bocil-btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Proses...
                  </>
                ) : 'Ya, Tukar! 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {successPopup && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-semibold">
            <span className="text-xl">🎉</span> {successPopup}
          </div>
        </div>
      )}

      {/* Error Popup */}
      {errorPopup && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-red-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-semibold">
            <span className="text-xl">😢</span> {errorPopup}
          </div>
        </div>
      )}
    </div>
  );
};
