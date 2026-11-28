-- Jalankan skrip ini di SQL Editor Supabase untuk mengaktifkan role 'admin' beserta hak akses & keamanannya.

-- 1. Izinkan nilai 'admin' pada kolom role di tabel profiles
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('seeker', 'creator', 'admin'));

-- 2. Helper function untuk memeriksa apakah user adalah admin
create or replace function public.is_admin(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'admin'
  );
$$;

-- 3. Cegah user non-admin mengubah role, verified, atau paid secara langsung dari client
create or replace function public.prevent_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user = 'authenticated' and pg_trigger_depth() = 0 and not public.is_admin(auth.uid()) then
    new.role := old.role;
    new.verified := old.verified;
    new.paid := old.paid;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_privilege_escalation on public.profiles;
create trigger trg_prevent_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_privilege_escalation();

-- 4. Policy khusus Admin untuk mengelola verifikasi, pembayaran QRIS, laporan, blokir, dan tim
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "payments_select_admin" on public.membership_payments;
create policy "payments_select_admin" on public.membership_payments
  for select to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "payments_update_admin" on public.membership_payments;
create policy "payments_update_admin" on public.membership_payments
  for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "payment_proofs_read_admin" on storage.objects;
create policy "payment_proofs_read_admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin(auth.uid()));

drop policy if exists "reports_select_admin" on public.reports;
create policy "reports_select_admin" on public.reports
  for select to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin" on public.reports
  for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "blocks_select_admin" on public.user_blocks;
create policy "blocks_select_admin" on public.user_blocks
  for select to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "teams_update_admin" on public.teams;
create policy "teams_update_admin" on public.teams
  for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "teams_delete_admin" on public.teams;
create policy "teams_delete_admin" on public.teams
  for delete to authenticated
  using (public.is_admin(auth.uid()));

-- 5. Trigger notifikasi otomatis saat admin memverifikasi akun atau menindaklanjuti laporan
create or replace function public.handle_profile_verified_notice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.verified is distinct from new.verified and new.verified = true then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      new.id,
      'request_decision',
      'Identitas akun terverifikasi',
      'Admin telah menyetujui pengajuan verifikasi identitasmu. Badge Terverifikasi kini tampil di profilmu.',
      '/profile'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_verified_notice on public.profiles;
create trigger on_profile_verified_notice
  after update on public.profiles
  for each row execute function public.handle_profile_verified_notice();

create or replace function public.handle_report_status_notice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status and new.status in ('reviewed', 'resolved') then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      new.reporter_id,
      'request_decision',
      case when new.status = 'resolved' then 'Laporan kamu telah diselesaikan' else 'Laporan kamu sedang ditinjau admin' end,
      'Admin telah memperbarui status laporan (' || new.category || ') menjadi ' || new.status || '.',
      '/notifications'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_report_status_notice on public.reports;
create trigger on_report_status_notice
  after update on public.reports
  for each row execute function public.handle_report_status_notice();

-- 6. Cara menjadikan satu akun sebagai Admin (ganti email di bawah lalu jalankan sekali):
-- update public.profiles set role = 'admin', onboarded = true where email = 'email-admin-anda@gmail.com';
