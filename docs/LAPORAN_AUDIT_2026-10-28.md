# Laporan Audit & Optimasi — Adzan Challenge (28 Okt 2026)

## 1. Kondisi awal

| Aspek | Temuan |
|---|---|
| Stack | React 18 + Vite + Tailwind, Supabase (REST + Realtime + Storage), deploy Vercel. Backend Express di `src/backend` tidak dipakai produksi. |
| Database | ±2.300 baris total (transactions 1.127, quiz_attempts 941, sisanya < 110 per tabel). Payload seluruh tabel ±358 KB mentah → **database jauh dari batas 500 MB**. |
| Saldo poin | **Tidak disimpan di mana pun.** Dihitung ulang di browser dari `adzan_log` + `attendance_log` + `quiz_attempts` + `transactions(adjustment)` − `redeem_history(approved)` setiap halaman dibuka. |
| Keamanan | Password admin `rofif123` tertanam di bundle JS; "login" hanya `sessionStorage`. Semua tulis/hapus memakai anon key → siapa pun bisa menambah/menghapus poin dari devtools (script di `scripts/` dan `check_pemanasan.mjs` membuktikan DELETE berhasil dengan anon key). |
| Realtime | Satu langganan untuk **seluruh skema public**; setiap perubahan apa pun → setiap browser yang terbuka me-reload **semua** tabel (±358 KB mentah / ±50 KB gzip per event per pengunjung). |
| Foto avatar | Disimpan apa adanya dari kamera: **hingga 2,7 MB per foto, ±14,8 MB diunduh setiap kunjungan beranda**. Setiap unggah ulang membuat file baru (nama acak), file lama tidak pernah dihapus. |
| Jadwal salat | Tidak ada (hanya jadwal petugas adzan). Tanggal Hijriah di header berupa teks statis "24 Syaban 1445 H". |

## 2. Penyebab poin bocil berkurang

Dari data yang tersisa (dibaca read-only) dan riwayat git:

1. **Desain:** karena saldo = hasil hitung ulang dari log, *menghapus baris log mana pun langsung mengurangi saldo*. Tidak ada saldo persisten yang bisa menahannya.
2. **Semua data sebelum 2026-07-02 terhapus** di semua tabel log (baris tertua di setiap tabel tepat 2026-07-02, hari dimulainya Season 2). Script yang menjalankan penghapusan massal ini **tidak ada di repo**. Dampaknya:
   - Saldo Season 2 *tidak* ikut turun, karena memang hanya menghitung data Season 2.
   - **Poin total sepanjang masa (`grossTotal`, papan admin) anjlok**, contoh Rega: 1.974 (Season 1) hilang dari total.
   - Log harian Season 1 hilang permanen.
3. **`check_pemanasan.mjs` (commit 3430335, 3 Jul 2026)** berisi DELETE data Season 2 untuk Iqbal (id 4) dan Rama (id 19) — transaksi, latihan, quiz — serta transaksi redeem Iqbal Adek Akmal (id 6). Jika dijalankan, saldo mereka langsung berkurang. Versi yang belum di-commit menghapus `redeem_history` mereka. Tidak ada log yang bisa memastikan apakah/kapan script dijalankan.
4. **Integritas transaksi:** tidak ada idempotensi. Terbukti ada bonus ganda — Radit menerima "Bonus Naik Pangkat: Letnan Ibadah +30" dua kali (27 Agu 01:21 & 01:22). Epin: ledger quiz 2 poin lebih besar daripada `quiz_attempts` (719 vs 717).

**Tentang "kapasitas penuh":** ukuran database tidak mungkin penuh (< 1 MB data). Kemungkinan besar yang habis adalah **kuota egress/bandwidth** (Free: 5 GB/bulan): ±15 MB avatar per kunjungan ditambah reload semua tabel di semua browser untuk setiap event realtime. Ini **perkiraan** — mohon cek *Supabase Dashboard → Usage* (Egress, Realtime messages, Storage) untuk memastikan. Kapasitas penuh sendiri tidak menghapus data; penghapusan terjadi lewat script.

## 3. Status pemulihan data

