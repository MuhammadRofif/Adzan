-- ════════════════════════════════════════════════════════════════════════════
-- 001 · Ledger poin + saldo persisten + RPC atomik
--
-- Sifat migrasi: ADITIF. Tidak menghapus/mengubah data yang sudah ada,
-- frontend lama tetap berjalan (trigger ikut mencatat insert langsung ke
-- `transactions`). Jalankan di Supabase SQL Editor dalam satu kali eksekusi.
--
-- Inti perubahan:
--   • `transactions` menjadi ledger APPEND-ONLY (UPDATE/DELETE diblokir).
--   • `point_balances` = saldo per anak per season, diperbarui ATOMIK oleh
--     trigger setiap ada baris ledger baru. Menghapus/mengarsip log aktivitas
--     (adzan_log, attendance_log, quiz_attempts, …) TIDAK mengubah saldo.
--   • `idempotency_key` unik → klik ganda / retry jaringan tidak menggandakan poin.
--   • Semua penambahan poin lewat fungsi RPC yang menghitung poin DI SERVER.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ─── 0. Admin ──────────────────────────────────────────────────────────────
create table if not exists public.app_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid());
$$;

create or replace function public.assert_admin()
returns void
language plpgsql stable security definer
set search_path = public
as $$
begin
  -- session_user 'postgres' = SQL Editor dashboard; request API selalu 'authenticator'.
  if not (public.is_admin() or session_user = 'postgres') then
    raise exception 'Hanya admin yang boleh melakukan aksi ini' using errcode = '42501';
  end if;
end $$;

-- ─── 1. Tabel pangkat (cermin dari PANGKAT_LEVELS di src/shared/types.ts) ──
create table if not exists public.pangkat_levels (
  min_points int primary key,
  title      text not null,
  emoji      text not null,
  bonus      int  not null default 0
);

insert into public.pangkat_levels (min_points, title, emoji, bonus) values
  (0,    'Prajurit Masjid', '⭐',     0),
  (100,  'Kopral Adzan',    '⭐⭐',   10),
  (250,  'Sersan Sholat',   '🌟',    20),
  (500,  'Letnan Ibadah',   '🌟🌟',  30),
  (800,  'Kapten Dakwah',   '🏅',    40),
  (1200, 'Mayor Muadzin',   '👑',    50),
  (1800, 'Jenderal Masjid', '🌅',    100),
  (2500, 'Panglima Subuh',  '⚔️',    150),
  (3500, 'Ksatria Masjid',  '🦸‍♂️',  200),
  (5000, 'Pahlawan Masjid', '🏆',    300),
  (7500, 'Legenda Muadzin', '🕌',    500)
on conflict (min_points) do update
  set title = excluded.title, emoji = excluded.emoji, bonus = excluded.bonus;

-- ─── 2. Kolom ledger pada `transactions` ──────────────────────────────────
alter table public.transactions
  add column if not exists category        text,
  add column if not exists season_id       uuid references public.seasons(id) on delete restrict,
  add column if not exists idempotency_key text,
  add column if not exists source_table    text,
  add column if not exists source_id       bigint;

create unique index if not exists transactions_idempotency_key_uq on public.transactions (idempotency_key);
create index if not exists transactions_participant_ts_idx on public.transactions (participant_id, "timestamp" desc);
create index if not exists transactions_season_participant_idx on public.transactions (season_id, participant_id);

alter table public.quiz_attempts add column if not exists idempotency_key text;
create unique index if not exists quiz_attempts_idempotency_key_uq on public.quiz_attempts (idempotency_key);
create index if not exists quiz_attempts_participant_quiz_ts_idx on public.quiz_attempts (participant_id, quiz_id, completed_at desc);

create index if not exists adzan_log_date_idx       on public.adzan_log (date desc);
create index if not exists attendance_log_date_idx  on public.attendance_log (date desc);
create index if not exists redeem_history_status_idx on public.redeem_history (status, requested_at desc);

-- Kategori ledger dari data lama (type + points + reason).
create or replace function public.ledger_category(p_type text, p_points int, p_reason text)
returns text language sql immutable as $$
  select case
    when p_type = 'adzan' and p_points = 8                    then 'sholawat_iqomah'
    when p_type = 'adzan'                                    then 'adzan'
    when p_type = 'attendance'                               then 'attendance'
    when p_type = 'quiz'                                     then 'quiz'
    when p_type = 'redeem'                                   then 'redeem'
    when p_type = 'adjustment' and p_reason like 'Bonus Naik Pangkat%' then 'bonus'
    when p_type = 'adjustment' and p_reason ilike '%catur%'  then 'game'
    else 'adjustment'
  end;
$$;

