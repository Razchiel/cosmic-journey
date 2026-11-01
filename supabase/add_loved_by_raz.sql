-- Kolom "Loved by Raz". Centang di Table Editor untuk memberi hati pada sebuah kartu.
alter table public.wishes
  add column if not exists loved_by_raz boolean not null default false;

-- Isi awal: Liya dan Rei
update public.wishes
set loved_by_raz = true
where id in (
  '9f7bf490-9f21-4218-8ff2-2b6bd327a901',
  '57a8b359-3db4-4f5e-bc83-46f0a5979f6a'
);