| Data | Status |
|---|---|
| Poin akhir Season 1 per anak | **Pulih.** Tersimpan di `season_history` (21 baris, dicatat 3 Jul 2026). Sekarang dihitung ke poin sepanjang masa. |
| Log harian sebelum 2 Jul 2026 | **Tidak bisa dipulihkan.** Tidak ada backup (paket Free tidak menyediakan backup yang bisa diunduh), tidak ada sumber lain. Tidak dikarang. |
| Saldo Season 2 | Utuh dan konsisten: ledger `transactions` = log sumber untuk 22 dari 23 anak. |
| Epin (+2) & bonus ganda Radit (+30) | Ditandai oleh `reconcile_points()`. **Keputusan admin** — koreksi lewat `admin_adjust_points()` bila diinginkan. |

## 4. Perbaikan sistem poin (migrasi 001)

- `transactions` menjadi **ledger append-only**: trigger memblokir UPDATE/DELETE; FK ke peserta diubah dari CASCADE ke RESTRICT.
- `point_balances`: saldo per anak per season, diperbarui **atomik** (satu upsert dalam trigger) setiap baris ledger masuk. Menghapus/mengarsip log aktivitas tidak mengubah saldo.
- `idempotency_key` unik + advisory lock → klik ganda / retry jaringan tidak menggandakan poin; bonus pangkat maksimal sekali per level per season.
- Semua poin dihitung **di server** lewat RPC: `record_activity`, `submit_quiz` (skor dari kunci jawaban di DB; soal tak terjawab tidak lagi dihitung "0" yang bisa kebetulan benar), `award_game_win` (catur, maks. 5×/hari), `request_redeem` (cek saldo + poin yang sedang dipesan), `process_redeem`, `admin_adjust_points`, `end_season`.
- `reconcile_points()` membandingkan saldo tersimpan vs ledger (+arsip); `archive_ledger()` memindahkan ledger > 90 hari ke arsip tanpa mengubah saldo; `storage_report()` untuk pemantauan ukuran.
- Backfill tidak mengarang angka: saldo awal = agregat ledger yang ada.

## 5. Keamanan (migrasi 002 + frontend)

- Login admin via **Supabase Auth** + tabel `app_admins` (dicek server). Password hard-coded dihapus.
- RLS: anon hanya **baca** data publik + panggil RPC publik. Tulis langsung ke ledger/quiz/redeem dicabut untuk semua role; tabel lain hanya admin. Storage `media`: unggah/hapus hanya admin.
- Tidak ada service role key di frontend/repo (dicek: hanya anon key di `.env`).

## 6. UI/UX ramah anak

- Palet baru: biru langit, mint, kuning matahari, putih; font Nunito (isi) + Baloo 2 (judul); tombol & kartu bergaya "mainan" (sudut besar, bayangan tebal, mengecil saat ditekan).
- Hero baru dengan ilustrasi SVG inline (masjid, awan, matahari/bulan sabit & bintang; versi malam otomatis).
- **Jadwal salat + hitung mundur** (Loa Kulu, WITA, metode Kemenag, dihitung offline — 0 request), menampilkan petugas adzan untuk salat berikutnya.
- Kartu profil: level "6 dari 11", progress bar ke pangkat berikutnya, lencana pangkat yang diraih + juara season lalu, statistik adzan/sholawat/latihan/quiz, target hadiah berikutnya ("334 poin lagi untuk Paket 140 Diamond").
- Pemilih nama berupa kartu foto yang bisa diketuk (sebelumnya dropdown).
- Navigasi: tab bar bawah besar di HP, pil menu di desktop. Tanggal Hijriah asli via `Intl` (Umm al-Qura).
- Riwayat poin dari ledger dengan pagination 30 baris.
- Halaman Hadiah menampilkan poin yang sedang menunggu persetujuan.
- Aksesibilitas: fokus keyboard jelas, `prefers-reduced-motion` dihormati, label ARIA pada timer/progress.

## 7. Optimasi performa — hasil ukur

Diukur dengan build produksi + Chrome headless (cache dimatikan), emulasi HP 390 px, data produksi asli.

