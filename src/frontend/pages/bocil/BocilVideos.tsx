import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Play, CheckCircle2, ChevronDown, ChevronUp, Star, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdzanVideo } from '../../../shared/types';
import { extractYoutubeId, getYoutubeThumbnail, getYoutubeEmbedUrl } from '../../utils/youtube';
import { cn } from '../../utils/cn';

// Teks Lafadz Adzan resmi dan standar
const ADZAN_TEXTS = [
  {
    arab: 'اللهُ أَكْبَرُ، اللهُ أَكْبَرُ',
    latin: 'Allaahu Akbar, Allaahu Akbar (2x)',
    arti: 'Allah Maha Besar, Allah Maha Besar',
  },
  {
    arab: 'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللهُ',
    latin: 'Asyhadu allaa ilaaha illallaah (2x)',
    arti: 'Aku bersaksi bahwa tiada sesembahan selain Allah',
  },
  {
    arab: 'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللهِ',
    latin: 'Asyhadu anna Muhammadar Rasuulullaah (2x)',
    arti: 'Aku bersaksi bahwa Muhammad adalah utusan Allah',
  },
  {
    arab: 'حَيَّ عَلَى الصَّلَاةِ',
    latin: "Hayya 'alash-Shalaah (2x)",
    arti: 'Mari menuju salat',
  },
  {
    arab: 'حَيَّ عَلَى الْفَلَاحِ',
    latin: "Hayya 'alal-Falaah (2x)",
    arti: 'Mari menuju kemenangan',
  },
  {
    arab: 'الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ',
    latin: 'Ash-shalaatu khairum minan-naum (2x, Khusus Subuh)',
    arti: 'Salat itu lebih baik daripada tidur',
  },
  {
    arab: 'اللهُ أَكْبَرُ، اللهُ أَكْبَرُ',
    latin: 'Allaahu Akbar, Allaahu Akbar (1x)',
    arti: 'Allah Maha Besar, Allah Maha Besar',
  },
  {
    arab: 'لَا إِلٰهَ إِلَّا اللهُ',
    latin: 'Laa ilaaha illallaah (1x)',
    arti: 'Tiada sesembahan selain Allah',
  },
];

const CATEGORIES = [
  'Semua',
  'Makkah & Madinah',
  'Hijaz',
  'Muadzin Cilik',
  'Khusus Subuh',
];

