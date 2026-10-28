-- ════════════════════════════════════════════════════════════════════════════
-- 002 · Kunci akses tulis (RLS)
--
-- JALANKAN SETELAH:
--   1. Migrasi 001 sukses,
--   2. Frontend baru sudah ter-deploy (login admin via Supabase Auth),
--   3. Akun admin dibuat & didaftarkan:
--        insert into public.app_admins (user_id, note)
--        select id, 'admin utama' from auth.users where email = '<email-admin>';
--
-- Setelah ini, anon key di browser HANYA bisa membaca data publik dan memanggil
-- RPC publik (submit_quiz, request_redeem, award_game_win). Tambah/hapus poin
-- langsung dari devtools atau script ber-anon-key tidak lagi mungkin.
--
-- Rollback darurat (membuka kembali akses lama) ada di bagian paling bawah.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- Pengaman: jangan kunci kalau belum ada admin, nanti tidak ada yang bisa mencatat poin.
do $$
begin
  if not exists (select 1 from public.app_admins) then
    raise exception 'Belum ada admin di public.app_admins. Daftarkan akun admin dulu.';
  end if;
end $$;

-- Hapus semua policy lama di tabel aplikasi agar tidak ada policy "allow all" tersisa.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
     where schemaname = 'public'
       and tablename in ('participants','adzan_log','attendance_log','transactions','redeem_packages',
                         'redeem_history','quizzes','quiz_attempts','seasons','season_history',
                         'adzan_schedule','budget_settings')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

do $$
declare t text;
begin
  -- Data publik: semua orang boleh baca, hanya admin yang boleh menulis langsung.
  foreach t in array array['participants','adzan_log','attendance_log','redeem_packages','quizzes',
                           'seasons','season_history','adzan_schedule']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "publik baca" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "admin tulis" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;

  -- Data yang hanya boleh ditulis lewat RPC (fungsi security definer).
  foreach t in array array['transactions','quiz_attempts','redeem_history']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "publik baca" on public.%I for select to anon, authenticated using (true)', t);
    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
  end loop;

  -- Khusus admin.
  alter table public.budget_settings enable row level security;
  create policy "admin saja" on public.budget_settings for all to authenticated
    using (public.is_admin()) with check (public.is_admin());
end $$;

-- Tidak ada yang boleh TRUNCATE tabel aplikasi dari API.
revoke truncate on all tables in schema public from anon, authenticated;

-- Storage foto profil: baca publik, unggah/hapus hanya admin.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'objects') then
    execute 'drop policy if exists "media publik baca" on storage.objects';
    execute 'drop policy if exists "media admin tulis" on storage.objects';
    execute $p$create policy "media publik baca" on storage.objects for select to anon, authenticated
              using (bucket_id = 'media')$p$;
    execute $p$create policy "media admin tulis" on storage.objects for all to authenticated
              using (bucket_id = 'media' and public.is_admin())
              with check (bucket_id = 'media' and public.is_admin())$p$;
  end if;
end $$;

commit;

-- ─── ROLLBACK DARURAT (jangan dijalankan kecuali perlu) ──────────────────────
-- Membuka kembali tulis untuk anon seperti kondisi lama. Ledger tetap append-only.
--
-- do $$ declare t text; begin
--   foreach t in array array['participants','adzan_log','attendance_log','transactions','redeem_packages',
--                            'redeem_history','quizzes','quiz_attempts','seasons','season_history',
--                            'adzan_schedule','budget_settings'] loop
--     execute format('create policy "rollback anon" on public.%I for all to anon, authenticated using (true) with check (true)', t);
--     execute format('grant insert, update on public.%I to anon, authenticated', t);
--   end loop; end $$;