| Metrik | Sebelum | Sesudah |
|---|---|---|
| JS+CSS halaman `/` (gzip) | 163,6 KB / 8 file | 165,7 KB / 9 file (+2,1 KB untuk jadwal salat, ilustrasi, lencana; confetti 4,2 KB kini lazy) |
| REST Supabase saat buka `/` (byte transfer) | 50,3 KB | 30,7 KB (−39%) |
| `transactions` saat buka `/` | 21,0 KB (semua baris, semua kolom) | 0,9 KB view saldo (+1,3 KB fallback sebelum migrasi; 0 setelah migrasi) |
| Per event realtime, per pengunjung | reload semua tabel ±50 KB gzip | INSERT diterapkan dari payload (±0,3 KB); tabel lain reload hanya tabel itu |
| Event saat tab tidak terlihat | diproses | diabaikan, sekali segarkan saat kembali |
| Avatar per kunjungan | ±14,8 MB (sampai 2,7 MB/foto) | ±15 KB/foto setelah admin klik **Pengaturan → Optimalkan foto** (perkiraan 256 px WebP; belum diukur di produksi) |
| Dependensi | framer-motion terpasang & dipaksa ke chunk vendor, tidak dipakai | dihapus |

Lainnya: query log dibatasi ke season aktif dan kolom yang dipakai saja (tanpa `answers` jsonb), quiz/paket/saldo di-cache di localStorage (stale-while-revalidate), `loading="lazy"` untuk semua gambar, detik hitung mundur hanya me-render ulang kartunya sendiri, tidak ada lagi reload ganda (aksi + realtime). Unggahan avatar baru otomatis dikecilkan dan menimpa file lama.

Chunk admin `Dashboard` (118 KB gzip, recharts) tidak berubah; hanya dimuat di halaman admin.

## 8. Pengujian

**Migrasi (PGlite/Postgres 16, skema mirip produksi + snapshot data asli): 50/50 lulus** — `npm run db:snapshot && npm run test:db`. Mencakup: backfill = saldo tampilan lama, idempoten dijalankan ulang, klik ganda, bonus sekali per level, hapus log tidak mengubah saldo, DELETE/UPDATE ledger diblokir, arsip tanpa selisih, skor quiz server + batas harian + jawaban kosong, batas catur, redeem saldo kurang/setujui 2×, ganti season, hak akses anon/admin/user biasa sebelum & sesudah 002.

**Frontend:** `tsc --noEmit` bersih, build sukses, beranda diuji di Chrome headless (HP 390 px & desktop 1280 px) dengan data produksi: tidak ada error console, tidak ada overflow horizontal, mode fallback (sebelum migrasi) menampilkan saldo yang sama dengan versi lama.

**Belum diuji (perlu dilakukan setelah deploy):** konkurensi sungguhan antar-koneksi (PGlite satu koneksi; dijamin oleh advisory lock + upsert, standar Postgres), realtime live, login/logout admin di produksi, halaman admin secara visual, alur quiz/catur/redeem end-to-end di produksi.

## 9. Risiko tersisa & rekomendasi

- Anak tidak login (memilih nama) — siapa pun tetap bisa mengerjakan quiz atas nama anak lain; dibatasi aturan poin harian. Kunci jawaban quiz masih terbaca publik (dipakai untuk umpan balik di layar).
- Hapus/arsipkan script berbahaya (`scripts/delete_pemanasan.ts`, `reset_chess_points.ts`, `check_pemanasan.mjs`); setelah 002 mereka otomatis gagal.
- Pemantauan: cek *Usage* Supabase tiap bulan; jalankan `select * from storage_report();` dan `select * from reconcile_points();` (atau tombol di Pengaturan) setiap bulan / sebelum menutup season.
- Backup: paket Free tidak punya backup — jalankan `npm run db:snapshot` (atau `pg_dump`) secara rutin, misalnya sebelum menutup season.
- Retensi: dengan ukuran sekarang **tidak perlu menghapus apa pun**. Bila nanti perlu, gunakan `archive_ledger()`, bukan DELETE.
- Setelah foto dioptimalkan dan dicek, file asli lama di bucket `media/avatars/*-0.*.jpg|png` bisa dihapus manual untuk menghemat Storage.
