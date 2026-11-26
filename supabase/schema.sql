-- EventMate Database Schema (Supabase PostgreSQL + RLS + Triggers + Realtime)
-- Jalankan seluruh skrip ini di SQL Editor pada Dashboard Supabase Anda.

create extension if not exists pgcrypto;

-- 1. Profiles (informasi publik pengguna + status akun)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  username text unique,
  role text not null default 'seeker' check (role in ('seeker', 'creator')),
  university text not null default '',
  major text not null default '',
  bio text not null default '',
  experience text not null default '',
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  avatar_url text not null default '',
  verified boolean not null default false,
  verification_requested boolean not null default false,
  onboarded boolean not null default false,
  trial_started_at timestamptz not null default now(),
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Profile Contacts (terpisah agar hanya terbuka bagi rekan tim yang diterima & tidak diblokir)
create table if not exists public.profile_contacts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  whatsapp text not null default '',
  telegram text not null default '',
  linkedin text not null default '',
  public_email text not null default '',
  share_with_teammates boolean not null default true,
  updated_at timestamptz not null default now()
);

-- 3. Teams
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  team_name text not null,
  title text not null,
  category text not null check (category in ('Kompetisi', 'Volunteer', 'Seminar', 'Penelitian', 'Proyek Kreatif', 'Organisasi')),
  mode text not null check (mode in ('Online', 'Offline', 'Hybrid')),
  region text not null,
  city text not null,
  needed_count integer not null default 2 check (needed_count >= 1 and needed_count <= 50),
  member_count integer not null default 1 check (member_count >= 0),
  deadline text not null default '',
  skills text[] not null default '{}',
  description text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Team Members
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'member' check (member_role in ('creator', 'member')),
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

-- 5. Join Requests (Individu melamar ke tim)
create table if not exists public.join_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  note text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (team_id, applicant_id)
);

-- 6. Team Invitations (Creator mengundang individu ke tim)
create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (team_id, invitee_id)
);

-- 7. Team Announcements (Pengganti chat: pengumuman resmi dari Team Creator)
create table if not exists public.team_announcements (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('join_request', 'request_decision', 'invitation', 'invitation_decision', 'announcement', 'review')),
  title text not null,
  body text not null,
  link text not null default '/requests',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 9. Reviews & Ratings (antaranggota satu tim)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null,
  created_at timestamptz not null default now(),
  unique (team_id, reviewer_id, reviewee_id),
  check (reviewer_id <> reviewee_id)
);

-- 10. User Blocks (perlindungan kontak & interaksi)
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- 11. Reports (laporan penyalahgunaan kontak/tim/profil)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  target_team_id uuid references public.teams(id) on delete set null,
  category text not null,
  details text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved')),
  created_at timestamptz not null default now()
);

-- Helper functions untuk kebijakan RLS (hindari rekursi policy)
create or replace function public.is_team_member(p_team_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = p_user_id
  );
$$;

create or replace function public.is_team_creator(p_team_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.teams
    where id = p_team_id and creator_id = p_user_id
  );
$$;

create or replace function public.shares_accepted_team(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members a
    join public.team_members b on a.team_id = b.team_id
    where a.user_id = p_user_a and b.user_id = p_user_b
  );
$$;

create or replace function public.is_blocked_between(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.user_blocks
    where (blocker_id = p_user_a and blocked_id = p_user_b)
       or (blocker_id = p_user_b and blocked_id = p_user_a)
  );
$$;

-- Trigger: buat profil & kontak kosong otomatis saat user mendaftar di auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_role text;
  v_base_username text;
  v_username text;