-- Season yang mencakup sebuah waktu. Batas akhir eksklusif, sehingga hari
-- pergantian season (end_date season lama = start_date season baru) masuk
-- ke season BARU — sama dengan perilaku frontend lama.
create or replace function public.season_for(p_at timestamptz)
returns uuid language sql stable
set search_path = public
as $$
  select id from public.seasons
   where start_date <= p_at and (end_date is null or end_date > p_at)
   order by start_date desc
   limit 1;
$$;

create or replace function public.active_season_id()
returns uuid language sql stable
set search_path = public
as $$
  select coalesce(
    (select id from public.seasons where end_date is null order by start_date desc limit 1),
    (select id from public.seasons order by start_date desc limit 1)
  );
$$;

-- ─── 3. Saldo persisten ───────────────────────────────────────────────────
create table if not exists public.point_balances (
  participant_id        bigint not null references public.participants(id) on delete restrict,
  season_id             uuid   not null references public.seasons(id) on delete restrict,
  balance               int    not null default 0,  -- saldo bisa dipakai (sudah dikurangi redeem)
  earned                int    not null default 0,  -- total poin masuk (tanpa redeem)
  spent                 int    not null default 0,  -- total poin redeem (angka positif)
  adzan_points          int    not null default 0,  -- adzan + sholawat/iqomah
  attendance_points     int    not null default 0,
  quiz_points           int    not null default 0,
  bonus_points          int    not null default 0,  -- bonus pangkat + catur + koreksi admin
  adzan_count           int    not null default 0,
  sholawat_iqomah_count int    not null default 0,
  attendance_count      int    not null default 0,
  quiz_count            int    not null default 0,
  updated_at            timestamptz not null default now(),
  primary key (participant_id, season_id)
);

-- Arsip ledger. Hanya diisi oleh archive_ledger(); saldo tidak berubah.
create table if not exists public.transactions_archive (like public.transactions including defaults);
alter table public.transactions_archive add column if not exists archived_at timestamptz not null default now();

-- BEFORE INSERT: lengkapi kategori & season.
create or replace function public.tg_ledger_before_insert()
returns trigger language plpgsql
set search_path = public
as $$
begin
  if new."timestamp" is null then new."timestamp" := now(); end if;
  if new.category is null then
    new.category := public.ledger_category(new.type, new.points, new.reason);
  end if;
  if new.season_id is null then
    new.season_id := public.season_for(new."timestamp");
  end if;
  if new.season_id is null then
    raise exception 'Tidak ada season untuk waktu %', new."timestamp";
  end if;
  return new;
end $$;

-- AFTER INSERT: perbarui saldo dalam SATU statement upsert (atomik, aman
-- dari lost update walau banyak transaksi bersamaan).
create or replace function public.tg_ledger_after_insert()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  c text := new.category;
  p int  := new.points;
begin
  insert into public.point_balances as b (
    participant_id, season_id, balance, earned, spent,
    adzan_points, attendance_points, quiz_points, bonus_points,
    adzan_count, sholawat_iqomah_count, attendance_count, quiz_count, updated_at)
  values (
    new.participant_id, new.season_id, p,
    case when c <> 'redeem' then greatest(p, 0) else 0 end,
    case when c =  'redeem' then -p else 0 end,
    case when c in ('adzan','sholawat_iqomah') then p else 0 end,
    case when c = 'attendance' then p else 0 end,
    case when c = 'quiz' then p else 0 end,
    case when c in ('bonus','game','adjustment') then p else 0 end,
    case when c = 'adzan' then 1 else 0 end,
    case when c = 'sholawat_iqomah' then 1 else 0 end,
    case when c = 'attendance' then 1 else 0 end,
    case when c = 'quiz' then 1 else 0 end,
    now())
  on conflict (participant_id, season_id) do update set
    balance               = b.balance + excluded.balance,
    earned                = b.earned + excluded.earned,
    spent                 = b.spent + excluded.spent,
    adzan_points          = b.adzan_points + excluded.adzan_points,
    attendance_points     = b.attendance_points + excluded.attendance_points,
    quiz_points           = b.quiz_points + excluded.quiz_points,
    bonus_points          = b.bonus_points + excluded.bonus_points,
    adzan_count           = b.adzan_count + excluded.adzan_count,
    sholawat_iqomah_count = b.sholawat_iqomah_count + excluded.sholawat_iqomah_count,
    attendance_count      = b.attendance_count + excluded.attendance_count,
    quiz_count            = b.quiz_count + excluded.quiz_count,
    updated_at            = now();
  return null;
end $$;