export const BocilVideos: React.FC = () => {
  const { adzanVideos, participants, setParticipantTargetIrama } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedBocilId, setSelectedBocilId] = useState<string>(() => localStorage.getItem('bocil_id') || '');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [showTeksLafadz, setShowTeksLafadz] = useState(true);
  const [targetSetSuccess, setTargetSetSuccess] = useState(false);

  const playerRef = useRef<HTMLDivElement>(null);

  // Ambil hanya video aktif
  const activeVideos = useMemo(() => {
    return adzanVideos.filter(v => v.isActive);
  }, [adzanVideos]);

  // Video yang sedang diputar di player utama
  const currentVideo = useMemo(() => {
    if (activeVideoId) {
      const found = activeVideos.find(v => v.id === activeVideoId);
      if (found) return found;
    }
    return activeVideos[0] || null;
  }, [activeVideoId, activeVideos]);

  // Bocil yang sedang aktif dipilih
  const currentBocil = useMemo(() => {
    if (!selectedBocilId) return null;
    return participants.find(p => String(p.id) === String(selectedBocilId)) || null;
  }, [selectedBocilId, participants]);

  // Irama target si anak saat ini
  const currentTargetIrama = useMemo(() => {
    if (!currentBocil) return null;
    return currentBocil.target_irama || localStorage.getItem(`bocil_target_irama_${currentBocil.id}`) || null;
  }, [currentBocil]);

  // Sync bocil_id jika berubah di tab lain atau dashboard
  useEffect(() => {
    const handleStorage = () => {
      const id = localStorage.getItem('bocil_id');
      if (id) setSelectedBocilId(id);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleSelectBocil = (id: string) => {
    setSelectedBocilId(id);
    if (id) {
      localStorage.setItem('bocil_id', id);
    } else {
      localStorage.removeItem('bocil_id');
    }
  };

  // Pilih Video untuk diputar
  const handleSelectVideo = (video: AdzanVideo) => {
    setActiveVideoId(video.id);
    // Smooth scroll ke atas player
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Tetapkan video saat ini sebagai target irama si anak
  const handleSetTarget = async () => {
    if (!currentBocil || !currentVideo) return;
    const iramaName = `${currentVideo.title} (${currentVideo.muadzin})`;
    await setParticipantTargetIrama(String(currentBocil.id), iramaName);
    setTargetSetSuccess(true);
    setTimeout(() => setTargetSetSuccess(false), 3000);
  };

  // Filter video berdasarkan kategori
  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'Semua') return activeVideos;
    return activeVideos.filter(v => v.category === selectedCategory);
  }, [activeVideos, selectedCategory]);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* ── Top Hero Header ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-sky-400 via-sky-500 to-indigo-500 rounded-3xl p-5 sm:p-7 text-white shadow-toy-sky relative overflow-hidden">
        {/* Dekorasi latar belakang ceria */}
        <div className="absolute -right-6 -bottom-8 text-8xl opacity-15 select-none pointer-events-none" aria-hidden>
          🕌
        </div>
        <div className="absolute right-1/4 -top-6 text-6xl opacity-15 select-none pointer-events-none" aria-hidden>
          🌟
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-extrabold text-xs">
              <span>🎬</span> Studio Latihan Adzan Bocil
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight leading-tight">
              Belajar Irama Adzan Merdu 🌟
            </h1>
            <p className="text-sky-100 text-xs sm:text-sm font-medium max-w-xl leading-relaxed">
              Dengarkan nada muadzin favoritmu, tirukan perlahan bait demi bait, dan jadikan irama pilihanmu saat adzan di masjid!
            </p>
          </div>

          {/* Pemilih Nama Anak (Latihan Sebagai) */}
          <div className="bg-white/10 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 shrink-0 min-w-[240px]">
            <label className="block text-[11px] font-bold text-sky-100 mb-1.5 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Kamu latihan sebagai:
            </label>
            <select
              value={selectedBocilId}
              onChange={e => handleSelectBocil(e.target.value)}
              className="w-full px-3 py-2 text-xs font-black rounded-xl bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sun-400"
            >
              <option value="">-- Pilih Nama Kamu --</option>
              {participants
                .filter(p => p.status === 'aktif')
                .map(p => (
                  <option key={p.id} value={p.id}>
                    👦 {p.nama}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Status Irama Target Saya (Jika anak sudah memilih) ─────────────── */}
      {currentBocil && (
        <div className="bg-white rounded-2xl p-4 border-2 border-sky-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-xl shrink-0">
              🎯
            </div>
            <div>
              <p className="text-xs font-black text-slate-700">
                Target Latihan <span className="text-sky-600">{currentBocil.nama}</span>:
              </p>
              <p className="text-sm font-heading font-extrabold text-slate-900">
                {currentTargetIrama || 'Belum memilih irama target. Pilih video di bawah & klik "Jadikan Irama Latihan Saya"!'}
              </p>
            </div>
          </div>

          {currentTargetIrama && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-xs shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Siap dipraktekkan di masjid!
            </span>
          )}
        </div>
      )}

      {/* ── Pemutar Video Utama (Main Stage) ─────────────────────────────────── */}
      {currentVideo ? (
        <div ref={playerRef} className="bg-white rounded-3xl border-2 border-sky-100 p-4 sm:p-6 shadow-toy space-y-5">
          {/* Video Iframe Container (Responsive 16:9) */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-inner border border-slate-200">
            <iframe
              src={getYoutubeEmbedUrl(currentVideo.youtubeId)}
              title={currentVideo.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Detail Video & Tombol Aksi */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-sky-100 text-sky-700">
                  {currentVideo.category}
                </span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-lg text-xs font-bold',
                    currentVideo.difficulty === 'Mudah'
                      ? 'bg-emerald-100 text-emerald-700'
                      : currentVideo.difficulty === 'Sedang'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                  )}
                >
                  Tingkat: {currentVideo.difficulty}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-800 leading-snug">
                {currentVideo.title}
              </h2>
              <p className="text-sm font-bold text-sky-600 flex items-center gap-1.5">
                <span>🎤 Muadzin:</span> {currentVideo.muadzin}
              </p>
            </div>

            {/* Tombol Jadikan Irama Latihan Saya */}
            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={handleSetTarget}
                disabled={!currentBocil}
                className={cn(
                  'px-4 py-2.5 rounded-2xl font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm',
                  targetSetSuccess
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                    : currentBocil
                    ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-amber-400/30'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
                title={!currentBocil ? 'Pilih nama kamu di bagian atas terlebih dahulu' : 'Jadikan irama latihan'}
              >
                {targetSetSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Berhasil Dipilih!
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 fill-current" /> Jadikan Irama Latihan Saya!
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Lafadz Bacaan Adzan ────────────────────────────────────────── */}
          <div className="border-t-2 border-sky-50 pt-4">
            <button
              onClick={() => setShowTeksLafadz(!showTeksLafadz)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100/80 transition-colors text-slate-800 font-heading font-black text-xs sm:text-sm"
            >
              <span className="flex items-center gap-2">
                <span>📜</span> Lafadz Bacaan Adzan
              </span>
              {showTeksLafadz ? <ChevronUp className="w-5 h-5 text-sky-600" /> : <ChevronDown className="w-5 h-5 text-sky-600" />}
            </button>

            {showTeksLafadz && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-fade-in">
                {ADZAN_TEXTS.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-sky-100 hover:border-sky-300 transition-all shadow-sm hover:shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-black text-[11px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">Lafadz {idx + 1}</span>
                      </div>
                      <p className="font-arabic text-2xl text-right text-slate-900 leading-loose mb-2 font-bold" dir="rtl">
                        {item.arab}
                      </p>
                      <p className="text-sm font-extrabold text-sky-700">{item.latin}</p>
                      <p className="text-xs text-slate-500 italic mt-0.5">"{item.arti}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 text-center border-2 border-sky-100">
          <p className="text-slate-500 font-bold">Belum ada video adzan yang tersedia.</p>
        </div>
      )}

      {/* ── Koleksi Video Lainnya (Grid Pilihan) ────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-heading font-black text-slate-800 flex items-center gap-2">
              <span>📺</span> Pilihan Video Irama Lainnya
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Klik salah satu video untuk memutarnya di atas
            </p>
          </div>

          {/* Kategori Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all duration-150',
                  selectedCategory === cat
                    ? 'bg-sky-500 text-white shadow-toy-sky'
                    : 'bg-white border border-sky-100 text-slate-600 hover:bg-sky-50'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map(video => {
            const isPlaying = currentVideo?.id === video.id;
            const thumb = getYoutubeThumbnail(video.youtubeId);
            return (
              <div
                key={video.id}
                onClick={() => handleSelectVideo(video)}
                className={cn(
                  'bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col group',
                  isPlaying
                    ? 'border-sky-400 ring-2 ring-sky-300 shadow-toy-sky'
                    : 'border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md'
                )}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  <img
                    src={thumb}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => {
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/0.jpg`;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110',
                        isPlaying ? 'bg-sky-500 text-white' : 'bg-white/90 text-sky-600'
                      )}
                    >
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                    </div>
                  </div>

                  {isPlaying && (
                    <div className="absolute top-2 left-2 bg-sky-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow">
                      Sedang Diputar
                    </div>
                  )}

                  <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                    {video.difficulty}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider block mb-1">
                      {video.category}
                    </span>
                    <h4 className="font-heading font-extrabold text-sm text-slate-800 line-clamp-1 group-hover:text-sky-600 transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                      Muadzin: {video.muadzin}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Call To Action: Praktek Langsung di Masjid ─────────────────────── */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-toy flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shrink-0">
            🕌
          </div>
          <div>
            <h3 className="text-lg font-heading font-black leading-tight">
              Sudah Lancar Menirukan Iramanya?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-1">
              Yuk tampil percaya diri dan adzan di masjid! Cek jadwal giliranmu sekarang.
            </p>
          </div>
        </div>

        <NavLink
          to="/"
          className="px-5 py-3 rounded-2xl bg-white text-emerald-800 font-heading font-black text-xs sm:text-sm shadow-md hover:bg-emerald-50 transition-all shrink-0 active:scale-95"
        >
          Lihat Jadwal Adzan 📅
        </NavLink>
      </div>
    </div>
  );
};

