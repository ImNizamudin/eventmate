import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, Megaphone, ShieldCheck, Star, Users } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SupabaseSetupBanner } from '../components/ui/StateViews';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-[var(--em-ground)] text-[var(--em-ink)]">
      <a href="#main-landing" className="skip-link">
        Lewati ke konten utama
      </a>

      <header className="border-b border-[var(--em-border)] bg-white">
        <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/" className="flex items-center">
            <img
              src="/eventmate-logo.png"
              alt="EventMate"
              width="154"
              height="52"
              fetchPriority="high"
              className="h-11 w-auto object-contain"
            />
          </Link>
          <nav aria-label="Navigasi masuk" className="flex items-center gap-3">
            <Link
              to="/auth?tab=login"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--em-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--em-ink)] transition hover:bg-[var(--em-rail)]"
            >
              Masuk
            </Link>
            <Link
              to="/auth?tab=signup"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--em-primary)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--em-primary-deep)]"
            >
              Buat Akun
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-landing">
        {!isSupabaseConfigured && (
          <div className="mx-auto max-w-6xl px-5 pt-6 sm:px-8">
            <SupabaseSetupBanner />
          </div>
        )}

        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <h1 className="text-3xl font-extrabold leading-[1.14] tracking-tight text-[var(--em-ink)] sm:text-5xl">
                Temukan tim yang tepat untuk setiap kompetisi dan proyek.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--em-muted)]">
                EventMate menghubungkan mahasiswa berdasarkan keahlian, wilayah, dan metode kerja.
                Kelola permintaan bergabung, lihat status aplikasi secara langsung, dan buka kontak
                anggota hanya setelah kolaborasi disetujui.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/auth?tab=signup"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[var(--em-primary)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--em-primary-deep)]"
                >
                  Daftar Akun EventMate
                </Link>
                <Link
                  to="/auth?tab=login"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[var(--em-border)] bg-white px-6 py-3 text-sm font-bold text-[var(--em-primary)] transition hover:bg-[var(--em-soft)]"
                >
                  Saya Sudah Punya Akun
                </Link>
              </div>

              <dl className="mt-8 grid grid-cols-1 gap-3 border-t border-[var(--em-border)] pt-6 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-bold text-[var(--em-ink)]">Akses Awal 30 Hari Gratis</dt>
                  <dd className="mt-0.5 text-[var(--em-muted)]">
                    Coba pencocokan tim dan direktori anggota sebelum berlangganan.
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-[var(--em-ink)]">Kontak Terlindungi</dt>
                  <dd className="mt-0.5 text-[var(--em-muted)]">
                    Nomor atau akun kontak hanya muncul setelah status Accepted.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-6">
              <div
                aria-label="Pratinjau antarmuka EventMate"
                className="rounded-3xl border border-[var(--em-border)] bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--em-border)] pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--em-muted)]">
                      Contoh Alur Kolaborasi
                    </p>
                    <h2 className="mt-0.5 text-lg font-extrabold text-[var(--em-ink)]">
                      Workspace Tim & Status Aplikasi
                    </h2>
                  </div>
                  <StatusBadge status="accepted" />
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[var(--em-ink)]">
                        Status Permintaan & Undangan
                      </span>
                      <div className="flex gap-1.5">
                        <StatusBadge status="pending" />
                        <StatusBadge status="rejected" />
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--em-muted)]">
                      Setiap pengajuan masuk dan undangan individu memperbarui status kedua akun
                      dan mengirim notifikasi otomatis.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--em-border)] bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--em-ink)]">
                      <Lock className="h-4 w-4 text-[var(--em-primary)]" aria-hidden="true" />
                      <span>Member Directory & Contact Information</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--em-muted)]">
                      Anggota yang diterima melihat daftar rekan satu tim beserta kanal kontak
                      (WhatsApp, Telegram, LinkedIn, atau Email) yang diizinkan pemiliknya.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--em-border)] bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-[var(--em-ink)]">
                        <Megaphone className="h-4 w-4 text-[var(--em-rose)]" aria-hidden="true" />
                        <span>Announcement</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--em-muted)]">
                        Pengumuman resmi dari Team Creator untuk seluruh anggota tim.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--em-border)] bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-[var(--em-ink)]">
                        <ShieldCheck className="h-4 w-4 text-[#155e3d]" aria-hidden="true" />
                        <span>Report & Block</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--em-muted)]">
                        Cabut visibilitas kontak dan laporkan penyalahgunaan kapan saja.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--em-border)] bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-extrabold text-[var(--em-ink)]">
                Alur sistem informasi dalam satu workspace
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--em-muted)]">
                Dirancang untuk keterlacakan data antar akun tanpa bergantung pada grup chat yang
                sulit dipantau.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-5">
                <Users className="h-5 w-5 text-[var(--em-primary)]" aria-hidden="true" />
                <h3 className="mt-3 text-base font-bold text-[var(--em-ink)]">
                  Pencarian Tim dan Individu Tersinkron
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--em-muted)]">
                  Pembaruan profil, jumlah slot kosong, dan lowongan tim langsung terlihat dari
                  seluruh akun yang terhubung.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-5">
                <CheckCircle2 className="h-5 w-5 text-[#155e3d]" aria-hidden="true" />
                <h3 className="mt-3 text-base font-bold text-[var(--em-ink)]">
                  Kontrol Persetujuan Dua Arah
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--em-muted)]">
                  Team Creator menerima atau menolak permintaan bergabung, sementara individu
                  menentukan jawaban atas setiap undangan masuk.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-5">
                <Star className="h-5 w-5 text-[#8a4b00]" aria-hidden="true" />
                <h3 className="mt-3 text-base font-bold text-[var(--em-ink)]">
                  Rekam Jejak Rating & Ulasan
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--em-muted)]">
                  Setelah bekerja bersama dalam tim, anggota dapat saling memberi rating dan ulasan
                  yang tampil di profil publik.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--em-border)] bg-[var(--em-rail)] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 text-sm text-[var(--em-muted)] sm:flex-row sm:items-center sm:px-8">
          <p className="font-semibold text-[var(--em-ink)]">
            EventMate: Find Your Team, Create Your Moment
          </p>
          <div className="flex gap-5">
            <Link to="/auth?tab=login" className="font-semibold hover:text-[var(--em-primary)]">
              Masuk
            </Link>
            <Link to="/auth?tab=signup" className="font-semibold hover:text-[var(--em-primary)]">
              Daftar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