begin
  v_name := coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1));
  v_role := case when new.raw_user_meta_data->>'role' in ('seeker', 'creator') then new.raw_user_meta_data->>'role' else 'seeker' end;
  v_base_username := regexp_replace(lower(v_name), '[^a-z0-9]+', '.', 'g');
  v_base_username := trim(both '.' from v_base_username);
  if v_base_username = '' then
    v_base_username := 'member';
  end if;
  v_username := v_base_username || '.' || substr(replace(new.id::text, '-', ''), 1, 4);

  insert into public.profiles (id, email, name, username, role)
  values (new.id, new.email, v_name, v_username, v_role)
  on conflict (id) do nothing;

  insert into public.profile_contacts (user_id, public_email)
  values (new.id, coalesce(new.email, ''))
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: otomatis masukkan creator ke team_members saat tim dibuat
create or replace function public.handle_team_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_members (team_id, user_id, member_role)
  values (new.id, new.creator_id, 'creator')
  on conflict (team_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_team_created on public.teams;
create trigger on_team_created
  after insert on public.teams
  for each row execute function public.handle_team_created();

-- Trigger: sinkronkan jumlah anggota tim secara otomatis
create or replace function public.sync_team_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  v_team_id := coalesce(new.team_id, old.team_id);
  update public.teams
  set member_count = (
    select count(*)::integer from public.team_members where team_id = v_team_id
  ),
  updated_at = now()
  where id = v_team_id;
  return null;
end;
$$;

drop trigger if exists on_team_member_changed on public.team_members;
create trigger on_team_member_changed
  after insert or delete on public.team_members
  for each row execute function public.sync_team_member_count();

-- Trigger: notifikasi & keanggotaan otomatis untuk join_requests
create or replace function public.handle_join_request_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team record;
  v_applicant_name text;
begin
  select id, team_name, title, creator_id into v_team from public.teams where id = new.team_id;
  select name into v_applicant_name from public.profiles where id = new.applicant_id;

  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, actor_id, type, title, body, link)
    values (
      v_team.creator_id,
      new.applicant_id,
      'join_request',
      'Permintaan bergabung baru',
      coalesce(v_applicant_name, 'Pengguna') || ' mengajukan diri untuk bergabung ke tim ' || v_team.team_name || '.',
      '/requests'
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'accepted' then
      insert into public.team_members (team_id, user_id, member_role)
      values (new.team_id, new.applicant_id, 'member')
      on conflict (team_id, user_id) do nothing;

      insert into public.notifications (user_id, actor_id, type, title, body, link)
      values (
        new.applicant_id,
        v_team.creator_id,
        'request_decision',
        'Permintaan bergabung diterima',
        'Kamu resmi diterima di tim ' || v_team.team_name || '. Cek Member Directory dan kontak tim.',
        '/teams'
      );
    elsif new.status = 'rejected' then
      insert into public.notifications (user_id, actor_id, type, title, body, link)
      values (
        new.applicant_id,
        v_team.creator_id,
        'request_decision',
        'Permintaan bergabung ditolak',
        'Permintaanmu untuk bergabung ke tim ' || v_team.team_name || ' belum diterima.',
        '/requests'
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_join_request_events on public.join_requests;
create trigger on_join_request_events
  after insert or update on public.join_requests
  for each row execute function public.handle_join_request_events();

-- Trigger: notifikasi & keanggotaan otomatis untuk team_invitations
create or replace function public.handle_invitation_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team record;
  v_inviter_name text;
  v_invitee_name text;
begin
  select id, team_name, title into v_team from public.teams where id = new.team_id;
  select name into v_inviter_name from public.profiles where id = new.inviter_id;
  select name into v_invitee_name from public.profiles where id = new.invitee_id;

  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, actor_id, type, title, body, link)
    values (
      new.invitee_id,
      new.inviter_id,
      'invitation',
      'Undangan bergabung ke tim',
      coalesce(v_inviter_name, 'Creator') || ' mengundangmu bergabung ke tim ' || v_team.team_name || '.',
      '/requests'
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'accepted' then
      insert into public.team_members (team_id, user_id, member_role)
      values (new.team_id, new.invitee_id, 'member')
      on conflict (team_id, user_id) do nothing;

      insert into public.notifications (user_id, actor_id, type, title, body, link)
      values (
        new.inviter_id,
        new.invitee_id,
        'invitation_decision',
        'Undangan tim diterima',
        coalesce(v_invitee_name, 'Kandidat') || ' menerima undanganmu untuk tim ' || v_team.team_name || '.',
        '/teams'
      );
    elsif new.status = 'rejected' then
      insert into public.notifications (user_id, actor_id, type, title, body, link)
      values (
        new.inviter_id,
        new.invitee_id,
        'invitation_decision',
        'Undangan tim ditolak',
        coalesce(v_invitee_name, 'Kandidat') || ' menolak undangan ke tim ' || v_team.team_name || '.',
        '/requests'
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_invitation_events on public.team_invitations;
create trigger on_invitation_events
  after insert or update on public.team_invitations
  for each row execute function public.handle_invitation_events();

-- Trigger: notifikasi pengumuman tim baru kepada seluruh anggota
create or replace function public.handle_announcement_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_name text;
begin
  select team_name into v_team_name from public.teams where id = new.team_id;
  insert into public.notifications (user_id, actor_id, type, title, body, link)
  select
    tm.user_id,
    new.author_id,
    'announcement',
    'Pengumuman baru di ' || coalesce(v_team_name, 'tim'),
    new.title,
    '/teams'
  from public.team_members tm
  where tm.team_id = new.team_id
    and tm.user_id <> new.author_id;
  return new;
end;
$$;

drop trigger if exists on_announcement_created on public.team_announcements;
create trigger on_announcement_created
  after insert on public.team_announcements
  for each row execute function public.handle_announcement_created();

-- Trigger: notifikasi review baru
create or replace function public.handle_review_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reviewer_name text;
begin
  select name into v_reviewer_name from public.profiles where id = new.reviewer_id;
  insert into public.notifications (user_id, actor_id, type, title, body, link)
  values (
    new.reviewee_id,
    new.reviewer_id,
    'review',
    'Ulasan kolaborasi baru',
    coalesce(v_reviewer_name, 'Rekan tim') || ' memberimu rating ' || new.rating || '/5.',
    '/profile'
  );
  return new;
end;
$$;

drop trigger if exists on_review_created on public.reviews;
create trigger on_review_created
  after insert on public.reviews
  for each row execute function public.handle_review_created();

-- Aktifkan Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.join_requests enable row level security;
alter table public.team_invitations enable row level security;
alter table public.team_announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.user_blocks enable row level security;
alter table public.reports enable row level security;

-- Policies: profiles
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Policies: profile_contacts (hanya pemilik atau rekan satu tim yang disetujui & tidak diblokir)
create policy "contacts_select_authorized" on public.profile_contacts
  for select to authenticated using (
    auth.uid() = user_id
    or (
      share_with_teammates = true
      and public.shares_accepted_team(auth.uid(), user_id)
      and not public.is_blocked_between(auth.uid(), user_id)
    )
  );
create policy "contacts_upsert_own" on public.profile_contacts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "contacts_update_own" on public.profile_contacts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies: teams
create policy "teams_select_authenticated" on public.teams
  for select to authenticated using (true);
create policy "teams_insert_creator" on public.teams
  for insert to authenticated with check (auth.uid() = creator_id);
create policy "teams_update_creator" on public.teams
  for update to authenticated using (auth.uid() = creator_id) with check (auth.uid() = creator_id);
create policy "teams_delete_creator" on public.teams
  for delete to authenticated using (auth.uid() = creator_id);

-- Policies: team_members
create policy "team_members_select_authenticated" on public.team_members
  for select to authenticated using (true);
create policy "team_members_delete_self_or_creator" on public.team_members
  for delete to authenticated using (
    auth.uid() = user_id or public.is_team_creator(team_id, auth.uid())
  );

-- Policies: join_requests
create policy "join_requests_select_involved" on public.join_requests
  for select to authenticated using (
    auth.uid() = applicant_id or public.is_team_creator(team_id, auth.uid())
  );
create policy "join_requests_insert_applicant" on public.join_requests
  for insert to authenticated with check (
    auth.uid() = applicant_id
    and not public.is_team_creator(team_id, auth.uid())
  );
create policy "join_requests_update_creator" on public.join_requests
  for update to authenticated using (
    public.is_team_creator(team_id, auth.uid())
  ) with check (
    public.is_team_creator(team_id, auth.uid())
  );

-- Policies: team_invitations
create policy "invitations_select_involved" on public.team_invitations
  for select to authenticated using (
    auth.uid() = inviter_id or auth.uid() = invitee_id
  );
create policy "invitations_insert_creator" on public.team_invitations
  for insert to authenticated with check (
    auth.uid() = inviter_id
    and public.is_team_creator(team_id, auth.uid())
    and not public.is_blocked_between(auth.uid(), invitee_id)
  );
create policy "invitations_update_invitee" on public.team_invitations
  for update to authenticated using (
    auth.uid() = invitee_id
  ) with check (
    auth.uid() = invitee_id
  );

-- Policies: team_announcements
create policy "announcements_select_member" on public.team_announcements
  for select to authenticated using (
    public.is_team_member(team_id, auth.uid())
  );
create policy "announcements_insert_creator" on public.team_announcements
  for insert to authenticated with check (
    auth.uid() = author_id and public.is_team_creator(team_id, auth.uid())
  );
create policy "announcements_update_creator" on public.team_announcements
  for update to authenticated using (
    auth.uid() = author_id and public.is_team_creator(team_id, auth.uid())
  );
create policy "announcements_delete_creator" on public.team_announcements
  for delete to authenticated using (
    auth.uid() = author_id and public.is_team_creator(team_id, auth.uid())
  );

-- Policies: notifications
create policy "notifications_select_own" on public.notifications
  for select to authenticated using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies: reviews
create policy "reviews_select_authenticated" on public.reviews
  for select to authenticated using (true);
create policy "reviews_insert_teammate" on public.reviews
  for insert to authenticated with check (
    auth.uid() = reviewer_id
    and reviewer_id <> reviewee_id
    and public.is_team_member(team_id, reviewer_id)
    and public.is_team_member(team_id, reviewee_id)
    and not public.is_blocked_between(reviewer_id, reviewee_id)
  );

-- Policies: user_blocks
create policy "blocks_select_own" on public.user_blocks
  for select to authenticated using (auth.uid() = blocker_id);
create policy "blocks_insert_own" on public.user_blocks
  for insert to authenticated with check (auth.uid() = blocker_id and blocker_id <> blocked_id);
create policy "blocks_delete_own" on public.user_blocks
  for delete to authenticated using (auth.uid() = blocker_id);

-- Policies: reports
create policy "reports_select_own" on public.reports
  for select to authenticated using (auth.uid() = reporter_id);
create policy "reports_insert_own" on public.reports
  for insert to authenticated with check (auth.uid() = reporter_id);

-- Storage bucket untuk foto profil
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars_auth_upload" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "avatars_auth_update" on storage.objects
  for update to authenticated using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "avatars_auth_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Realtime publication untuk sinkronisasi otomatis antar akun
alter publication supabase_realtime add table
  public.profiles,
  public.teams,
  public.team_members,
  public.join_requests,
  public.team_invitations,
  public.team_announcements,
  public.notifications,
  public.reviews,
  public.user_blocks;
