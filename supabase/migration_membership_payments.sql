-- Jalankan skrip ini di SQL Editor Supabase untuk mendukung upload bukti pembayaran QRIS & aktivasi Pro oleh admin.

create table if not exists public.membership_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null default 15000,
  payment_method text not null default 'QRIS',
  sender_name text not null default '',
  notes text not null default '',
  proof_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.membership_payments enable row level security;

create policy "payments_select_own" on public.membership_payments
  for select to authenticated using (auth.uid() = user_id);

create policy "payments_insert_own" on public.membership_payments
  for insert to authenticated with check (auth.uid() = user_id);

-- Bucket privat untuk menyimpan bukti transfer QRIS
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

create policy "payment_proofs_read_own" on storage.objects
  for select to authenticated using (
    bucket_id = 'payment-proofs' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "payment_proofs_upload_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'payment-proofs' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Otomatis aktifkan akun Pro dan kirim notifikasi saat admin mengubah status menjadi approved
create or replace function public.handle_membership_payment_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    if new.status = 'approved' then
      update public.profiles
      set paid = true, updated_at = now()
      where id = new.user_id;

      insert into public.notifications (user_id, type, title, body, link)
      values (
        new.user_id,
        'request_decision',
        'Akun EventMate Pro aktif',
        'Pembayaran QRIS kamu telah dikonfirmasi admin. Akunmu sekarang berstatus EventMate Pro.',
        '/subscription'
      );
    elsif new.status = 'rejected' then
      insert into public.notifications (user_id, type, title, body, link)
      values (
        new.user_id,
        'request_decision',
        'Bukti pembayaran perlu diperiksa ulang',
        'Pengajuan pembayaran QRIS belum dapat diverifikasi. Unggah ulang bukti pembayaran di halaman Membership.',
        '/subscription'
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_membership_payment_review on public.membership_payments;
create trigger on_membership_payment_review
  after update on public.membership_payments
  for each row execute function public.handle_membership_payment_review();
