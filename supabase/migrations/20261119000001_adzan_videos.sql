-- ════════════════════════════════════════════════════════════════════════════
-- 003 · Tabel Video Latihan Adzan (adzan_videos)
-- ════════════════════════════════════════════════════════════════════════════

begin;

create table if not exists public.adzan_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  muadzin text not null,
  category text not null default 'Umum',
  youtube_url text not null,
  youtube_id text not null,
  difficulty text not null default 'Mudah',
  description text,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Kolom target irama pada tabel participants jika belum ada
alter table public.participants add column if not exists target_irama text;

-- Aktifkan RLS
alter table public.adzan_videos enable row level security;

-- Policy: Publik boleh membaca semua video aktif
drop policy if exists "publik baca adzan_videos" on public.adzan_videos;
create policy "publik baca adzan_videos" on public.adzan_videos
  for select to anon, authenticated
  using (true);

-- Policy: Admin boleh menulis (insert/update/delete)
drop policy if exists "admin tulis adzan_videos" on public.adzan_videos;
create policy "admin tulis adzan_videos" on public.adzan_videos
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 1. HAPUS SEMUA DATA DUMMY / PLACEHOLDER LAMA
delete from public.adzan_videos
where youtube_id in ('0h9Vqj80x5I', 'mUq3tF34bQk', '2T9lX_1zG9A', 'L9L72o6RjXQ', '8K_3-fV_718', 'WCEFOR5jgAU');

-- 2. SESUAIKAN VIDEO NUSSA YANG DIINPUTKAN SEBELUMNYA
update public.adzan_videos
set
  title = 'NUSSA : ADZAN',
  muadzin = 'Nussa Official',
  category = 'Muadzin Cilik',
  difficulty = 'Mudah',
  description = 'Animasi edukasi adzan ramah anak dengan irama stabil dan mudah ditirukan.',
  order_index = 1,
  is_active = true
where youtube_id = 'X1Aec-UC2UI';

-- 3. MASUKKAN KOLEKSI VIDEO ADZAN ASLI DAN TERVERIFIKASI
insert into public.adzan_videos (title, muadzin, category, youtube_url, youtube_id, difficulty, description, order_index, is_active)
select 'NUSSA : ADZAN', 'Nussa Official', 'Muadzin Cilik', 'https://www.youtube.com/watch?v=X1Aec-UC2UI', 'X1Aec-UC2UI', 'Mudah', 'Animasi edukasi adzan ramah anak dengan irama stabil dan mudah ditirukan.', 1, true
where not exists (select 1 from public.adzan_videos where youtube_id = 'X1Aec-UC2UI');

insert into public.adzan_videos (title, muadzin, category, youtube_url, youtube_id, difficulty, description, order_index, is_active)
select 'ADZAN MERDU || Muzammil Hasballah', 'Muzammil Hasballah', 'Hijaz', 'https://www.youtube.com/watch?v=X1wtcLunYVk', 'X1wtcLunYVk', 'Sedang', 'Lantunan adzan merdu dan fasih dari qari muda panutan anak-anak Indonesia.', 2, true
where not exists (select 1 from public.adzan_videos where youtube_id = 'X1wtcLunYVk');

insert into public.adzan_videos (title, muadzin, category, youtube_url, youtube_id, difficulty, description, order_index, is_active)
select 'SUARA ADZAN MERDU || UMAR AL FARUQ', 'Umar Al Faruq', 'Rost & Nahawand', 'https://www.youtube.com/watch?v=18r6pTlgFKs', '18r6pTlgFKs', 'Sedang', 'Kumandang adzan sangat merdu dengan makhraj huruf yang jelas dan tartil.', 3, true
where not exists (select 1 from public.adzan_videos where youtube_id = '18r6pTlgFKs');

insert into public.adzan_videos (title, muadzin, category, youtube_url, youtube_id, difficulty, description, order_index, is_active)
select 'ADZAN MERDU || MUHAMMAD VICKRY', 'Muhammad Vickry', 'Makkah & Madinah', 'https://www.youtube.com/watch?v=cJbKGxOq9n8', 'cJbKGxOq9n8', 'Mudah', 'Irama adzan yang tenang, sejuk, dan tempo stabil cocok untuk latihan anak.', 4, true
where not exists (select 1 from public.adzan_videos where youtube_id = 'cJbKGxOq9n8');

insert into public.adzan_videos (title, muadzin, category, youtube_url, youtube_id, difficulty, description, order_index, is_active)
select 'Adzan Sangat Merdu - Taqy Malik', 'Taqy Malik', 'Hijaz', 'https://www.youtube.com/watch?v=xlVUVnwSU_s', 'xlVUVnwSU_s', 'Mahir', 'Lantunan nada adzan khas dan menyentuh hati dengan nada tinggi yang mantap.', 5, true
where not exists (select 1 from public.adzan_videos where youtube_id = 'xlVUVnwSU_s');

insert into public.adzan_videos (title, muadzin, category, youtube_url, youtube_id, difficulty, description, order_index, is_active)
select 'Adzan Merdu - Salim Bahanan', 'Salim Bahanan', 'Umum', 'https://www.youtube.com/watch?v=T7s3IFMktLo', 'T7s3IFMktLo', 'Sedang', 'Kumandang adzan yang syahdu dan khusyuk penyejuk hati.', 6, true
where not exists (select 1 from public.adzan_videos where youtube_id = 'T7s3IFMktLo');

commit;