-- Ledger append-only. Satu-satunya jalan keluar: archive_ledger() yang
-- menyalakan flag transaksi lokal `app.ledger_maintenance`.
create or replace function public.tg_ledger_immutable()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('app.ledger_maintenance', true), '') = 'on' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  raise exception 'Ledger poin tidak boleh diubah/dihapus. Koreksi saldo pakai admin_adjust_points().'
    using errcode = '42501';
end $$;

drop trigger if exists ledger_before_insert on public.transactions;
create trigger ledger_before_insert before insert on public.transactions
  for each row execute function public.tg_ledger_before_insert();

drop trigger if exists ledger_after_insert on public.transactions;
create trigger ledger_after_insert after insert on public.transactions
  for each row execute function public.tg_ledger_after_insert();

drop trigger if exists ledger_immutable on public.transactions;
create trigger ledger_immutable before update or delete on public.transactions
  for each row execute function public.tg_ledger_immutable();

-- Saldo hanya boleh disentuh trigger/fungsi di atas.
create or replace function public.tg_balances_no_delete()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('app.ledger_maintenance', true), '') = 'on' then return old; end if;
  raise exception 'Saldo poin tidak boleh dihapus' using errcode = '42501';
end $$;

drop trigger if exists balances_no_delete on public.point_balances;
create trigger balances_no_delete before delete on public.point_balances
  for each row execute function public.tg_balances_no_delete();

-- Hapus peserta tidak boleh ikut menghapus ledger (sebelumnya ON DELETE CASCADE).
do $$
declare r record;
begin
  for r in
    select con.conname, att.attname
      from pg_constraint con
      join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
     where con.conrelid = 'public.transactions'::regclass
       and con.confrelid = 'public.participants'::regclass
       and con.contype = 'f' and con.confdeltype = 'c'
  loop
    execute format('alter table public.transactions drop constraint %I', r.conname);
    execute format('alter table public.transactions add constraint %I foreign key (%I) references public.participants(id) on delete restrict', r.conname, r.attname);
  end loop;
end $$;

-- ─── 4. Backfill data lama (tanpa mengarang angka) ────────────────────────
-- Matikan sementara trigger immutable untuk melengkapi kolom baru.
select set_config('app.ledger_maintenance', 'on', true);

update public.transactions
   set category = public.ledger_category(type, points, reason)
 where category is null;

update public.transactions
   set season_id = public.season_for("timestamp")
 where season_id is null;

-- Kunci idempotensi untuk bonus pangkat lama: satu bonus per level per season.
-- Baris duplikat (bonus yang tercatat 2x) TIDAK dihapus — tetap ada di ledger
-- dan dilaporkan oleh reconcile_points() agar admin yang memutuskan.
with lvl as (
  select t.id, t.participant_id, t.season_id, l.min_points,
         row_number() over (partition by t.participant_id, t.season_id, l.min_points order by t."timestamp", t.id) as rn
    from public.transactions t
    join public.pangkat_levels l on t.reason like 'Bonus Naik Pangkat: ' || l.title || '%'
   where t.category = 'bonus'
)
update public.transactions t
   set idempotency_key = 'bonus:' || lvl.participant_id || ':' || lvl.season_id || ':' || lvl.min_points
  from lvl
 where t.id = lvl.id and lvl.rn = 1 and t.idempotency_key is null;

select set_config('app.ledger_maintenance', 'off', true);

-- Saldo awal = agregat ledger yang ada sekarang (hanya baris yang punya season).
insert into public.point_balances (
  participant_id, season_id, balance, earned, spent,
  adzan_points, attendance_points, quiz_points, bonus_points,
  adzan_count, sholawat_iqomah_count, attendance_count, quiz_count)
select participant_id, season_id,
       sum(points),
       sum(case when category <> 'redeem' then greatest(points, 0) else 0 end),
       sum(case when category =  'redeem' then -points else 0 end),
       sum(case when category in ('adzan','sholawat_iqomah') then points else 0 end),
       sum(case when category = 'attendance' then points else 0 end),
       sum(case when category = 'quiz' then points else 0 end),
       sum(case when category in ('bonus','game','adjustment') then points else 0 end),
       count(*) filter (where category = 'adzan'),
       count(*) filter (where category = 'sholawat_iqomah'),
       count(*) filter (where category = 'attendance'),
       count(*) filter (where category = 'quiz')
  from public.transactions
 where season_id is not null
 group by participant_id, season_id
on conflict (participant_id, season_id) do nothing;

