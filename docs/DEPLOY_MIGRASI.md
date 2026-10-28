# Panduan Deploy Migrasi Poin & Keamanan

Urutan ini penting. Langkah 1–4 tidak mengubah perilaku untuk anak-anak.

1. **Backup dulu**
   `npm run db:snapshot` → salinan JSON semua tabel di `supabase/tests/snapshot.json` (tidak di-commit).
   Opsional: `pg_dump` dengan connection string dari *Project Settings → Database*.
2. **Audit (read-only)** — jalankan `supabase/audit/inspect_production.sql` per blok di SQL Editor, simpan hasilnya. Perhatikan blok 4 (policy), 5 (cascade), 7 (cron).
3. **Migrasi 001** — tempel seluruh `supabase/migrations/20261028000001_points_ledger.sql` ke SQL Editor → Run.
   Cek: `select * from reconcile_points();` → seharusnya hanya baris catatan bonus ganda Radit.
4. **Buat akun admin** — *Authentication → Users → Add user* (email + password kuat), lalu:
   ```sql
   insert into public.app_admins (user_id, note)
   select id, 'admin utama' from auth.users where email = 'EMAIL-ADMIN';
   ```
5. **Deploy frontend** (push ke Vercel). Uji: login `/login`, catat 1 adzan, kerjakan 1 quiz, buka Pengaturan → "Cek rekonsiliasi".
6. **Migrasi 002** — jalankan `supabase/migrations/20261028000002_lockdown_rls.sql`. Uji lagi langkah 5. (Rollback darurat ada di bawah file.)
7. **Pengaturan → Optimalkan foto** (sekali).
8. Opsional: koreksi Epin/Radit bila diputuskan, misalnya:
   `select admin_adjust_points(8, -30, 'bonus Letnan Ibadah tercatat ganda 27 Agu', 'fix-radit-bonus-2026');` (dari SQL Editor).

Jika frontend ter-deploy sebelum langkah 3, halaman anak tetap tampil (mode fallback), tetapi mencatat poin akan menampilkan pesan "Database belum diperbarui".
