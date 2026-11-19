import React, { useState, useMemo } from 'react';
import { Video, Plus, Play, Trash2, Edit2, ToggleLeft, ToggleRight, ExternalLink, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge, SectionHeader, Input, Select, ConfirmDialog, EmptyState } from '../components/ui/index';
import { AdzanVideo } from '../../shared/types';
import { extractYoutubeId, getYoutubeThumbnail, getYoutubeEmbedUrl } from '../utils/youtube';
import { cn } from '../utils/cn';

const CATEGORY_OPTIONS = [
  'Semua',
  'Makkah & Madinah',
  'Hijaz',
  'Muadzin Cilik',
  'Khusus Subuh',
  'Rost & Nahawand',
  'Umum',
];

const DIFFICULTY_OPTIONS = [
  { value: 'Mudah', label: '⭐ Mudah (Pemula)' },
  { value: 'Sedang', label: '⭐⭐ Sedang' },
  { value: 'Mahir', label: '⭐⭐⭐ Mahir' },
];

export const VideosPage: React.FC = () => {
  const { adzanVideos, addAdzanVideo, updateAdzanVideo, toggleVideoActive, deleteAdzanVideo } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<AdzanVideo | null>(null);
  const [previewVideo, setPreviewVideo] = useState<AdzanVideo | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [muadzin, setMuadzin] = useState('');
  const [category, setCategory] = useState('Makkah & Madinah');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [difficulty, setDifficulty] = useState<'Mudah' | 'Sedang' | 'Mahir'>('Mudah');
  const [orderIndex, setOrderIndex] = useState(0);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const liveYoutubeId = useMemo(() => extractYoutubeId(youtubeUrl), [youtubeUrl]);

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingVideo(null);
    setTitle('');
    setMuadzin('');
    setCategory('Makkah & Madinah');
    setYoutubeUrl('');
    setDifficulty('Mudah');
    setOrderIndex(adzanVideos.length + 1);
    setDescription('');
    setIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (video: AdzanVideo) => {
    setEditingVideo(video);
    setTitle(video.title);
    setMuadzin(video.muadzin);
    setCategory(video.category || 'Makkah & Madinah');
    setYoutubeUrl(video.youtubeUrl);
    setDifficulty(video.difficulty);
    setOrderIndex(video.orderIndex ?? 0);
    setDescription(video.description || '');
    setIsActive(video.isActive);
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !muadzin.trim() || !youtubeUrl.trim()) {
      setFormError('Mohon isi Judul, Nama Muadzin, dan Link YouTube!');
      return;
    }

    const ytId = extractYoutubeId(youtubeUrl);
    if (!ytId) {
      setFormError('Link YouTube tidak valid. Masukkan URL YouTube atau ID video yang benar.');
      return;
    }

    if (editingVideo) {
      const ok = await updateAdzanVideo(editingVideo.id, {
        title: title.trim(),
        muadzin: muadzin.trim(),
        category,
        youtubeUrl: youtubeUrl.trim(),
        youtubeId: ytId,
        difficulty,
        orderIndex: Number(orderIndex) || 0,
        description: description.trim(),
        isActive,
      });
      if (ok) setIsModalOpen(false);
    } else {
      const ok = await addAdzanVideo({
        title: title.trim(),
        muadzin: muadzin.trim(),
        category,
        youtubeUrl: youtubeUrl.trim(),
        youtubeId: ytId,
        difficulty,
        orderIndex: Number(orderIndex) || 0,
        description: description.trim(),
        isActive,
      });
      if (ok) setIsModalOpen(false);
    }
  };

  // Filtered video list
  const filteredVideos = useMemo(() => {
    return adzanVideos.filter(v => {
      const matchSearch =
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        v.muadzin.toLowerCase().includes(search.toLowerCase()) ||
        (v.category && v.category.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = selectedCategory === 'Semua' || v.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [adzanVideos, search, selectedCategory]);

  const activeCount = adzanVideos.filter(v => v.isActive).length;
  const categoriesCount = useMemo(() => new Set(adzanVideos.map(v => v.category)).size, [adzanVideos]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 font-heading tracking-tight flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </span>
            Koleksi Video Latihan Adzan
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola referensi video dan rekaman adzan untuk panduan belajar anak-anak di masjid
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="flex items-center gap-2 shadow-lg shadow-primary-500/20">
          <Plus className="w-4 h-4" /> Tambah Video Baru
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black text-xl">
            🎬
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 font-heading">{adzanVideos.length}</div>
            <div className="text-xs text-gray-500 font-medium">Total Koleksi Video</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl">
            ✅
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 font-heading">{activeCount}</div>
            <div className="text-xs text-gray-500 font-medium">Video Aktif (Tampil di Bocil)</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xl">
            🕌
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 font-heading">{categoriesCount}</div>
            <div className="text-xs text-gray-500 font-medium">Variasi Irama & Kategori</div>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORY_OPTIONS.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                selectedCategory === cat
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul atau muadzin..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Video Grid List */}
      {filteredVideos.length === 0 ? (
        <EmptyState
          icon={<Video className="w-12 h-12 text-gray-300" />}
          title="Belum Ada Video"
          description={
            search || selectedCategory !== 'Semua'
              ? 'Tidak ada video yang cocok dengan pencarian atau filter yang dipilih.'
              : 'Belum ada video adzan yang ditambahkan. Klik tombol di atas untuk menambah!'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVideos.map(video => {
            const thumbUrl = getYoutubeThumbnail(video.youtubeId);
            return (
              <div
                key={video.id}
                className={cn(
                  'bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md',
                  video.isActive ? 'border-gray-100' : 'border-gray-200 opacity-70 bg-gray-50/50'
                )}
              >
                {/* Thumbnail with overlay play */}
                <div className="relative aspect-video bg-slate-900 group cursor-pointer overflow-hidden" onClick={() => setPreviewVideo(video)}>
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => {
                        // Fallback jika maxresdefault tidak ada
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/0.jpg`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Video className="w-10 h-10" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 text-primary-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-current translate-x-0.5" />
                    </div>
                  </div>

                  {/* Badges on Thumbnail */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/60 text-white backdrop-blur-sm">
                      {video.category}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-sm',
                        video.difficulty === 'Mudah'
                          ? 'bg-emerald-500/90 text-white'
                          : video.difficulty === 'Sedang'
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-rose-500/90 text-white'
                      )}
                    >
                      {video.difficulty}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-heading font-extrabold text-base text-gray-900 leading-snug line-clamp-1">
                        {video.title}
                      </h3>
                    </div>

                    <p className="text-xs font-semibold text-primary-600 flex items-center gap-1 mb-2">
                      <span>🎤</span> {video.muadzin}
                    </p>

                    {video.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                        {video.description}
                      </p>
                    )}
                  </div>

                  {/* Card Actions Bottom */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleVideoActive(video.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
                        title={video.isActive ? 'Nonaktifkan video' : 'Aktifkan video'}
                      >
                        {video.isActive ? (
                          <ToggleRight className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                        <span className="text-[11px]">{video.isActive ? 'Aktif' : 'Draft'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(video)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="Edit video"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(video.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Tambah / Edit Video */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVideo ? 'Edit Video Latihan Adzan' : 'Tambah Video Latihan Adzan'}
      >
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Judul Video <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Adzan Makkah Al-Mukarramah"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nama Muadzin / Qari <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Syaikh Ali Mulla"
                value={muadzin}
                onChange={e => setMuadzin(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Kategori Irama
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="Makkah & Madinah">Makkah & Madinah</option>
                <option value="Hijaz">Hijaz (Semangat & Tegas)</option>
                <option value="Muadzin Cilik">Muadzin Cilik (Ramah Anak)</option>
                <option value="Khusus Subuh">Khusus Subuh (Tatswib)</option>
                <option value="Rost & Nahawand">Rost & Nahawand (Merdu)</option>
                <option value="Umum">Umum</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Link YouTube (URL atau ID) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Mendukung link video YouTube biasa, YouTube Shorts, atau link Share.
            </p>
          </div>

          {/* Live Preview Thumbnail saat mengetik YouTube URL */}
          {liveYoutubeId && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <img
                src={getYoutubeThumbnail(liveYoutubeId)}
                alt="Preview"
                className="w-24 aspect-video object-cover rounded-lg shadow-sm border border-slate-200"
                onError={e => {
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${liveYoutubeId}/0.jpg`;
                }}
              />
              <div className="text-xs text-slate-600">
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  ✓ ID Terdeteksi: <code className="bg-white px-1.5 py-0.5 rounded border">{liveYoutubeId}</code>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Video ini akan langsung bisa diputar di web.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tingkat Kesulitan
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                {DIFFICULTY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Urutan Tampil (No. Urut)
              </label>
              <input
                type="number"
                min={0}
                value={orderIndex}
                onChange={e => setOrderIndex(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Deskripsi / Keterangan (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Keterangan singkat video adzan ini..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-bold text-gray-700 cursor-pointer">
              Tampilkan langsung di halaman anak-anak (Status Aktif)
            </label>
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">
              {editingVideo ? 'Simpan Perubahan' : 'Tambah Video'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Preview Video Player */}
      <Modal
        isOpen={!!previewVideo}
        onClose={() => setPreviewVideo(null)}
        title={previewVideo ? previewVideo.title : 'Preview Video'}
      >
        {previewVideo && (
          <div className="space-y-4">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
              <iframe
                src={getYoutubeEmbedUrl(previewVideo.youtubeId)}
                title={previewVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-primary-600">🎤 {previewVideo.muadzin}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-white border border-gray-200 text-gray-700">
                  {previewVideo.category}
                </span>
              </div>

              {previewVideo.description && (
                <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                  {previewVideo.description}
                </p>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={previewVideo.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Buka di YouTube <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <Button onClick={() => setPreviewVideo(null)}>Tutup</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            deleteAdzanVideo(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        title="Hapus Video Adzan?"
        message="Video ini akan dihapus dari koleksi latihan adzan anak-anak. Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Video"
      />
    </div>
  );
};