-- ─── 5. View ringkasan (yang dibaca frontend) ─────────────────────────────
-- lifetime_points: poin season berjalan + poin akhir season-season lama dari
-- `season_history` (snapshot resmi saat season ditutup). Karena itu poin
-- Season 1 tetap terhitung walau log hariannya sudah terhapus.
create or replace view public.v_participant_points
with (security_invoker = true) as
select p.id as participant_id,
       s.id as season_id,
       coalesce(b.balance, 0)               as balance,
       coalesce(b.earned, 0)                as earned,
       coalesce(b.spent, 0)                 as spent,
       coalesce(b.adzan_points, 0)          as adzan_points,
       coalesce(b.attendance_points, 0)     as attendance_points,
       coalesce(b.quiz_points, 0)           as quiz_points,
       coalesce(b.bonus_points, 0)          as bonus_points,
       coalesce(b.adzan_count, 0)           as adzan_count,
       coalesce(b.sholawat_iqomah_count, 0) as sholawat_iqomah_count,
       coalesce(b.attendance_count, 0)      as attendance_count,
       coalesce(b.quiz_count, 0)            as quiz_count,
       coalesce(b.earned, 0) + coalesce((
         select sum(h.final_points) from public.season_history h
          where h.participant_id = p.id and h.season_id <> s.id
       ), 0)                                as lifetime_points
  from public.participants p
  cross join (select public.active_season_id() as id) s
  left join public.point_balances b on b.participant_id = p.id and b.season_id = s.id;

-- ─── 6. Fungsi internal: posting ke ledger + bonus pangkat ────────────────
create or replace function public.ledger_post(
  p_participant_id bigint,
  p_type           text,
  p_category       text,
  p_points         int,
  p_reason         text,
  p_key            text,
  p_admin          text,
  p_at             timestamptz default now(),
  p_source_table   text default null,
  p_source_id      bigint default null
) returns bigint
language plpgsql security definer
set search_path = public
as $$
declare
  v_id      bigint;
  v_season  uuid := public.season_for(p_at);
  v_old     int;
  v_new     int;
  v_level   record;
begin
  if v_season is null then raise exception 'Tidak ada season aktif'; end if;

  -- Serialisasi per anak: saldo lama/baru untuk cek bonus konsisten.
  perform pg_advisory_xact_lock(hashtextextended('points:' || p_participant_id, 0));

  select coalesce(balance, 0) into v_old from public.point_balances
   where participant_id = p_participant_id and season_id = v_season;
  v_old := coalesce(v_old, 0);

  insert into public.transactions (participant_id, type, category, points, reason, admin_id,
                                   "timestamp", season_id, idempotency_key, source_table, source_id)
  values (p_participant_id, p_type, p_category, p_points, p_reason, p_admin,
          now(), v_season, p_key, p_source_table, p_source_id)
  on conflict (idempotency_key) do nothing
  returning id into v_id;

  if v_id is null then
    return null; -- duplikat: sudah pernah diposting
  end if;

  -- Bonus naik pangkat: hanya untuk poin aktivitas, sekali per level per season.
  if p_points > 0 and p_category in ('adzan','sholawat_iqomah','attendance','quiz') then
    v_new := v_old + p_points;
    select * into v_level from public.pangkat_levels
     where min_points > v_old and min_points <= v_new and bonus > 0
     order by min_points desc limit 1;
    if found then
      insert into public.transactions (participant_id, type, category, points, reason, admin_id,
                                       "timestamp", season_id, idempotency_key)
      values (p_participant_id, 'adjustment', 'bonus', v_level.bonus,
              'Bonus Naik Pangkat: ' || v_level.title || ' ' || v_level.emoji, 'system',
              now(), v_season,
              'bonus:' || p_participant_id || ':' || v_season || ':' || v_level.min_points)
      on conflict (idempotency_key) do nothing;
    end if;
  end if;

  return v_id;
end $$;

-- ─── 7. RPC publik ────────────────────────────────────────────────────────
-- Semua RPC mengembalikan jsonb: { ok, duplicate?, points, bonus?, message? }

