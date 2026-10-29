-- ============================================================
-- COSMIC JOURNEY: skema Wishes (tempel seluruhnya di Supabase SQL Editor, klik Run)
-- ============================================================

create type public.wish_status as enum ('pending', 'approved', 'rejected');

create table public.wishes (
  id           uuid primary key default gen_random_uuid(),
  display_name text        not null check (char_length(display_name) between 1 and 30),
  is_anonymous boolean     not null default false,
  category     text        not null check (category in ('feedback', 'suggestion', 'developer', 'wish')),
  message      text        not null check (char_length(message) between 5 and 280),
  rating       smallint    not null check (rating between 1 and 5),
  is_private   boolean     not null default false,
  status       public.wish_status not null default 'pending',
  ip_hash      text,                                   -- hash IP bergaram rahasia (BUKAN IP mentah), hanya untuk rate limit
  created_at   timestamptz not null default now()
);

-- RLS aktif TANPA policy apa pun = anon & authenticated tidak bisa select/insert/update/delete.
-- Hanya service key (dipakai Netlify Function) yang melewati RLS.
alter table public.wishes enable row level security;
revoke all on public.wishes from anon, authenticated;

-- Index untuk Gallery (hanya baris publik) dan rate limit
create index wishes_public_newest_idx   on public.wishes (created_at desc, id desc)
  where status = 'approved' and is_private = false;
create index wishes_public_rating_idx   on public.wishes (rating desc, created_at desc, id desc)
  where status = 'approved' and is_private = false;
create index wishes_public_category_idx on public.wishes (category, created_at desc)
  where status = 'approved' and is_private = false;
create index wishes_ip_recent_idx       on public.wishes (ip_hash, created_at desc)
  where ip_hash is not null;

-- Agregat untuk header Gallery ("4.7 ★ from 32 astronauts")
create or replace function public.wish_stats()
returns table (count bigint, average numeric)
language sql stable
as $$
  select count(*), coalesce(round(avg(rating)::numeric, 1), 0)
  from public.wishes
  where status = 'approved' and is_private = false;
$$;

revoke all on function public.wish_stats() from public, anon, authenticated;
grant execute on function public.wish_stats() to service_role;