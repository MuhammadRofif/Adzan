-- ════════════════════════════════════════════════════════════════════════════
-- Audit produksi — HANYA MEMBACA. Aman dijalankan kapan saja di SQL Editor.
-- Jalankan per blok dan simpan hasilnya; bagian ini tidak bisa diperiksa dari
-- frontend karena anon key tidak boleh membaca katalog sistem.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Ukuran tabel + indeks (mencari tabel yang paling makan kapasitas)
select c.relname                                    as tabel,
       c.reltuples::bigint                          as perkiraan_baris,
       pg_size_pretty(pg_relation_size(c.oid))      as data,
       pg_size_pretty(pg_indexes_size(c.oid))       as indeks,
       pg_size_pretty(pg_total_relation_size(c.oid)) as total
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname in ('public', 'storage', 'auth', 'realtime') and c.relkind = 'r'
 order by pg_total_relation_size(c.oid) desc
 limit 25;

-- 2. Ukuran database keseluruhan (batas paket Free = 500 MB)
select pg_size_pretty(pg_database_size(current_database())) as ukuran_database;

-- 3. Ukuran Storage (foto avatar) per bucket — dihitung terpisah dari database (batas Free = 1 GB)
select bucket_id, count(*) as jumlah_file,
       pg_size_pretty(sum((metadata->>'size')::bigint)) as total
  from storage.objects group by bucket_id;

-- 4. Kebijakan RLS yang aktif (cari policy "allow all" untuk anon)
select tablename, policyname, roles, cmd, qual, with_check
  from pg_policies where schemaname = 'public' order by tablename, policyname;

select relname as tabel, relrowsecurity as rls_aktif
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r' order by 1;

-- 5. Foreign key dengan ON DELETE CASCADE (menghapus peserta/season = ikut hapus riwayat)
select con.conrelid::regclass as tabel, con.conname, pg_get_constraintdef(con.oid) as definisi
  from pg_constraint con
 where con.contype = 'f' and con.confdeltype = 'c'
   and con.connamespace = 'public'::regnamespace;

-- 6. Trigger buatan pengguna
select event_object_table as tabel, trigger_name, action_timing, event_manipulation, action_statement
  from information_schema.triggers where trigger_schema = 'public' order by 1, 2;

-- 7. Cron job / cleanup otomatis (pg_cron). Error "relation does not exist" = pg_cron tidak dipasang.
select jobid, schedule, command, active from cron.job;
select jobid, status, start_time, left(return_message, 200) as pesan
  from cron.job_run_details order by start_time desc limit 50;

-- 8. Fungsi buatan pengguna (cari fungsi yang menghapus data)
select p.proname, pg_get_function_arguments(p.oid) as argumen,
       position('delete' in lower(pg_get_functiondef(p.oid))) > 0 as mengandung_delete
  from pg_proc p where p.pronamespace = 'public'::regnamespace order by 1;

-- 9. Tabel yang dipancarkan Realtime
select * from pg_publication_tables where pubname = 'supabase_realtime';
select pubname, puballtables from pg_publication;

-- 10. Query paling berat (butuh ekstensi pg_stat_statements; aktif default di Supabase)
select calls, round(total_exec_time)::bigint as total_ms, round(mean_exec_time::numeric, 1) as rata_ms,
       rows, left(query, 160) as query
  from pg_stat_statements
 order by total_exec_time desc limit 20;

-- 11. Jejak penghapusan massal: statistik tuple mati per tabel sejak reset statistik
select relname, n_live_tup, n_dead_tup, n_tup_del, last_autovacuum, last_vacuum
  from pg_stat_user_tables order by n_tup_del desc;

-- 12. Setelah migrasi 001: cek konsistensi saldo vs ledger (harus kosong kecuali catatan bonus ganda)
-- (jalankan sebagai admin yang login, atau di SQL Editor dengan role postgres)
-- select * from public.reconcile_points();