-- 7a. Admin: catat adzan / sholawat+iqomah / latihan.
create or replace function public.record_activity(
  p_participant_id bigint,
  p_kind           text,          -- 'adzan' | 'sholawat_iqomah' | 'attendance'
  p_prayer_time    text,
  p_attitude       text,
  p_date           date,
  p_idempotency_key text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_points int;
  v_log_id bigint;
  v_reason text;
  v_date   date := coalesce(p_date, (now() at time zone 'Asia/Makassar')::date);
  v_prayer text := coalesce(p_prayer_time, '');
  v_suffix text := case when coalesce(p_prayer_time, '') <> '' then ' ' || p_prayer_time else '' end;
  v_tx     bigint;
begin
  perform public.assert_admin();
  if p_idempotency_key is null or length(p_idempotency_key) < 8 then
    raise exception 'idempotency_key wajib diisi';
  end if;
  if not exists (select 1 from public.participants where id = p_participant_id) then
    raise exception 'Peserta tidak ditemukan';
  end if;
  -- Request kembar yang datang bersamaan menunggu di sini, lalu terdeteksi duplikat.
  perform pg_advisory_xact_lock(hashtextextended('key:' || p_idempotency_key, 0));
  if exists (select 1 from public.transactions where idempotency_key = p_idempotency_key) then
    return jsonb_build_object('ok', true, 'duplicate', true, 'points', 0);
  end if;

  if p_kind = 'adzan' then
    v_points := 10;
    insert into public.adzan_log (participant_id, prayer_time, attitude, attitude_points, adzan_points, total, date)
    values (p_participant_id, v_prayer, p_attitude, 0, 10, 10, v_date) returning id into v_log_id;
    v_reason := 'Adzan' || v_suffix || ' - Sikap: ' || coalesce(p_attitude, 'Bagus');
    v_tx := public.ledger_post(p_participant_id, 'adzan', 'adzan', v_points, v_reason,
                               p_idempotency_key, 'admin', v_date::timestamptz, 'adzan_log', v_log_id);
  elsif p_kind = 'sholawat_iqomah' then
    v_points := 8;
    insert into public.adzan_log (participant_id, prayer_time, attitude, attitude_points, adzan_points, total, date)
    values (p_participant_id, v_prayer, p_attitude, 0, 8, 8, v_date) returning id into v_log_id;
    v_reason := 'Sholawat + Iqomah' || v_suffix || ' - Sikap: ' || coalesce(p_attitude, 'Bagus');
    v_tx := public.ledger_post(p_participant_id, 'adzan', 'sholawat_iqomah', v_points, v_reason,
                               p_idempotency_key, 'admin', v_date::timestamptz, 'adzan_log', v_log_id);
  elsif p_kind = 'attendance' then
    v_points := case p_attitude when 'Cukup Bagus' then 3 when 'Ribut' then 1 else 5 end;
    insert into public.attendance_log (participant_id, prayer_time, points, date)
    values (p_participant_id, v_prayer, v_points, v_date) returning id into v_log_id;
    v_reason := 'Latihan' || v_suffix || ' - Sikap: ' || coalesce(p_attitude, 'Bagus');
    v_tx := public.ledger_post(p_participant_id, 'attendance', 'attendance', v_points, v_reason,
                               p_idempotency_key, 'admin', v_date::timestamptz, 'attendance_log', v_log_id);
  else
    raise exception 'Jenis aktivitas tidak dikenal: %', p_kind;
  end if;

  return jsonb_build_object('ok', true, 'points', v_points);
end $$;

-- 7b. Publik: kirim jawaban quiz. Skor dihitung di server dari kunci jawaban.
--     Aturan lama dipertahankan: poin per quiz per hari tidak melebihi jumlah
--     jawaban benar terbaik hari itu (zona waktu WITA).
create or replace function public.submit_quiz(
  p_participant_id  bigint,
  p_quiz_id         bigint,
  p_answers         jsonb,       -- array; null = belum dijawab
  p_idempotency_key text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_quiz      record;
  v_n         int;
  v_correct   int := 0;
  v_score     int;
  v_today     date := (now() at time zone 'Asia/Makassar')::date;
  v_earned_today int;
  v_final     int;
  v_attempt   bigint;
  v_prev      record;
  i           int;
begin
  if p_idempotency_key is null or length(p_idempotency_key) < 8 then
    raise exception 'idempotency_key wajib diisi';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('key:' || p_idempotency_key, 0));
  select score, earned_points into v_prev from public.quiz_attempts where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('ok', true, 'duplicate', true, 'score', v_prev.score, 'points', v_prev.earned_points);
  end if;

  if not exists (select 1 from public.participants where id = p_participant_id and status = 'aktif') then
    raise exception 'Peserta tidak aktif / tidak ditemukan';
  end if;

  select id, title, questions, is_active into v_quiz from public.quizzes where id = p_quiz_id;
  if not found or not v_quiz.is_active then raise exception 'Quiz tidak aktif'; end if;

  v_n := jsonb_array_length(v_quiz.questions);
  if v_n = 0 then raise exception 'Quiz tidak punya soal'; end if;
  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) > v_n then
    raise exception 'Format jawaban tidak valid';
  end if;

  for i in 0 .. v_n - 1 loop
    if jsonb_typeof(p_answers -> i) = 'number'
       and (p_answers ->> i) = (v_quiz.questions -> i ->> 'correctAnswer') then
      v_correct := v_correct + 1;
    end if;
  end loop;
  v_score := round(v_correct * 100.0 / v_n);

  perform pg_advisory_xact_lock(hashtextextended('quiz:' || p_participant_id || ':' || p_quiz_id, 0));

  select coalesce(sum(earned_points), 0) into v_earned_today
    from public.quiz_attempts
   where participant_id = p_participant_id and quiz_id = p_quiz_id
     and (completed_at at time zone 'Asia/Makassar')::date = v_today;

  v_final := greatest(0, v_correct - v_earned_today);

  insert into public.quiz_attempts (participant_id, quiz_id, score, earned_points, answers, completed_at, idempotency_key)
  values (p_participant_id, p_quiz_id, v_score, v_final, p_answers, now(), p_idempotency_key)
  returning id into v_attempt;

  if v_final > 0 then
    perform public.ledger_post(p_participant_id, 'quiz', 'quiz', v_final,
      'Quiz: ' || v_quiz.title || ' - Skor: ' || v_score || '%',
      'quiz:' || p_idempotency_key, 'system', now(), 'quiz_attempts', v_attempt);
  end if;

  return jsonb_build_object('ok', true, 'score', v_score, 'correct', v_correct,
                            'points', v_final, 'earned_today', v_earned_today, 'max', v_n);
