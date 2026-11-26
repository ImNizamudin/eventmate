import { AlertTriangle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { getTrialDaysLeft, isTrialExpired } from '../lib/constants';

export function SubscriptionPage() {
  const { profile } = useAuth();
  const daysLeft = getTrialDaysLeft(profile?.trial_started_at);
  const expired = isTrialExpired(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membership EventMate"
        description="Status masa uji coba gratis 30 hari dan informasi paket EventMate Plus."
      />

      <section className="em-hero-surface max-w-2xl rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-wider text-white/85">
          EVENTMATE PLUS
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-white">
          {profile?.paid ? 'Membership Kamu Aktif' : 'Satu akses untuk seluruh fitur kolaborasi'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/90">
          30 hari pertama gratis sejak akun terdaftar, lalu Rp15.000 per bulan (rencana harga
          standar).
        </p>

        <div className="mt-5 flex items-baseline gap-2">
          <span className="tabular-nums text-3xl font-extrabold text-white">
            {profile?.paid ? 'AKTIF' : 'Rp15.000'}
          </span>
          <span className="text-sm text-white/80">
            {profile?.paid ? 'Terverifikasi' : '/ bulan setelah masa trial'}
          </span>
        </div>

        <ul className="mt-5 space-y-2 text-sm text-white/95">
          {[
            'Profil keahlian, pengalaman, dan pencarian individu',
            'Pencarian tim lintas wilayah dan metode kolaborasi',
            'Permintaan bergabung dan undangan dua arah',
            'Member Directory, Contact Information terlindungi, dan Announcement',
            'Rating, ulasan, serta pelaporan dan pemblokiran pengguna',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-2xl rounded-3xl border border-[var(--em-border)] bg-white p-6">
        <h3 className="text-base font-extrabold text-[var(--em-ink)]">Status Akun Saat Ini</h3>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-4">
          <div>
            <p className="text-sm font-bold text-[var(--em-ink)]">
              {profile?.paid
                ? 'Membership Aktif'
                : expired
                  ? 'Masa Uji Coba 30 Hari Berakhir'
                  : `Free Trial Aktif (${daysLeft} hari tersisa)`}
            </p>
            <p className="mt-0.5 text-xs text-[var(--em-muted)]">
              Profil dan seluruh riwayat tim tetap tersimpan di database Supabase.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              profile?.paid
                ? 'bg-[#eaf7f0] text-[#155e3d]'
                : expired
                  ? 'bg-[#fdeeee] text-[#9e2424]'
                  : 'bg-[var(--em-soft)] text-[var(--em-primary)]'
            }`}
          >
            {profile?.paid ? 'ACTIVE' : expired ? 'EXPIRED' : 'FREE TRIAL'}
          </span>
        </div>

        <div className="mt-4 rounded-2xl border border-[#e9cfa2] bg-[#fef6e7] p-4 text-sm text-[#683800]">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#8a4b00]" aria-hidden="true" />
            <div>
              <p className="font-bold">Pembayaran Gateway Belum Dihubungkan</p>
              <p className="mt-1 text-xs leading-relaxed">
                Sesuai kebijakan keamanan transaksi EventMate, aktivasi membership berbayar hanya
                dapat dilakukan setelah webhook payment gateway resmi terhubung di sisi server. Tidak
                ada simulasi pembayaran palsu atau tagihan yang diproses di halaman ini.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