end $$;

-- 7c. Publik: hadiah menang catur. Dibatasi agar tidak bisa di-spam.
create or replace function public.award_game_win(
  p_participant_id  bigint,
  p_quiz_id         bigint,
  p_idempotency_key text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  c_points      constant int := 5;
  c_daily_limit constant int := 5;   -- maks. menang berhadiah per anak per hari
  v_today_wins  int;
  v_title       text;
  v_tx          bigint;
begin
  if p_idempotency_key is null or length(p_idempotency_key) < 8 then
    raise exception 'idempotency_key wajib diisi';
  end if;
  if not exists (select 1 from public.participants where id = p_participant_id and status = 'aktif') then
    raise exception 'Peserta tidak aktif / tidak ditemukan';
  end if;
  select title into v_title from public.quizzes where id = p_quiz_id;

  perform pg_advisory_xact_lock(hashtextextended('game:' || p_participant_id, 0));
  select count(*) into v_today_wins from public.transactions
   where participant_id = p_participant_id and category = 'game'
     and ("timestamp" at time zone 'Asia/Makassar')::date = (now() at time zone 'Asia/Makassar')::date;
  if v_today_wins >= c_daily_limit then
    return jsonb_build_object('ok', false, 'points', 0, 'message', 'Batas hadiah catur hari ini sudah tercapai');
  end if;

  v_tx := public.ledger_post(p_participant_id, 'adjustment', 'game', c_points,
    'Menang Battle Royale Catur: ' || coalesce(v_title, '-'),
    'game:' || p_idempotency_key, 'system');
  return jsonb_build_object('ok', true, 'duplicate', v_tx is null, 'points', case when v_tx is null then 0 else c_points end);
end $$;

-- 7d. Publik: ajukan redeem. Saldo dicek di server; 1 permintaan pending per paket.
create or replace function public.request_redeem(
  p_participant_id bigint,
  p_package_id     bigint
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_pkg     record;
  v_balance int;
  v_pending int;
  v_id      bigint;
begin
  select * into v_pkg from public.redeem_packages where id = p_package_id;
  if not found or not coalesce(v_pkg.is_available, true) then
    return jsonb_build_object('ok', false, 'message', 'Paket tidak tersedia');
  end if;
  if not exists (select 1 from public.participants where id = p_participant_id and status = 'aktif') then
    return jsonb_build_object('ok', false, 'message', 'Peserta tidak aktif / tidak ditemukan');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('points:' || p_participant_id, 0));

  select coalesce(balance, 0) into v_balance from public.point_balances
   where participant_id = p_participant_id and season_id = public.active_season_id();
  v_balance := coalesce(v_balance, 0);

  -- Poin yang sedang "dipesan" oleh permintaan pending ikut diperhitungkan.
  select coalesce(sum(points_spent), 0) into v_pending from public.redeem_history
   where participant_id = p_participant_id and status = 'pending';

  if v_balance - v_pending < v_pkg.points_required then
    return jsonb_build_object('ok', false, 'message', 'Poin tidak mencukupi');
  end if;

  insert into public.redeem_history (participant_id, package_id, package_name, points_spent, status)
  values (p_participant_id, p_package_id, v_pkg.name, v_pkg.points_required, 'pending')
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

-- 7e. Admin: setujui / tolak redeem. Persetujuan = 1 baris ledger negatif.
create or replace function public.process_redeem(
  p_redeem_id bigint,
  p_action    text   -- 'approved' | 'rejected'
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_r       record;
  v_balance int;
begin
  perform public.assert_admin();
  if p_action not in ('approved', 'rejected') then raise exception 'Aksi tidak valid'; end if;

  select * into v_r from public.redeem_history where id = p_redeem_id for update;
  if not found then raise exception 'Data redeem tidak ditemukan'; end if;
  if v_r.status <> 'pending' then
    return jsonb_build_object('ok', true, 'duplicate', true, 'status', v_r.status);
  end if;

  if p_action = 'approved' then
    perform pg_advisory_xact_lock(hashtextextended('points:' || v_r.participant_id, 0));
    select coalesce(balance, 0) into v_balance from public.point_balances
     where participant_id = v_r.participant_id and season_id = public.active_season_id();
    if coalesce(v_balance, 0) < v_r.points_spent then
      return jsonb_build_object('ok', false, 'message', 'Saldo anak tidak cukup untuk redeem ini');
    end if;
    perform public.ledger_post(v_r.participant_id, 'redeem', 'redeem', -v_r.points_spent,
      'Redeem: ' || v_r.package_name, 'redeem:' || v_r.id, 'admin', now(), 'redeem_history', v_r.id);
  end if;

  update public.redeem_history
     set status = p_action, processed_at = now(), processed_by = 'admin'
   where id = p_redeem_id;

  return jsonb_build_object('ok', true, 'status', p_action);
end $$;

-- 7f. Admin: koreksi poin manual (tercatat di ledger, bukan edit saldo).
create or replace function public.admin_adjust_points(
  p_participant_id  bigint,
  p_points          int,
  p_reason          text,
  p_idempotency_key text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare v_tx bigint;
begin
  perform public.assert_admin();
  if p_points = 0 or abs(p_points) > 10000 then raise exception 'Jumlah poin tidak valid'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'Alasan wajib diisi'; end if;
  v_tx := public.ledger_post(p_participant_id, 'adjustment', 'adjustment', p_points,
                             'Koreksi admin: ' || p_reason, p_idempotency_key, 'admin');
  return jsonb_build_object('ok', true, 'duplicate', v_tx is null, 'points', p_points);
end $$;

-- 7g. Admin: tutup season. Klasemen diambil dari saldo tersimpan di server.
create or replace function public.end_season(p_next_name text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_season uuid := public.active_season_id();
  v_now    timestamptz := now();
begin
  perform public.assert_admin();
  if v_season is null then raise exception 'Tidak ada season aktif'; end if;
  if coalesce(trim(p_next_name), '') = '' then raise exception 'Nama season baru wajib diisi'; end if;

  insert into public.season_history (season_id, participant_id, final_points, rank, badge)
  select v_season, x.participant_id, x.balance, x.rnk,
         case x.rnk when 1 then 'gold' when 2 then 'silver' when 3 then 'bronze' end
    from (
      select p.id as participant_id, coalesce(b.balance, 0) as balance,
             row_number() over (order by coalesce(b.balance, 0) desc, p.id) as rnk
        from public.participants p
        left join public.point_balances b on b.participant_id = p.id and b.season_id = v_season
    ) x
  on conflict (season_id, participant_id) do nothing;

  update public.seasons set end_date = v_now where id = v_season;
  insert into public.seasons (name, start_date) values (trim(p_next_name), v_now);

  return jsonb_build_object('ok', true);
end $$;

-- ─── 8. Rekonsiliasi & pemeliharaan ───────────────────────────────────────
-- Bandingkan saldo tersimpan dengan (ledger aktif + arsip). Baris yang
-- dikembalikan = ada selisih ATAU ada bonus ganda yang perlu ditinjau admin.
create or replace function public.reconcile_points()
returns table (participant_id bigint, nama text, season_id uuid,
               stored_balance int, ledger_balance int, diff int, note text)
language sql stable security definer
set search_path = public
as $$
  with ledger as (
    select l.participant_id, l.season_id, sum(l.points)::int as total
      from (select t.participant_id, t.season_id, t.points from public.transactions t
            union all
            select a.participant_id, a.season_id, a.points from public.transactions_archive a) l
     where l.season_id is not null
     group by 1, 2
  ),
  dup_bonus as (
    select x.participant_id, x.season_id, string_agg(x.reason || ' ×' || x.n, '; ') as reasons
      from (select t.participant_id, t.season_id, t.reason, count(*) as n
              from public.transactions t
             where t.category = 'bonus'
             group by t.participant_id, t.season_id, t.reason
            having count(*) > 1) x
     group by x.participant_id, x.season_id
  )
  select coalesce(b.participant_id, l.participant_id), p.nama, coalesce(b.season_id, l.season_id),
         coalesce(b.balance, 0), coalesce(l.total, 0),
         coalesce(b.balance, 0) - coalesce(l.total, 0),
         case when d.reasons is not null then 'Bonus ganda: ' || d.reasons end
    from public.point_balances b
    full join ledger l on l.participant_id = b.participant_id and l.season_id = b.season_id
    left join public.participants p on p.id = coalesce(b.participant_id, l.participant_id)
    left join dup_bonus d on d.participant_id = coalesce(b.participant_id, l.participant_id)
                         and d.season_id = coalesce(b.season_id, l.season_id)
   where (public.is_admin() or session_user = 'postgres')
     and (coalesce(b.balance, 0) <> coalesce(l.total, 0) or d.reasons is not null);
$$;

-- Pindahkan baris ledger lama ke arsip (bukan hapus). Saldo tidak berubah
-- karena trigger saldo hanya bereaksi pada INSERT.
create or replace function public.archive_ledger(p_before timestamptz)
returns int
language plpgsql security definer
set search_path = public
as $$
declare v_n int;
begin
  perform public.assert_admin();
  if p_before > now() - interval '90 days' then
    raise exception 'Arsip hanya untuk data lebih tua dari 90 hari';
  end if;
  perform set_config('app.ledger_maintenance', 'on', true);
  with moved as (
    delete from public.transactions where "timestamp" < p_before returning *
  )
  insert into public.transactions_archive select moved.*, now() from moved;
  get diagnostics v_n = row_count;
  perform set_config('app.ledger_maintenance', 'off', true);
  return v_n;
end $$;

-- Ukuran tabel untuk pemantauan kapasitas (khusus admin).
create or replace function public.storage_report()
returns table (table_name text, row_estimate bigint, total_bytes bigint, total_pretty text)
language sql stable security definer
set search_path = public, pg_catalog
as $$
  select c.relname::text, c.reltuples::bigint,
         pg_total_relation_size(c.oid), pg_size_pretty(pg_total_relation_size(c.oid))
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and (public.is_admin() or session_user = 'postgres')
   order by pg_total_relation_size(c.oid) desc;
$$;

-- ─── 9. Hak akses fungsi ──────────────────────────────────────────────────
revoke all on function public.ledger_post(bigint, text, text, int, text, text, text, timestamptz, text, bigint) from public, anon, authenticated;
revoke all on function public.archive_ledger(timestamptz) from public, anon;
revoke all on function public.storage_report() from public, anon;
revoke all on function public.reconcile_points() from public, anon;
revoke all on function public.record_activity(bigint, text, text, text, date, text) from public, anon;
revoke all on function public.process_redeem(bigint, text) from public, anon;
revoke all on function public.admin_adjust_points(bigint, int, text, text) from public, anon;
revoke all on function public.end_season(text) from public, anon;

grant execute on function public.record_activity(bigint, text, text, text, date, text) to authenticated;
grant execute on function public.process_redeem(bigint, text)                         to authenticated;
grant execute on function public.admin_adjust_points(bigint, int, text, text)         to authenticated;
grant execute on function public.end_season(text)                                     to authenticated;
grant execute on function public.reconcile_points()                                   to authenticated;
grant execute on function public.archive_ledger(timestamptz)                          to authenticated;
grant execute on function public.storage_report()                                     to authenticated;
grant execute on function public.submit_quiz(bigint, bigint, jsonb, text)             to anon, authenticated;
grant execute on function public.award_game_win(bigint, bigint, text)                 to anon, authenticated;
grant execute on function public.request_redeem(bigint, bigint)                       to anon, authenticated;
grant execute on function public.is_admin()                                           to anon, authenticated;

-- Tabel & view baru: baca publik, tulis hanya lewat fungsi.
alter table public.point_balances       enable row level security;
alter table public.pangkat_levels       enable row level security;
alter table public.app_admins           enable row level security;
alter table public.transactions_archive enable row level security;

drop policy if exists "baca saldo" on public.point_balances;
create policy "baca saldo" on public.point_balances for select to anon, authenticated using (true);
drop policy if exists "baca pangkat" on public.pangkat_levels;
create policy "baca pangkat" on public.pangkat_levels for select to anon, authenticated using (true);
drop policy if exists "admin lihat dirinya" on public.app_admins;
create policy "admin lihat dirinya" on public.app_admins for select to authenticated using (user_id = auth.uid());

grant select on public.point_balances, public.pangkat_levels, public.v_participant_points to anon, authenticated;
revoke insert, update, delete on public.point_balances, public.pangkat_levels, public.transactions_archive from anon, authenticated;

-- Realtime: frontend cukup mendengar saldo, bukan seluruh skema.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime' and not puballtables)
     and not exists (select 1 from pg_publication_tables
                      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'point_balances') then
    alter publication supabase_realtime add table public.point_balances;
  end if;
end $$;

commit;
